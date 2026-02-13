import base64
import time

from fastapi import APIRouter, File, Query, UploadFile

from backend.dependencies import get_stt
from backend.models import PipelineResponse
from backend.resolver import resolve_translate, resolve_tts

router = APIRouter(prefix="/api", tags=["pipeline"])


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
    ollama_url: str | None = Query(None),
) -> PipelineResponse:
    start = time.perf_counter()

    # 1. STT
    audio = await file.read()
    text, detected_lang = await get_stt().transcribe(audio, source_lang)

    # 2. Translate
    translator, ad_hoc = resolve_translate(provider, api_url, api_key, model, ollama_url)
    try:
        translated = await translator.translate(text, detected_lang, target_lang, model)
    finally:
        if ad_hoc:
            await translator.cleanup()

    # 3. TTS (optional)
    audio_b64: str | None = None
    if tts:
        tts_impl, tts_ad_hoc = resolve_tts(tts_provider, voice, chatterbox_url)
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
