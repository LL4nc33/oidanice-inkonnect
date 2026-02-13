import logging
import re
from contextlib import asynccontextmanager
from pathlib import Path
from collections.abc import AsyncIterator

import httpx
from fastapi import APIRouter, Form, Query, UploadFile

from backend.dependencies import get_settings, get_tts
from backend.models import (
    ChatterboxUploadResponse,
    ChatterboxVoice,
    ChatterboxVoicesResponse,
    ConfigResponse,
    GpuStatusResponse,
    LanguagesResponse,
    ModelsResponse,
    PiperDownloadRequest,
    PiperDownloadResponse,
    PiperVoicesResponse,
)
from backend.providers.tts.chatterbox_remote import ChatterboxRemoteProvider

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["config"])

PIPER_VOICES_DIR = Path("/app/piper-voices")
HF_BASE = "https://huggingface.co/rhasspy/piper-voices/resolve/main"


@asynccontextmanager
async def _chatterbox_provider(url: str | None = None) -> AsyncIterator[ChatterboxRemoteProvider]:
    """Yield a ChatterboxRemoteProvider, reusing the singleton when possible."""
    s = get_settings()
    effective_url = url or s.chatterbox_url

    singleton = get_tts()
    if isinstance(singleton, ChatterboxRemoteProvider) and effective_url == s.chatterbox_url:
        yield singleton
        return

    provider = ChatterboxRemoteProvider(base_url=effective_url, voice=s.chatterbox_voice)
    try:
        yield provider
    finally:
        await provider.cleanup()


@router.get("/config", response_model=ConfigResponse)
async def get_config() -> ConfigResponse:
    s = get_settings()
    return ConfigResponse(
        stt_provider=s.stt_provider,
        tts_provider=s.tts_provider,
        translate_provider=s.translate_provider,
        device=s.device,
        whisper_model=s.whisper_model,
        piper_voice=s.piper_voice,
        ollama_model=s.ollama_model,
        chatterbox_url=s.chatterbox_url,
        chatterbox_voice=s.chatterbox_voice,
    )


@router.get("/piper/voices", response_model=PiperVoicesResponse)
async def get_piper_voices() -> PiperVoicesResponse:
    voices: list[str] = []
    if PIPER_VOICES_DIR.exists():
        for f in sorted(PIPER_VOICES_DIR.glob("*.onnx")):
            voices.append(f.stem)
    return PiperVoicesResponse(voices=voices)


def _voice_hf_url(voice_name: str) -> str:
    """Build HuggingFace URL from voice name like 'de_DE-thorsten-high'."""
    parts = voice_name.split("-")
    locale = parts[0]       # de_DE
    lang = locale.split("_")[0]  # de
    name = parts[1]         # thorsten
    quality = parts[2]      # high
    return f"{HF_BASE}/{lang}/{locale}/{name}/{quality}/{voice_name}"


@router.post("/piper/voices/download", response_model=PiperDownloadResponse)
async def download_piper_voice(body: PiperDownloadRequest) -> PiperDownloadResponse:
    voice = body.voice.strip()
    if not voice:
        return PiperDownloadResponse(success=False, message="Voice name is empty")

    parts = voice.split("-")
    if len(parts) < 3:
        return PiperDownloadResponse(
            success=False,
            message=f"Invalid voice name format: {voice} (expected locale-name-quality)",
        )

    onnx_path = PIPER_VOICES_DIR / f"{voice}.onnx"
    if onnx_path.exists():
        return PiperDownloadResponse(success=True, message=f"{voice} already installed")

    base_url = _voice_hf_url(voice)
    PIPER_VOICES_DIR.mkdir(parents=True, exist_ok=True)

    try:
        async with httpx.AsyncClient(timeout=120.0, follow_redirects=True) as client:
            for suffix in [".onnx", ".onnx.json"]:
                url = f"{base_url}{suffix}"
                logger.info("Downloading %s", url)
                resp = await client.get(url)
                resp.raise_for_status()
                dest = PIPER_VOICES_DIR / f"{voice}{suffix}"
                dest.write_bytes(resp.content)
                logger.info("Saved %s (%d bytes)", dest, len(resp.content))
    except httpx.HTTPStatusError as exc:
        return PiperDownloadResponse(
            success=False,
            message=f"Download failed: HTTP {exc.response.status_code} for {voice}",
        )
    except Exception as exc:
        return PiperDownloadResponse(success=False, message=f"Download failed: {exc}")

    return PiperDownloadResponse(success=True, message=f"{voice} downloaded successfully")


@router.get("/chatterbox/voices", response_model=ChatterboxVoicesResponse)
async def get_chatterbox_voices(
    url: str | None = Query(None),
) -> ChatterboxVoicesResponse:
    try:
        async with _chatterbox_provider(url) as provider:
            raw_voices = await provider.get_voices()
            voices = [ChatterboxVoice(name=v["name"], language=v.get("language")) for v in raw_voices]
            return ChatterboxVoicesResponse(voices=voices)
    except Exception:
        logger.warning("Could not fetch Chatterbox voices")
        return ChatterboxVoicesResponse(voices=[])


