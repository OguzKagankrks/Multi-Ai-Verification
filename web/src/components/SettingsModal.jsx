import React, { useEffect, useState } from 'react'

const EMPTY_FORM = {
  geminiKey: '',
  claudeKey: '',
  xaiKey: '',
  xaiTeamId: '',
  perplexityKey: '',
  openaiKey: ''
}

export default function SettingsModal({ open, onClose, onSaved, status, strings }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [serverStatus, setServerStatus] = useState(status)

  useEffect(() => {
    setServerStatus(status)
  }, [status])

  useEffect(() => {
    if (!open) {
      return
    }

    fetch('/api/status')
      .then(response => response.json())
      .then(setServerStatus)
      .catch(() => {})
  }, [open])

  const refreshServerStatus = async () => {
    try {
      const response = await fetch('/api/status')
      if (!response.ok) {
        return null
      }
      const snapshot = await response.json()
      setServerStatus(snapshot)
      return snapshot
    } catch (_error) {
      return null
    }
  }

  const save = async () => {
    try {
      const response = await fetch('/api/set-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (!response.ok) {
        return
      }

      setForm(EMPTY_FORM)
      await refreshServerStatus()
      await onSaved?.()
      onClose?.()
    } catch (_error) {
     
    }
  }

  const clear = async () => {
    try {
      const response = await fetch('/api/set-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(EMPTY_FORM)
      })
      if (!response.ok) {
        return
      }

      setForm(EMPTY_FORM)
      await refreshServerStatus()
      await onSaved?.()
      onClose?.()
    } catch (_error) {
   
    }
  }

  const availability = serverStatus?.has ?? {}
  const fieldConfig = [
    { name: 'geminiKey', ...strings.fields.gemini },
    { name: 'claudeKey', ...strings.fields.claude },
    { name: 'xaiKey', ...strings.fields.xai },
    { name: 'xaiTeamId', ...strings.fields.xaiTeamId },
    { name: 'perplexityKey', ...strings.fields.perplexity },
    { name: 'openaiKey', ...strings.fields.openai }
  ]

  return (
    <div
      className={`modal ${open ? 'open' : ''}`}
      aria-hidden={!open}
      onClick={event => {
        if (event.target.classList.contains('modal')) {
          onClose?.()
        }
      }}
    >
      <div className="sheet">
        <h3 className="modal-title">{strings.title}</h3>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>{strings.statusIntro}</div>

        <div className="status-grid">
          {strings.statusOrder.map(item => (
            <StatusPill key={item.key} label={item.label} ok={availability[item.key]} />
          ))}
        </div>

        {fieldConfig.map(field => (
          <div className="row" key={field.name}>
            <label>{field.label}</label>
            <input
              type={field.type || 'password'}
              placeholder={field.placeholder}
              value={form[field.name]}
              onChange={event => setForm(value => ({ ...value, [field.name]: event.target.value }))}
            />
          </div>
        ))}

        <div className="actions">
          <button className="btn danger" type="button" onClick={clear}>{strings.buttons.clear}</button>
          <button className="btn" type="button" onClick={onClose}>{strings.buttons.close}</button>
          <button className="btn primary" type="button" onClick={save}>{strings.buttons.save}</button>
        </div>
      </div>
    </div>
  )
}

function StatusPill({ label, ok }) {
  return (
    <span className={`status-pill ${ok ? 'ok' : 'missing'}`}>
      <span className="indicator" aria-hidden="true"></span>
      {label}
    </span>
  )
}
