# InKonnect API Gateway – Implementierungsplan

Erstelle ein **API Gateway** als neue Schicht ueber dem bestehenden InKonnect-Backend. Das Gateway exponiert die Voice-Pipeline (STT → Translate → TTS) als wiederverwendbaren Service fuer externe Programme.

---

## Kontext

InKonnect ist eine Voice-Translation-PWA mit Provider-Abstraction-Layer:
- **STT:** faster-whisper (lokal)
- **TTS:** Piper (lokal) + Chatterbox Multilingual (remote, 23 Sprachen)
- **Translate:** Ollama (lokal) + OpenAI-compat

Das bestehende Frontend kommuniziert ueber `/api/*` Endpoints. Das Gateway laeuft parallel unter `/v1/*` und exponiert dieselben Provider als standardisierte API fuer externe Clients.

---

## Phase 0: Code-Review & Refactoring

Vor dem Gateway-Bau: bestehendes Backend reviewen und Probleme beheben.

### Task 0.1: Shared Resolver erstellen
**Was:** `_resolve_tts()` ist in `routers/tts.py` und `routers/pipeline.py` dupliziert. `_resolve_translate()` ebenso in `routers/translate.py` und `routers/pipeline.py`.
**Aktion:** Neue Datei `backend/resolver.py` mit `resolve_tts(tts_provider, voice, chatterbox_url) -> tuple[TTSProvider, bool]` und `resolve_translate(provider, api_url, api_key, model, ollama_url) -> tuple[TranslateProvider, bool]`. Beide Router importieren daraus.

### Task 0.2: TTSProvider ABC-Signatur fixen
**Was:** Das ABC `TTSProvider.synthesize()` in `providers/base.py` hat Signatur `(text, lang, voice)`, aber `ChatterboxRemoteProvider` braucht zusaetzlich `exaggeration`, `cfg_weight`, `temperature`. `PiperLocalProvider` nutzt bereits `**kwargs`.
**Aktion:** ABC erweitern auf `async def synthesize(self, text: str, lang: str, voice: str | None = None, **kwargs) -> bytes`.

### Task 0.3: language_id an Chatterbox durchreichen
**Was:** `ChatterboxRemoteProvider.synthesize()` empfaengt `lang`, sendet es aber NICHT im Payload an die Chatterbox TTS API. Ohne `language_id` funktioniert Multilingual nicht.
**Aktion:** In `chatterbox_remote.py` → `payload["language_id"] = lang` hinzufuegen.

### Task 0.4: ChatterboxRemoteProvider Singleton-Pattern in config Router
**Was:** `routers/config.py` erstellt fuer jeden Request eine neue Provider-Instanz (get_chatterbox_voices, get_chatterbox_languages, get_gpu_status etc.) und raeumt sie danach auf. Ineffizient bei haeufigen Calls.
**Aktion:** Wenn die angeforderte URL der Default-URL aus Settings entspricht, den Startup-Provider aus `dependencies.py` nutzen. Nur bei abweichender URL ad-hoc erstellen.

### Task 0.5: Allgemeiner Review-Durchgang
Restliches Backend auf Code-Qualitaet, Konsistenz und potenzielle Bugs pruefen. Insbesondere:
- Error Handling Konsistenz (manche Routen geben strukturierte Responses, manche raisen)
- Type Hints Vollstaendigkeit
- Logging Konsistenz

---

## Phase 1: Gateway-Struktur

### Task 1.1: Gateway-Verzeichnis und Config

Neue Dateien:
```
backend/gateway/
├── __init__.py
├── router.py           # Hauptrouter, mountet auf /v1/
├── auth.py             # API-Key Middleware
├── rate_limit.py       # Rate Limiting (In-Memory Token Bucket)
├── models.py           # Gateway-spezifische Request/Response Models
└── openai_compat.py    # OpenAI-kompatible Endpoints
```

