import time

from fastapi import APIRouter

from backend.dependencies import get_translate
from backend.models import TranslateRequest, TranslateResponse

router = APIRouter(prefix="/api", tags=["translate"])


@router.post("/translate", response_model=TranslateResponse)
async def translate_text(req: TranslateRequest) -> TranslateResponse:
    start = time.perf_counter()
    translated = await get_translate().translate(req.text, req.source, req.target)
    duration_ms = int((time.perf_counter() - start) * 1000)
    return TranslateResponse(text=translated, duration_ms=duration_ms)
