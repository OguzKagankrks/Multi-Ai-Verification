import React from 'react'

export default function ModelCard({
  id,
  title,
  text,
  disabled,
  metaReady,
  metaDisabled,
  draggable = false,
  isDragging = false,
  isDragOver = false,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onCopy,
  copyLabel = '',
  copyActive = false,
  copyDisabled = false
}) {
  const colorVar = {
    gemini: 'var(--gemini)',
    claude: 'var(--claude)',
    grok: 'var(--grok)',
    perplexity: 'var(--perplexity)',
    chatgpt: 'var(--chatgpt)',
    final: 'var(--summary)'
  }[id] || 'var(--primary)'

  const className = [
    'card',
    disabled ? 'card-disabled' : '',
    draggable ? 'card-draggable' : '',
    isDragging ? 'card-dragging' : '',
    isDragOver ? 'card-drag-over' : ''
  ]
    .filter(Boolean)
    .join(' ')

  const statusLabel = disabled ? metaDisabled : metaReady
  const showCopyButton = typeof onCopy === 'function'
  const buttonText = copyLabel || ''

  return (
    <article
      className={className}
      data-model={id}
      data-disabled={disabled || undefined}
      draggable={draggable || undefined}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      <div className="head-row">
        <span className="badge" style={{ background: colorVar }}></span>
        <strong>{title}</strong>
        <div className="meta">
          {showCopyButton && (
            <button
              type="button"
              className={`copy-button${copyActive ? ' is-active' : ''}`}
              onClick={onCopy}
              disabled={copyDisabled}
              aria-label={buttonText || copyLabel || 'Copy text'}
            >
              {buttonText}
            </button>
          )}
          <span className="ts">{statusLabel}</span>
        </div>
      </div>
      <div className="body">
        <div className="bubble">{text}</div>
      </div>
    </article>
  )
}
