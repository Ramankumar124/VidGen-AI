from __future__ import annotations

from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel


# ── Request body for saving a project ────────────────────────────────────────

class ProjectSave(BaseModel):
    """Payload sent from the frontend when the user clicks 'Save Project'."""
    run_id: str
    url: str
    summary: Optional[Any] = None    # VideoAnalysis dict
    product: Optional[Any] = None    # product_details dict
    script: Optional[Any] = None     # GeneratedScript dict (None if skipped)


# ── Lightweight item for list endpoints ──────────────────────────────────────

class ProjectListItem(BaseModel):
    """Compact representation shown in Dashboard / project lists."""
    id: int
    run_id: str
    url: str
    status: str
    script_title: Optional[str] = None
    product_name: Optional[str] = None
    scene_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Full project detail ───────────────────────────────────────────────────────

class ProjectRead(BaseModel):
    """Full representation returned by GET /agent/projects/{run_id}."""
    id: int
    run_id: str
    url: str
    summary: Optional[Any] = None
    product: Optional[Any] = None
    script: Optional[Any] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
