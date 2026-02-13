import base64
import logging
import time

from fastapi import APIRouter, File, Query, UploadFile

from backend.dependencies import get_settings, get_stt, get_translate, get_tts
from backend.models import PipelineResponse
from backend.providers.base import TTSProvider, TranslateProvider

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["pipeline"])


def _resolve_translate(
    provider: str | None,
    api_url: str | None,
    api_key: str | None,
    model: str | None,
) -> tuple[TranslateProvider, bool]:
    """Return (provider_instance, is_ad_hoc). Ad-hoc providers must be cleaned up."""
    if provider == "openai" and api_url:
        from backend.providers.translate.openai_compat import OpenAICompatProvider
        return OpenAICompatProvider(model=model or "", base_url=api_url, api_key=api_key or ""), True
    return get_translate(), False


def _resolve_tts(
    tts_provider: str | None,
    voice: str | None,
    chatterbox_url: str | None = None,
) -> tuple[TTSProvider, bool]:
    """Return (provider_instance, is_ad_hoc). Ad-hoc providers must be cleaned up."""
    if tts_provider == "chatterbox":
        from backend.providers.tts.chatterbox_remote import ChatterboxRemoteProvider

        s = get_settings()
        return ChatterboxRemoteProvider(
            base_url=chatterbox_url or s.chatterbox_url,
            voice=voice or s.chatterbox_voice,
        ), True
    return get_tts(), False


@router.post("/pipeline", response_model=PipelineResponse)
async def full_pipeline(
    file: UploadFile = File(...),
    source_lang: str | None = Query(None),
    target_lang: str = Query("en"),
    tts: bool = Query(True),
    voice: str | None = Query(None),
    tts_provider: str | None = Query(None),
    exaggeration: float | None = Query(None),
    cfg_weight: float | None = Query(None),
    temperature: float | None = Query(None),
    model: str | None = Query(None),
    provider: str | None = Query(None),
    api_url: str | None = Query(None),
    api_key: str | None = Query(None),
    chatterbox_url: str | None = Query(None),
) -> PipelineResponse:
    start = time.perf_counter()

    # 1. STT
    audio = await file.read()
    text, detected_lang = await get_stt().transcribe(audio, source_lang)

    # 2. Translate
    translator, ad_hoc = _resolve_translate(provider, api_url, api_key, model)
    try:
        translated = await translator.translate(text, detected_lang, target_lang, model)
    finally:
        if ad_hoc:
            await translator.cleanup()

    # 3. TTS (optional)
    audio_b64: str | None = None
    if tts:
        tts_impl, tts_ad_hoc = _resolve_tts(tts_provider, voice, chatterbox_url)
        try:
            audio_bytes = await tts_impl.synthesize(
                translated,
                target_lang,
                voice,
                exaggeration=exaggeration,
                cfg_weight=cfg_weight,
                temperature=temperature,
            )
            audio_b64 = base64.b64encode(audio_bytes).decode()
        finally:
            if tts_ad_hoc:
                await tts_impl.cleanup()

    duration_ms = int((time.perf_counter() - start) * 1000)
    return PipelineResponse(
        original_text=text,
        detected_language=detected_lang,
        translated_text=translated,
        audio=audio_b64,
        duration_ms=duration_ms,
    )
