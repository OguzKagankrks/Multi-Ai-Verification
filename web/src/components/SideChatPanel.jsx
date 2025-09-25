import React, { useEffect, useState } from 'react'

const MODEL_ORDER = [
  { id: 'gemini', availabilityKey: 'gemini' },
  { id: 'claude', availabilityKey: 'claude' },
  { id: 'grok', availabilityKey: 'xai' },
  { id: 'perplexity', availabilityKey: 'perplexity' },
  { id: 'chatgpt', availabilityKey: 'openai' }
]

export default function SideChatPanel({
  availability,
  strings,
  waitingMessage,
  emptyFallback,
  errorPrefix,
  onSend
}) {
  const [selected, setSelected] = useState(null)
  const [message, setMessage] = useState('')
  const [responses, setResponses] = useState({})
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const chosen = MODEL_ORDER.find(item => item.id === selected)
    if (chosen && !availability[chosen.availabilityKey]) {
      setSelected(null)
    }
    if (!selected) {
      const fallback = MODEL_ORDER.find(item => availability[item.availabilityKey])
      if (fallback) {
        setSelected(fallback.id)
      }
    }
  }, [availability, selected])

  useEffect(() => {
    setStatus('idle')
    setErrorMessage('')
  }, [selected])

  const handleSelect = id => {
    const entry = MODEL_ORDER.find(item => item.id === id)
    if (!entry || !availability[entry.availabilityKey]) {
      return
    }
    setSelected(id)
    setErrorMessage('')
  }

  const handleSubmit = async event => {
    event.preventDefault()
    const trimmed = message.trim()
    if (!selected) {
      setErrorMessage(strings.selectModel)
      return
    }
    if (!trimmed) {
      return
    }

    setStatus('loading')
    setErrorMessage('')

    try {
      const reply = await onSend(selected, trimmed)
      const normalized = typeof reply === 'string' ? reply.trim() : ''
      setResponses(prev => ({ ...prev, [selected]: normalized }))
      setStatus('success')
      setMessage('')
    } catch (error) {
      const detail = error instanceof Error && error.message ? error.message : String(error)
      setErrorMessage(errorPrefix + ': ' + detail)
      setStatus('error')
    }
  }

  const handleKeyDown = event => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  const currentResponse = selected ? responses[selected] : ''
  let displayText = currentResponse || emptyFallback
  if (status === 'loading') {
    displayText = waitingMessage
  } else if (status === 'error') {
    displayText = errorMessage || emptyFallback
  }

  return (
    <aside className="side-chat-panel">
      <div className="side-chat-header">
        <h2>{strings.title}</h2>
        <span className="side-chat-options-label">{strings.optionsLabel}</span>
      </div>

      <div className="side-chat-options">
        {MODEL_ORDER.map(model => {
          const available = !!availability[model.availabilityKey]
          const isSelected = model.id === selected
          const classes = ['side-chat-option']
          if (isSelected) classes.push('is-selected')
          if (!available) classes.push('is-disabled')
          const label = strings.modelNames?.[model.id] || model.id

          return (
            <button
              key={model.id}
              type="button"
              className={classes.join(' ')}
              onClick={() => handleSelect(model.id)}
              disabled={!available}
              aria-pressed={isSelected}
            >
              <span className="side-chat-option-label">{label}</span>
              {!available && (
                <span className="side-chat-option-hint">{strings.missingLabel}</span>
              )}
            </button>
          )
        })}
      </div>

      <form className="side-chat-form" onSubmit={handleSubmit}>
        <textarea
          className="side-chat-input"
          value={message}
          onChange={event => setMessage(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={strings.placeholder}
          rows={4}
        />
        <div className="side-chat-actions">
          <button className="btn primary" type="submit" disabled={status === 'loading'}>
            {strings.send}
          </button>
          {errorMessage && status !== 'error' && (
            <span className="side-chat-inline-error" role="alert">{errorMessage}</span>
          )}
        </div>
      </form>

      <section className="side-chat-response" aria-live="polite">
        <h3>{strings.responseTitle}</h3>
        <div
          className={[
            'side-chat-response-body',
            status === 'loading' ? 'is-loading' : '',
            status === 'error' ? 'has-error' : ''
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {displayText}
        </div>
        {status === 'error' && (
          <span className="side-chat-inline-error" role="alert">{errorMessage}</span>
        )}
      </section>
    </aside>
  )
}
