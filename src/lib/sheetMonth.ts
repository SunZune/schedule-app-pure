import type { SheetResult } from '../types/schedule'

const CN_MONTH: Record<string, number> = {
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
  十一: 11,
  十二: 12,
}

/** 从 Sheet 名解析排序键：YYYYMM，无法解析则返回 0 */
export function sheetMonthSortKey(sheetName: string): number {
  const yearMatch = sheetName.match(/(20\d{2})/)
  const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear()

  const numMatch = sheetName.match(/(\d{1,2})\s*月/)
  if (numMatch) {
    const m = parseInt(numMatch[1], 10)
    if (m >= 1 && m <= 12) return year * 100 + m
  }

  for (const [cn, m] of Object.entries(CN_MONTH)) {
    if (sheetName.includes(`${cn}月`)) return year * 100 + m
  }

  return 0
}

export function sortSheetsByMonth<T extends { sheet: string }>(sheets: T[]): T[] {
  return [...sheets].sort((a, b) => {
    const ka = sheetMonthSortKey(a.sheet)
    const kb = sheetMonthSortKey(b.sheet)
    if (ka && kb) return ka - kb
    if (ka) return -1
    if (kb) return 1
    return a.sheet.localeCompare(b.sheet, 'zh-CN')
  })
}

/** 取时间顺序上最新、且文档里有累计余的月份 */
export function pickLatestTotalBalance(
  sheets: SheetResult[],
): { value: number; sheetName: string } | null {
  const sorted = sortSheetsByMonth(sheets)
  for (let i = sorted.length - 1; i >= 0; i--) {
    const s = sorted[i]
    if (s.total_balance !== null && s.total_balance !== undefined) {
      return { value: s.total_balance, sheetName: s.sheet }
    }
  }
  return null
}
