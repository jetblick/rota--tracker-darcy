import {
  PAY_PERIODS, HOURLY_RATE, EARLY_ACCESS_FEE, EARLY_ACCESS_MAX,
  shiftsInRange, totalEarnings, totalHours,
  calcEarnings, formatMoney, formatHours, formatShortDate,
  getLastWeekRange, getMonthLabel,
  parseLocalDate, isoDate,
} from '../data.js'
import BarChart from '../components/BarChart.jsx'
import s from './PayTab.module.css'

const MONTHS = ['Jun', 'Jul', 'Aug', 'Sep']
const MONTH_RANGES = {
  Jun: { start: '2026-06-01', end: '2026-06-30' },
  Jul: { start: '2026-07-01', end: '2026-07-31' },
  Aug: { start: '2026-08-01', end: '2026-08-31' },
  Sep: { start: '2026-09-01', end: '2026-09-30' },
}

function getWeekBuckets(shifts) {
  // Group into Mon-Sun weeks, sorted oldest first
  const map = {}
  for (const s of shifts) {
    const d = parseLocalDate(s.date)
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    const mon = new Date(d)
    mon.setDate(d.getDate() + diff)
    const key = isoDate(mon)
    if (!map[key]) map[key] = []
    map[key].push(s)
  }
  return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]))
}

function weekLabel(weekStart) {
  const d = parseLocalDate(weekStart)
  return `${d.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]}`
}

export default function PayTab({ shifts }) {
  const summerTotal = totalEarnings(shifts)
  const summerHours = totalHours(shifts)

  const lastWeek = getLastWeekRange()
  const lastWeekShifts = shiftsInRange(shifts, lastWeek.start, lastWeek.end)
  const lastWeekEarnings = totalEarnings(lastWeekShifts)
  const earlyRaw = +(lastWeekEarnings * 0.5).toFixed(2)
  const earlyCapped = Math.min(earlyRaw, EARLY_ACCESS_MAX)
  const earlyAccess = +(earlyCapped - EARLY_ACCESS_FEE).toFixed(2)

  // Monthly chart data
  const monthBars = MONTHS.map(m => ({
    label: m,
    value: totalEarnings(shiftsInRange(shifts, MONTH_RANGES[m].start, MONTH_RANGES[m].end)),
    color: 'var(--green)',
  }))

  // Weekly bars (last 8 weeks that have data)
  const weekBuckets = getWeekBuckets(shifts).slice(-8)
  const weekBars = weekBuckets.map(([ws, ws_shifts]) => ({
    label: weekLabel(ws),
    value: totalEarnings(ws_shifts),
    color: 'var(--green)',
  }))

  return (
    <div className={s.container}>
      {/* Summer total hero */}
      <div className={s.hero}>
        <div className={s.heroLabel}>Summer 2026 Total</div>
        <div className={s.heroAmount}>{formatMoney(summerTotal)}</div>
        <div className={s.heroHours}>{formatHours(summerHours)} · £{HOURLY_RATE.toFixed(2)}/hr</div>
      </div>

      {/* Early access */}
      <div className={s.earlyCard}>
        <div className={s.earlyLeft}>
          <span className={s.earlyTitle}>Early Access</span>
          <span className={s.earlyMeta}>50% of last week · max £{EARLY_ACCESS_MAX} · −£{EARLY_ACCESS_FEE} fee</span>
          <span className={s.earlyMeta}>{lastWeek.start} – {lastWeek.end}</span>
        </div>
        <div className={s.earlyRight}>
          <span className={s.earlyTotal}>{formatMoney(lastWeekEarnings)} earned</span>
          <span className={s.earlyTotal}>{formatMoney(earlyCapped)} (50%{earlyRaw > EARLY_ACCESS_MAX ? ', capped' : ''})</span>
          <span className={s.earlyAmount}>{earlyAccess > 0 ? formatMoney(earlyAccess) : '—'} after fee</span>
        </div>
      </div>

      {/* Monthly chart */}
      <div className={s.chartCard}>
        <h3 className={s.chartTitle}>Monthly Earnings</h3>
        <BarChart bars={monthBars} height={110} />
      </div>

      {/* Weekly chart */}
      {weekBars.length > 0 && (
        <div className={s.chartCard}>
          <h3 className={s.chartTitle}>Weekly Earnings</h3>
          <BarChart bars={weekBars} height={110} />
        </div>
      )}

      {/* Pay periods */}
      <h3 className={s.periodsTitle}>Pay Periods</h3>
      {PAY_PERIODS.map(period => {
        const periodShifts = shiftsInRange(shifts, period.start, period.end)
        const earned = totalEarnings(periodShifts)
        const periodEarlyRaw = +(earned * 0.5).toFixed(2)
        const periodEarlyCapped = Math.min(periodEarlyRaw, EARLY_ACCESS_MAX)
        const earlyAmt = +(periodEarlyCapped - EARLY_ACCESS_FEE).toFixed(2)
        return (
          <div key={period.label} className={s.periodCard}>
            <div className={s.periodHeader}>
              <span className={s.periodLabel}>{period.label}</span>
              <span className={s.periodEarned}>{formatMoney(earned)}</span>
            </div>
            <div className={s.periodMeta}>
              <span className={s.periodRange}>{period.start} – {period.end}</span>
              <span className={s.periodPayday}>Payday {period.payday}</span>
            </div>
            <div className={s.periodEarly}>
              <span className={s.earlyLabel2}>Early access (after £{EARLY_ACCESS_FEE} fee{periodEarlyRaw > EARLY_ACCESS_MAX ? ', capped' : ''})</span>
              <span className={s.earlyAmt}>{earlyAmt > 0 ? formatMoney(earlyAmt) : '—'}</span>
            </div>
            {periodShifts.length > 0 && (
              <div className={s.periodShifts}>
                {periodShifts.map(sh => {
                  const earn = calcEarnings(sh)
                  return (
                    <div key={sh.id} className={s.periodShiftRow}>
                      <span className={s.psDate}>{formatShortDate(sh.date)}</span>
                      <span className={s.psTime}>{sh.startTime} → {sh.endTime ?? 'close'}</span>
                      <span className={s.psEarn}>
                        {earn !== null ? formatMoney(earn) : <span className={s.psPending}>pending</span>}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
            {periodShifts.length === 0 && (
              <p className={s.noShifts}>No shifts in this period yet</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
