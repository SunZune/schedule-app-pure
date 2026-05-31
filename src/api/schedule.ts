import type { AllResult, UploadResult } from '../types/schedule'

export type {
  UploadResult,
  DailyRecord,
  SheetResult,
  AllResult,
} from '../types/schedule'
import { calcAllLocal, listSheetNames, buildColoredWorkbookBlob } from '../lib/scheduleEngine'
import { getWorkbook, setWorkbook } from '../lib/workbookStore'

export const uploadFile = async (file: File): Promise<UploadResult> => {
  if (!file.name.endsWith('.xlsx')) {
    throw new Error('只支持 .xlsx 格式')
  }
  const buffer = await file.arrayBuffer()
  const session_id = crypto.randomUUID()
  setWorkbook(session_id, buffer)
  const sheets = await listSheetNames(buffer)
  return { session_id, sheets, filename: file.name }
}

export const calcAll = async (
  sessionId: string,
  name: string,
  holidaysBySheet: Record<string, string[]> = {},
): Promise<AllResult> => {
  const buffer = getWorkbook(sessionId)
  if (!buffer) {
    throw new Error('session 不存在，请重新上传文件')
  }
  return calcAllLocal(buffer, name, holidaysBySheet)
}

export const getColorDownloadUrl = async (sessionId: string): Promise<string> => {
  const buffer = getWorkbook(sessionId)
  if (!buffer) {
    throw new Error('session 不存在，请重新上传文件')
  }
  const blob = await buildColoredWorkbookBlob(buffer)
  return URL.createObjectURL(blob)
}
