import io
import logging
import tempfile
from pathlib import Path

from faster_whisper import WhisperModel

from backend.providers.base import STTProvider

logger = logging.getLogger(__name__)


def _resolve_device(device: str) -> tuple[str, str]:
    """Resolve 'auto' device to actual device + compute type."""
    if device == "auto":
        try:
            import torch
            if torch.cuda.is_available():
                return "cuda", "float16"
        except ImportError:
            pass
        return "cpu", "int8"
    if device == "cuda":
        return "cuda", "float16"
    return "cpu", "int8"


class WhisperLocalProvider(STTProvider):
    def __init__(self, model_size: str, device: str, compute_type: str) -> None:
        self._model_size = model_size
        self._device_raw = device
        self._compute_type = compute_type
        self._model: WhisperModel | None = None

    def _ensure_model(self) -> WhisperModel:
        if self._model is None:
            device, compute = _resolve_device(self._device_raw)
            if self._compute_type != "int8":
                compute = self._compute_type
            logger.info("Loading Whisper model=%s device=%s compute=%s", self._model_size, device, compute)
            self._model = WhisperModel(
                self._model_size,
                device=device,
                compute_type=compute,
            )
        return self._model

    async def transcribe(self, audio: bytes, language: str | None = None) -> tuple[str, str]:
        model = self._ensure_model()

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=True) as tmp:
            tmp.write(audio)
            tmp.flush()

            segments, info = model.transcribe(
                tmp.name,
                language=language,
                beam_size=5,
                vad_filter=True,
            )

            text = " ".join(seg.text.strip() for seg in segments)
            detected_lang = info.language or language or "unknown"

        return text, detected_lang

    async def cleanup(self) -> None:
        self._model = None
