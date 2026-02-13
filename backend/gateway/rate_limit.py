"""In-memory token bucket rate limiter for the gateway."""

import time
from dataclasses import dataclass, field

from fastapi import HTTPException, Request, Response

from backend.dependencies import get_settings
from backend.gateway.auth import ClientInfo


@dataclass
class _Bucket:
    tokens: float
    last_refill: float


_buckets: dict[str, _Bucket] = {}


def _get_bucket(key: str, limit: int) -> _Bucket:
    now = time.monotonic()
    bucket = _buckets.get(key)
    if bucket is None:
        bucket = _Bucket(tokens=float(limit), last_refill=now)
        _buckets[key] = bucket
        return bucket

    elapsed = now - bucket.last_refill
    refill = elapsed * (limit / 60.0)
    bucket.tokens = min(float(limit), bucket.tokens + refill)
    bucket.last_refill = now
    return bucket


def check_rate_limit(client: ClientInfo, cost: int = 1) -> dict[str, str]:
    """Consume tokens and return rate limit headers. Raises 429 if exhausted."""
    s = get_settings()
    limit = s.gateway_rate_limit

    if limit <= 0:
        return {}

    key = client.api_key or "__anonymous__"
    bucket = _get_bucket(key, limit)

    remaining = max(0, int(bucket.tokens - cost))
    reset_seconds = int(60 - (time.monotonic() - bucket.last_refill) % 60)

    headers = {
        "X-RateLimit-Limit": str(limit),
        "X-RateLimit-Remaining": str(remaining),
        "X-RateLimit-Reset": str(reset_seconds),
    }

    if bucket.tokens < cost:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded",
            headers=headers,
        )

    bucket.tokens -= cost
    return headers
