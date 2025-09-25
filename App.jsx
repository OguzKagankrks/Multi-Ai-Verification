import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Header from './components/Header.jsx'
import ModelCard from './components/ModelCard.jsx'
import SettingsModal from './components/SettingsModal.jsx'
import SideChatPanel from './components/SideChatPanel.jsx'

const BASE_STEPS = [
  { id: 'gemini', key: 'gemini' },
  { id: 'claude', key: 'claude' },
  { id: 'grok', key: 'xai' },
  { id: 'perplexity', key: 'perplexity' },
  { id: 'chatgpt', key: 'openai' },
  { id: 'final', key: 'openai' }
]

const LOCALE = {
  tr: {
    waiting: 'Bekleniyor...',
    skip: 'API anahtari tanimli degil, model atlandi.',
    finalMissing: 'ChatGPT anahtari olmadigi icin nihai cevap olusturulamadi.',
    errorPrefix: 'Hata',
    emptyAnswer: 'Bos yanit',
    emptyCard: name => 'Bu alanda ' + name + ' sonucunu goreceksin.',
    steps: {
      gemini: 'Gemini Yaniti',
      claude: 'Claude Degerlendirmesi',
      grok: 'Grok Dogrulamasi',
      perplexity: 'Perplexity Analizi',
      chatgpt: 'ChatGPT Incelemesi',
      final: 'Son Cevap'
    },
    header: {
      themeLabel: { light: 'Gunduz modu', dark: 'Gece modu' },
      languageLabel: 'Dil',
      languages: [
        { code: 'tr', label: 'Turkce' },
        { code: 'en', label: 'English' }
      ],
      settingsButton: 'Ayarlar'
    },
    input: {
      placeholder: 'Sorunu yaz... (Enter: Gonder)',
      hint: 'VS Code: Terminalde "npm run dev" komutunu calistir. Ilk seferde Ayarlari acip anahtarlari kontrol et.',
      send: 'Gonder'
    },
    sidePanel: {
      title: 'Hizli Sohbet',
      optionsLabel: 'Secenekler',
      placeholder: 'Sag panelde secili modele sorunuzu yazin...',
      send: 'Gonder',
      selectModel: 'Lutfen once bir model sec.',
      emptyResponse: 'Henuz yanit yok.',
      responseTitle: 'Son Yanit',
      missingLabel: 'API anahtari yok',
      modelNames: {
        gemini: 'Gemini',
        claude: 'Claude',
        grok: 'Grok',
        perplexity: 'Perplexity',
        chatgpt: 'ChatGPT'
      }
    },
    about: {
      title: 'Hakkinda',
      description: 'Multi-Ai Flow, bir soruya birden fazla modeli sira ile calistirarak dogrulama ve nihai yanit uretimini otomatiklestirir.',
      featuresTitle: 'Ozellikler',
      features: [
        'Gemini always generates the initial draft response',
        'Claude, Grok and Perplexity review the draft in sequence',
        'If ChatGPT is unavailable, the final card shows the last successful model output',
        'API errors stay on their own card while the rest of the pipeline continues',
        'Use the side panel to query any single model on demand'
      ],
      usageTitle: 'How to use',
      usageSteps: [
        'Enter your question in the main composer on the left and press Send.',
        'Watch each card populate and note any warnings or corrections.',
        'When ChatGPT is missing, the final card automatically shows the most recent reviewer output.',
        'Leverage the side panel to re-run or probe individual models directly.'
      ]
    },
    status: { ready: 'ready', disabled: 'inactive' },
    settings: {
      title: 'API Keys',
      statusIntro: 'Server-side key status:',
      statusOrder: [
        { key: 'gemini', label: 'Gemini' },
        { key: 'claude', label: 'Claude' },
        { key: 'xai', label: 'Grok (xAI)' },
        { key: 'xaiTeamId', label: 'xAI Team ID' },
        { key: 'perplexity', label: 'Perplexity' },
        { key: 'openai', label: 'OpenAI' }
      ],
      fields: {
        gemini: { label: 'Gemini', placeholder: 'Key giriniz...', type: 'password' },
        claude: { label: 'Claude', placeholder: 'Key giriniz...', type: 'password' },
        xai: { label: 'Grok (xAI)', placeholder: 'Key giriniz...', type: 'password' },
        xaiTeamId: { label: 'xAI Team ID', placeholder: 'Optional team identifier', type: 'text' },
        perplexity: { label: 'Perplexity', placeholder: 'Key giriniz...', type: 'password' },
        openai: { label: 'OpenAI (ChatGPT)', placeholder: 'Key giriniz...', type: 'password' }
      },
      buttons: { clear: 'Clear', close: 'Close', save: 'Save' }
    },
    placeholders: {
      gemini: '[Gemini skipped]',
      claude: '[Claude skipped]',
      grok: '[Grok skipped]',
      perplexity: '[Perplexity skipped]'
    },
    prompts: {
      claude: ({ question, gemini }) => ({
        model: 'claude-3-5-sonnet-latest',
        max_tokens: 1024,
        temperature: 0.2,
        messages: [
          {
            role: 'user',
            content:
              'Question: ' + question +
              '\n\nGemini answer:\n' + gemini +
              '\n\nTasks:\n- Assess factual accuracy and flag issues.' +
              '\n- Provide a concise corrected answer if needed.' +
              '\n- Give a confidence score between 0-100.' +
              '\nRespond with clear bullet points.'
          }
        ]
      }),
      grok: ({ question, gemini, claude }) => ({
        model: 'grok-2',
        messages: [
          {
            role: 'system',
            content: 'You are Grok. Inspect the Claude review, catch critical mistakes, and refine the answer if required. Focus on insights and risks.'
          },
          {
            role: 'user',
            content: `Question: ${question}\n\nGemini answer\n${gemini}\n\nClaude review\n${claude}\n\nPlease\n1) List any omissions or errors in Claude's notes.\n2) Provide a clear correction or confirmation.\n3) Share your confidence score (0-100).`
          }
        ],
        temperature: 0.2
      }),
      perplexity: ({ question, gemini, claude, grok }) => ({
        model: 'sonar-reasoning-pro',
        messages: [
          {
            role: 'system',
            content: 'As Perplexity, cross-check prior model outputs, suggest helpful sources, and provide a concise summary.'
          },
          {
            role: 'user',
            content:
              'Question: ' + question +
              '\n\nGemini answer:\n' + gemini +
              '\n\nClaude review:\n' + claude +
              '\n\nGrok verification:\n' + grok +
              '\n\nSummarize reliability, highlight conflicts, and suggest adjustments as short bullet points.'
          }
        ]
      }),
      chatgpt: ({ question, gemini, claude, grok, perplexity }) => ({
        model: 'gpt-4o-mini',
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: 'You are ChatGPT. Synthesize every output, resolve inconsistencies, and present a trustworthy final answer. Return JSON with fields analysis and final.'
          },
          {
            role: 'user',
            content:
              'Question: ' + question +
              '\n\nGemini answer:\n' + gemini +
              '\n\nClaude review:\n' + claude +
              '\n\nGrok verification:\n' + grok +
              '\n\nPerplexity analysis:\n' + perplexity +
              '\n\nJSON template: {"analysis":"...", "final":"..."}.'
          }
        ]
      })
    }
  }
}

