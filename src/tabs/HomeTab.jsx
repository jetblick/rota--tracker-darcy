import {
  calcEarnings, formatMoney, formatHours, formatShortDate,
  getThisWeekRange, getLastWeekRange, shiftsInRange,
  totalEarnings, totalHours, pendingCount, nextShift,
  EARLY_ACCESS_FEE, EARLY_ACCESS_MAX,
} from '../data.js'
import s from './HomeTab.module.css'

function EarlyAccessCard({ lastWeekShifts }) {
  const earned = totalEarnings(lastWeekShifts)
  const rawAvail = +(earned * 0.5).toFixed(2)
  const capped = Math.min(rawAvail, EARLY_ACCESS_MAX)
  const afterFee = +(capped - EARLY_ACCESS_FEE).toFixed(2)
  const { start, end } = getLastWeekRange()

  return (
    <div className={s.earlyCard}>
      <div className={s.earlyHeader}>
        <span className={s.earlyLabel}>Early Access</span>
        <span className={s.earlyBadge}>50%</span>
      </div>
      <div className={s.earlyAmounts}>
        <div className={s.earlyRow}>
          <span className={s.earlyDim}>Last week earned</span>
          <span className={s.earlyEarned}>{formatMoney(earned)}</span>
        </div>
        <div className={s.earlyRow}>
          <span className={s.earlyDim}>50% of earnings{rawAvail > EARLY_ACCESS_MAX ? ` (capped at £${EARLY_ACCESS_MAX})` : ''}</span>
          <span className={s.earlyEarned}>{formatMoney(capped)}</span>
        </div>
        <div className={s.earlyRowDivider} />
        <div className={s.earlyRow}>
          <span className={s.earlyDim}>Service fee</span>
          <span className={s.earlyFee}>−{formatMoney(EARLY_ACCESS_FEE)}</span>
        </div>
        <div className={s.earlyRow}>
          <span className={s.earlyDim}>You receive</span>
          <span className={s.earlyAvail}>{afterFee > 0 ? formatMoney(afterFee) : '—'}</span>
        </div>
      </div>
      <div className={s.earlyDates}>{start} – {end}</div>
    </div>
  )
}

export default function HomeTab({ shifts }) {
  const thisWeek = getThisWeekRange()
  const lastWeek = getLastWeekRange()
  const thisWeekShifts = shiftsInRange(shifts, thisWeek.start, thisWeek.end)
  const lastWeekShifts = shiftsInRange(shifts, lastWeek.start, lastWeek.end)

  const weekEarnings = totalEarnings(thisWeekShifts)
  const weekHours = totalHours(thisWeekShifts)
  const summerEarnings = totalEarnings(shifts)
  const pending = pendingCount(shifts)
  const next = nextShift(shifts)

  return (
    <div className={s.container}>
      {/* Hero — this week */}
      <div className={s.hero}>
        <div className={s.heroLabel}>This Week</div>
        <div className={s.heroEarnings}>{formatMoney(weekEarnings)}</div>
        <div className={s.heroHours}>{formatHours(weekHours)} worked</div>
      </div>

      {/* Early Access */}
      <EarlyAccessCard lastWeekShifts={lastWeekShifts} />

      {/* Stats row */}
      <div className={s.statsRow}>
        <div className={s.statCard}>
          <span className={s.statLabel}>Summer Total</span>
          <span className={s.statValue} style={{ color: 'var(--green)' }}>{formatMoney(summerEarnings)}</span>
        </div>
        <div className={s.statCard}>
          <span className={s.statLabel}>Awaiting Close</span>
          <span className={s.statValue} style={{ color: pending > 0 ? 'var(--amber)' : 'var(--text-dimmer)' }}>
            {pending} shift{pending !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Next shift */}
      {next && (
        <div className={s.nextCard}>
          <span className={s.nextLabel}>Next Shift</span>
          <div className={s.nextInfo}>
            <span className={s.nextDate}>{formatShortDate(next.date)}</span>
            <span className={s.nextTime}>{next.startTime} → {next.endTime ?? (next.isClose ? 'close' : '?')}</span>
            {next.location && <span className={s.nextLoc}>{next.location}</span>}
          </div>
        </div>
      )}
      {!next && (
        <div className={s.noNext}>No upcoming shifts logged</div>
      )}
    </div>
  )
}
