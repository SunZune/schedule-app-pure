import ExcelJS from 'exceljs'
import type { AllResult, DailyRecord, SheetResult } from '../types/schedule'
import { sortSheetsByMonth } from './sheetMonth'

const SHIFT_TEXT_MAP: Record<string, string> = {
  值: '值班',
  值班: '值班',
  白: '白班',
  白班: '白班',
  休: '休息',
  休息: '休息',
  年: '年假',
  年假: '年假',
}

const SHIFT_HOURS: Record<string, number> = {
  值班: 12,
  白班: 8,
  休息: 0,
  年假: 8,
}

const SHIFT_FILL: Record<string, ExcelJS.Fill> = {
  值班: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } },
  白班: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } },
  休息: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } },
  年假: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC000' } },
}

/** 长关键词优先，避免「月余」误匹配「本月余」等 */
const SUMMARY_KEYWORD_ENTRIES: [string, keyof SummaryValues][] = [
  ['实际出勤', 'actual_work'],
  ['应出勤', 'should_work'],
  ['累计结余', 'total_balance'],
  ['累计余', 'total_balance'],
  ['本月余', 'month_balance'],
  ['累余', 'total_balance'],
  ['实勤', 'actual_work'],
  ['应勤', 'should_work'],
  ['月余', 'month_balance'],
]

function matchSummaryField(label: string): keyof SummaryValues | null {
  const t = label.replace(/\s/g, '')
  for (const [kw, key] of SUMMARY_KEYWORD_ENTRIES) {
    if (t.includes(kw)) return key
  }
  return null
}

function lastUsedColumn(sheet: ExcelJS.Worksheet, aroundRow?: number): number {
  const dim = sheet.dimensions
  if (dim?.right && dim.right > 1) return dim.right
  let max = sheet.columnCount || 0
  const rows = aroundRow
    ? [sheet.getRow(aroundRow)]
    : []
  for (let ri = 1; ri <= Math.min(sheet.rowCount || 0, 20); ri++) {
    rows.push(sheet.getRow(ri))
  }
  for (const row of rows) {
    row.eachCell({ includeEmpty: false }, (_, col) => {
      max = Math.max(max, col)
    })
  }
  return Math.max(max, 30)
}

const WEEKDAY_MAP: Record<string, number> = {
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  日: 7,
  天: 7,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
}

type SummaryValues = {
  should_work: number | null
  actual_work: number | null
  month_balance: number | null
  total_balance: number | null
}

function cellStr(cell: ExcelJS.Cell): string {
  const v = cell.value
  if (v == null) return ''
  if (typeof v === 'object' && v !== null && 'richText' in v) {
    return (v as ExcelJS.CellRichTextValue).richText.map((t) => t.text).join('').trim()
  }
  if (typeof v === 'object' && v !== null && 'result' in v) {
    const r = (v as ExcelJS.CellFormulaValue).result
    return r == null ? '' : String(r).trim()
  }
  return String(v).trim()
}

function cellNum(cell: ExcelJS.Cell): number | null {
  const v = cell.value
  if (v == null || v === '') return null
  if (typeof v === 'object' && v !== null && 'result' in v) {
    const r = (v as ExcelJS.CellFormulaValue).result
    if (r == null || r === '') return null
    if (typeof r === 'string') return parseBalanceText(r)
    const n = Number(r)
    return Number.isNaN(n) ? null : n
  }
  if (typeof v === 'number') return Number.isNaN(v) ? null : v
  return parseBalanceText(String(v))
}

/** 解析班表中的余/负工时：余22、余4、负4、纯数字等（见 docs/2026年班表.xlsx） */
export function parseBalanceText(raw: string): number | null {
  const s = raw.replace(/\s/g, '').replace(/,/g, '')
  if (!s) return null

  if (s.startsWith('负')) {
    const m = s.match(/^负([+-]?\d+(?:\.\d+)?)/)
    if (m) return -Math.abs(Number(m[1]))
  }
  if (s.startsWith('余')) {
    const m = s.match(/^余([+-]?\d+(?:\.\d+)?)/)
    if (m) return Number(m[1])
  }
  if (/^[+-]?\d+(?:\.\d+)?$/.test(s)) return Number(s)

  const trailing = s.match(/([+-]?\d+(?:\.\d+)?)\s*小时?$/)
  if (trailing) return Number(trailing[1])

  return null
}

function readSummaryCell(cell: ExcelJS.Cell, field: keyof SummaryValues): number | null {
  if (field === 'month_balance' || field === 'total_balance') {
    return parseBalanceText(cellStr(cell))
  }
  return cellNum(cell)
}

function getBgArgb(cell: ExcelJS.Cell): string | null {
  const fill = cell.fill
  if (!fill || fill.type !== 'pattern' || fill.pattern !== 'solid') return null
  const argb = fill.fgColor?.argb
  if (!argb) return null
  return argb.toUpperCase()
}