export default function App() {
  const [theme, setTheme] = useState('dark')
  const [language, setLanguage] = useState('tr')
  const [showSettings, setShowSettings] = useState(false)
  const [answers, setAnswers] = useState({})
  const [status, setStatus] = useState(null)
  const [cursor, setCursor] = useState({ x: 0, y: 0 })
  const [mainDraft, setMainDraft] = useState('')
  const [mainSending, setMainSending] = useState(false)
  const themeWaveTimeout = useRef(null)

  const locale = LOCALE[language]
  const waitingMessage = useMemo(() => locale.waiting, [locale])
  const skipMessage = useMemo(() => locale.skip, [locale])
  const finalMissingMessage = useMemo(() => locale.finalMissing, [locale])

  const orderedSteps = useMemo(() => {
    return BASE_STEPS.map(step => ({ ...step, name: locale.steps[step.id] ?? step.id }))
  }, [locale])

  const orderedStepIds = useMemo(() => orderedSteps.map(step => step.id), [orderedSteps])
  const about = locale.about

  const refreshStatus = async () => {
    try {
      const response = await fetch('/api/status')
      const snapshot = await response.json()
      setStatus(snapshot)
      return snapshot
    } catch (_error) {
      setStatus(null)
      return null
    }
  }

  const availability = status?.has ?? {}

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    const waveColor = theme === 'light' ? 'rgba(96, 165, 250, 0.45)' : 'rgba(255, 179, 71, 0.45)'
    root.style.setProperty('--theme-wave-color', waveColor)
  }, [theme])

  useEffect(() => {
    refreshStatus()
  }, [])

  useEffect(() => {
    const handlePointerMove = event => setCursor({ x: event.clientX, y: event.clientY })
    window.addEventListener('pointermove', handlePointerMove)
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [])

  useEffect(() => () => {
    if (themeWaveTimeout.current) {
      window.clearTimeout(themeWaveTimeout.current)
    }
  }, [])

  const formatErrorMessage = reason => {
    if (reason instanceof Error && reason.message) {
      return locale.errorPrefix + ': ' + reason.message
    }
    return locale.errorPrefix + ': ' + String(reason)
  }

  const askAll = async question => {
    const snapshot = (await refreshStatus()) ?? status
    const currentAvailability = snapshot?.has ?? availability

    setAnswers(Object.fromEntries(orderedStepIds.map(id => [id, waitingMessage])))
    const context = { question }

    const ensureContext = (id, value) => {
      context[id] = value
      return value
    }

    const skipStep = (stepId, message = skipMessage) => {
      setAnswers(prev => ({ ...prev, [stepId]: message }))
      ensureContext(stepId, message)
      if (stepId === 'chatgpt') {
        const finalMessage = finalMissingMessage
        setAnswers(prev => ({ ...prev, chatgpt: message, final: finalMessage }))
        ensureContext('chatgpt', message)
        ensureContext('final', finalMessage)
      }
      if (stepId === 'final') {
        ensureContext('final', message)
      }
    }

    const markFailure = (stepId, error) => {
      const message = formatErrorMessage(error)
      setAnswers(prev => ({ ...prev, [stepId]: message }))
      ensureContext(stepId, message)
    }

    for (const stepId of orderedStepIds) {
      if (stepId === 'final') {
        continue
      }

      switch (stepId) {
        case 'gemini':
          if (currentAvailability.gemini) {
            try {
              const geminiAnswer = await callGemini(question, locale)
              ensureContext('gemini', geminiAnswer)
              setAnswers(prev => ({ ...prev, gemini: geminiAnswer }))
            } catch (error) {
              markFailure('gemini', error)
            }
          } else {
            skipStep('gemini')
          }
          break
        case 'claude':
          if (currentAvailability.claude) {
            try {
              const claudeReview = await callClaude(
                question,
                context.gemini ?? locale.placeholders.gemini,
                locale
              )
              ensureContext('claude', claudeReview)
              setAnswers(prev => ({ ...prev, claude: claudeReview }))
            } catch (error) {
              markFailure('claude', error)
            }
          } else {
            skipStep('claude')
          }
          break
        case 'grok':
          if (currentAvailability.xai) {
            try {
              const grokReview = await callGrok(
                question,
                {
                  gemini: context.gemini ?? locale.placeholders.gemini,
                  claude: context.claude ?? locale.placeholders.claude
                },
                locale
              )
              ensureContext('grok', grokReview)
              setAnswers(prev => ({ ...prev, grok: grokReview }))
            } catch (error) {
              markFailure('grok', error)
            }
          } else {
            skipStep('grok')
          }
          break
        case 'perplexity':
          if (currentAvailability.perplexity) {
            try {
              const perplexityReview = await callPerplexity(
                question,
                {
                  gemini: context.gemini ?? locale.placeholders.gemini,
                  claude: context.claude ?? locale.placeholders.claude,
                  grok: context.grok ?? locale.placeholders.grok
                },
                locale
              )
              ensureContext('perplexity', perplexityReview)
              setAnswers(prev => ({ ...prev, perplexity: perplexityReview }))
            } catch (error) {
              markFailure('perplexity', error)
            }
          } else {
            skipStep('perplexity')
          }
          break
        case 'chatgpt':
          if (currentAvailability.openai) {
            try {
              const chatgptResult = await callChatGPT(
                question,
                {
                  gemini: context.gemini ?? locale.placeholders.gemini,
                  claude: context.claude ?? locale.placeholders.claude,
                  grok: context.grok ?? locale.placeholders.grok,
                  perplexity: context.perplexity ?? locale.placeholders.perplexity
                },
                locale
              )
              ensureContext('chatgpt', chatgptResult.analysis)
              ensureContext('final', chatgptResult.final)
              setAnswers(prev => ({
                ...prev,
                chatgpt: chatgptResult.analysis,
                final: chatgptResult.final
              }))
            } catch (error) {
              markFailure('chatgpt', error)
            }
          } else {
            skipStep('chatgpt')
            const fallbackFinal = await computeFinalAnswer(context, locale, currentAvailability)
            setAnswers(prev => ({ ...prev, final: fallbackFinal }))
            ensureContext('final', fallbackFinal)
          }
          break
        default:
          break
      }
    }
  }

  const handleThemeToggle = useCallback(event => {
    const button = event?.currentTarget
    const root = document.documentElement

    if (button) {
      const rect = button.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2
      root.style.setProperty('--theme-wave-x', x + 'px')
      root.style.setProperty('--theme-wave-y', y + 'px')
    }

    if (themeWaveTimeout.current) {
      window.clearTimeout(themeWaveTimeout.current)
    }

    root.classList.remove('theme-wave-active')
    void root.offsetWidth
    root.classList.add('theme-wave-active')

    setTheme(value => (value === 'light' ? 'dark' : 'light'))

    themeWaveTimeout.current = window.setTimeout(() => {
      root.classList.remove('theme-wave-active')
      themeWaveTimeout.current = null
    }, 650)
  }, [])

  const mainComposerTitle = language === 'tr' ? 'Ana Ak?? Sorusu' : 'Pipeline Question'
  const sendingLabel = language === 'tr' ? 'G?nderiliyor...' : 'Sending...'

  const handleMainSubmit = async event => {
    event.preventDefault()
    const question = mainDraft.trim()
    if (!question) {
      return
    }
    setMainSending(true)
    try {
      await askAll(question)
      setMainDraft('')
    } catch (_error) {
     
    } finally {
      setMainSending(false)
    }
  }

  const handleSideChatSend = async (modelId, prompt) => {
    switch (modelId) {
      case 'gemini':
        return callGemini(prompt, locale)
      case 'claude':
        return callClaudeDirect(prompt, locale)
      case 'grok':
        return callGrokDirect(prompt, locale)
      case 'perplexity':
        return callPerplexityDirect(prompt, locale)
      case 'chatgpt':
        return callChatGPTDirect(prompt, locale)
      default:
        throw new Error(locale.errorPrefix + ': Unsupported model (' + modelId + ')')
    }
  }

  const glowStyle = {
    transform: 'translate(' + (cursor.x - 160) + 'px, ' + (cursor.y - 160) + 'px)'
  }

  return (
    <>
      <div className="cursor-glow" style={glowStyle} aria-hidden="true" />
      <Header
        theme={theme}
        language={language}
        onToggleTheme={handleThemeToggle}
        onLanguageChange={value => setLanguage(value)}
        onOpenSettings={() => setShowSettings(true)}
        copy={locale.header}
      />

      <main className="container">
        <div className="main-column">
          <section className="about-panel">
            <h2>{about.title}</h2>
            <p>{about.description}</p>
            <h3>{about.featuresTitle}</h3>
            <ul>
              {about.features.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <h3>{about.usageTitle}</h3>
            <ol>
              {about.usageSteps.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ol>
          </section>
          <section className="stage" aria-live="polite">
            {orderedSteps.map(step => {
              const stepAvailable = step.key ? !!availability[step.key] : !!availability.openai

              return (
                <ModelCard
                  key={step.id}
                  id={step.id}
                  title={step.name}
                  disabled={!stepAvailable}
                  metaReady={locale.status.ready}
                  metaDisabled={locale.status.disabled}
                  text={answers[step.id] ?? locale.emptyCard(step.name)}
                />
              )
            })}
            <form className="composer-card" onSubmit={handleMainSubmit}>
              <h3>{mainComposerTitle}</h3>
              <textarea
                className="composer-textarea"
                value={mainDraft}
                onChange={event => setMainDraft(event.target.value)}
                placeholder={locale.input.placeholder}
                disabled={mainSending}
              />
              <div className="composer-actions">
                <button className="btn primary" type="submit" disabled={mainSending || !mainDraft.trim()}>
                  {mainSending ? sendingLabel : locale.input.send}
                </button>
              </div>
            </form>
          </section>
        </div>
        <aside className="side-column">
          <SideChatPanel
            availability={availability}
            strings={locale.sidePanel}
            waitingMessage={waitingMessage}
            emptyFallback={locale.sidePanel.emptyResponse}
            errorPrefix={locale.errorPrefix}
            onSend={handleSideChatSend}
          />
        </aside>
      </main>

      <SettingsModal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        onSaved={refreshStatus}
        status={status}
        strings={locale.settings}
      />
    </>
  )
}

async function callGemini(question, locale) {
  const response = await fetch('/api/gemini/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: question }] }]
    })
  })

  const data = await readJsonResponse(response, 'Gemini')
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || locale.emptyAnswer
}

