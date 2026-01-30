import io
import logging
import wave

from piper import PiperVoice

from backend.providers.base import TTSProvider

logger = logging.getLogger(__name__)


class PiperLocalProvider(TTSProvider):
    def __init__(self, voice: str) -> None:
        self._voice_name = voice
        self._voice: PiperVoice | None = None

    def _ensure_voice(self) -> PiperVoice:
        if self._voice is None:
            logger.info("Loading Piper voice=%s", self._voice_name)
            self._voice = PiperVoice.load(self._voice_name)
        return self._voice

    async def synthesize(self, text: str, lang: str, voice: str | None = None) -> bytes:
        piper_voice = self._ensure_voice()

        buf = io.BytesIO()
        with wave.open(buf, "wb") as wav:
            wav.setnchannels(1)
            wav.setsampwidth(2)
            wav.setframerate(piper_voice.config.sample_rate)

            for audio_bytes in piper_voice.synthesize_stream_raw(text):
                wav.writeframes(audio_bytes)

        return buf.getvalue()

    async def cleanup(self) -> None:
        self._voice = None
