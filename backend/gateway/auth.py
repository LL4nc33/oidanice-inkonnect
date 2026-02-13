"""API key authentication for the gateway."""

from dataclasses import dataclass

from fastapi import Depends, HTTPException, Request

from backend.dependencies import get_settings


@dataclass
class ClientInfo:
    api_key: str | None


def _extract_key(request: Request) -> str | None:
    """Extract API key from Authorization header or X-API-Key header."""
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:].strip()
    return request.headers.get("X-API-Key") or None


async def require_auth(request: Request) -> ClientInfo:
    """FastAPI dependency that validates the API key.

    If no keys are configured (empty GATEWAY_API_KEYS), auth is disabled
    and all requests are allowed.
    """
    s = get_settings()
    configured_keys = [k.strip() for k in s.gateway_api_keys.split(",") if k.strip()]

    if not configured_keys:
        return ClientInfo(api_key=None)

    key = _extract_key(request)
    if not key or key not in configured_keys:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")

    return ClientInfo(api_key=key)
