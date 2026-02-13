import logging

import httpx

from backend.providers.base import TranslateProvider

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = (
    "You are a professional translator. "
    "Translate the following text from {source} to {target}. "
    "Output ONLY the translation, nothing else."
)


class OpenAICompatProvider(TranslateProvider):
    def __init__(self, model: str, base_url: str, api_key: str = "") -> None:
        self._model = model
        self._base_url = base_url.rstrip("/").removesuffix("/v1")
        headers: dict[str, str] = {}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
        self._client = httpx.AsyncClient(timeout=120.0, headers=headers)

    async def translate(self, text: str, source: str, target: str, model: str | None = None) -> str:
        if not text.strip():
            return ""

        system = SYSTEM_PROMPT.format(source=source, target=target)

        try:
            response = await self._client.post(
                f"{self._base_url}/v1/chat/completions",
                json={
                    "model": model or self._model,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": text},
                    ],
                    "temperature": 0.3,
                },
            )
            response.raise_for_status()
        except httpx.HTTPStatusError as e:
            logger.error("OpenAI-compat returned %s: %s", e.response.status_code, e.response.text[:200])
            raise RuntimeError(f"Translation failed: OpenAI-compat {e.response.status_code}") from e
        except httpx.ConnectError:
            logger.error("Cannot reach OpenAI-compat API at %s", self._base_url)
            raise RuntimeError(f"Translation failed: cannot reach API at {self._base_url}")

        data = response.json()
        return data["choices"][0]["message"]["content"].strip()

    async def cleanup(self) -> None:
        await self._client.aclose()
