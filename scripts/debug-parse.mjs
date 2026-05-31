import ExcelJS from 'exceljs'
import { readFileSync } from 'fs'

const buf = readFileSync('docs/2026年班表.xlsx')
const wb = new ExcelJS.Workbook()
await wb.xlsx.load(buf)

const SUMMARY_KEYWORD_ENTRIES = [
  ['实际出勤', 'actual_work'],
  ['应出勤', 'should_work'],
  ['累计结余', 'total_balance'],
  ['累计余', 'total_balance'],
  ['本月余', 'month_balance'],
  ['累余', 'total_balance'],
]

function cellStr(cell) {
  const v = cell.value
  if (v == null) return ''
  if (typeof v === 'object' && v !== null && 'richText' in v)
    return v.richText.map((t) => t.text).join('').trim()
  if (typeof v === 'object' && v !== null && 'result' in v)
    return v.result == null ? '' : String(v.result).trim()
  return String(v).trim()
}

function matchSummaryField(label) {
  const t = label.replace(/\s/g, '')
  for (const [kw, key] of SUMMARY_KEYWORD_ENTRIES) {
    if (t.includes(kw)) return key
  }
  return null
}

function lastUsedColumn(sheet, aroundRow) {
  const dim = sheet.dimensions
  if (dim?.right && dim.right > 1) return dim.right
  let max = sheet.columnCount || 0
  return Math.max(max, 30)
}

function lastUsedColumnFixed(sheet, aroundRow) {
  let max = 0
  const dim = sheet.dimensions
  if (dim?.right) max = dim.right
  for (const ri of [2, aroundRow, 1, 3, 4, 5]) {
    if (!ri || ri > sheet.rowCount) continue
    sheet.getRow(ri).eachCell({ includeEmpty: false }, (_, col) => {
      max = Math.max(max, col)
    })
  }
  return Math.max(max, 40)
}

function findSummaryCols(sheet, headerRow, useFixed) {
  const merged = {}
  const maxR = Math.min(headerRow + 8, sheet.rowCount || headerRow + 8)
  const maxC = useFixed ? lastUsedColumnFixed(sheet, headerRow) : lastUsedColumn(sheet, headerRow)
  for (let ri = 1; ri <= maxR; ri++) {
    const row = sheet.getRow(ri)
    for (let ci = 1; ci <= maxC; ci++) {
      const val = cellStr(row.getCell(ci))
      if (!val) continue
      const key = matchSummaryField(val)
      if (key) merged[key] = ci
    }
  }
  return { merged, maxC }
}

function parseBalanceText(raw) {
  const s = String(raw).replace(/\s/g, '').replace(/,/g, '')
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
  return null
}

for (const name of ['5月', '1月']) {
  const ws = wb.getWorksheet(name)
  let nameRow = 0
  for (let ri = 1; ri <= ws.rowCount; ri++) {
    if (cellStr(ws.getRow(ri).getCell(2)) === '张小燕') {
      nameRow = ri
      break
    }
  }
  const old = findSummaryCols(ws, nameRow, false)
  const fixed = findSummaryCols(ws, nameRow, true)
  const col = fixed.merged.total_balance
  const raw = col ? cellStr(ws.getRow(nameRow).getCell(col)) : null
  console.log(name, 'nameRow', nameRow, 'maxC old', old.maxC, 'maxC fixed', fixed.maxC)
  console.log('  cols old', old.merged)
  console.log('  cols fixed', fixed.merged)
  console.log('  total raw', raw, 'parsed', parseBalanceText(raw))
}
