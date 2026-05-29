from sqlalchemy import Column, Integer, String, JSON, DateTime, func
from sqlalchemy.orm import mapped_column, Mapped
from typing import Optional
from datetime import datetime
from app.db.database import Base


class Project(Base):
    """Persisted project — one row per saved agent run."""

    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # Unique identifier that matches the LangGraph thread_id / run_id
    run_id: Mapped[str] = mapped_column(String, unique=True, index=True)

    # Source video URL that was analyzed
    url: Mapped[str] = mapped_column(String)

    # User who owns this project (email from jwt)
    user_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Full VideoAnalysis JSON (from analized_summary agent state)
    summary: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Product details dict (from product_details agent state)
    product: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # GeneratedScript JSON — null when user skipped script generation
    script: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # "with_script" | "without_script"
    status: Mapped[str] = mapped_column(String, default="without_script")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
