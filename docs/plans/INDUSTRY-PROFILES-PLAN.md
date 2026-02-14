# Dolmtschr Industry Profiles – Implementation Plan

## Overview

Pre-configured profiles that set optimal defaults for specific industries. Selected via Profile Switcher in Settings. Each profile configures: translation system prompt, language presets, retention policy, audio default, TTS settings, and UI hints.

## Profiles

### 🏥 Medical (`medical`)

**Use Case:** Arztpraxen, Krankenhäuser, Therapie – Patient-Arzt Kommunikation

| Setting | Value | Reason |
|---------|-------|--------|
| System Prompt | Medical-grade, formal, terminology-aware | Accuracy critical |
| Quick Languages | DE↔AR, DE↔TR, DE↔RU, DE↔UK, DE↔FA* | Vienna patient demographics |
| Retention | 10 years | Austrian medical documentation law (§ 51 ÄrzteG) |
| Audio | ON by default | Dokumentationspflicht |
| Translation Model | gemma3:4b | Best accuracy (9/10) |
| TTS | ON | Patient needs to hear translation |

**System Prompt:**
```
You are a medical interpreter. Translate accurately and formally.
Preserve medical terminology precisely. Never omit, add, or simplify
medical information. Use formal register appropriate for clinical settings.
If a term has no exact equivalent, transliterate and add a brief explanation.
Translate from {source} to {target}. Output ONLY the translation.
```

### 🏠 NGO / Social Services (`ngo`)

**Use Case:** Caritas, Diakonie, Hemayat, Flüchtlingsberatung

| Setting | Value | Reason |
|---------|-------|--------|
| System Prompt | Empathetic, clear, simple language | Clients may have limited literacy |
| Quick Languages | DE↔AR, DE↔TR, DE↔FA, DE↔SO*, DE↔UK, DE↔RU | Refugee demographics |
| Retention | 1 year | Case documentation |
| Audio | Optional (default OFF) | Privacy-sensitive |
| Translation Model | qwen3:4b available | 119 languages incl. Farsi/Dari/Somali |
| TTS | ON | Accessibility |

**System Prompt:**
```
You are an interpreter for social services. Translate clearly using
simple, everyday language. Avoid bureaucratic jargon – use plain words
that someone with basic language skills can understand. Be accurate but
prioritize clarity over formality. Translate from {source} to {target}.
Output ONLY the translation.
```

### 🏨 Hotel / Tourism (`hotel`)

**Use Case:** Rezeption, Concierge, Restaurant – Gäste-Kommunikation

| Setting | Value | Reason |
|---------|-------|--------|
| System Prompt | Friendly, service-oriented, casual-professional | Hospitality tone |
| Quick Languages | DE↔EN, DE↔IT, DE↔FR, DE↔ES, DE↔JA, DE↔ZH, DE↔KO | Tourist demographics |
| Retention | 24 hours | No need to store, DSGVO minimal |
| Audio | OFF | Quick interactions |
| Translation Model | gemma3:4b | Best accuracy, tourist langs well-covered |
| TTS | ON | Guest needs to hear |

**System Prompt:**
```
You are a hotel concierge interpreter. Translate in a warm, professional,
and service-oriented tone. Use polite forms of address. Keep translations
natural and conversational – not stiff or overly formal.
Translate from {source} to {target}. Output ONLY the translation.
```

### 🏛️ Government / Authority (`government`)

**Use Case:** MA 35, AMS, Bezirksamt – Behördengänge mit Klienten

| Setting | Value | Reason |
|---------|-------|--------|
| System Prompt | Formal, precise, legal terminology | Official communication |
| Quick Languages | DE↔AR, DE↔TR, DE↔RU, DE↔UK, DE↔FA*, DE↔SR | Client demographics |
| Retention | Configurable (default 7 years) | Aktenvermerk requirements |
| Audio | ON by default | Documentation for Aktenvermerke |
| Translation Model | gemma3:4b | Accuracy critical |
| TTS | ON | Client needs to understand |

**System Prompt:**
```
You are an official interpreter for government services. Translate formally
and precisely. Preserve legal and administrative terminology accurately.
Use the formal register (Sie/vous/usted). Do not simplify or paraphrase
official terms. Translate from {source} to {target}. Output ONLY the translation.
```

### 🛍️ Retail / Shop (`retail`)

**Use Case:** Geschäfte, Boutiquen, Märkte – Kunden-Kommunikation

| Setting | Value | Reason |
|---------|-------|--------|
| System Prompt | Casual, helpful, product-oriented | Sales context |
| Quick Languages | DE↔EN, DE↔AR, DE↔TR, DE↔ZH, DE↔RU, DE↔JA | Shopper demographics |
| Retention | 24 hours | Transactional, no need to store |
| Audio | OFF | Quick interactions |
| Translation Model | gemma3:4b | Good enough, fast enough |
| TTS | Optional (default ON) | Depends on noise level |

