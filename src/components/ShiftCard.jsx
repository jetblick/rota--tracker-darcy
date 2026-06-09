import { useState } from 'react'
import { calcEarnings, calcHours, formatMoney, formatShortDate, formatHours } from '../data.js'
import s from './ShiftCard.module.css'

export default function ShiftCard({ shift, onLogFinish, onDelete }) {
  const [showPicker, setShowPicker] = useState(false)
  const [finishTime, setFinishTime] = useState('')

  const earnings = calcEarnings(shift)
  const hours = calcHours(shift)
  const pending = shift.isClose && !shift.endTime

  function handleLog() {
    if (!finishTime) return
    onLogFinish(shift.id, finishTime)
    setShowPicker(false)
    setFinishTime('')
  }

  return (
    <div className={`${s.card} ${pending ? s.pending : ''}`}>
      <div className={s.top}>
        <div className={s.left}>
          <span className={s.date}>{formatShortDate(shift.date)}</span>
          {shift.location && <span className={s.loc}>{shift.location}</span>}
        </div>
        <div className={s.right}>
          {earnings !== null ? (
            <span className={s.earn}>{formatMoney(earnings)}</span>
          ) : (
            <span className={s.earnPending}>pending</span>
          )}
        </div>
      </div>

      <div className={s.middle}>
        <span className={s.time}>
          {shift.startTime}
          {' → '}
          {shift.endTime ? shift.endTime : shift.isClose ? 'close' : '?'}
        </span>
        {hours !== null && (
          <span className={s.hours}>{formatHours(hours)}</span>
        )}
      </div>

      {(pending || onDelete) && (
        <div className={s.actions}>
          {pending && !showPicker && (
            <button className={s.btnLog} onClick={() => setShowPicker(true)}>
              Log finish time
            </button>
          )}
          {showPicker && (
            <div className={s.picker}>
              <input
                type="time"
                value={finishTime}
                onChange={e => setFinishTime(e.target.value)}
                className={s.timeInput}
              />
              <button className={s.btnConfirm} onClick={handleLog} disabled={!finishTime}>
                Save
              </button>
              <button className={s.btnCancel} onClick={() => setShowPicker(false)}>
                Cancel
              </button>
            </div>
          )}
          {onDelete && (
            <button className={s.btnDelete} onClick={() => onDelete(shift.id)} title="Delete shift">
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  )
}
