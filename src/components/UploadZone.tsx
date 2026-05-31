import { useRef, useState } from 'react'
import './UploadZone.css'

interface Props {
  onUpload: (file: File) => void
  loading: boolean
}

export default function UploadZone({ onUpload, loading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.xlsx')) {
      alert('请上传 .xlsx 格式的文件')
      return
    }
    onUpload(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="upload-page">
      <div className="upload-title">上传排班表</div>
      <p className="upload-sub">支持每个 Sheet 为一个月的 Excel 排班文件</p>

      <div
        className={`drop-zone ${dragging ? 'dragging' : ''} ${loading ? 'loading' : ''}`}
        onClick={() => !loading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        {loading ? (
          <div className="dz-loading">
            <div className="spinner" />
            <span>正在解析文件...</span>
          </div>
        ) : (
          <>
            <div className="dz-icon">📂</div>
            <div className="dz-text">拖拽文件到此处，或<span className="dz-link">点击选择</span></div>
            <div className="dz-hint">仅支持 .xlsx 格式</div>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />

      <div className="upload-rules">
        <div className="rule-title">排班表格式说明</div>
        <div className="rules-grid">
          <div className="rule-item"><span className="rule-tag shift-duty">值</span>值班 — 12 小时</div>
          <div className="rule-item"><span className="rule-tag shift-day">白</span>白班 — 8 小时</div>
          <div className="rule-item"><span className="rule-tag shift-rest">休</span>休息 — 0 小时</div>
          <div className="rule-item"><span className="rule-tag shift-color">色</span>也支持红/黄/蓝背景色</div>
        </div>
      </div>
    </div>
  )
}
