import { readFileSync } from 'fs'
import { calcAllLocal } from '../src/lib/scheduleEngine'

const buf = readFileSync('docs/2026年班表.xlsx').buffer
const r = await calcAllLocal(buf, '张小燕', {})
for (const s of r.sheets) {
  console.log(
    s.sheet,
    'month=', s.month_balance,
    'total=', s.total_balance,
    'has_summary=', s.has_summary,
  )
}
