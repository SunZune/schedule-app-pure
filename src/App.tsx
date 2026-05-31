import { useState } from 'react'
import { uploadFile, calcAll, getColorDownloadUrl, UploadResult, AllResult } from './api/schedule'
import UploadZone from './components/UploadZone'
import NameInput from './components/NameInput'
import ResultDashboard from './components/ResultDashboard'
import './App.css'

type Step = 'upload' | 'loaded' | 'result'

export default function App() {
  const [step, setStep] = useState<Step>('upload')
  const [uploadInfo, setUploadInfo] = useState<UploadResult | null>(null)
  const [name, setName] = useState('张小燕')
  // holidaysBySheet: { sheetName: ['1','5','6',...] }
  const [holidaysBySheet, setHolidaysBySheet] = useState<Record<string, string[]>>({})
  const [result, setResult] = useState<AllResult | null>(null)
  const [downloadUrl, setDownloadUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const errMsg = (e: unknown, fallback: string) =>
    e instanceof Error ? e.message : fallback

  const handleUpload = async (file: File) => {
    setError('')
    setLoading(true)
    try {
      const info = await uploadFile(file)
      setUploadInfo(info)
      // 初始化每个 sheet 的节假日为空
      const init: Record<string, string[]> = {}
      info.sheets.forEach(s => { init[s] = [] })
      setHolidaysBySheet(init)
      setStep('loaded')
    } catch (e: unknown) {
      setError(errMsg(e, '上传失败，请检查文件格式'))
    } finally {
      setLoading(false)
    }
  }

  const handleCalc = async () => {
    if (!uploadInfo) return
    setError('')
    setLoading(true)
    try {
      const r = await calcAll(uploadInfo.session_id, name, holidaysBySheet)
      if (r.sheets.length === 0) {
        setError(`未在任何 Sheet 中找到员工「${name}」，请确认姓名是否正确`)
      } else {
        setResult(r)
        const url = await getColorDownloadUrl(uploadInfo.session_id)
        setDownloadUrl(url)
        setStep('result')
      }
    } catch (e: unknown) {
      setError(errMsg(e, '计算失败'))
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    if (downloadUrl.startsWith('blob:')) {
      URL.revokeObjectURL(downloadUrl)
    }
    setStep('upload')
    setUploadInfo(null)
    setResult(null)
    setDownloadUrl('')
    setError('')
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">📅</span>
            <span className="logo-text">排班工时计算器</span>
            <span className="logo-badge">纯前端 · 本地处理</span>
          </div>
          {step !== 'upload' && (
            <button className="btn-ghost" onClick={handleReset}>重新上传</button>
          )}
        </div>
      </header>

      <main className="app-main">
        {step === 'upload' && (
          <UploadZone onUpload={handleUpload} loading={loading} />
        )}

        {step === 'loaded' && uploadInfo && (
          <NameInput
            filename={uploadInfo.filename}
            sheets={uploadInfo.sheets}
            name={name}
            onNameChange={setName}
            holidaysBySheet={holidaysBySheet}
            onHolidaysChange={setHolidaysBySheet}
            onCalc={handleCalc}
            loading={loading}
          />
        )}

        {step === 'result' && result && uploadInfo && (
          <ResultDashboard
            result={result}
            downloadUrl={downloadUrl}
          />
        )}

        {error && (
          <div className="error-banner"><span>⚠ {error}</span></div>
        )}
      </main>
    </div>
  )
}
