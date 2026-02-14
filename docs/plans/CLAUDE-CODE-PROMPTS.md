# Dolmtschr — Claude Code Prompts

Run these 3 prompts IN ORDER. Wait for each to complete before starting the next.

---

## Prompt 1: Code Review Fixes

```
Read docs/plans/V05-CODE-REVIEW-FIXES.md and fix all 3 issues:

1. docker-compose.yml: Change OLLAMA_MODEL default from ministral-3:3b to gemma3:4b
2. docs/architecture.md: Fix the unclosed code block — the closing ``` is missing after the ASCII architecture diagram (before the "### Translation Model Benchmark Results" heading). Make sure the benchmark table and everything after it renders as normal markdown, not inside a code block.
3. backend/dependencies.py + backend/routers/pipeline.py: Make EmbeddingProvider a singleton. Add get_embedding() to dependencies.py following the exact same pattern as get_stt(), get_tts(), get_translate(). Then update _generate_embedding() in pipeline.py to use get_embedding() instead of creating a new OllamaEmbeddingProvider each time.

All 3 are surgical fixes. Do NOT refactor or change anything else.
```

---

## Prompt 2: Rebrand (run AFTER Prompt 1 is done)

```
Rebrand the entire project from "inkonnect" to "dolmtschr". Read docs/plans/REBRAND-PLAN.md for full context.

This is a Big Bang migration — no backward compatibility needed, no production users.

Phase 1 — Documentation (safe, do first):
- CLAUDE.md: replace all "inkonnect" / "InKonnect" with "dolmtschr" / "Dolmtschr"
- README.md: update project name, description, all references
- ROADMAP.md: update any inkonnect references
- docs/*.md (architecture.md, api-reference.md, configuration.md, development.md, DEVLOG.md, GATEWAY-PLAN.md, system-requirements.md): global find-replace inkonnect → dolmtschr
- docs/plans/*.md: update references where they mention "inkonnect" (but keep plan content intact)

Phase 2 — Frontend code:
- Rename frontend/src/api/inkonnect.ts → frontend/src/api/dolmtschr.ts
- Update EVERY import across the entire frontend that references 'api/inkonnect' → 'api/dolmtschr'
- App.tsx: change title="inkonnect" to title="dolmtschr"
- frontend/index.html: update <title> and any meta tags
- If frontend/public/manifest.json exists, update name and short_name to "Dolmtschr"
- useSettings.ts: change the localStorage key from any "inkonnect" key to "dolmtschr-settings". Add a one-time migration function that checks for the old key and moves data to the new key on init.

Phase 3 — Backend + Infrastructure:
- docker-compose.yml: rename service "inkonnect" → "dolmtschr", change POSTGRES_DB/POSTGRES_USER from "inkonnect" to "dolmtschr", update DATABASE_URL accordingly
- backend/config.py: update database_url default string from "inkonnect" to "dolmtschr"
- .env.example: update any inkonnect references
- alembic.ini: update if it contains inkonnect references

Be thorough — use grep/search to find ALL occurrences of "inkonnect" and "InKonnect" across the entire codebase. Nothing should reference the old name when you're done.

Do NOT rename the repo directory or git remote — I'll do that manually.
Do NOT create brand assets (logo, favicon) — that's a separate task.
```

---

## Prompt 3: UI Redesign Phase 1+2 (run AFTER Prompt 2 is done)

```
Implement the UI Redesign Phases 1 and 2. Read docs/plans/UI-REDESIGN-PLAN.md for the full spec.

Build these 5 features:

1. RecordButton.tsx — REWRITE completely:
   - Large round button (64px+), centered, with mic icon (use 🎤 or SVG)
   - Idle: subtle breathing animation (CSS scale 1.0→1.02 loop)
   - Recording: red background, pulsing ring animation (ripple outward), show recording timer
   - Touch feedback: scale(0.95) on press
   - Mobile haptic: navigator.vibrate([50]) on start/stop (with feature check)
   - Keep existing onStart/onStop interface, integrate into PipelineRecorder

2. LanguageSelector.tsx — REWRITE completely:
   - Flag emoji chips instead of <Select> dropdowns: [🇦🇹 DE ▾] ⇄ [🇬🇧 EN ▾]
   - Flag mapping: { de: '🇦🇹', en: '🇬🇧', ar: '🇸🇦', tr: '🇹🇷', ru: '🇷🇺', ja: '🇯🇵', zh: '🇨🇳', fr: '🇫🇷', es: '🇪🇸', it: '🇮🇹', pt: '🇵🇹', nl: '🇳🇱', pl: '🇵🇱', uk: '🇺🇦', fa: '🇮🇷', ko: '🇰🇷' }
   - Use 🇦🇹 for "de" (Austrian context), NOT 🇩🇪
   - Swap button: animated 180° rotation on tap (CSS transition)
   - Tap on chip opens dropdown with flag + full language name
   - Keep same props interface (sourceLang, targetLang, onSourceChange, onTargetChange)

3. AudioWaveform — NEW components:
   - hooks/useAudioVisualizer.ts: takes MediaStream, returns levels: number[] (5-7 frequency bins)
     Uses AudioContext → createAnalyser() → getByteFrequencyData() on requestAnimationFrame
   - components/AudioWaveform.tsx: renders levels as animated CSS bars (30px max height)
   - Integrate into PipelineRecorder.tsx: show waveform when recording, pass active stream

4. TranscriptBubble.tsx — NEW component replacing TranscriptDisplay + SpeakButton:
   - Original text: left-aligned bubble, neutral background
   - Translation: right-aligned bubble, accent/primary color background, play button INSIDE the bubble
   - Timing info as subtle monospace footer per bubble (DE · 1.2s STT etc.)
   - Copy button per bubble
   - Update Home.tsx to use TranscriptBubble instead of TranscriptDisplay + SpeakButton

5. Auto-Session in Home.tsx:
   - In handleProcess(): if no active session and history is enabled, auto-create session before pipeline call
   - After first message returns, update session title to first 50 chars of original_text via PATCH
   - Add historyEnabled to useSettings (default: true)
   - When historyEnabled is false, skip auto-session (current "translate without logging" behavior)
   - Remove the need to manually create sessions from sidebar — it should "just work"

Rules:
- Components < 100 lines, extract larger logic into sub-components or hooks
- TypeScript strict, no any
- Use ink-ui (Card, Button, etc.) where it makes sense, custom CSS for animations
- All CSS animations via @keyframes in the component file or index.css
- Keep all existing functionality working — this is a redesign, not a rewrite
- Test that the old SpeakButton/TranscriptDisplay can be safely removed after TranscriptBubble works
- Do NOT implement Phase 3 (Split-Screen, Walkie-Talkie, Quick Phrases) — that's a future task
```