function classifyByText(cell: ExcelJS.Cell): string | undefined {
  return SHIFT_TEXT_MAP[cellStr(cell)]
}

function classifyByColor(cell: ExcelJS.Cell): string | null {
  const argb = getBgArgb(cell)
  if (!argb) return null
  const rgb = argb.slice(-6)
  const r = parseInt(rgb.slice(0, 2), 16)
  const g = parseInt(rgb.slice(2, 4), 16)
  const b = parseInt(rgb.slice(4, 6), 16)
  if (r >= 240 && g >= 240 && b >= 240) return null
  if (r >= 180 && g <= 120 && b <= 120) return '值班'
  if (r >= 180 && g >= 150 && b <= 120) return '白班'
  if (b >= 150 && r <= 130 && g <= 160) return '休息'
  if (g >= 130 && r <= 150 && b <= 120) return '休息'
  return null
}

function findNameRow(sheet: ExcelJS.Worksheet, name: string): { row: number; col: number } | null {
  for (let ri = 1; ri <= sheet.rowCount; ri++) {
    const row = sheet.getRow(ri)
    for (let ci = 1; ci <= sheet.columnCount; ci++) {
      const cell = row.getCell(ci)
      if (cellStr(cell) === name) {
        return { row: ri, col: ci }
      }
    }
  }
  return null
}

function findDateAndWeekdayRows(sheet: ExcelJS.Worksheet, nameRow: number) {
  const dateRowMap: Record<number, string> = {}
  const weekdayMap: Record<number, number> = {}
  let dateBest: number | null = null
  let dateScore = 0
  let weekBest: number | null = null
  let weekScore = 0

  for (let ri = 1; ri <= nameRow; ri++) {
    const row = sheet.getRow(ri)
    let dScore = 0
    let wScore = 0
    for (let ci = 1; ci <= sheet.columnCount; ci++) {
      const cell = row.getCell(ci)
      if (cell.value == null) continue
      const val = cellStr(cell)
      const n = parseInt(val, 10)
      if (!Number.isNaN(n) && n >= 1 && n <= 31) dScore += 1
      for (const kw of Object.keys(WEEKDAY_MAP)) {
        if (val.includes(kw)) {
          wScore += 1
          break
        }
      }
    }
    if (dScore > dateScore) {
      dateScore = dScore
      dateBest = ri
    }
    if (wScore > weekScore) {
      weekScore = wScore
      weekBest = ri
    }
  }

  if (dateBest != null) {
    const row = sheet.getRow(dateBest)
    for (let ci = 1; ci <= sheet.columnCount; ci++) {
      const cell = row.getCell(ci)
      if (cell.value == null) continue
      const n = parseInt(cellStr(cell), 10)
      if (!Number.isNaN(n) && n >= 1 && n <= 31) dateRowMap[ci] = String(n)
    }
  }

  if (weekBest != null && weekBest !== dateBest) {
    const row = sheet.getRow(weekBest)
    for (let ci = 1; ci <= sheet.columnCount; ci++) {
      const cell = row.getCell(ci)
      if (cell.value == null) continue
      const val = cellStr(cell)
      for (const [kw, num] of Object.entries(WEEKDAY_MAP)) {
        if (val.includes(kw)) {
          weekdayMap[ci] = num
          break
        }
      }
    }
  }

  return { dateRowMap, weekdayMap }
}

function findSummaryCols(sheet: ExcelJS.Worksheet, headerRow: number): Partial<Record<keyof SummaryValues, number>> {
  const merged: Partial<Record<keyof SummaryValues, number>> = {}
  const maxR = Math.min(headerRow + 8, sheet.rowCount || headerRow + 8)
  const maxC = lastUsedColumn(sheet, headerRow)

  for (let ri = 1; ri <= maxR; ri++) {
    const row = sheet.getRow(ri)
    for (let ci = 1; ci <= maxC; ci++) {
      const val = cellStr(row.getCell(ci))
      if (!val) continue
      const key = matchSummaryField(val)
      if (key) merged[key] = ci
    }
  }
  return merged
}

function readSummaryValues(
  sheet: ExcelJS.Worksheet,
  dataRow: number,
  summaryCols: Partial<Record<keyof SummaryValues, number>>,
): SummaryValues {
  const values: SummaryValues = {
    should_work: null,
    actual_work: null,
    month_balance: null,
    total_balance: null,
  }
  for (const [key, col] of Object.entries(summaryCols) as [keyof SummaryValues, number][]) {
    const n = readSummaryCell(sheet.getRow(dataRow).getCell(col), key)
    if (n !== null) values[key] = n
  }
  return values
}

