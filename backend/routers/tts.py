import base64
import time

from fastapi import APIRouter

from backend.models import TTSRequest, TTSResponse
from backend.resolver import resolve_tts

router = APIRouter(prefix="/api", tags=["tts"])


@router.post("/tts", response_model=TTSResponse)
async def text_to_speech(req: TTSRequest) -> TTSResponse:
    start = time.perf_counter()
    tts_impl, ad_hoc = resolve_tts(
        req.tts_provider, req.voice, req.chatterbox_url,
        req.elevenlabs_key, req.elevenlabs_voice_id, req.elevenlabs_model,
        req.elevenlabs_stability, req.elevenlabs_similarity,
    )
    try:
        audio_bytes = await tts_impl.synthesize(
            req.text,
            req.lang,
            req.voice if req.tts_provider != "elevenlabs" else req.elevenlabs_voice_id,
            exaggeration=req.exaggeration,
            cfg_weight=req.cfg_weight,
            temperature=req.temperature,
            stability=req.elevenlabs_stability,
            similarity_boost=req.elevenlabs_similarity,
        )
        duration_ms = int((time.perf_counter() - start) * 1000)
        audio_b64 = base64.b64encode(audio_bytes).decode()
        fmt = "mp3" if req.tts_provider == "elevenlabs" else "wav"
        return TTSResponse(audio=audio_b64, audio_format=fmt, duration_ms=duration_ms)
    finally:
        if ad_hoc:
            await tts_impl.cleanup()
