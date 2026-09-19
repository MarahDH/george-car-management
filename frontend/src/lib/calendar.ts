/** Shared Gregorian-calendar helpers for the date pickers (Levantine/Syrian labels). */

/** Levantine (Syrian) Gregorian month names, e.g. أيلول for September. */
export const MONTHS = [
  'كانون الثاني', 'شباط', 'آذار', 'نيسان', 'أيار', 'حزيران',
  'تموز', 'آب', 'أيلول', 'تشرين الأول', 'تشرين الثاني', 'كانون الأول',
]
/** Weekday headers, week starting on Saturday (Levantine convention). */
export const WEEKDAYS = ['سبت', 'أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع']

const pad = (n: number) => String(n).padStart(2, '0')
/** Format a Date as a local YYYY-MM-DD (no UTC shift). */
export const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const todayStr = () => fmt(new Date())

/** Parse YYYY-MM-DD into a local Date (falls back to today when empty/invalid). */
export function parse(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!m) return new Date()
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

/**
 * Build the 6×7 month grid for the given year/0-based month: leading blanks so
 * the 1st lands under its weekday (week starts Saturday), then each day's
 * YYYY-MM-DD, padded to 42 cells. Shared by the single and range calendars.
 */
export function monthCells(y: number, mo: number): (string | null)[] {
  const first = new Date(y, mo, 1)
  const lead = (first.getDay() - 6 + 7) % 7
  const total = new Date(y, mo + 1, 0).getDate()
  const out: (string | null)[] = []
  for (let i = 0; i < lead; i++) out.push(null)
  for (let d = 1; d <= total; d++) out.push(fmt(new Date(y, mo, d)))
  while (out.length < 42) out.push(null)
  return out
}
