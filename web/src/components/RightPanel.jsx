import React from 'react'

export default function RightPanel({
  locale,
  selectedModel,
  onSelect,
  onRun,
  panelAnswer,
  panelLoading,
  panelError,
  availableModels,
  lastQuestion
}) {
  const handleSelect = event => {
    onSelect?.(event.target.value)
  }

  return (
    <aside className="side-panel">
      <div className="panel-shell">
        <h2 className="panel-title">{locale.panel.title}</h2>
        <p className="panel-desc">{locale.panel.description}</p>

        <label className="panel-field">
          <span className="panel-label">{locale.panel.selectLabel}</span>
          <select value={selectedModel} onChange={handleSelect}>
            {locale.panel.models.map(option => (
              <option key={option.id} value={option.id} disabled={!availableModels[option.id]}>
                {option.name}
              </option>
            ))}
          </select>
        </label>

        {!lastQuestion && <div className="panel-hint">{locale.panel.noQuestion}</div>}
        {lastQuestion && (
          <>
            <div className="panel-summary">
              <span className="panel-summary-label">{locale.panel.questionLabel}</span>
              <p className="panel-summary-text">{lastQuestion}</p>
            </div>
            <button
              className="btn primary panel-run"
              type="button"
              onClick={onRun}
              disabled={panelLoading || !availableModels[selectedModel]}
            >
              {panelLoading ? locale.panel.loading : locale.panel.run}
            </button>
            {!availableModels[selectedModel] && (
              <div className="panel-hint muted">{locale.panel.missingKey}</div>
            )}
          </>
        )}

        {panelError && <div className="panel-error">{panelError}</div>}

        {panelAnswer && (
          <div className="panel-result">
            <span className="panel-summary-label">{locale.panel.answerLabel}</span>
            <pre>{panelAnswer}</pre>
          </div>
        )}
      </div>
    </aside>
  )
}
