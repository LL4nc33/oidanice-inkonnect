from abc import ABC, abstractmethod


class STTProvider(ABC):
    @abstractmethod
    async def transcribe(self, audio: bytes, language: str | None = None) -> tuple[str, str]:
        """Transcribe audio bytes. Returns (text, detected_language)."""

    async def cleanup(self) -> None:
        """Release resources."""


class TTSProvider(ABC):
    @abstractmethod
    async def synthesize(self, text: str, lang: str, voice: str | None = None) -> bytes:
        """Synthesize text to audio. Returns WAV bytes."""

    async def cleanup(self) -> None:
        """Release resources."""


class TranslateProvider(ABC):
    @abstractmethod
    async def translate(self, text: str, source: str, target: str) -> str:
        """Translate text. Returns translated string."""

    async def cleanup(self) -> None:
        """Release resources."""
