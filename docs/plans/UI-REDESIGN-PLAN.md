# Dolmtschr UI Redesign Plan

## Status: Ready for Implementation (after v0.5 fixes + v0.6 profiles)

## Vision

Transform Dolmtschr from a developer-facing tool into an intuitive, professional translation interface that a hotel receptionist, doctor, or social worker can use without training. The current UI uses monospace `[ brackets ]`, flat text buttons, and developer-centric layouts — the redesign focuses on visual clarity, one-tap workflows, and profile-aware theming.

---

## Phase 1: Core Recording Experience (High Impact)

### 1.1 — Big Central Record Button

**Current:** Flat text button `[ tap to record ]` — easily missed, no visual weight.

**Target:** Large, round, animated microphone button (60–80px) centered on the page.

**Behavior:**
- **Idle:** Solid circle with mic icon, subtle breathing animation (scale 1.0 → 1.02)
- **Recording:** Red background, pulsing ring animation (ripple outward), recording timer overlay
- **Processing:** Spinner animation inside the circle
- **Result:** Shrinks back, result appears below

**Implementation:**
- Replace `RecordButton.tsx` — currently 15 lines wrapping ink-ui `<Button>`, needs custom component
- CSS animations via `@keyframes` — pulse ring, breathing
- Touch feedback: `transform: scale(0.95)` on press
- Haptic vibration on mobile via `navigator.vibrate([50])` on start/stop

**Component:** `RecordButton.tsx` → rewrite (~80 lines)

### 1.2 — Language Selector with Flags

**Current:** Two `<Select>` dropdowns with text labels ("Deutsch", "English") + text swap button `⇄`.

**Target:** Compact flag-chip design:
```
  [🇦🇹 DE ▾]  ⇄  [🇬🇧 EN ▾]
```

**Behavior:**
- Flag emoji + 2-letter code as chip/pill
- Tap chip → dropdown opens with flag + full name
- Swap button animated (180° rotation on tap)
- When Industry Profile is active → Quick Language Chips appear below (see 1.4)

**Implementation:**
- Add flag emoji mapping: `{ de: '🇦🇹', en: '🇬🇧', ar: '🇸🇦', tr: '🇹🇷', ... }`
- Note: Use 🇦🇹 for "de" (Austrian context, not 🇩🇪)
- Chip component with dropdown, ~60 lines
- Swap animation via CSS `transition: transform 0.3s`

**Component:** `LanguageSelector.tsx` → rewrite (~80 lines)

### 1.3 — Audio Waveform Visualizer

**Current:** No visual feedback during recording — user can't tell if mic is working.

**Target:** Real-time waveform/level meter below the record button.

**Behavior:**
- During recording: animated bars (5–7 bars) responding to audio input level
- Uses `AnalyserNode` from Web Audio API (already available via MediaRecorder)
- Height of each bar = frequency bin amplitude
- Subtle, not distracting — 30px tall max

**Implementation:**
- Hook: `useAudioVisualizer(stream: MediaStream)` → returns `levels: number[]`
- Uses `AudioContext` → `createAnalyser()` → `getByteFrequencyData()`
- Component: `AudioWaveform.tsx` — canvas or CSS bars (~50 lines)
- Integrate into `PipelineRecorder.tsx` — pass active stream

**New files:** `hooks/useAudioVisualizer.ts`, `components/AudioWaveform.tsx`

### 1.4 — Quick Language Chips (Profile-Aware)

**Current:** Only dropdown selectors, every language change = 2 taps + scroll.

**Target:** Row of tappable chips below the language selector, showing the most relevant target languages.

**Behavior:**
- When profile active (e.g. Medical): `[AR] [TR] [RU] [UK] [FA]`
- When no profile: show last 5 used target languages (from localStorage)
- Source defaults to "Auto-detect" or "DE" (Austrian context)
- One tap = set target language instantly

**Implementation:**
- Reads from profile's `quick_languages` array (from v0.6 Industry Profiles)
- Fallback: `useRecentLanguages()` hook tracking last-used targets
- Component: `QuickLanguageChips.tsx` (~40 lines)
- Placed between `LanguageSelector` and `RecordButton`

**Dependency:** v0.6 Industry Profiles (for profile-aware chips)

---

