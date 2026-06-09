import { useState } from 'react'
import { calcEarnings, calcHours, formatMoney, formatShortDate, formatHours, DEFAULT_BREAK_MINS, HOURLY_RATE } from '../data.js'
import s from './ShiftCard.module.css'

export const SHIFT_TYPES = ['Terrace', 'Bistro', 'BIC Show', 'PAV Show']

const TYPE_COLOURS = {
  'Terrace':  { bg: 'rgba(245,166,35,0.12)',  border: 'rgba(245,166,35,0.35)',  text: '#f5a623' },
  'Bistro':   { bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.35)',  text: '#34d399' },
  'BIC Show': { bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.35)', text: '#a78bfa' },
  'PAV Show': { bg: 'rgba(96,165,250,0.12)',  border: 'rgba(96,165,250,0.35)',  text: '#60a5fa' },
}

export default function ShiftCard({ shift, onLogFinish, onDelete, onUpdateBreak, onUpdateType }) {
  const [showPicker, setShowPicker] = useState(false)
  const [finishTime, setFinishTime] = useState('')
  const [editingBreak, setEditingBreak] = useState(false)
  const [breakInput, setBreakInput] = useState('')
  const [editingType, setEditingType] = useState(false)

  const breakMins = shift.breakMins ?? DEFAULT_BREAK_MINS
  const earnings = calcEarnings(shift)
  const hours = calcHours(shift)
  const pending = shift.isClose && !shift.endTime
  const typeStyle = shift.shiftType ? TYPE_COLOURS[shift.shiftType] : null

  function handleLog() {
    if (!finishTime) return
    onLogFinish(shift.id, finishTime)
    setShowPicker(false)
    setFinishTime('')
  }

  function handleBreakSave() {
    const val = parseInt(breakInput, 10)
    if (isNaN(val) || val < 0) return
    onUpdateBreak(shift.id, val)
    setEditingBreak(false)
    setBreakInput('')
  }

  function handleTypeSelect(type) {
    onUpdateType(shift.id, type === shift.shiftType ? null : type)
    setEditingType(false)
  }

  return (
    <div className={`${s.card} ${pending ? s.pending : ''}`}>

      {/* Shift type badge row */}
      <div className={s.typeRow}>
        {!editingType ? (
          <button
            className={s.typeBadge}
            style={typeStyle ? {
              background: typeStyle.bg,
              borderColor: typeStyle.border,
              color: typeStyle.text,
            } : {}}
            onClick={() => setEditingType(true)}
          >
            {shift.shiftType ?? '+ Set shift type'}
          </button>
        ) : (
          <div className={s.typePicker}>
            {SHIFT_TYPES.map(t => {
              const c = TYPE_COLOURS[t]
              return (
                <button
                  key={t}
                  className={s.typeOption}
                  style={{ background: c.bg, borderColor: c.border, color: c.text }}
                  onClick={() => handleTypeSelect(t)}
                >
                  {t}
                </button>
              )
            })}
            <button className={s.btnCancel} onClick={() => setEditingType(false)}>✕</button>
          </div>
        )}
      </div>

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

      {/* Break row */}
      <div className={s.breakRow}>
        <span className={s.breakLabel}>Break</span>
        {editingBreak ? (
          <div className={s.breakEdit}>
            <input
              type="number"
              min="0"
              max="120"
              className={s.breakInput}
              value={breakInput}
              onChange={e => setBreakInput(e.target.value)}
              placeholder={String(breakMins)}
              autoFocus
            />
            <span className={s.breakUnit}>min</span>
            <button className={s.btnConfirm} onClick={handleBreakSave}>Save</button>
            <button className={s.btnCancel} onClick={() => setEditingBreak(false)}>Cancel</button>
          </div>
        ) : (
          <button className={s.breakValue} onClick={() => { setBreakInput(String(breakMins)); setEditingBreak(true) }}>
            {breakMins} min {earnings !== null ? <span className={s.breakDeduct}>−{formatMoney((breakMins / 60) * HOURLY_RATE)}</span> : null}
          </button>
        )}
      </div>

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
    </div>
  )
}