Config-Erweiterung in `backend/config.py`:
```python
# Gateway
gateway_enabled: bool = True
gateway_api_keys: str = ""          # Komma-separiert, leer = kein Auth
gateway_rate_limit: int = 60        # Requests/Minute pro Key
gateway_max_audio_mb: int = 25      # Max Upload-Groesse
```

### Task 1.2: Auth Middleware

- Header: `Authorization: Bearer ink_xxxxxxxxxxxx` oder `X-API-Key: ink_xxxxxxxxxxxx`
- Keys via Env: `GATEWAY_API_KEYS=ink_key1,ink_key2`
- Leerer Wert = kein Auth (Dev-Modus)
- FastAPI Dependency die Client-Info injiziert

### Task 1.3: Rate Limiting

- In-Memory Token Bucket pro API-Key
- Default 60 req/min, Pipeline-Calls zaehlen als 3
- Response-Header: `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## Phase 2: Gateway Endpoints

### Task 2.1: OpenAI-kompatible Audio Endpoints

**`POST /v1/audio/transcriptions`** (multipart/form-data):
- file: Audio, model: whisper-Modell, language: optional ISO
- Response: `{ "text": "..." }` (OpenAI-Format)

**`POST /v1/audio/speech`** (JSON):
- input: Text, model: "piper"|"chatterbox"|"chatterbox-multilingual", voice: Name
- Response: Raw WAV-Bytes (Content-Type: audio/wav), KEIN Base64

**`GET /v1/models`**:
- Response: OpenAI-Format `{ "data": [{ "id": "whisper-small", "object": "model" }, ...] }`

### Task 2.2: Translation Endpoint

**`POST /v1/translate`** (JSON):
- text, source ("auto" oder ISO), target (ISO), model (optional)
- Response: `{ "text": "...", "detected_source": "de", "model": "gemma3:4b" }`

### Task 2.3: Pipeline Endpoint

**`POST /v1/pipeline`** (multipart):
- file: Audio, target_lang, tts: bool, voice: optional
- response_format: "json" (Base64 Audio in JSON) | "audio" (Raw WAV Stream)
- JSON Response: `{ "transcript": "...", "source_lang": "de", "translation": "...", "audio": "base64..." }`
- Audio Response: Direkt WAV-Stream zurueck

### Task 2.4: Service Discovery Endpoints

**`GET /v1/health`**: Status + Latenz aller Provider (Ollama, Chatterbox, Whisper)
**`GET /v1/languages`**: Unterstuetzte Sprachen (Schnittmenge aus STT + TTS Faehigkeiten)
**`GET /v1/voices`**: Alle verfuegbaren Stimmen (Piper + Chatterbox)
**`POST /v1/voices`**: Voice Upload (Chatterbox)

---

## Phase 3: Integration

### Task 3.1: Gateway in main.py einbinden

```python
if settings.gateway_enabled:
    from backend.gateway.router import gateway_router
    app.include_router(gateway_router)
```

Bestehende `/api/*` Endpoints bleiben vollstaendig erhalten fuer das InKonnect-Frontend.

### Task 3.2: Tests

- Unit Tests fuer Auth, Rate Limiting, Model-Validation
- Integration Tests fuer jeden Gateway-Endpoint
- Sicherstellen dass bestehende `/api/*` Endpoints nicht brechen

### Task 3.3: Dokumentation

- README.md Gateway-Sektion mit Beispiel-Calls (curl)
- OpenAPI/Swagger Doku via FastAPI auto-docs
- .env.example um Gateway-Settings erweitern

---

## Design-Prinzipien

1. **Kein Code duplizieren** – Gateway nutzt dieselben Provider-Instanzen und den shared Resolver
2. **Audio-Responses** – Raw Audio statt Base64 fuer externe Clients (weniger Overhead)
3. **OpenAI-Kompatibilitaet** – Jedes Tool das OpenAI Audio API kann, soll auch InKonnect nutzen koennen
4. **Bestehende Endpoints nicht brechen** – `/api/*` bleibt unangetastet
5. **Minimal Dependencies** – Kein Redis/DB fuer Rate Limiting, alles In-Memory
