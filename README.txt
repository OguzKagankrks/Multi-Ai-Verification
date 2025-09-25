# Multi-AI VSCode Flow

## Turkce (TR)

### Genel Bakis
Multi-AI VSCode Flow, bir soruyu sirali olarak birden fazla yapay zeka modeline aktarip gozetimli dogrulama yapan cok katmanli bir asistandir. Proje, Vite tabanli React istemcisi (`web/`) ve Express ile yazilmis API gecidi (`server/`) olmak uzere iki paketli bir npm workspace olarak duzenlendi. VS Code icin optimize edilmis cam yuzeyli tema, gece/gunduz renk gecisleri ve klavye kisayollari sayesinde gelistirme ortaminda hizli test yapmanizi saglar.

### Ozellikler
- Gemini -> Claude -> Grok -> Perplexity -> ChatGPT -> Son Cevap zinciri ile ardil model dogrulama ve hata toleransli devam etme.
- Her modelin karti ham ciktisi, hata mesajlarini ve anahtar eksikliginde atlama uyarilarini gosterir; ChatGPT anahtari yoksa final karti son basarili modelin yanitini kullanir.
- SideChatPanel sagda tekil model testine izin verir, yanitlari kaydeder ve eksik anahtarlar icin uyarir.
- Ayarlar modali, anahtar durumunu aninda guncelleyip `/api/set-keys` uzerinden bellege kaydeder; surdurulebilirlik icin `.env` kullanabilirsiniz.
- Tema ve dil (Turkce/English) secici ile calisma seansinda arayuz tercihini degistirebilirsiniz.
- Vite gelistirme sunucusu `/api` isteklerini Express katmanina otomatik olarak proxyler ve uretim modunda `web/dist` sunucu tarafindan servis edilir.

### Proje Yapisi
```
multi-ai-vscode/
  package.json          # workspace kok dizin ve ortak scriptler
  server/
    server.js           # Express API gecidi ve statik dosya servisi
    package.json
    .env.example        # ornek ortam degiskenleri
  web/
    package.json
    src/App.jsx         # cok adimli akis, yerellesme ve durum yonetimi
    src/components/     # Header, ModelCard, SettingsModal, SideChatPanel
    src/styles.css      # cam panel temasi ve animasyonlar
```

