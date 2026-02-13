import logging

import httpx

from backend.providers.base import TTSProvider

logger = logging.getLogger(__name__)


class ChatterboxRemoteProvider(TTSProvider):
    def __init__(self, base_url: str, voice: str = "default") -> None:
        self._base_url = base_url.rstrip("/")
        self._voice = voice
        self._client = httpx.AsyncClient(timeout=120.0)

    async def synthesize(self, text: str, lang: str, voice: str | None = None) -> bytes:
        voice_name = voice or self._voice
        payload = {"input": text, "voice": voice_name}
        logger.info("Chatterbox synthesize voice=%s len=%d", voice_name, len(text))

        resp = await self._client.post(
            f"{self._base_url}/v1/audio/speech",
            json=payload,
        )
        resp.raise_for_status()
        return resp.content

    async def get_voices(self) -> list[dict[str, str | None]]:
        """Fetch available voices from the Chatterbox API."""
        resp = await self._client.get(f"{self._base_url}/voices", timeout=30.0)
        resp.raise_for_status()
        data: list[dict[str, str | None]] = resp.json()
        return data

    async def upload_voice(self, name: str, audio_data: bytes) -> dict[str, object]:
        """Upload an audio file as a new voice sample."""
        resp = await self._client.post(
            f"{self._base_url}/voices",
            files={"file": (f"{name}.wav", audio_data)},
            data={"name": name},
        )
        resp.raise_for_status()
        result: dict[str, object] = resp.json()
        return result

    async def delete_voice(self, name: str) -> dict[str, object]:
        """Delete a voice from the Chatterbox API."""
        resp = await self._client.delete(f"{self._base_url}/voices/{name}", timeout=30.0)
        resp.raise_for_status()
        result: dict[str, object] = resp.json()
        return result

    async def cleanup(self) -> None:
        """Close the shared HTTP client."""
        await self._client.aclose()
