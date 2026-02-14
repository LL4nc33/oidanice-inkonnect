# Industry Profiles – Claude Code Task

## Context

Read `docs/plans/INDUSTRY-PROFILES-PLAN.md` for the full feature spec. Read `CLAUDE.md` for project conventions.

Dolmtschr is a voice translation PWA. We need pre-configured industry profiles that optimize the translation pipeline for specific use cases (medical, NGO, hotel, government, retail, education). Each profile sets: a domain-specific system prompt for the LLM translator, default language pairs, retention policy, audio settings, and TTS preferences.

## Task

Implement Industry Profiles with Profile Switcher in Settings and system prompt injection into the translation pipeline.

## Phase 1: Backend Profile Registry

1. Create `backend/profiles.py` with:
   - `IndustryProfile` dataclass (id, name, icon, system_prompt, quick_languages, default_retention, audio_enabled_default, tts_enabled_default, recommended_model, description)
   - `PROFILES` dict with 6 profiles: medical, ngo, hotel, government, retail, education
   - System prompts from INDUSTRY-PROFILES-PLAN.md (each uses `{source}` and `{target}` placeholders)
   - `get_profile(profile_id: str) -> IndustryProfile | None` helper
   - `get_all_profiles() -> list[IndustryProfile]` helper

2. Create endpoint `GET /api/profiles` in a new `backend/routers/profiles.py`:
   - Returns all profiles as JSON (id, name, icon, description, quick_languages, defaults)
   - Mount in main.py

## Phase 2: System Prompt Injection

3. Modify `backend/providers/translate/ollama_local.py`:
   - Accept `system_prompt` via `**kwargs` in `translate()`
   - If `kwargs.get("system_prompt")` is provided, use it instead of the hardcoded `SYSTEM_PROMPT`
   - Still format with `{source}` and `{target}` placeholders

4. Same change in `backend/providers/translate/openai_compat.py`

5. Modify `backend/routers/pipeline.py`:
   - Accept optional `profile_id: str | None = Query(None)` parameter
   - If profile_id provided: load profile via `get_profile()`, pass `system_prompt` to translator
   - Pass `system_prompt=profile.system_prompt` through `resolve_translate()` call as kwarg

6. Modify `backend/resolver.py` or the translate call in pipeline.py:
   - Ensure `system_prompt` kwarg flows through to the provider's `translate()` method

## Phase 3: Database Integration

7. Add `profile_id` column to sessions and messages tables:
   - Create Alembic migration
   - Update SQLAlchemy models in `backend/database/models.py`
   - When saving messages in pipeline, include profile_id
   - Session creation accepts optional profile_id

8. Update `backend/routers/sessions.py`:
   - `SessionCreate` model accepts optional `profile_id`
   - When profile_id provided on session creation, auto-set retention + audio defaults from profile

9. Update `backend/routers/search.py`:
   - Accept optional `profile_id` filter in search requests

## Phase 4: Frontend Profile Switcher

10. Add `profileId` to `AppSettings` interface in `frontend/src/hooks/useSettings.ts` with default `''` (no profile = custom)

11. Create `frontend/src/components/ProfileSwitcher.tsx`:
    - Fetch profiles from `GET /api/profiles`
    - Display as grid of cards: icon + name + short description
    - "Custom" card for no profile (current manual behavior)
    - On select: apply all profile defaults to settings via `update()` call
    - Highlight currently active profile
    - Use ink-ui components (Card, Button)

12. Add ProfileSwitcher to Settings page:
    - New section at the top, before other settings
    - When profile is selected, other settings update but remain editable

13. Create `frontend/src/components/QuickLanguageChips.tsx`:
    - If a profile is active, show quick language pair buttons on Home page
    - Each chip shows target language flag/code
    - Tap to switch target language instantly
    - Source language defaults to "de" (auto-detect stays as fallback)

14. Add profile badge to Home page:
    - Small indicator showing active profile (e.g. "🏥 Medical" chip)
    - Clicking it navigates to Settings

## Phase 5: Gateway Extension

15. Add `GET /v1/profiles` to gateway router
16. Accept `profile_id` in `POST /v1/pipeline` gateway endpoint

## Constraints

- Profiles are read-only (code-defined), not user-editable
- Profile selection sets smart defaults but NEVER locks settings
- System prompt MUST keep `{source}` and `{target}` placeholders
- Existing pipeline behavior unchanged when no profile_id is provided
- Do NOT break existing `/api/*` or `/v1/*` endpoints
- Follow existing code patterns in CLAUDE.md
- Components < 100 lines, extract larger logic

## Delegation

Use `cwe:builder` for implementation.
Use `cwe:architect` for API design questions.
Use `cwe:quality` for tests after each phase.
