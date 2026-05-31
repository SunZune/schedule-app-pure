import { readFileSync } from 'fs'
import { calcAllLocal } from '../src/lib/scheduleEngine'

const buf = readFileSync('docs/2026年班表.xlsx').buffer
const r = await calcAllLocal(buf, '张小燕', {})
const wd = ['', '一', '二', '三', '四', '五', '六', '日']

for (const s of r.sheets) {
  const days = s.daily
    .slice(0, 5)
    .map((x) => `${x.day}日=周${wd[x.weekday ?? 0] || '?'}`)
    .join(' ')
  console.log(s.sheet, days)
}
