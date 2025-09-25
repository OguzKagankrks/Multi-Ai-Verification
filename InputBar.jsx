import React, { useState } from 'react'

export default function InputBar({ onSend, hint, placeholder, sendLabel }) {
  const [q, setQ] = useState('')

  const submit = event => {
    event.preventDefault()
    const trimmed = q.trim()
    if (!trimmed) {
      return
    }
    onSend?.(trimmed)
    setQ('')
  }

  const handleKeyDown = event => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  return (
    <form className="input-bar" onSubmit={submit}>
      <div className="input">
        <textarea
          value={q}
          onChange={event => setQ(event.target.value)}
          placeholder={placeholder || ''}
          onKeyDown={handleKeyDown}
        />
        <button className="send" type="submit">{sendLabel || 'Send'}</button>
      </div>
      {hint && <span style={{ color: 'var(--muted)', fontSize: 12 }}>{hint}</span>}
    </form>
  )
}
