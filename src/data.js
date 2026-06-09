// ─── Constants ────────────────────────────────────────────────────────────────
export const STORAGE_KEY = 'rota-tracker-darcy-v1'
export const HOURLY_RATE = 12.71
export const EARLY_ACCESS_FEE = 2.75
export const EARLY_ACCESS_MAX = 500
export const DEFAULT_BREAK_MINS = 30

export const PAY_PERIODS = [
  { label: 'July 2026 Pay',      payday: '2026-07-29', start: '2026-06-01', end: '2026-06-28' },
  { label: 'August 2026 Pay',    payday: '2026-08-27', start: '2026-06-29', end: '2026-08-02' },
  { label: 'September 2026 Pay', payday: '2026-09-28', start: '2026-08-03', end: '2026-08-30' },
  { label: 'October 2026 Pay',   payday: '2026-10-29', start: '2026-08-31', end: '2026-09-27' },
]

// ─── Seed data ────────────────────────────────────────────────────────────────
export const SEED_SHIFTS = []

// ─── Storage helpers ──────────────────────────────────────────────────────────
export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (_) {}
  // First run — seed
  const initial = { shifts: SEED_SHIFTS }
  saveData(initial)
  return initial
}

export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// ─── Shift calculations ───────────────────────────────────────────────────────
export function calcHours(shift) {
  if (!shift.endTime) return null
  const [sh, sm] = shift.startTime.split(':').map(Number)
  const [eh, em] = shift.endTime.split(':').map(Number)
  let mins = (eh * 60 + em) - (sh * 60 + sm)
  if (mins < 0) mins += 24 * 60 // past midnight
  // Deduct break (default 30 mins if field missing on old shifts)
  const breakMins = shift.breakMins ?? DEFAULT_BREAK_MINS
  mins = Math.max(0, mins - breakMins)
  return +(mins / 60).toFixed(2)
}

export function calcEarnings(shift) {
  const h = calcHours(shift)
  if (h === null) return null
  return +(h * HOURLY_RATE).toFixed(2)
}

export function formatMoney(n) {
  if (n === null || n === undefined) return '—'
  return `£${n.toFixed(2)}`
}

export function formatHours(h) {
  if (h === null || h === undefined) return '—'
  const hrs = Math.floor(h)
  const mins = Math.round((h - hrs) * 60)
  return mins ? `${hrs}h ${mins}m` : `${hrs}h`
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function parseLocalDate(dateStr) {
  // dateStr: "2026-06-02"
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function formatShortDate(dateStr) {
  const d = parseLocalDate(dateStr)
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`
}

export function formatFullDate(dateStr) {
  const d = parseLocalDate(dateStr)
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
}

export function isoDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getWeekStart(dateStr) {
  // Monday-based week
  const d = parseLocalDate(dateStr)
  const day = d.getDay() // 0=Sun
  const diff = (day === 0) ? -6 : 1 - day
  const mon = new Date(d)
  mon.setDate(d.getDate() + diff)
  return isoDate(mon)
}

export function getLastWeekRange() {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  // Start of this week (Monday)
  const thisMonday = new Date(today)
  thisMonday.setDate(today.getDate() + diffToMon)
  thisMonday.setHours(0, 0, 0, 0)
  // Last week Mon–Sun
  const lastMonday = new Date(thisMonday)
  lastMonday.setDate(thisMonday.getDate() - 7)
  const lastSunday = new Date(thisMonday)
  lastSunday.setDate(thisMonday.getDate() - 1)
  return { start: isoDate(lastMonday), end: isoDate(lastSunday) }
}

export function getThisWeekRange() {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(today)
  monday.setDate(today.getDate() + diffToMon)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { start: isoDate(monday), end: isoDate(sunday) }
}

export function groupByWeek(shifts) {
  const map = {}
  for (const s of shifts) {
    const ws = getWeekStart(s.date)
    if (!map[ws]) map[ws] = []
    map[ws].push(s)
  }
  // Sort shifts within each week
  for (const ws of Object.keys(map)) {
    map[ws].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
  }
  // Return sorted weeks newest first
  return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]))
}

export function getMonthLabel(dateStr) {
  const d = parseLocalDate(dateStr)
  return MONTH_NAMES[d.getMonth()]
}

export function shiftsInRange(shifts, start, end) {
  return shifts.filter(s => s.date >= start && s.date <= end)
}

export function totalEarnings(shifts) {
  return shifts.reduce((sum, s) => sum + (calcEarnings(s) ?? 0), 0)
}

export function totalHours(shifts) {
  return shifts.reduce((sum, s) => sum + (calcHours(s) ?? 0), 0)
}

export function pendingCount(shifts) {
  return shifts.filter(s => s.isClose && !s.endTime).length
}

export function nextShift(shifts) {
  const today = isoDate(new Date())
  return shifts
    .filter(s => s.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))[0] ?? null
}

export function generateId() {
  return Math.random().toString(36).slice(2, 10)
}