@router.post("/chatterbox/voices", response_model=ChatterboxUploadResponse)
async def upload_chatterbox_voice(
    file: UploadFile,
    name: str = Form(...),
    language: str | None = Form(None),
    url: str | None = Query(None),
) -> ChatterboxUploadResponse:
    if not re.match(r'^[\w\-]+$', name):
        return ChatterboxUploadResponse(success=False, name=name, message="Invalid voice name")

    max_size = 10 * 1024 * 1024  # 10 MB
    audio_data = await file.read()
    if len(audio_data) > max_size:
        return ChatterboxUploadResponse(
            success=False,
            name=name,
            message=f"File too large ({len(audio_data)} bytes, max {max_size})",
        )

    try:
        async with _chatterbox_provider(url) as provider:
            result = await provider.upload_voice(name, audio_data, language)
            return ChatterboxUploadResponse(
                success=bool(result.get("success", True)),
                name=name,
                message=str(result.get("message", "Voice uploaded successfully")),
            )
    except httpx.HTTPStatusError as exc:
        return ChatterboxUploadResponse(
            success=False,
            name=name,
            message=f"Upload failed: HTTP {exc.response.status_code}",
        )
    except Exception as exc:
        return ChatterboxUploadResponse(
            success=False,
            name=name,
            message=f"Upload failed: {exc}",
        )


@router.delete("/chatterbox/voices/{name}", response_model=ChatterboxUploadResponse)
async def delete_chatterbox_voice(
    name: str,
    url: str | None = Query(None),
) -> ChatterboxUploadResponse:
    if not re.match(r'^[\w\-]+$', name):
        return ChatterboxUploadResponse(success=False, name=name, message="Invalid voice name")
    try:
        async with _chatterbox_provider(url) as provider:
            result = await provider.delete_voice(name)
            return ChatterboxUploadResponse(
                success=bool(result.get("success", True)),
                name=name,
                message=str(result.get("message", "Voice deleted successfully")),
            )
    except httpx.HTTPStatusError as exc:
        return ChatterboxUploadResponse(
            success=False,
            name=name,
            message=f"Delete failed: HTTP {exc.response.status_code}",
        )
    except Exception as exc:
        return ChatterboxUploadResponse(
            success=False,
            name=name,
            message=f"Delete failed: {exc}",
        )


@router.get("/ollama/models", response_model=ModelsResponse)
async def get_ollama_models(
    url: str | None = Query(None),
) -> ModelsResponse:
    s = get_settings()
    ollama_url = (url or s.ollama_url).rstrip("/")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{ollama_url}/api/tags")
            resp.raise_for_status()
            data = resp.json()
            names = [m["name"] for m in data.get("models", [])]
            return ModelsResponse(models=names)
    except Exception:
        logger.warning("Could not fetch Ollama models from %s", ollama_url)
        return ModelsResponse(models=[])


@router.get("/openai/models", response_model=ModelsResponse)
async def get_openai_models(
    url: str = Query(...),
    key: str = Query(""),
) -> ModelsResponse:
    headers: dict[str, str] = {}
    if key:
        headers["Authorization"] = f"Bearer {key}"
    try:
        async with httpx.AsyncClient(timeout=10.0, headers=headers) as client:
            base = url.rstrip("/").removesuffix("/v1")
            resp = await client.get(f"{base}/v1/models")
            resp.raise_for_status()
            data = resp.json()
            names = [m["id"] for m in data.get("data", [])]
            return ModelsResponse(models=sorted(names))
    except Exception:
        logger.warning("Could not fetch OpenAI-compat models from %s", url)
        return ModelsResponse(models=[])


@router.post("/gpu/warmup")
async def warmup_gpu(
    service: str = Query("ollama"),
    url: str | None = Query(None),
) -> dict:
    s = get_settings()
    ollama_url = (url or s.ollama_url).rstrip("/")
    model = s.ollama_model

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            ps_resp = await client.get(f"{ollama_url}/api/ps")
            ps_resp.raise_for_status()
            ps_data = ps_resp.json()
            loaded = [m["name"] for m in ps_data.get("models", [])]
            if model in loaded:
                return {"status": "already_loaded", "model": model}
    except Exception:
        logger.warning("Could not check Ollama ps, attempting warmup anyway")

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            await client.post(
                f"{ollama_url}/api/chat",
                json={
                    "model": model,
                    "messages": [],
                    "stream": False,
                    "keep_alive": "60s",
                },
            )
        return {"status": "warmed_up", "model": model}
    except Exception as exc:
        logger.warning("Ollama warmup failed: %s", exc)
        return {"status": "warmup_failed", "model": model}


@router.get("/gpu/status", response_model=GpuStatusResponse)
async def get_gpu_status(
    ollama_url: str | None = Query(None),
    chatterbox_url: str | None = Query(None),
) -> GpuStatusResponse:
    s = get_settings()
    ollama_info: dict = {}
    chatterbox_info: dict = {}

    # Ollama: GET /api/ps
    effective_ollama = ollama_url or s.ollama_url
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{effective_ollama.rstrip('/')}/api/ps")
            resp.raise_for_status()
            ollama_info = resp.json()
    except Exception:
        ollama_info = {"error": "unreachable"}

    # Chatterbox: GET /memory
    try:
        async with _chatterbox_provider(chatterbox_url) as provider:
            chatterbox_info = await provider.get_memory()
    except Exception:
        chatterbox_info = {"error": "unreachable"}

    return GpuStatusResponse(ollama=ollama_info, chatterbox=chatterbox_info)


@router.get("/chatterbox/languages", response_model=LanguagesResponse)
async def get_chatterbox_languages(
    url: str | None = Query(None),
) -> LanguagesResponse:
    try:
        async with _chatterbox_provider(url) as provider:
            languages = await provider.get_languages()
            return LanguagesResponse(languages=languages)
    except Exception:
        logger.warning("Could not fetch Chatterbox languages")
        return LanguagesResponse(languages=[])
