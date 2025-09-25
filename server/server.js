import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"
import fs from "fs"

dotenv.config()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 8787

app.use(cors())
app.use(express.json({ limit: "2mb" }))

// Keys loaded from .env, can be overridden via /api/set-keys (in-memory only)
const KEYS = {
  openaiKey: process.env.OPENAI_API_KEY || "",
  geminiKey: process.env.GEMINI_API_KEY || "",
  claudeKey: process.env.CLAUDE_API_KEY || "",
  xaiKey: process.env.XAI_API_KEY || "",
  xaiTeamId: process.env.XAI_TEAM_ID || "",
  perplexityKey: process.env.PERPLEXITY_API_KEY || ""
}

app.get("/api/status", (_req, res) => {
  res.json({
    ok: true,
    has: {
      openai: !!KEYS.openaiKey,
      gemini: !!KEYS.geminiKey,
      claude: !!KEYS.claudeKey,
      xai: !!KEYS.xaiKey,
      xaiTeamId: !!KEYS.xaiTeamId,
      perplexity: !!KEYS.perplexityKey
    }
  })
})

app.post("/api/set-keys", (req, res) => {
  const { openaiKey, geminiKey, claudeKey, xaiKey, xaiTeamId, perplexityKey } = req.body || {}
  if (typeof openaiKey === "string") KEYS.openaiKey = openaiKey.trim()
  if (typeof geminiKey === "string") KEYS.geminiKey = geminiKey.trim()
  if (typeof claudeKey === "string") KEYS.claudeKey = claudeKey.trim()
  if (typeof xaiKey === "string") KEYS.xaiKey = xaiKey.trim()
  if (typeof xaiTeamId === "string") KEYS.xaiTeamId = xaiTeamId.trim()
  if (typeof perplexityKey === "string") KEYS.perplexityKey = perplexityKey.trim()
  res.json({
    ok: true,
    has: {
      openai: !!KEYS.openaiKey,
      gemini: !!KEYS.geminiKey,
      claude: !!KEYS.claudeKey,
      xai: !!KEYS.xaiKey,
      xaiTeamId: !!KEYS.xaiTeamId,
      perplexity: !!KEYS.perplexityKey
    }
  })
})

async function forward(url, opts) {
  const response = await fetch(url, opts)
  const text = await response.text()
  return {
    status: response.status,
    text,
    type: response.headers.get("content-type") || "application/json"
  }
}

app.post("/api/openai/chat", async (req, res) => {
  if (!KEYS.openaiKey) {
    return res.status(400).json({ error: "OpenAI key missing" })
  }

  const out = await forward("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEYS.openaiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(req.body || {})
  })

  res.status(out.status).type(out.type).send(out.text)
})

app.post("/api/gemini/generate", async (req, res) => {
  if (!KEYS.geminiKey) {
    return res.status(400).json({ error: "Gemini key missing" })
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(
    KEYS.geminiKey
  )}`

  const out = await forward(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(req.body || {})
  })

  res.status(out.status).type(out.type).send(out.text)
})

app.post("/api/claude/chat", async (req, res) => {
  if (!KEYS.claudeKey) {
    return res.status(400).json({ error: "Claude key missing" })
  }

  const payload = req.body && Object.keys(req.body).length > 0 ? req.body : {
    model: "claude-3-5-sonnet-latest",
    max_tokens: 1024,
    messages: [{ role: "user", content: "Hello" }]
  }

  const out = await forward("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": KEYS.claudeKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  })

  res.status(out.status).type(out.type).send(out.text)
})

app.post("/api/xai/chat", async (req, res) => {
  if (!KEYS.xaiKey) {
    return res.status(400).json({ error: "xAI key missing" })
  }

  const headers = {
    Authorization: `Bearer ${KEYS.xaiKey}`,
    "Content-Type": "application/json",
    "X-Title": "VERIFICATION Ai Flow VSCode"
  }
  if (KEYS.xaiTeamId) {
    headers["x-ai-team-id"] = KEYS.xaiTeamId
  }

  const out = await forward("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers,
    body: JSON.stringify(req.body || {})
  })

  res.status(out.status).type(out.type).send(out.text)
})

app.post("/api/perplexity/chat", async (req, res) => {
  if (!KEYS.perplexityKey) {
    return res.status(400).json({ error: "Perplexity key missing" })
  }

  const out = await forward("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEYS.perplexityKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(req.body || {})
  })

  res.status(out.status).type(out.type).send(out.text)
})

// Serve built client if exists (web/dist)
const distPath = path.resolve(__dirname, "..", "web", "dist")
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")))
} else {
  app.get("/", (_req, res) =>
    res.send("API server up. Dev UI runs on Vite (http://localhost:5173).")
  )
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
