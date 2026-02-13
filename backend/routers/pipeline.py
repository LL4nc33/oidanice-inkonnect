import asyncio
import base64
import json
import logging
import subprocess
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, Query, UploadFile

from backend.dependencies import get_settings, get_stt
from backend.models import PipelineResponse
from backend.resolver import resolve_translate, resolve_tts

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["pipeline"])

BENCHMARKS_DIR = Path(__file__).resolve().parent.parent.parent / "benchmarks"


def _log_benchmark(entry: dict) -> None:
    try:
        BENCHMARKS_DIR.mkdir(parents=True, exist_ok=True)
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        path = BENCHMARKS_DIR / f"{today}.jsonl"
        with path.open("a") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except Exception:
        logger.debug("Benchmark logging failed", exc_info=True)


async def _save_message(
    session_id: str,
    direction: str,
    original_text: str,
    translated_text: str,
    original_lang: str,
    translated_lang: str,
    audio_data: bytes | None,
    audio_enabled: bool,
    stt_ms: int | None,
    translate_ms: int | None,
    tts_ms: int | None,
    model_used: str | None,
) -> None:
    """Save a pipeline result as a message in the database. Non-blocking."""
    try:
        from backend.database.connection import get_session_factory
        from backend.database.models import Message, Session

        s = get_settings()
        factory = get_session_factory()
        async with factory() as db:
            session = await db.get(Session, uuid.UUID(session_id))
            if not session:
                logger.warning("Session %s not found, skipping message save", session_id)
                return

            msg_id = uuid.uuid4()
            audio_path: str | None = None

            # Save audio to filesystem if enabled
            if audio_enabled and audio_data and session.audio_enabled:
                audio_dir = Path(s.audio_storage_path) / session_id
                audio_dir.mkdir(parents=True, exist_ok=True)
                opus_file = audio_dir / f"{msg_id}.opus"
                try:
                    # Encode to Opus using ffmpeg
                    proc = await asyncio.create_subprocess_exec(
                        "ffmpeg", "-i", "pipe:0", "-c:a", "libopus", "-b:a", "16k",
                        "-f", "opus", "pipe:1",
                        stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                    )
                    opus_data, _ = await proc.communicate(input=audio_data)
                    if proc.returncode == 0 and opus_data:
                        opus_file.write_bytes(opus_data)
                        audio_path = f"{session_id}/{msg_id}.opus"
                except Exception as exc:
                    logger.debug("Opus encoding failed: %s", exc)

            msg = Message(
                id=msg_id,
                session_id=uuid.UUID(session_id),
                direction=direction,
                original_text=original_text,
                translated_text=translated_text,
                original_lang=original_lang,
                translated_lang=translated_lang,
                audio_path=audio_path,
                stt_ms=stt_ms,
                translate_ms=translate_ms,
                tts_ms=tts_ms,
                model_used=model_used,
            )
            db.add(msg)
            # Update session timestamp
            session.updated_at = datetime.now(timezone.utc)
            await db.commit()
            logger.debug("Message saved: %s in session %s", msg_id, session_id)
    except Exception as exc:
        logger.warning("Failed to save message: %s", exc)


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
    ollama_keep_alive: str | None = Query(None),
    ollama_context_length: int | None = Query(None),
    deepl_free: bool = Query(True),
    elevenlabs_key: str | None = Query(None),
    elevenlabs_voice_id: str | None = Query(None),
    elevenlabs_model: str | None = Query(None),
    elevenlabs_stability: float | None = Query(None),
    elevenlabs_similarity: float | None = Query(None),
    session_id: str | None = Query(None),
) -> PipelineResponse:
    total_start = time.perf_counter()

    # 1. STT
    t0 = time.perf_counter()
    audio = await file.read()
    text, detected_lang = await get_stt().transcribe(audio, source_lang)
    stt_ms = int((time.perf_counter() - t0) * 1000)

    if not text.strip():
        raise HTTPException(status_code=400, detail="No speech detected")

    # 2. Translate
    t0 = time.perf_counter()
    translator, ad_hoc = resolve_translate(provider, api_url, api_key, model, ollama_url, deepl_free)
    try:
        translated = await translator.translate(
            text, detected_lang, target_lang, model,
            keep_alive=ollama_keep_alive, num_ctx=ollama_context_length,
        )
    finally:
        if ad_hoc:
            await translator.cleanup()
    translate_ms = int((time.perf_counter() - t0) * 1000)

    # 3. TTS (optional)
    audio_b64: str | None = None
    tts_ms: int | None = None
    if tts:
        t0 = time.perf_counter()
        tts_impl, tts_ad_hoc = resolve_tts(
            tts_provider, voice, chatterbox_url,
            elevenlabs_key, elevenlabs_voice_id, elevenlabs_model,
            elevenlabs_stability, elevenlabs_similarity,
        )
        try:
            audio_bytes = await tts_impl.synthesize(
                translated,
                target_lang,
                voice if tts_provider != "elevenlabs" else elevenlabs_voice_id,
                exaggeration=exaggeration,
                cfg_weight=cfg_weight,
                temperature=temperature,
                stability=elevenlabs_stability,
                similarity_boost=elevenlabs_similarity,
            )
            audio_b64 = base64.b64encode(audio_bytes).decode()
        finally:
            if tts_ad_hoc:
                await tts_impl.cleanup()
        tts_ms = int((time.perf_counter() - t0) * 1000)

    audio_fmt = "mp3" if tts_provider == "elevenlabs" else "wav"
    duration_ms = int((time.perf_counter() - total_start) * 1000)

    # Benchmark logging
    s = get_settings()
    translate_provider_name = provider or s.translate_provider
    if translate_provider_name == "local":
        translate_provider_name = f"ollama/{model or s.ollama_model}"
    tts_provider_name = tts_provider or s.tts_provider
    _log_benchmark({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "stt_provider": f"whisper-{s.whisper_model}",
        "translate_provider": translate_provider_name,
        "tts_provider": tts_provider_name,
        "source_lang": detected_lang,
        "target_lang": target_lang,
        "text_length": len(text),
        "stt_ms": stt_ms,
        "translate_ms": translate_ms,
        "tts_ms": tts_ms,
        "total_ms": duration_ms,
    })

    # Save to chat history (non-blocking)
    if session_id and s.history_enabled:
        model_used = model or (s.ollama_model if (provider or s.translate_provider) == "local" else provider or s.translate_provider)
        asyncio.create_task(_save_message(
            session_id=session_id,
            direction="source",
            original_text=text,
            translated_text=translated,
            original_lang=detected_lang,
            translated_lang=target_lang,
            audio_data=audio,
            audio_enabled=True,
            stt_ms=stt_ms,
            translate_ms=translate_ms,
            tts_ms=tts_ms,
            model_used=model_used,
        ))

    return PipelineResponse(
        original_text=text,
        detected_language=detected_lang,
        translated_text=translated,
        audio=audio_b64,
        audio_format=audio_fmt,
        duration_ms=duration_ms,
        stt_ms=stt_ms,
        translate_ms=translate_ms,
        tts_ms=tts_ms,
    )