## Phase 2: Translation Display (High Impact)

### 2.1 — Chat Bubble Layout

**Current:** `TranscriptDisplay` in a Card with divider — original + translation stacked vertically. `SpeakButton` and `ResultActions` are separate components below.

**Target:** Messenger-style bubbles:
```
┌──────────────────────────┐
│ 🎤 Ich habe Brustschmerzen│  ← original (left-aligned, light bg)
│ DE · 1.2s STT             │
└──────────────────────────┘

    ┌──────────────────────────┐
    │ I have chest pain    [▶] │  ← translation (right-aligned, accent bg)
    │ EN · 0.8s translate      │
    └──────────────────────────┘
```

**Behavior:**
- Original: left-aligned bubble, neutral background
- Translation: right-aligned bubble, accent color, integrated play button
- Timing info as subtle footer text per bubble
- Play button inside translation bubble (not separate component)
- Copy on long-press or via small icon

**Implementation:**
- Reuse `MessageBubble.tsx` concept but with directional alignment
- `TranscriptBubble.tsx` — left/right variant (~60 lines)
- Integrates `SpeakButton` functionality inline
- `ResultActions` → floating action bar below bubbles

**Component:** `TranscriptBubble.tsx` (new), replaces `TranscriptDisplay.tsx` + `SpeakButton.tsx`

### 2.2 — Auto-Session

**Current:** User must explicitly create a session via sidebar `[ + new ]` to enable chat history. Without session = messages are lost.

**Target:** First recording auto-creates a session. No extra clicks, no concepts to explain.

**Behavior:**
1. User opens app → sees record button (no session bar, no sidebar required)
2. User records first message → auto-creates session before pipeline call
3. Session title auto-generated from first message (first 50 chars of original text)
4. Session bar appears after first message with title + `[ end ]`
5. "Translate without logging" mode still available via explicit toggle in settings

**Implementation:**
- `Home.tsx`: In `handleProcess()`, if `!sessionId && settings.historyEnabled`:
  ```typescript
  const newSession = await createSession(sourceLang, targetLang, ttsEnabled)
  // then proceed with pipeline using newSession.id
  ```
- Remove the requirement to manually create sessions
- Settings toggle: `historyEnabled` (default: true) → when false, no auto-session
- Session title: update via PATCH after first message returns

**Components modified:** `Home.tsx`, `useSession.ts`

---

## Phase 3: Advanced Interaction Modes (Medium Impact)

### 3.1 — Split-Screen / Two-Person Mode

**Current:** Single-person view — user sees everything, needs to physically turn device to show other person the translation.

**Target:** Samsung-style split screen for face-to-face conversations:
```
┌─────────────────────────────┐
│    ↑ THEIR SIDE (rotated)   │  ← upside-down for person across table
│    [AR] Translation here    │
│         [🎤 Record]         │
│─────────────────────────────│
│         [🎤 Record]         │
│    [DE] Your message here   │  ← right-side-up for you
│    ↓ YOUR SIDE              │
└─────────────────────────────┘
```

**Behavior:**
- Top half: rotated 180° via CSS `transform: rotate(180deg)`
- Each half has its own record button + most recent bubble
- Top half auto-swaps source↔target languages
- Divider line between halves with drag handle (optional: adjustable split)
- Tablet optimized (landscape or portrait)

**Implementation:**
- New page: `pages/Conversation.tsx` (~120 lines)
- Two instances of recording + display, mirror languages
- CSS Grid with two rows, top row rotated
- Page switcher: Home | Conversation | Settings

**New file:** `pages/Conversation.tsx`
**Modified:** `App.tsx` (add page route)

### 3.2 — Walkie-Talkie (Hold-to-Talk)

**Current:** Tap to start recording → tap to stop → auto-process. Two taps per message.

**Target:** Optional hold-to-talk mode:
- Press and hold record button → recording starts
- Release → immediately processes + plays translation
- Perfect for quick exchanges at reception/counter

**Behavior:**
- Activated via toggle in settings or long-press on record button
- `onTouchStart` / `onMouseDown` → start recording
- `onTouchEnd` / `onMouseUp` → stop + process
- Minimum hold time: 500ms (prevent accidental triggers)
- Visual: button stays "pressed" (inset shadow) while held

