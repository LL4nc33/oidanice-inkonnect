"""Gateway router -- exposes the voice pipeline as /v1/* API for external clients."""

import base64
import logging
import re
import time
from pathlib import Path

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from fastapi.responses import Response as RawResponse

from backend.dependencies import get_settings, get_stt, get_tts
from backend.gateway.auth import ClientInfo, require_auth
from backend.gateway.models import (
    HealthProvider,
    HealthResponse,
    LanguagesGatewayResponse,
    ModelObject,
    ModelsListResponse,
    PipelineGatewayResponse,
    SearchGatewayRequest,
    SessionCreateGateway,
    SessionUpdateGateway,
    SpeechRequest,
    TranscriptionResponse,
    TranslateGatewayRequest,
    TranslateGatewayResponse,
    VoiceInfo,
    VoicesResponse,
)
from backend.gateway.rate_limit import check_rate_limit
from backend.providers.tts.chatterbox_remote import ChatterboxRemoteProvider
from backend.resolver import resolve_translate, resolve_tts

logger = logging.getLogger(__name__)

gateway_router = APIRouter(prefix="/v1", tags=["gateway"])

_version_file = Path(__file__).resolve().parent.parent.parent / "VERSION"
_version = _version_file.read_text().strip() if _version_file.exists() else "0.0.0"


def _apply_headers(response: Response, headers: dict[str, str]) -> None:
    for k, v in headers.items():
        response.headers[k] = v


# ---------------------------------------------------------------------------
# OpenAI-compatible: Audio
# ---------------------------------------------------------------------------

@gateway_router.post("/audio/transcriptions", response_model=TranscriptionResponse)
async def transcribe(
    response: Response,
    file: UploadFile = File(...),
    model: str = Form("whisper-small"),
    language: str | None = Form(None),
    client: ClientInfo = Depends(require_auth),
) -> TranscriptionResponse:
    rl_headers = check_rate_limit(client)
    _apply_headers(response, rl_headers)

    audio = await file.read()
    text, _ = await get_stt().transcribe(audio, language)
    return TranscriptionResponse(text=text)


