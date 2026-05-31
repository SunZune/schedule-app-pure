import { useState } from 'react'
import './NameInput.css'

interface Props {
  filename: string
  sheets: string[]
  name: string
  onNameChange: (n: string) => void
  holidaysBySheet: Record<string, string[]>
  onHolidaysChange: (h: Record<string, string[]>) => void
  onCalc: () => void
  loading: boolean
}

export default function NameInput({
  filename, sheets, name, onNameChange,
  holidaysBySheet, onHolidaysChange,
  onCalc, loading
}: Props) {
  const [activeSheet, setActiveSheet] = useState(sheets[0] ?? '')

  const handleHolidayInput = (sheet: string, val: string) => {
    // 解析逗号/空格分隔的数字，如 "1,5,6" 或 "1 5 6"
    const days = val
      .split(/[,\s，]+/)
      .map(s => s.trim())
      .filter(s => /^\d{1,2}$/.test(s) && parseInt(s) >= 1 && parseInt(s) <= 31)
    onHolidaysChange({ ...holidaysBySheet, [sheet]: days })
  }

  const totalHolidays = Object.values(holidaysBySheet).reduce((s, arr) => s + arr.length, 0)

  return (
    <div className="name-page">
      <div className="file-badge">
        <span className="file-icon">📄</span>
        <span className="file-name">{filename}</span>
        <span className="sheet-count">{sheets.length} 个 Sheet</span>
      </div>

      <div className="name-card">
        <label className="input-label">员工姓名</label>
        <input
          className="name-field"
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="请输入员工姓名"
          onKeyDown={(e) => e.key === 'Enter' && onCalc()}
        />
        <p className="input-hint">将统计该员工在所有月份 Sheet 中的工时</p>
      </div>

      {/* 节假日设置 */}
      <div className="holiday-card">
        <div className="holiday-header">
          <span className="input-label">节假日设置</span>
          <span className="holiday-hint">
            周末（六、日）自动识别 · 下方可额外填写法定节假日
          </span>
        </div>

        {/* Sheet 切换 Tab */}
        <div className="sheet-tabs">
          {sheets.map(s => (
            <button
              key={s}
              className={`sheet-tab ${activeSheet === s ? 'active' : ''}`}
              onClick={() => setActiveSheet(s)}
            >
              {s}
              {holidaysBySheet[s]?.length > 0 && (
                <span className="tab-badge">{holidaysBySheet[s].length}</span>
              )}
            </button>
          ))}
        </div>

        {/* 节假日输入 */}
        <div className="holiday-input-row">
          <label className="holiday-month-label">{activeSheet} 节假日日期</label>
          <input
            className="holiday-field"
            type="text"
            placeholder="例：1,2,7,8（逗号或空格分隔，输入该月第几天）"
            value={holidaysBySheet[activeSheet]?.join(', ') ?? ''}
            onChange={(e) => handleHolidayInput(activeSheet, e.target.value)}
          />
          {holidaysBySheet[activeSheet]?.length > 0 && (
            <div className="holiday-tags">
              {holidaysBySheet[activeSheet].map(d => (
                <span key={d} className="holiday-tag">{d}日</span>
              ))}
            </div>
          )}
        </div>

        {totalHolidays > 0 && (
          <p className="input-hint">
            共设置 {totalHolidays} 个节假日，休息日将被特别标注
          </p>
        )}
      </div>

      <button
        className="btn-primary"
        onClick={onCalc}
        disabled={loading || !name.trim()}
        style={{ width: '100%', maxWidth: 480 }}
      >
        {loading ? (
          <span className="btn-loading"><span className="spinner-sm" /> 计算中...</span>
        ) : '开始计算工时'}
      </button>
    </div>
  )
}