async function callClaude(question, geminiAnswer, locale) {
  const payload = locale.prompts.claude({ question, gemini: geminiAnswer })
  const response = await fetch('/api/claude/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  const data = await readJsonResponse(response, 'Claude')
  const text = Array.isArray(data.content)
    ? data.content.map(part => part.text).filter(Boolean).join('\n').trim()
    : ''
  return text || locale.emptyAnswer
}

async function callGrok(question, context, locale) {
  const payload = locale.prompts.grok({ question, gemini: context.gemini, claude: context.claude })
  const response = await fetch('/api/xai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  const data = await readJsonResponse(response, 'xAI')
  return data.choices?.[0]?.message?.content?.trim() || locale.emptyAnswer
}

async function callPerplexity(question, context, locale) {
  const payload = locale.prompts.perplexity({
    question,
    gemini: context.gemini,
    claude: context.claude,
    grok: context.grok
  })
  const response = await fetch('/api/perplexity/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  const data = await readJsonResponse(response, 'Perplexity')
  return data.choices?.[0]?.message?.content?.trim() || locale.emptyAnswer
}

async function callChatGPT(question, context, locale) {
  const payload = locale.prompts.chatgpt({
    question,
    gemini: context.gemini,
    claude: context.claude,
    grok: context.grok,
    perplexity: context.perplexity
  })
  const response = await fetch('/api/openai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  const data = await readJsonResponse(response, 'OpenAI')
  const raw = data.choices?.[0]?.message?.content?.trim() || ''
  return parseChatGPTOutput(raw, locale.emptyAnswer)
}

async function callClaudeDirect(message, locale) {
  const payload = {
    model: 'claude-3-5-sonnet-latest',
    max_tokens: 512,
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content: 'You are Claude. Provide concise, factual answers.'
      },
      { role: 'user', content: message }
    ]
  }

  const response = await fetch('/api/claude/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  const data = await readJsonResponse(response, 'Claude')
  const text = Array.isArray(data.content)
    ? data.content.map(part => part.text).filter(Boolean).join('\n').trim()
    : ''
  return text || locale.emptyAnswer
}

async function callGrokDirect(message, locale) {
  const payload = {
    model: 'grok-2',
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content: 'You are Grok. Give clear answers and call out important warnings when needed.'
      },
      { role: 'user', content: message }
    ]
  }

  const response = await fetch('/api/xai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  const data = await readJsonResponse(response, 'xAI')
  return data.choices?.[0]?.message?.content?.trim() || locale.emptyAnswer
}

async function callPerplexityDirect(message, locale) {
  const payload = {
    model: 'sonar-reasoning-pro',
    messages: [
      {
        role: 'system',
        content: 'You are Perplexity. Provide accurate, sourced answers when possible.'
      },
      { role: 'user', content: message }
    ]
  }

  const response = await fetch('/api/perplexity/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  const data = await readJsonResponse(response, 'Perplexity')
  return data.choices?.[0]?.message?.content?.trim() || locale.emptyAnswer
}

async function computeFinalAnswer(context, locale, availability) {
  const stages = [
    { id: 'chatgpt', available: availability.openai, value: context.chatgpt },
    { id: 'perplexity', available: availability.perplexity, value: context.perplexity },
    { id: 'grok', available: availability.xai, value: context.grok },
    { id: 'claude', available: availability.claude, value: context.claude },
    { id: 'gemini', available: availability.gemini, value: context.gemini }
  ]

  for (const stage of stages) {
    if (stage.available && stage.value && stage.value.trim()) {
      return stage.value
    }
  }

  return locale.finalMissing
}

async function callChatGPTDirect(message, locale) {
  const payload = {
    model: 'gpt-4o-mini',
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content: 'You are ChatGPT. Respond with a helpful and trustworthy answer.'
      },
      { role: 'user', content: message }
    ]
  }

  const response = await fetch('/api/openai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  const data = await readJsonResponse(response, 'OpenAI')
  return data.choices?.[0]?.message?.content?.trim() || locale.emptyAnswer
}

async function readJsonResponse(response, providerName) {
  const text = await response.text()
  if (!response.ok) {
    const detail = extractErrorDetail(text)
    const suffix = detail ? ' - ' + detail : ''
    throw new Error(providerName + ' ' + response.status + suffix)
  }

  try {
    return JSON.parse(text || '{}')
  } catch (_error) {
    throw new Error(providerName + ' response could not be parsed as JSON')
  }
}

function parseChatGPTOutput(raw, emptyAnswer) {
  if (!raw) {
    return { analysis: emptyAnswer, final: emptyAnswer }
  }

  const trimmed = raw.trim()
  try {
    const parsed = JSON.parse(trimmed)
    const analysis = String(parsed.analysis ?? '').trim()
    const final = String(parsed.final ?? '').trim()
    if (analysis || final) {
      return {
        analysis: analysis || final || emptyAnswer,
        final: final || analysis || emptyAnswer
      }
    }
  } catch (_error) {
    // plain text fallback below
  }

  const match = trimmed.match(/final\s*[:=-]\s*(.+)$/i)
  const final = match ? match[1].trim() : trimmed
  return {
    analysis: trimmed,
    final: final || trimmed
  }
}

function extractErrorDetail(rawText) {
  if (!rawText) {
    return ''
  }

  const trimmed = rawText.trim()
  if (!trimmed) {
    return ''
  }

  try {
    const payload = JSON.parse(trimmed)
    return (
      payload?.error?.message ||
      payload?.error?.code ||
      payload?.error ||
      payload?.message ||
      ''
    )
  } catch (_error) {
    return trimmed.slice(0, 160)
  }
}













































