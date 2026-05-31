export interface UploadResult {
  session_id: string
  sheets: string[]
  filename: string
}

export interface DailyRecord {
  col: number
  day: string
  shift: string
  rest_type: string | null
  hours: number
  is_weekend: boolean
  is_holiday: boolean
  weekday: number | null
}

export interface SheetResult {
  sheet: string
  name: string
  actual_work: number
  should_work: number | null
  month_balance: number | null
  total_balance: number | null
  duty: number
  day_shift: number
  rest: number
  weekend_rest: number
  holiday_rest: number
  annual_leave: number
  mode: string
  daily: DailyRecord[]
  has_summary: boolean
}

export interface AllResult {
  name: string
  sheets: SheetResult[]
  grand_actual: number
}
