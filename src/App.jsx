import { useState, useCallback } from 'react'
import { loadData, saveData } from './data.js'
import HomeTab from './tabs/HomeTab.jsx'
import UploadTab from './tabs/UploadTab.jsx'
import ShiftsTab from './tabs/ShiftsTab.jsx'
import PayTab from './tabs/PayTab.jsx'
import s from './App.module.css'

const TABS = [
  { id: 'home',   label: 'Home',   icon: '⌂' },
  { id: 'upload', label: 'Upload', icon: '↑' },
  { id: 'shifts', label: 'Shifts', icon: '≡' },
  { id: 'pay',    label: 'Pay',    icon: '£' },
]

export default function App() {
  const [data, setData] = useState(() => loadData())
  const [tab, setTab] = useState('home')

  const updateData = useCallback((updater) => {
    setData(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      saveData(next)
      return next
    })
  }, [])

  function handleLogFinish(shiftId, endTime) {
    updateData(d => ({
      ...d,
      shifts: d.shifts.map(s =>
        s.id === shiftId ? { ...s, endTime } : s
      ),
    }))
  }

  function handleDelete(shiftId) {
    updateData(d => ({
      ...d,
      shifts: d.shifts.filter(s => s.id !== shiftId),
    }))
  }

  function handleAddShift(shift) {
    updateData(d => ({ ...d, shifts: [...d.shifts, shift] }))
  }

  function handleAddShifts(newShifts) {
    updateData(d => ({ ...d, shifts: [...d.shifts, ...newShifts] }))
  }

  function handleRestoreData(restored) {
    updateData(restored)
  }

  const shifts = data.shifts ?? []

  return (
    <div className={s.app}>
      {/* Header */}
      <header className={s.header}>
        <span className={s.logo}>BHLive</span>
        <span className={s.tagline}>Darcy · Summer 2026</span>
      </header>

      {/* Tab content */}
      <main className={s.main}>
        {tab === 'home' && (
          <HomeTab shifts={shifts} />
        )}
        {tab === 'upload' && (
          <UploadTab
            shifts={shifts}
            onAddShifts={handleAddShifts}
            onRestoreData={handleRestoreData}
            rawData={data}
          />
        )}
        {tab === 'shifts' && (
          <ShiftsTab
            shifts={shifts}
            onLogFinish={handleLogFinish}
            onDelete={handleDelete}
            onAddShift={handleAddShift}
          />
        )}
        {tab === 'pay' && (
          <PayTab shifts={shifts} />
        )}
      </main>

      {/* Bottom nav */}
      <nav className={s.nav}>
        {TABS.map(t => (
          <button
            key={t.id}
            className={`${s.navBtn} ${tab === t.id ? s.active : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className={s.navIcon}>{t.icon}</span>
            <span className={s.navLabel}>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