@gateway_router.post("/audio/speech", response_model=None)
async def speech(
    req: SpeechRequest,
    response: Response,
    client: ClientInfo = Depends(require_auth),
) -> RawResponse:
    rl_headers = check_rate_limit(client)

    tts_provider_name = "chatterbox" if req.model in ("chatterbox", "chatterbox-multilingual") else None
    tts_impl, ad_hoc = resolve_tts(tts_provider_name, req.voice)
    try:
        audio_bytes = await tts_impl.synthesize(
            req.input,
            req.language or "en",
            req.voice,
            exaggeration=req.exaggeration,
            cfg_weight=req.cfg_weight,
            temperature=req.temperature,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    finally:
        if ad_hoc:
            await tts_impl.cleanup()

    raw_resp = RawResponse(content=audio_bytes, media_type="audio/wav")
    _apply_headers(raw_resp, rl_headers)
    return raw_resp


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

@gateway_router.get("/models", response_model=ModelsListResponse)
async def list_models(
    response: Response,
    client: ClientInfo = Depends(require_auth),
) -> ModelsListResponse:
    rl_headers = check_rate_limit(client)
    _apply_headers(response, rl_headers)

    s = get_settings()
    models = [
        ModelObject(id=f"whisper-{s.whisper_model}", owned_by="dolmtschr"),
        ModelObject(id="piper", owned_by="dolmtschr"),
    ]

    if isinstance(get_tts(), ChatterboxRemoteProvider) or s.chatterbox_url:
        models.append(ModelObject(id="chatterbox", owned_by="dolmtschr"))
        models.append(ModelObject(id="chatterbox-multilingual", owned_by="dolmtschr"))

    return ModelsListResponse(data=models)


# ---------------------------------------------------------------------------
# Translation
# ---------------------------------------------------------------------------

@gateway_router.post("/translate", response_model=TranslateGatewayResponse)
async def translate(
    req: TranslateGatewayRequest,
    response: Response,
    client: ClientInfo = Depends(require_auth),
) -> TranslateGatewayResponse:
    rl_headers = check_rate_limit(client)
    _apply_headers(response, rl_headers)

    s = get_settings()
    translator, ad_hoc = resolve_translate(None, None, None, req.model)
    try:
        translated = await translator.translate(req.text, req.source, req.target, req.model)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    finally:
        if ad_hoc:
            await translator.cleanup()

    return TranslateGatewayResponse(
        text=translated,
        detected_source=req.source,
        model=req.model or s.ollama_model,
    )


# ---------------------------------------------------------------------------
# Pipeline
# ---------------------------------------------------------------------------

@gateway_router.post("/pipeline", response_model=None)
async def pipeline(
    response: Response,
    file: UploadFile = File(...),
    target_lang: str = Form("en"),
    tts: bool = Form(True),
    voice: str | None = Form(None),
    model: str | None = Form(None),
    tts_model: str | None = Form(None),
    response_format: str = Form("json"),
    client: ClientInfo = Depends(require_auth),
) -> PipelineGatewayResponse | RawResponse:
    rl_headers = check_rate_limit(client, cost=3)

    s = get_settings()
    max_bytes = s.gateway_max_audio_mb * 1024 * 1024
    audio = await file.read()
    if len(audio) > max_bytes:
        raise HTTPException(status_code=413, detail=f"Audio too large (max {s.gateway_max_audio_mb}MB)")

    # 1. STT
    text, detected_lang = await get_stt().transcribe(audio)

    if not text.strip():
        raise HTTPException(status_code=400, detail="No speech detected")

    # 2. Translate
    translator, t_ad_hoc = resolve_translate(None, None, None, model)
    try:
        translated = await translator.translate(text, detected_lang, target_lang, model)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    finally:
        if t_ad_hoc:
            await translator.cleanup()

    # 3. TTS (optional)
    audio_bytes: bytes | None = None
    if tts:
        tts_provider_name = "chatterbox" if tts_model in ("chatterbox", "chatterbox-multilingual") else None
        tts_impl, tts_ad_hoc = resolve_tts(tts_provider_name, voice)
        try:
            audio_bytes = await tts_impl.synthesize(translated, target_lang, voice)
        except RuntimeError as exc:
            raise HTTPException(status_code=502, detail=str(exc))
        finally:
            if tts_ad_hoc:
                await tts_impl.cleanup()

    if response_format == "audio" and audio_bytes:
        raw_resp = RawResponse(content=audio_bytes, media_type="audio/wav")
        _apply_headers(raw_resp, rl_headers)
        return raw_resp

    _apply_headers(response, rl_headers)
    return PipelineGatewayResponse(
        transcript=text,
        source_lang=detected_lang,
        translation=translated,
        audio=base64.b64encode(audio_bytes).decode() if audio_bytes else None,
    )


# ---------------------------------------------------------------------------
# Service Discovery
# ---------------------------------------------------------------------------

@gateway_router.get("/health", response_model=HealthResponse)
async def health(
    response: Response,
    client: ClientInfo = Depends(require_auth),
) -> HealthResponse:
    rl_headers = check_rate_limit(client)
    _apply_headers(response, rl_headers)

    s = get_settings()
    providers: dict[str, HealthProvider] = {}

    providers["whisper"] = HealthProvider(status="ok")

    if get_tts() is not None:
        providers["piper"] = HealthProvider(status="ok")

    try:
        start = time.monotonic()
        async with httpx.AsyncClient(timeout=3.0) as http:
            resp = await http.get(f"{s.ollama_url.rstrip('/')}/api/tags")
            resp.raise_for_status()
        providers["ollama"] = HealthProvider(status="ok", latency_ms=int((time.monotonic() - start) * 1000))
    except Exception:
        providers["ollama"] = HealthProvider(status="unreachable")

    if s.chatterbox_url:
        try:
            start = time.monotonic()
            async with httpx.AsyncClient(timeout=3.0) as http:
                resp = await http.get(f"{s.chatterbox_url.rstrip('/')}/memory")
                resp.raise_for_status()
            providers["chatterbox"] = HealthProvider(status="ok", latency_ms=int((time.monotonic() - start) * 1000))
        except Exception:
            providers["chatterbox"] = HealthProvider(status="unreachable")

    overall = "ok" if all(p.status == "ok" for p in providers.values()) else "degraded"
    return HealthResponse(status=overall, version=_version, providers=providers)


@gateway_router.get("/languages", response_model=LanguagesGatewayResponse)
async def languages(
    response: Response,
    client: ClientInfo = Depends(require_auth),
) -> LanguagesGatewayResponse:
    rl_headers = check_rate_limit(client)
    _apply_headers(response, rl_headers)

    s = get_settings()
    langs: list[str] = []
    if s.chatterbox_url:
        try:
            provider = ChatterboxRemoteProvider(base_url=s.chatterbox_url, voice=s.chatterbox_voice)
            try:
                langs = await provider.get_languages()
            finally:
                await provider.cleanup()
        except Exception:
            pass

    return LanguagesGatewayResponse(languages=langs)


@gateway_router.get("/voices", response_model=VoicesResponse)
async def voices(
    response: Response,
    client: ClientInfo = Depends(require_auth),
) -> VoicesResponse:
    rl_headers = check_rate_limit(client)
    _apply_headers(response, rl_headers)

    all_voices: list[VoiceInfo] = []

    piper_dir = Path("/app/piper-voices")
    if piper_dir.exists():
        for f in sorted(piper_dir.glob("*.onnx")):
            all_voices.append(VoiceInfo(name=f.stem, provider="piper"))

    s = get_settings()
    if s.chatterbox_url:
        try:
            provider = ChatterboxRemoteProvider(base_url=s.chatterbox_url, voice=s.chatterbox_voice)
            try:
                raw = await provider.get_voices()
                for v in raw:
                    all_voices.append(VoiceInfo(name=v["name"], provider="chatterbox", language=v.get("language")))
            finally:
                await provider.cleanup()
        except Exception:
            pass

    return VoicesResponse(voices=all_voices)


@gateway_router.post("/voices")
async def upload_voice(
    response: Response,
    file: UploadFile = File(...),
    name: str = Form(...),
    language: str | None = Form(None),
    client: ClientInfo = Depends(require_auth),
) -> dict:
    rl_headers = check_rate_limit(client)
    _apply_headers(response, rl_headers)

    if not re.match(r'^[\w\-]+$', name):
        raise HTTPException(status_code=400, detail="Invalid voice name")

    s = get_settings()
    audio_data = await file.read()
    max_size = s.gateway_max_audio_mb * 1024 * 1024
    if len(audio_data) > max_size:
        raise HTTPException(status_code=413, detail="File too large")

    provider = ChatterboxRemoteProvider(base_url=s.chatterbox_url, voice=s.chatterbox_voice)
    try:
        result = await provider.upload_voice(name, audio_data, language)
        return {"success": True, "name": name, "message": str(result.get("message", "Voice uploaded"))}
    finally:
        await provider.cleanup()


# ---------------------------------------------------------------------------
# Sessions (Chat History)
# ---------------------------------------------------------------------------

@gateway_router.post("/sessions")
async def create_session(
    req: SessionCreateGateway,
    response: Response,
    client: ClientInfo = Depends(require_auth),
) -> dict:
    rl_headers = check_rate_limit(client)
    _apply_headers(response, rl_headers)

    from backend.routers.sessions import create_session as _create
    from backend.models import SessionCreate
    body = SessionCreate(
        source_lang=req.source_lang,
        target_lang=req.target_lang,
        audio_enabled=req.audio_enabled,
        title=req.title,
        org_id=req.org_id,
    )
    result = await _create(body)
    return result.model_dump()


@gateway_router.get("/sessions")
async def list_sessions(
    response: Response,
    limit: int = 20,
    offset: int = 0,
    client: ClientInfo = Depends(require_auth),
) -> dict:
    rl_headers = check_rate_limit(client)
    _apply_headers(response, rl_headers)

    from backend.routers.sessions import list_sessions as _list
    result = await _list(limit=limit, offset=offset)
    return result.model_dump()


@gateway_router.get("/sessions/{session_id}")
async def get_session(
    session_id: str,
    response: Response,
    client: ClientInfo = Depends(require_auth),
) -> dict:
    rl_headers = check_rate_limit(client)
    _apply_headers(response, rl_headers)

    from backend.routers.sessions import get_session as _get
    result = await _get(session_id)
    return result.model_dump()


@gateway_router.patch("/sessions/{session_id}")
async def update_session(
    session_id: str,
    req: SessionUpdateGateway,
    response: Response,
    client: ClientInfo = Depends(require_auth),
) -> dict:
    rl_headers = check_rate_limit(client)
    _apply_headers(response, rl_headers)

    from backend.routers.sessions import update_session as _update
    from backend.models import SessionUpdate
    body = SessionUpdate(title=req.title, audio_enabled=req.audio_enabled)
    result = await _update(session_id, body)
    return result.model_dump()


@gateway_router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    response: Response,
    client: ClientInfo = Depends(require_auth),
) -> dict:
    rl_headers = check_rate_limit(client)
    _apply_headers(response, rl_headers)

    from backend.routers.sessions import delete_session as _delete
    return await _delete(session_id)


@gateway_router.get("/sessions/{session_id}/messages")
async def list_messages(
    session_id: str,
    response: Response,
    limit: int = 50,
    offset: int = 0,
    client: ClientInfo = Depends(require_auth),
) -> dict:
    rl_headers = check_rate_limit(client)
    _apply_headers(response, rl_headers)

    from backend.routers.messages import get_messages as _get_msgs
    result = await _get_msgs(session_id, limit=limit, offset=offset)
    return result.model_dump()


# ---------------------------------------------------------------------------
# Semantic Search
# ---------------------------------------------------------------------------

@gateway_router.post("/search")
async def search(
    req: SearchGatewayRequest,
    response: Response,
    client: ClientInfo = Depends(require_auth),
) -> dict:
    rl_headers = check_rate_limit(client)
    _apply_headers(response, rl_headers)

    from backend.routers.search import semantic_search, SearchRequest
    body = SearchRequest(
        query=req.query,
        org_id=req.org_id,
        limit=req.limit,
        source_lang=req.source_lang,
        target_lang=req.target_lang,
    )
    result = await semantic_search(body)
    return result.model_dump()
