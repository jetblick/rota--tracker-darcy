import { useState, useRef } from 'react'
import { parseRotaFile } from '../parseRota.js'
import { formatShortDate, generateId } from '../data.js'
import s from './UploadTab.module.css'

export default function UploadTab({ shifts, onAddShifts, onRestoreData, rawData }) {
  const [dragging, setDragging] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState(null)
  const [preview, setPreview] = useState(null) // [{ shift, isDupe }]
  const [restoreText, setRestoreText] = useState('')
  const [restoreMsg, setRestoreMsg] = useState('')
  const fileRef = useRef()

  function handleFile(file) {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['xls', 'xlsx'].includes(ext)) {
      setParseError('Please upload an .xls or .xlsx file.')
      return
    }
    setParseError(null)
    setPreview(null)
    setParsing(true)

    parseRotaFile(file)
      .then(found => {
        if (found.length === 0) {
          setParseError("No shifts found for 'Darcy' in this rota. Check the file is correct.")
          setParsing(false)
          return
        }
        // Check dupes
        const withDupe = found.map(sh => {
          const dupe = shifts.some(
            existing => existing.date === sh.date && existing.startTime === sh.startTime
          )
          return { shift: sh, isDupe: dupe }
        })
        setPreview(withDupe)
        setParsing(false)
      })
      .catch(err => {
        setParseError(err.message)
        setParsing(false)
      })
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  function confirmAdd() {
    const toAdd = preview.filter(p => !p.isDupe).map(p => p.shift)
    onAddShifts(toAdd)
    setPreview(null)
  }

  function handleRestore() {
    try {
      const parsed = JSON.parse(restoreText.trim())
      if (!parsed.shifts || !Array.isArray(parsed.shifts)) throw new Error('Invalid format')
      onRestoreData(parsed)
      setRestoreMsg('✓ Data restored successfully.')
      setRestoreText('')
    } catch {
      setRestoreMsg('✗ Invalid JSON. Paste the full backup string.')
    }
  }

  const newCount = preview ? preview.filter(p => !p.isDupe).length : 0
  const dupeCount = preview ? preview.filter(p => p.isDupe).length : 0

  return (
    <div className={s.container}>
      <h2 className={s.title}>Upload Rota</h2>

      {/* Drop zone */}
      <div
        className={`${s.dropZone} ${dragging ? s.dragging : ''}`}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".xls,.xlsx"
          style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])}
        />
        {parsing ? (
          <span className={s.dropText}>Parsing…</span>
        ) : (
          <>
            <span className={s.dropIcon}>📁</span>
            <span className={s.dropText}>Drop your weekly .xls rota here</span>
            <span className={s.dropSub}>or click to browse</span>
          </>
        )}
      </div>

      {parseError && <div className={s.error}>{parseError}</div>}

      {/* Preview */}
      {preview && (
        <div className={s.preview}>
          <div className={s.previewHeader}>
            <span className={s.previewTitle}>Found {preview.length} shift{preview.length !== 1 ? 's' : ''}</span>
            <span className={s.previewMeta}>
              {newCount} new · {dupeCount} duplicate{dupeCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div className={s.previewList}>
            {preview.map(({ shift, isDupe }) => (
              <div key={shift.id} className={`${s.previewRow} ${isDupe ? s.dupe : ''}`}>
                <div className={s.previewMain}>
                  <span className={s.previewDate}>{formatShortDate(shift.date)}</span>
                  <span className={s.previewTime}>{shift.startTime} → close</span>
                  {shift.location && <span className={s.previewLoc}>{shift.location}</span>}
                  {isDupe && <span className={s.dupeBadge}>duplicate</span>}
                </div>
                {shift._raw && (
                  <div className={s.previewRaw}>
                    from sheet: {shift._raw.day} {shift._raw.dateNum} {shift._raw.month} · {shift._raw.timeRaw} · found name "{shift._raw.nameFound}"
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className={s.previewActions}>
            <button
              className={s.btnConfirm}
              onClick={confirmAdd}
              disabled={newCount === 0}
            >
              Add {newCount} new shift{newCount !== 1 ? 's' : ''}
            </button>
            <button className={s.btnCancel} onClick={() => setPreview(null)}>
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Backup & Restore */}
      <div className={s.section}>
        <h3 className={s.sectionTitle}>Backup & Restore</h3>

        <div className={s.backupBlock}>
          <p className={s.backupLabel}>Current data (copy to back up)</p>
          <textarea
            className={s.textarea}
            readOnly
            value={JSON.stringify(rawData, null, 2)}
            rows={5}
            onClick={e => e.target.select()}
          />
        </div>

        <div className={s.restoreBlock}>
          <p className={s.backupLabel}>Paste backup to restore</p>
          <textarea
            className={s.textarea}
            value={restoreText}
            onChange={e => setRestoreText(e.target.value)}
            placeholder='{"shifts": [...]}'
            rows={4}
          />
          <button className={s.btnRestore} onClick={handleRestore} disabled={!restoreText.trim()}>
            Restore
          </button>
          {restoreMsg && <p className={s.restoreMsg}>{restoreMsg}</p>}
        </div>
      </div>
    </div>
  )
}