**Implementation:**
- Add `holdToTalk` to settings
- `RecordButton.tsx`: conditional touch/mouse event handlers
- Debounce: ignore releases < 500ms

**Components modified:** `RecordButton.tsx`, `useSettings.ts`

### 3.3 — Favorite Phrases (Per Profile)

**Current:** Every interaction requires speaking. No pre-built phrases.

**Target:** Quick-phrase buttons for common sentences per industry profile:

**Medical:**
- "Wo tut es weh?" / "Where does it hurt?"
- "Bitte nehmen Sie Platz" / "Please take a seat"
- "Nehmen Sie Medikamente?" / "Are you taking any medication?"

**Hotel:**
- "Ihr Zimmer ist im dritten Stock" / "Your room is on the third floor"
- "Das Frühstück ist von 7 bis 10 Uhr" / "Breakfast is from 7 to 10"
- "Brauchen Sie ein Taxi?" / "Do you need a taxi?"

**Behavior:**
- Collapsible panel below language selector
- One tap → translates phrase + speaks it (skips STT, goes straight to translate+TTS)
- Phrases defined per profile in `backend/profiles.py`
- User can add custom phrases (stored in localStorage, synced to session)

**Implementation:**
- Backend: Add `quick_phrases: list[dict[str, str]]` to `IndustryProfile` (source_text + source_lang)
- Frontend: `QuickPhrases.tsx` — collapsible chip grid (~60 lines)
- API: `POST /api/translate-text` (text-only pipeline, skip STT)

**New files:** `components/QuickPhrases.tsx`
**Backend:** `profiles.py` extension, new endpoint

---

## Phase 4: Polish & Accessibility (Nice-to-Have)

### 4.1 — TTS Speed/Volume Control
- Slider for playback rate (0.5x – 2.0x) on translation audio
- Volume slider for environments with different noise levels
- Stored in settings per profile

### 4.2 — Service Status Indicator
- Small colored dot in header: 🟢 all services up / 🟡 degraded / 🔴 offline
- Uses existing `/api/health` endpoint
- Tap → shows which services are down
- Critical for self-hosted where GPU server may restart

### 4.3 — Font Size Control
- Accessibility slider: translation text size 14px – 32px
- Important for tablet-on-counter setups and older users
- Stored in settings

### 4.4 — Dark/Light per Profile
- Medical: light, clean, clinical whites
- Hotel: darker, elegant
- Per-profile CSS variable overrides

---

## Implementation Order

| Priority | Feature | Depends On | Effort |
|----------|---------|------------|--------|
| 1 | Fix 3 code review issues | Nothing | 30 min |
| 2 | Record Button redesign | Nothing | 2h |
| 3 | Language Selector + Flags | Nothing | 2h |
| 4 | Audio Waveform | Nothing | 2h |
| 5 | Chat Bubble Layout | Nothing | 3h |
| 6 | Auto-Session | v0.5 backend | 1h |
| 7 | Quick Language Chips | v0.6 Profiles | 1h |
| 8 | Quick Phrases | v0.6 Profiles | 3h |
| 9 | Split-Screen Mode | Bubbles done | 4h |
| 10 | Walkie-Talkie | Record Button | 1h |
| 11 | Service Status | Nothing | 1h |
| 12 | Font Size / Speed | Nothing | 1h |

**Total estimated: ~22h of Claude Code time**

---

## Design Principles

1. **One-tap workflows** — minimize clicks between "want to say something" and "translation plays"
2. **Profile-aware defaults** — UI adapts to industry context without manual config
3. **Tablet-first** — many use cases are shared-device (counter, desk, between two people)
4. **Accessible** — WCAG 2.1 AA, screen reader support, adjustable fonts
5. **Neobrutalism evolved** — keep the offset shadows and bold borders, but add rounded shapes for the record button and bubbles. Professional but not boring.

---

## Claude Code Task Template

```
Implement Dolmtschr UI Redesign Phase [N].
Read docs/plans/UI-REDESIGN-PLAN.md for the full spec.
Start with feature [X].

Design principles:
- One-tap workflows
- Tablet-first (shared device)
- ink-ui components where possible, custom for Record Button and Waveform
- Components < 100 lines
- TypeScript strict, no any
```