**System Prompt:**
```
You are a shop assistant interpreter. Translate in a friendly, helpful tone.
Keep it casual and natural. Use simple language for product descriptions,
prices, and directions. Translate from {source} to {target}.
Output ONLY the translation.
```

### 🎓 Education (`education`)

**Use Case:** Schulen, VHS, Sprachkurse – Lehrer-Eltern / Lehrer-Schüler

| Setting | Value | Reason |
|---------|-------|--------|
| System Prompt | Clear, patient, educational | Age-appropriate, simple |
| Quick Languages | DE↔AR, DE↔TR, DE↔BKS*, DE↔UK, DE↔RU, DE↔FA* | School demographics Vienna |
| Retention | 30 days | Elterngespräche documentation |
| Audio | Optional (default OFF) | Privacy of minors |
| Translation Model | gemma3:4b / qwen3:4b for Dari | Mixed population |
| TTS | ON | Comprehension aid |

**System Prompt:**
```
You are an interpreter for educational settings. Translate clearly and
patiently. Use simple, age-appropriate language. Avoid complex sentence
structures. For parent communication, maintain a respectful and supportive
tone. Translate from {source} to {target}. Output ONLY the translation.
```

*Languages marked with * require qwen3:4b swap (not in Chatterbox TTS, text-only output)

## Technical Implementation

### Backend: Profile Registry

New file `backend/profiles.py`:

```python
@dataclass
class IndustryProfile:
    id: str                           # "medical", "ngo", "hotel", ...
    name: str                         # Display name
    icon: str                         # Emoji
    system_prompt: str                # Translation prompt template
    quick_languages: list[tuple[str, str]]  # [(source, target), ...]
    default_retention: str            # "24 hours", "30 days", "1 year", ...
    audio_enabled_default: bool
    tts_enabled_default: bool
    recommended_model: str            # "gemma3:4b", "qwen3:4b"
    description: str                  # Short description for UI
```

New endpoint: `GET /api/profiles` – returns all available profiles.

### Backend: System Prompt Injection

The system prompt is currently hardcoded in `OllamaLocalProvider` and `OpenAICompatProvider` as `SYSTEM_PROMPT`. 

Changes needed:
1. Add `system_prompt` parameter to `TranslateProvider.translate()` via `**kwargs`
2. In `OllamaLocalProvider.translate()`: use `kwargs.get("system_prompt")` if provided, else fallback to default
3. Same for `OpenAICompatProvider.translate()`
4. Pipeline router passes the profile's system_prompt through resolve_translate
5. Profile ID stored in session (so messages inherit the context)

### Frontend: Profile Switcher

Add to Settings page:
- New section "Industry Profile" at the top (or as FilterChip)
- Grid/List of profile cards with icon, name, description
- Selecting a profile applies all defaults at once
- "Custom" option for manual configuration
- Active profile stored in localStorage alongside settings
- Profile badge visible on Home page (e.g. "🏥 Medical Mode")

### Frontend: Quick Language Selector

Each profile defines quick-access language pairs:
- Shown as chips/buttons on Home page above the recorder
- One tap switches source↔target language
- Replaces generic language dropdown for faster workflow
- E.g. Medical: [AR] [TR] [RU] [UK] [FA] – tap to set as target

### Settings Flow

```
User selects profile "Medical"
  → sourceLang = "de" (Austrian default)
  → targetLang = "ar" (most common)
  → retention = "10 years"
  → audio = ON
  → ttsEnabled = ON
  → translateModel = "gemma3:4b"
  → systemPrompt = medical prompt
  → quickLanguages = [ar, tr, ru, uk, fa]
  
User can still override ANY individual setting after profile selection.
Profile just sets smart defaults.
```

### Pipeline Integration

Extended pipeline flow:
1. Frontend sends `profile_id` as query parameter (optional)
2. Backend loads profile → injects system_prompt into translation call
3. If session_id provided → session stores profile_id for context
4. Search results can filter by profile (e.g. "show all medical conversations")

### Database Addition

Add to sessions table:
```sql
ALTER TABLE sessions ADD COLUMN profile_id VARCHAR(50);
```

Add to messages table (denormalized for search):
```sql
ALTER TABLE messages ADD COLUMN profile_id VARCHAR(50);
```

## Implementation Order

1. `backend/profiles.py` – Profile registry with all 6 profiles
2. `GET /api/profiles` endpoint
3. System prompt passthrough in translate providers (kwargs)
4. Pipeline integration (profile_id → system_prompt injection)
5. Session/Message schema update (profile_id column)
6. Frontend: Profile Switcher component in Settings
7. Frontend: Quick Language chips on Home page
8. Frontend: Profile badge indicator

## Notes

- Profiles are code-defined, not user-editable (for now)
- "Custom" profile = no profile, manual settings (current behavior)
- Profile selection does NOT lock settings – user can always override
- System prompt uses {source}/{target} placeholders, filled at translate time
- Quick languages are suggestions, not restrictions
- BKS = Bosnisch/Kroatisch/Serbisch – common in Vienna schools
