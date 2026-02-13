import io
import logging
import wave
from pathlib import Path

from piper import PiperVoice

from backend.providers.base import TTSProvider

logger = logging.getLogger(__name__)

MODELS_DIR = Path("/app/piper-voices")


class PiperLocalProvider(TTSProvider):
    def __init__(self, voice: str) -> None:
        self._voice_name = voice
        self._voices: dict[str, PiperVoice] = {}

    def _load_voice(self, name: str) -> PiperVoice:
        if name in self._voices:
            return self._voices[name]

        model_path = MODELS_DIR / f"{name}.onnx"
        if model_path.exists():
            logger.info("Loading Piper voice=%s from %s", name, model_path)
            voice = PiperVoice.load(str(model_path))
        else:
            raise FileNotFoundError(f"Voice model not found: {model_path}")

        self._voices[name] = voice
        return voice

    async def synthesize(self, text: str, lang: str, voice: str | None = None) -> bytes:
        voice_name = voice or self._voice_name
        piper_voice = self._load_voice(voice_name)

        buf = io.BytesIO()
        with wave.open(buf, "wb") as wav:
            wav.setnchannels(1)
            wav.setsampwidth(2)
            wav.setframerate(piper_voice.config.sample_rate)

            for audio_bytes in piper_voice.synthesize_stream_raw(text):
                wav.writeframes(audio_bytes)

        return buf.getvalue()

    async def cleanup(self) -> None:
        self._voices.clear()
