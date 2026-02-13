"""Embedding provider using Ollama API (nomic-embed-text)."""

import logging

import httpx

from backend.providers.base import EmbeddingProvider

logger = logging.getLogger(__name__)


class OllamaEmbeddingProvider(EmbeddingProvider):
    def __init__(self, base_url: str = "http://localhost:11434", model: str = "nomic-embed-text") -> None:
        self._base_url = base_url.rstrip("/")
        self._model = model
        self._client = httpx.AsyncClient(base_url=self._base_url, timeout=30.0)

    async def embed(self, text: str) -> list[float]:
        resp = await self._client.post("/api/embeddings", json={"model": self._model, "prompt": text})
        resp.raise_for_status()
        data = resp.json()
        embedding = data.get("embedding", [])
        if not embedding:
            raise ValueError(f"Empty embedding from {self._model}")
        return embedding

    async def cleanup(self) -> None:
        await self._client.aclose()
