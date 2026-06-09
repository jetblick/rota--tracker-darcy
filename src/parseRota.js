import * as XLSX from 'xlsx'
import { generateId, isoDate } from './data.js'

// Day-group start columns (Mon=3, Tue=7, Wed=11, Thu=15, Fri=19, Sat=23, Sun=27)
const DAY_COLS = [3, 7, 11, 15, 19, 23, 27]
const DAY_NAMES_BY_COL = { 3: 'Mon', 7: 'Tue', 11: 'Wed', 15: 'Thu', 19: 'Fri', 23: 'Sat', 27: 'Sun' }

const MONTH_MAP = {
  JAN: 0, JANUARY: 0,
  FEB: 1, FEBRUARY: 1,
  MAR: 2, MARCH: 2,
  APR: 3, APRIL: 3,
  MAY: 4,
  JUN: 5, JUNE: 5,
  JUL: 6, JULY: 6,
  AUG: 7, AUGUST: 7,
  SEP: 8, SEPT: 8, SEPTEMBER: 8,
  OCT: 9, OCTOBER: 9,
  NOV: 10, NOVEMBER: 10,
  DEC: 11, DECEMBER: 11,
}

function parseTimeSlot(raw) {
  if (!raw || typeof raw !== 'string') return null
  const cleaned = raw.trim().toUpperCase()
  if (!cleaned.includes('-')) return null
  const [timePart] = cleaned.split('-')
  const normalised = timePart.replace('.', ':')
  const [hStr, mStr] = normalised.split(':')
  const h = parseInt(hStr, 10)
  const m = parseInt(mStr || '0', 10)
  if (isNaN(h) || isNaN(m) || h > 23 || m > 59) return null
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function parseDateNumber(raw) {
  // Handle: "1ST", "8TH", "22ND", plain number 19, etc.
  if (raw === null || raw === undefined || raw === '') return null
  const str = String(raw).trim().toUpperCase().replace(/[A-Z]+$/, '')
  const n = parseInt(str, 10)
  return isNaN(n) ? null : n
}

function parseMonth(raw) {
  if (raw === null || raw === undefined || raw === '') return null
  const str = String(raw).trim().toUpperCase().replace(/[^A-Z]/g, '')
  return MONTH_MAP[str] ?? null
}

function inferYearFromFilename(filename) {
  // Try WC__01_06_26.xls → 26 → 2026
  // Try various patterns: _26_, -26-, 2026, 26.xls
  const patterns = [
    /20(\d{2})/,           // full year like 2026
    /[_\-\.](\d{2})[_\-]/, // _26_ or -26-
    /[_\-\.](\d{2})\.xls/i, // _26.xls
  ]
  for (const p of patterns) {
    const m = filename.match(p)
    if (m) {
      const yy = parseInt(m[1], 10)
      // If it's already a 4-digit year
      if (m[0].startsWith('20')) return parseInt(m[0].slice(0, 4), 10)
      return yy < 50 ? 2000 + yy : 1900 + yy
    }
  }
  return new Date().getFullYear()
}

// Find which row is the header row (contains day names like MON/TUE)
function findHeaderRow(rows) {
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    const row = rows[i]
    const cell3 = String(row[3] || '').trim().toUpperCase()
    const cell7 = String(row[7] || '').trim().toUpperCase()
    if (['MON','TUE','WED','THU','FRI','SAT','SUN'].includes(cell3) ||
        ['MON','TUE','WED','THU','FRI','SAT','SUN'].includes(cell7)) {
      return i
    }
  }
  return 0 // fall back to row 0
}

export function parseRotaFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })

        // Find BICPAV sheet (case-insensitive)
        const sheetName = workbook.SheetNames.find(
          n => n.trim().toUpperCase() === 'BICPAV'
        )
        if (!sheetName) {
          reject(new Error(
            `Could not find the BICPAV sheet. Sheets found: ${workbook.SheetNames.join(', ')}`
          ))
          return
        }

        const sheet = workbook.Sheets[sheetName]
        const year = inferYearFromFilename(file.name)

        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

        if (rows.length < 2) {
          reject(new Error('Sheet appears to be empty.'))
          return
        }

        const headerRowIdx = findHeaderRow(rows)
        const headerRow = rows[headerRowIdx]

        // Parse day headers for each column group
        const dayHeaders = {}
        for (const col of DAY_COLS) {
          const dayName = String(headerRow[col] || '').trim().toUpperCase()
          const dateNum = parseDateNumber(headerRow[col + 1])
          const monthIdx = parseMonth(headerRow[col + 2])

          if (dateNum !== null && monthIdx !== null) {
            // Build the actual date — handle year rollover (e.g. Dec→Jan)
            let y = year
            // If month is Jan/Feb and we'd expect summer, roll year forward
            const dateObj = new Date(y, monthIdx, dateNum)
            dayHeaders[col] = {
              dayName: DAY_NAMES_BY_COL[col] || dayName,
              dateNum,
              monthIdx,
              dateStr: isoDate(dateObj),
            }
          }
        }

        // Scan data rows for Jordan's shifts
        const found = []
        for (let rowIdx = headerRowIdx + 1; rowIdx < rows.length; rowIdx++) {
          const row = rows[rowIdx]
          for (const col of DAY_COLS) {
            // Name cell is at col+1
            const nameCell = String(row[col + 1] || '').trim().toLowerCase()
            if (!nameCell) continue

            // Match "darcy" anywhere in the name cell (handles DARCY D, DARCY DYETT, etc.)
            if (!nameCell.includes('darcy')) continue

            const header = dayHeaders[col]
            if (!header) continue

            const timeRaw = String(row[col] || '').trim()
            const location = String(row[col + 2] || '').trim()
            const startTime = parseTimeSlot(timeRaw)

            if (!startTime) continue

            found.push({
              id: generateId(),
              date: header.dateStr,
              startTime,
              endTime: null,
              isClose: true,
              location: location || '',
              breakMins: 30,
              confirmed: true,
              // Extra debug info shown in preview
              _raw: {
                day: header.dayName,
                dateNum: header.dateNum,
                month: Object.keys(MONTH_MAP).find(k => MONTH_MAP[k] === header.monthIdx && k.length > 2) ?? header.monthIdx,
                timeRaw,
                nameFound: String(row[col + 1] || '').trim(),
              },
            })
          }
        }

        resolve(found)
      } catch (err) {
        reject(new Error(`Failed to parse file: ${err.message}`))
      }
    }
    reader.onerror = () => reject(new Error('Could not read the file.'))
    reader.readAsArrayBuffer(file)
  })
}
