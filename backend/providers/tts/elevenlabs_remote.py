import logging

import httpx

from backend.providers.base import TTSProvider

logger = logging.getLogger(__name__)

BASE_URL = "https://api.elevenlabs.io"


class ElevenLabsRemoteProvider(TTSProvider):
    def __init__(
        self,
        api_key: str,
        model: str = "eleven_multilingual_v2",
        voice_id: str = "",
    ) -> None:
        self._api_key = api_key
        self._model = model
        self._voice_id = voice_id
        self._client = httpx.AsyncClient(
            timeout=60.0,
            headers={"xi-api-key": api_key},
        )

    async def synthesize(
        self, text: str, lang: str, voice: str | None = None, **kwargs: object,
    ) -> bytes:
        vid = voice or self._voice_id
        if not vid:
            raise RuntimeError("ElevenLabs: no voice_id configured")

        stability = kwargs.get("stability", 0.5)
        similarity_boost = kwargs.get("similarity_boost", 0.75)

        resp = await self._client.post(
            f"{BASE_URL}/v1/text-to-speech/{vid}",
            params={"output_format": "mp3_44100_128"},
            json={
                "text": text,
                "model_id": self._model,
                "voice_settings": {
                    "stability": stability,
                    "similarity_boost": similarity_boost,
                },
            },
        )
        if resp.status_code == 401:
            raise RuntimeError("ElevenLabs 401: invalid API key")
        if resp.status_code == 429:
            raise RuntimeError("ElevenLabs 429: rate limit exceeded")
        resp.raise_for_status()
        return resp.content

    async def get_voices(self) -> list[dict]:
        resp = await self._client.get(f"{BASE_URL}/v2/voices", params={"limit": 100})
        resp.raise_for_status()
        data = resp.json()
        return [
            {"voice_id": v["voice_id"], "name": v["name"]}
            for v in data.get("voices", [])
        ]

    async def cleanup(self) -> None:
        await self._client.aclose()
