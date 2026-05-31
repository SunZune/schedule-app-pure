import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import { AllResult, SheetResult } from '../api/schedule'
import './ResultDashboard.css'

interface Props {
  result: AllResult
  downloadUrl: string
}

const WEEKDAY_NAMES = ['', '一', '二', '三', '四', '五', '六', '日']

function fmt(v: number | null, suffix = 'h'): string {
  if (v === null || v === undefined) return '—'
  const n = Number(v)
  if (suffix === 'h' && n > 0) return `+${n}${suffix}`
  return `${n}${suffix}`
}

function balanceClass(v: number | null): string {
  if (v === null || v === undefined) return ''
  return v > 0 ? 'positive' : v < 0 ? 'negative' : 'zero'
}

function StatCard({ label, value, sub, color, className = '' }: {
  label: string; value: string | number; sub?: string; color?: string; className?: string
}) {
  return (
    <div className={`stat-card ${className}`} style={{ '--accent-color': color } as React.CSSProperties}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}

function DailyCell({ d }: { d: any }) {
  const isWeekend = d.is_weekend
  const isHoliday = d.is_holiday
  const isRest = d.shift === '休息'

  let cellClass = `daily-cell shift-${
    d.shift === '值班' ? 'duty' : d.shift === '白班' ? 'day' : d.shift === '年假' ? 'annual' : 'rest'
  }`
  if (isRest && isHoliday) cellClass += ' rest-holiday'
  else if (isRest && isWeekend) cellClass += ' rest-weekend'

  const label = d.shift === '值班' ? '值' : d.shift === '白班' ? '白' : d.shift === '年假' ? '年' : '休'
  const wd = d.weekday ? `周${WEEKDAY_NAMES[d.weekday]}` : ''

  return (
    <div className={cellClass}>
      <div className="daily-day">{d.day}日</div>
      {wd && <div className="daily-weekday">{wd}</div>}
      <div className="daily-shift">
        {label}
        {isRest && isHoliday && <span className="rest-mark">假</span>}
        {isRest && !isHoliday && isWeekend && <span className="rest-mark weekend-mark">末</span>}
      </div>
      <div className="daily-hours">{d.hours}h</div>
    </div>
  )
}

function SheetDetail({ sheet }: { sheet: SheetResult }) {
  const [open, setOpen] = useState(false)
  const hasBalance = sheet.should_work !== null
  const specialRest = (sheet.weekend_rest ?? 0) + (sheet.holiday_rest ?? 0)

  return (
    <div className="sheet-detail">
      <div className="sheet-header" onClick={() => setOpen(!open)}>
        <div className="sheet-header-left">
          <span className="sheet-chevron">{open ? '▾' : '▸'}</span>
          <span className="sheet-name">{sheet.sheet}</span>
          <span className="sheet-mode-tag">{sheet.mode}模式</span>
        </div>
        <div className="sheet-header-right">
          <span className="badge badge-duty">值×{sheet.duty}</span>
          <span className="badge badge-day">白×{sheet.day_shift}</span>
          <span className="badge badge-rest">休×{sheet.rest}</span>
          {sheet.weekend_rest > 0 &&
            <span className="badge badge-weekend">周末×{sheet.weekend_rest}</span>}
          {sheet.holiday_rest > 0 &&
            <span className="badge badge-holiday">假日×{sheet.holiday_rest}</span>}
          {(sheet.annual_leave ?? 0) > 0 &&
            <span className="badge badge-annual">年假×{sheet.annual_leave}</span>}
          {hasBalance && (
            <>
              <span className="divider">|</span>
              <span className="sheet-hours-row">
                <span className="lbl">应</span><span className="val">{sheet.should_work}h</span>
                <span className="lbl">实</span><span className="val accent2">{sheet.actual_work}h</span>
                <span className={`balance-tag ${balanceClass(sheet.month_balance)}`}>
                  本月余 {fmt(sheet.month_balance)}
                </span>
              </span>
            </>
          )}
          {!hasBalance && <span className="sheet-total">{sheet.actual_work}h</span>}
        </div>
      </div>

      {open && (
        <div className="sheet-body">
          {hasBalance && (
            <div className="summary-row">
              <div className="summary-item">
                <span className="summary-label">应出勤</span>
                <span className="summary-value">{sheet.should_work}h</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">实际出勤</span>
                <span className="summary-value accent2">{sheet.actual_work}h</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">本月余</span>
                <span className={`summary-value ${balanceClass(sheet.month_balance)}`}>
                  {fmt(sheet.month_balance)}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">累计余</span>
                <span className={`summary-value ${balanceClass(sheet.total_balance)}`}>
                  {fmt(sheet.total_balance)}
                </span>
              </div>
            </div>
          )}

          {/* 特殊休息说明 */}
          {specialRest > 0 && (
            <div className="special-rest-row">
              {sheet.weekend_rest > 0 && (
                <span className="special-rest-item weekend">
                  末 周末休息 × {sheet.weekend_rest} 天
                </span>
              )}
              {sheet.holiday_rest > 0 && (
                <span className="special-rest-item holiday">
                  假 节假日休息 × {sheet.holiday_rest} 天
                </span>
              )}
            </div>
          )}

          <div className="daily-grid">
            {sheet.daily.map((d, i) => (
              <DailyCell key={i} d={d} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ResultDashboard({ result, downloadUrl }: Props) {
  const totalDuty       = result.sheets.reduce((s, r) => s + r.duty, 0)
  const totalDay        = result.sheets.reduce((s, r) => s + r.day_shift, 0)
  const totalRest       = result.sheets.reduce((s, r) => s + r.rest, 0)
  const totalWeekend    = result.sheets.reduce((s, r) => s + (r.weekend_rest ?? 0), 0)
  const totalHoliday    = result.sheets.reduce((s, r) => s + (r.holiday_rest ?? 0), 0)
  const totalAnnual     = result.sheets.reduce((s, r) => s + (r.annual_leave ?? 0), 0)
  const hasSummary      = result.sheets.some(r => r.has_summary)
  const lastBalance     = hasSummary
    ? result.sheets.filter(r => r.total_balance !== null).slice(-1)[0]?.total_balance
    : null

  const chartData = result.sheets.map((r) => ({
    name: r.sheet,
    实际出勤: r.actual_work,
    应出勤: r.should_work ?? 0,
    本月余: r.month_balance ?? 0,
  }))

  return (
    <div className="dashboard">
      <div className="dash-top">
        <div className="dash-title">
          <span className="dash-name">{result.name}</span>
          <span className="dash-sub">工时统计报告</span>
        </div>
        <a href={downloadUrl} download className="btn-download">⬇ 下载涂色版</a>
      </div>

      <div className="stats-row">
        <StatCard label="实际出勤合计" value={`${result.grand_actual}h`} sub={`共 ${result.sheets.length} 个月`} color="var(--accent2)" />
        <StatCard label="值班次数" value={totalDuty} sub={`${totalDuty*12}h`} color="var(--red)" />
        <StatCard label="白班次数" value={totalDay}  sub={`${totalDay*8}h`}  color="var(--yellow)" />
        <StatCard label="普通休息" value={totalRest} color="var(--green)" />
        {totalWeekend > 0 &&
          <StatCard label="周末休息" value={totalWeekend} color="var(--accent)" />}
        {totalHoliday > 0 &&
          <StatCard label="节假日休息" value={totalHoliday} color="var(--yellow)" />}
        {totalAnnual > 0 &&
          <StatCard label="年假" value={totalAnnual} sub={`${totalAnnual * 8}h`} color="#f5a032" />}
        {lastBalance !== null && lastBalance !== undefined && (
          <StatCard
            label="累计余工时" value={fmt(lastBalance)} sub="最新月份"
            color={lastBalance >= 0 ? 'var(--accent2)' : 'var(--red)'}
            className={balanceClass(lastBalance)}
          />
        )}
      </div>

      {chartData.length > 0 && (
        <div className="chart-card">
          <div className="card-title">月度工时对比</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} barGap={4} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--text2)', fontSize: 13 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text2)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px' }}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                formatter={(v: number, n: string) => [`${v}h`, n]}
              />
              <ReferenceLine y={0} stroke="var(--border)" />
              <Bar dataKey="应出勤"  fill="var(--border)"  radius={[4,4,0,0]} maxBarSize={36} />
              <Bar dataKey="实际出勤" fill="var(--accent2)" radius={[4,4,0,0]} maxBarSize={36} />
              <Bar dataKey="本月余"  fill="var(--accent)"  radius={[4,4,0,0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            <span className="legend-item"><span className="dot" style={{background:'var(--border)'}}/>应出勤</span>
            <span className="legend-item"><span className="dot" style={{background:'var(--accent2)'}}/>实际出勤</span>
            <span className="legend-item"><span className="dot" style={{background:'var(--accent)'}}/>本月余</span>
          </div>
        </div>
      )}

      <div className="card-title" style={{ marginTop: 8 }}>逐月明细</div>
      <div className="sheets-list">
        {result.sheets.map((s) => (
          <SheetDetail key={s.sheet} sheet={s} />
        ))}
      </div>
    </div>
  )
}
