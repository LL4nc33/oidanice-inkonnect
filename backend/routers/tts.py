import base64
import time

from fastapi import APIRouter

from backend.dependencies import get_tts
from backend.models import TTSRequest, TTSResponse

router = APIRouter(prefix="/api", tags=["tts"])


@router.post("/tts", response_model=TTSResponse)
async def text_to_speech(req: TTSRequest) -> TTSResponse:
    start = time.perf_counter()
    audio_bytes = await get_tts().synthesize(req.text, req.lang, req.voice)
    duration_ms = int((time.perf_counter() - start) * 1000)
    audio_b64 = base64.b64encode(audio_bytes).decode()
    return TTSResponse(audio=audio_b64, duration_ms=duration_ms)