function calcSheet(
  sheet: ExcelJS.Worksheet,
  name: string,
  holidays: string[] = [],
): Omit<SheetResult, 'sheet' | 'name'> | null {
  const holidaySet = new Set(holidays.map(String))
  const pos = findNameRow(sheet, name)
  if (!pos) return null

  const { row: rowIdx, col: nameCol } = pos
  const { dateRowMap, weekdayMap } = findDateAndWeekdayRows(sheet, rowIdx)
  const summaryCols = findSummaryCols(sheet, rowIdx)
  const summaryColsList = Object.values(summaryCols).filter((c): c is number => c != null)
  const summaryMinCol = summaryColsList.length ? Math.min(...summaryColsList) : sheet.columnCount + 1
  const minDataCol = nameCol + 1
  const maxDataCol = summaryColsList.length ? summaryMinCol - 1 : lastUsedColumn(sheet, rowIdx)

  let textHits = 0
  let colorHits = 0
  const row = sheet.getRow(rowIdx)
  for (let ci = minDataCol; ci <= maxDataCol; ci++) {
    const cell = row.getCell(ci)
    if (classifyByText(cell)) textHits += 1
    else if (classifyByColor(cell)) colorHits += 1
  }
  const useText = textHits >= colorHits

  const counts: Record<string, number> = {
    值班: 0,
    白班: 0,
    休息: 0,
    周末休息: 0,
    节假日休息: 0,
    年假: 0,
  }
  const daily: DailyRecord[] = []

  for (let ci = minDataCol; ci <= maxDataCol; ci++) {
    const cell = row.getCell(ci)
    let shift = useText ? classifyByText(cell) ?? classifyByColor(cell) : classifyByColor(cell) ?? classifyByText(cell)
    if (!shift || !['值班', '白班', '休息', '年假'].includes(shift)) continue

    const dayStr = dateRowMap[ci] ?? String(ci - nameCol)
    const weekday = weekdayMap[ci]
    const isWeekend = weekday === 6 || weekday === 7
    const isHoliday = holidaySet.has(dayStr)

    let restType: string | null = null
    if (shift === '休息') {
      if (isHoliday) restType = '节假日休息'
      else if (isWeekend) restType = '周末休息'
      else restType = '休息'
      counts[restType] += 1
    } else {
      counts[shift] += 1
    }

    daily.push({
      col: ci,
      day: dayStr,
      shift,
      rest_type: restType,
      hours: SHIFT_HOURS[shift],
      is_weekend: isWeekend,
      is_holiday: isHoliday,
      weekday: weekday ?? null,
    })
  }

  const actualWork = counts['值班'] * 12 + counts['白班'] * 8 + counts['年假'] * 8
  const docValues = readSummaryValues(sheet, rowIdx, summaryCols)
  let monthBalance = docValues.month_balance
  const shouldWork = docValues.should_work
  const totalBalance = docValues.total_balance
  if (monthBalance == null && shouldWork != null) {
    monthBalance = actualWork - shouldWork
  }

  return {
    actual_work: actualWork,
    should_work: shouldWork,
    month_balance: monthBalance,
    total_balance: totalBalance,
    duty: counts['值班'],
    day_shift: counts['白班'],
    rest: counts['休息'],
    weekend_rest: counts['周末休息'],
    holiday_rest: counts['节假日休息'],
    annual_leave: counts['年假'],
    mode: useText ? '文字' : '颜色',
    daily,
    has_summary: Object.keys(summaryCols).length > 0,
  }
}

export async function loadWorkbook(buffer: ArrayBuffer): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buffer)
  return wb
}

export async function listSheetNames(buffer: ArrayBuffer): Promise<string[]> {
  const wb = await loadWorkbook(buffer)
  return wb.worksheets.map((w) => w.name)
}

export async function calcAllLocal(
  buffer: ArrayBuffer,
  name: string,
  holidaysBySheet: Record<string, string[]> = {},
): Promise<AllResult> {
  const wb = await loadWorkbook(buffer)
  const sheets: SheetResult[] = []
  let grandActual = 0
  for (const ws of wb.worksheets) {
    const holidayList = holidaysBySheet[ws.name] ?? []
    const r = calcSheet(ws, name, holidayList)
    if (r) {
      sheets.push({ sheet: ws.name, name, ...r })
      grandActual += r.actual_work
    }
  }
  return { name, sheets: sortSheetsByMonth(sheets), grand_actual: grandActual }
}

function applyColors(sheet: ExcelJS.Worksheet): void {
  sheet.eachRow((row) => {
    row.eachCell({ includeEmpty: false }, (cell) => {
      const shift = SHIFT_TEXT_MAP[cellStr(cell)]
      if (shift && SHIFT_FILL[shift]) {
        cell.fill = SHIFT_FILL[shift]
      }
    })
  })
}

export async function buildColoredWorkbookBlob(buffer: ArrayBuffer): Promise<Blob> {
  const wb = await loadWorkbook(buffer)
  for (const ws of wb.worksheets) {
    applyColors(ws)
  }
  const out = await wb.xlsx.writeBuffer()
  return new Blob([out], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}
