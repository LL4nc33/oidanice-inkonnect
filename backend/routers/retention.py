"""Retention settings endpoints."""

import logging
import uuid

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.database.connection import get_session_factory
from backend.database.models import Organization

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/settings", tags=["settings"])

VALID_PRESETS = {"24 hours", "7 days", "30 days", "1 year", "unlimited"}


class RetentionResponse(BaseModel):
    org_id: str
    retention_policy: str
    audio_enabled_default: bool


class RetentionUpdate(BaseModel):
    retention_policy: str  # "24 hours", "7 days", "30 days", "1 year", "unlimited"
    audio_enabled_default: bool | None = None


@router.get("/retention/{org_id}", response_model=RetentionResponse)
async def get_retention(org_id: str) -> RetentionResponse:
    factory = get_session_factory()
    async with factory() as db:
        org = await db.get(Organization, uuid.UUID(org_id))
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")
        return RetentionResponse(
            org_id=str(org.id),
            retention_policy=org.retention_policy,
            audio_enabled_default=org.audio_enabled_default,
        )


@router.put("/retention/{org_id}", response_model=RetentionResponse)
async def update_retention(org_id: str, body: RetentionUpdate) -> RetentionResponse:
    if body.retention_policy not in VALID_PRESETS:
        raise HTTPException(status_code=400, detail=f"Invalid retention policy. Valid: {', '.join(sorted(VALID_PRESETS))}")

    factory = get_session_factory()
    async with factory() as db:
        org = await db.get(Organization, uuid.UUID(org_id))
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")
        org.retention_policy = body.retention_policy
        if body.audio_enabled_default is not None:
            org.audio_enabled_default = body.audio_enabled_default
        await db.commit()
        await db.refresh(org)
        return RetentionResponse(
            org_id=str(org.id),
            retention_policy=org.retention_policy,
            audio_enabled_default=org.audio_enabled_default,
        )
