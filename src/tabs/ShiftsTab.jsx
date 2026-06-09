import { useState } from 'react'
import {
  groupByWeek, parseLocalDate, formatShortDate, formatFullDate,
  isoDate, generateId, getWeekStart, DEFAULT_BREAK_MINS,
} from '../data.js'
import ShiftCard, { SHIFT_TYPES } from '../components/ShiftCard.jsx'
import s from './ShiftsTab.module.css'

function weekRangeLabel(weekStart) {
  const mon = parseLocalDate(weekStart)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  const monLabel = `${mon.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][mon.getMonth()]}`
  const sunLabel = `${sun.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][sun.getMonth()]}`
  return `${monLabel} – ${sunLabel}`
}

export default function ShiftsTab({ shifts, onLogFinish, onDelete, onAddShift, onUpdateBreak, onUpdateType }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    date: '', startTime: '', endTime: '', isClose: true, location: '', breakMins: DEFAULT_BREAK_MINS, shiftType: ''
  })
  const [formError, setFormError] = useState('')

  const grouped = groupByWeek(shifts)

  function handleAdd(e) {
    e.preventDefault()
    if (!form.date || !form.startTime) {
      setFormError('Date and start time are required.')
      return
    }
    const newShift = {
      id: generateId(),
      date: form.date,
      startTime: form.startTime,
      endTime: form.isClose ? (form.endTime || null) : form.endTime || null,
      isClose: form.isClose,
      location: form.location.trim(),
      breakMins: parseInt(form.breakMins, 10) || 0,
      shiftType: form.shiftType || null,
      confirmed: true,
    }
    onAddShift(newShift)
    setForm({ date: '', startTime: '', endTime: '', isClose: true, location: '' })
    setFormError('')
    setShowForm(false)
  }

  return (
    <div className={s.container}>
      <div className={s.header}>
        <h2 className={s.title}>Shifts</h2>
        <button className={s.btnAdd} onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancel' : '+ Add shift'}
        </button>
      </div>

      {showForm && (
        <form className={s.form} onSubmit={handleAdd}>
          <div className={s.formRow}>
            <label className={s.label}>Date</label>
            <input
              type="date"
              className={s.input}
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              required
            />
          </div>
          <div className={s.formRow}>
            <label className={s.label}>Start time</label>
            <input
              type="time"
              className={s.input}
              value={form.startTime}
              onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
              required
            />
          </div>
          <div className={s.formRowCheck}>
            <label className={s.checkLabel}>
              <input
                type="checkbox"
                checked={form.isClose}
                onChange={e => setForm(f => ({ ...f, isClose: e.target.checked }))}
              />
              Close shift
            </label>
          </div>
          {!form.isClose && (
            <div className={s.formRow}>
              <label className={s.label}>End time</label>
              <input
                type="time"
                className={s.input}
                value={form.endTime}
                onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
              />
            </div>
          )}
          <div className={s.formRow}>
            <label className={s.label}>Location</label>
            <input
              type="text"
              className={s.input}
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="CC, PM, Training…"
            />
          </div>
          <div className={s.formRow}>
            <label className={s.label}>Shift type</label>
            <select
              className={s.input}
              value={form.shiftType}
              onChange={e => setForm(f => ({ ...f, shiftType: e.target.value }))}
            >
              <option value="">— Select type —</option>
              {SHIFT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className={s.formRow}>
            <label className={s.label}>Break (minutes)</label>
            <input
              type="number"
              min="0"
              max="120"
              className={s.input}
              value={form.breakMins}
              onChange={e => setForm(f => ({ ...f, breakMins: e.target.value }))}
            />
          </div>
          {formError && <p className={s.formError}>{formError}</p>}
          <button type="submit" className={s.btnSubmit}>Add shift</button>
        </form>
      )}

      {grouped.length === 0 && (
        <p className={s.empty}>No shifts yet. Upload a rota or add one manually.</p>
      )}

      {grouped.map(([weekStart, weekShifts]) => (
        <div key={weekStart} className={s.weekGroup}>
          <div className={s.weekHeader}>
            <span className={s.weekRange}>{weekRangeLabel(weekStart)}</span>
            <span className={s.weekCount}>{weekShifts.length} shift{weekShifts.length !== 1 ? 's' : ''}</span>
          </div>
          <div className={s.weekShifts}>
            {weekShifts.map(shift => (
              <ShiftCard
                key={shift.id}
                shift={shift}
                onLogFinish={onLogFinish}
                onDelete={onDelete}
                onUpdateBreak={onUpdateBreak}
                onUpdateType={onUpdateType}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
