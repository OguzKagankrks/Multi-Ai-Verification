import React from 'react'

export default function Header({ theme, language, onToggleTheme, onLanguageChange, onOpenSettings, copy }) {
  return (
    <header className="app-header">
      <div className="container head">
        <div className="logo">
          <span className="dot orbit" aria-hidden="true"></span>
          <div className="wordmark">
            <span className="brand">Multi-Ai</span>
            <span className="tag">Flow</span>
          </div>
        </div>
        <div className="spacer"></div>
        <button
          className="btn theme-toggle"
          type="button"
          onClick={event => onToggleTheme?.(event)}
          aria-label={copy.themeLabel[theme]}
        >
          <span className={`toggle-orb ${theme}`}></span>
          <span className="toggle-label">{copy.themeLabel[theme]}</span>
        </button>
        <label className="btn lang-select">
          <span className="toggle-label">{copy.languageLabel}</span>
          <select value={language} onChange={event => onLanguageChange?.(event.target.value)}>
            {copy.languages.map(option => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button className="btn primary" type="button" onClick={onOpenSettings}>
          {copy.settingsButton}
        </button>
      </div>
    </header>
  )
}
