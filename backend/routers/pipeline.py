import base64
import time

from fastapi import APIRouter, File, Query, UploadFile

from backend.dependencies import get_stt, get_translate, get_tts
from backend.models import PipelineResponse

router = APIRouter(prefix="/api", tags=["pipeline"])


@router.post("/pipeline", response_model=PipelineResponse)
async def full_pipeline(
    file: UploadFile = File(...),
    source_lang: str | None = Query(None),
    target_lang: str = Query("en"),
    tts: bool = Query(True),
    voice: str | None = Query(None),
) -> PipelineResponse:
    start = time.perf_counter()

    # 1. STT
    audio = await file.read()
    text, detected_lang = await get_stt().transcribe(audio, source_lang)

    # 2. Translate
    translated = await get_translate().translate(text, detected_lang, target_lang)

    # 3. TTS (optional)
    audio_b64: str | None = None
    if tts:
        audio_bytes = await get_tts().synthesize(translated, target_lang, voice)
        audio_b64 = base64.b64encode(audio_bytes).decode()

    duration_ms = int((time.perf_counter() - start) * 1000)
    return PipelineResponse(
        original_text=text,
        detected_language=detected_lang,
        translated_text=translated,
        audio=audio_b64,
        duration_ms=duration_ms,
    )
