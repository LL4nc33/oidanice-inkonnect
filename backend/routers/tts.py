import base64
import time

from fastapi import APIRouter

from backend.models import TTSRequest, TTSResponse
from backend.resolver import resolve_tts

router = APIRouter(prefix="/api", tags=["tts"])


@router.post("/tts", response_model=TTSResponse)
async def text_to_speech(req: TTSRequest) -> TTSResponse:
    start = time.perf_counter()
    tts_impl, ad_hoc = resolve_tts(req.tts_provider, req.voice, req.chatterbox_url)
    try:
        audio_bytes = await tts_impl.synthesize(
            req.text,
            req.lang,
            req.voice,
            exaggeration=req.exaggeration,
            cfg_weight=req.cfg_weight,
            temperature=req.temperature,
        )
        duration_ms = int((time.perf_counter() - start) * 1000)
        audio_b64 = base64.b64encode(audio_bytes).decode()
        return TTSResponse(audio=audio_b64, duration_ms=duration_ms)
    finally:
        if ad_hoc:
            await tts_impl.cleanup()