### Kurulum ve Gelistirme
1. Node.js 20 LTS veya uzeri kurulu oldugundan emin olun.
2. Depo kokunde `npm install` calistirin (workspaces otomatik olarak `server` ve `web` paketlerini kurar).
3. Gelistirme modunu `npm run dev` ile baslatin. Bu komut `concurrently` araciligiyla hem Express API sunucusunu (http://localhost:8787) hem Vite arayuzunu (http://localhost:5173) acar.
4. Yalnizca API veya istemciyi calistirmak isterseniz: `npm run dev -w server` ya da `npm run dev -w web`.

### Testler
- Cypress E2E testlerini calistirmadan once ayri bir terminalde `npm run dev` komutunu baslatin.
- Diger terminalde interaktif calistirici icin `npm run cypress:open -w web`, basit kosum icin `npm run cypress:run -w web` komutlarini kullanin.

### Uretime Hazirlama
- `npm run build` komutu Vite istemcisini `web/dist` klasorune derler.
- `npm run start` (veya `npm run start -w server`) komutu Express sunucusunu baslatir; eger `web/dist` mevcutsa statik dosyalari otomatik olarak servis eder.

### API Anahtarlari
- Varsayilan ortam degiskenlerini `server/.env.example` dosyasini kopyalayip `server/.env` olarak yeniden adlandirarak yukleyin.
- Anahtarlar calisma zamaninda `/api/set-keys` uzerinden bellege yazilir; dosyaya kaydedilmez. Sunucuyu yeniden baslatirsaniz `.env` icerigi tekrar yuklenir.
- Gerekli degiskenler:

| Degisken           | Kullanim Amaci                                               |
|--------------------|--------------------------------------------------------------|
| OPENAI_API_KEY     | ChatGPT final harmanlayici ve hizli sohbet `chatgpt` modeli  |
| GEMINI_API_KEY     | Zincirin ilk adimi olan Gemini cagrilari                     |
| CLAUDE_API_KEY     | Claude dogrulama adimi                                       |
| XAI_API_KEY        | Grok (xAI) adimi                                             |
| XAI_TEAM_ID        | Opsiyonel xAI takim kimligi (varsa panelde gosterilir)       |
| PERPLEXITY_API_KEY | Perplexity cift kontrol adimi                                |

### API Uclari
- `GET /api/status` -> Kayitli anahtarlarin mevcudiyetini dondurur.
- `POST /api/set-keys` -> Gonderilen anahtar degerlerini sunucu bellegine yazar.
- `POST /api/openai/chat` -> OpenAI chat completions API'sine vekalet eder.
- `POST /api/gemini/generate` -> Google Gemini generateContent API'sine vekalet eder.
- `POST /api/claude/chat` -> Anthropic Claude messages API'sine istek gonderir.
- `POST /api/xai/chat` -> xAI chat completions API'sine vekalet eder (`X-Title` basligi ile).
- `POST /api/perplexity/chat` -> Perplexity chat completions API'sine baglanir.

### Kullanici Akisi
1. Kullanici sol panodan sorusunu yazar ve gonderir.
2. Gemini yaniti olusturur; hata alirsa kart hatayi gosterir ve zincir bir sonraki modele gecer.
3. Claude, Grok ve Perplexity sirayla onceki ciktilari degerlendirir; hatalar zinciri durdurmaz.
4. ChatGPT mevcutsa tum araci model ciktilarini analiz + JSON formatli final yanit olarak birlestirir.
5. `Son Cevap` karti ChatGPT ciktisini, yoksa en son basarili modeli gosterir.
6. Sag paneldeki hizli sohbet, secilen tekil modelden bagimsiz sorgulama yapmanizi saglar ve onceki yanitlari hatirlar.

### Ek Notlar
- Uzak ortamda yayinlamadan once `/api/set-keys` ucunu kimlik dogrulama veya sinirli CORS ile koru; aksi halde herkes anahtarlarini bellege yazabilir.

- Anahtarlar yalnizca bellek icinde tutulur; kalici saklama ihtiyaci varsa kendi saklama cozumunuzu ekleyin.
- Tum fetch cagri hatalari kartlarda okunabilir mesajlara donusturulur; JSON parse edilemiyorsa donen metnin ilk 160 karakteri gosterilir.
- Proxy davranisi Vite konfigurasyonunda otomatik; farkli port kullanacaksaniz `vite.config.js` uzerinden guncellemeniz gerekir.
- Projede test betikleri bulunmuyor; degisikliklerden sonra el ile senaryo testleri onerilir.

---

## English (EN)

### Overview
Multi-AI VSCode Flow is a multi-stage assistant that routes a question through several AI models to perform supervised validation. The repository is organised as an npm workspace with a Vite-powered React client (`web/`) and an Express API gateway (`server/`). The UI ships with a glassmorphism theme, day/night transitions, and keyboard-friendly affordances tuned for VS Code.

### Features
- Sequential verification chain (Gemini -> Claude -> Grok -> Perplexity -> ChatGPT -> Final) with graceful fallbacks when a provider fails or lacks an API key.
- Each model card reveals its raw output, error messages, and "skipped" hints; when ChatGPT is unavailable the final card falls back to the latest successful model response.
- The right-hand quick chat panel lets you probe individual models, keeps the most recent answer per provider, and warns about missing keys.
- The settings modal updates key availability live through `/api/set-keys`, storing values in memory while `.env` supplies defaults on boot.
- Theme and language selectors (Turkish/English) let you switch the interface without reloading.
- The Vite dev server proxies `/api` calls to Express, and in production the server automatically serves `web/dist`.

### Project Structure
```
multi-ai-vscode/
  package.json          # workspace root and shared scripts
  server/
    server.js           # Express gateway and static file host
    package.json
    .env.example        # sample environment variables
  web/
    package.json
    src/App.jsx         # multi-step flow, localisation, state handling
    src/components/     # Header, ModelCard, SettingsModal, SideChatPanel
    src/styles.css      # glass theme styling
```

### Setup and Development
1. Ensure Node.js 20 LTS or newer is installed.
2. Run `npm install` at the repository root (installs `server` and `web` workspaces).
3. Start development mode with `npm run dev`. This spawns the Express API on http://localhost:8787 and the Vite UI on http://localhost:5173 via `concurrently`.
4. To run a single workspace, use `npm run dev -w server` or `npm run dev -w web`.

### Tests
- Start `npm run dev` in another terminal before running the Cypress E2E suite.
- Use `npm run cypress:open -w web` for the interactive runner or `npm run cypress:run -w web` for headless mode.

### Production Build
- `npm run build` compiles the Vite client into `web/dist`.
- `npm run start` (or `npm run start -w server`) launches Express; when `web/dist` exists it serves the compiled UI automatically.

### API Keys
- Copy `server/.env.example` to `server/.env` and fill in your credentials.
- The server loads defaults from `.env` on startup but keeps runtime changes only in memory via `/api/set-keys`.
- Required variables:

| Variable           | Purpose                                                    |
|--------------------|------------------------------------------------------------|
| OPENAI_API_KEY     | ChatGPT final aggregator and quick chat `chatgpt` model    |
| GEMINI_API_KEY     | Initial Gemini response step                               |
| CLAUDE_API_KEY     | Claude verification stage                                  |
| XAI_API_KEY        | Grok (xAI) verification stage                              |
| XAI_TEAM_ID        | Optional team identifier for xAI (exposed in the modal)    |
| PERPLEXITY_API_KEY | Perplexity cross-check stage                               |

### API Endpoints
- `GET /api/status` -> Returns the availability snapshot of configured keys.
- `POST /api/set-keys` -> Overwrites in-memory keys with the provided payload.
- `POST /api/openai/chat` -> Proxies to OpenAI chat completions.
- `POST /api/gemini/generate` -> Proxies to Google Gemini generateContent.
- `POST /api/claude/chat` -> Forwards to Anthropic Claude messages API.
- `POST /api/xai/chat` -> Proxies to xAI chat completions (adds `X-Title` header).
- `POST /api/perplexity/chat` -> Proxies to Perplexity chat completions.

### Interaction Flow
1. The user submits a question from the left panel.
2. Gemini produces the first answer; if it fails the card shows the error and the chain advances.
3. Claude, Grok, and Perplexity sequentially inspect previous outputs while tolerating upstream failures.
4. When available, ChatGPT merges the collected context into an analysis + JSON final payload.
5. The `Final Answer` card surfaces ChatGPT's output or falls back to the latest successful model response.
6. The quick chat side panel lets you query a single model on demand and retains the last answer per provider.

### Additional Notes
- Before exposing the stack publicly, protect or disable `/api/set-keys` (auth, locked-down CORS) so outsiders cannot overwrite your in-memory keys.

- Keys are not persisted to disk; add your own storage layer if long-term retention is required.
- Fetch errors are converted into human-readable card messages; when JSON parsing fails the first 160 characters of the response are shown.
- The `/api` proxy is configured in Vite; adjust the config if you need custom ports.
- The project does not ship automated tests; manual regression checks are recommended after edits.
