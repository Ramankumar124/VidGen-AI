from typing import Any, TypedDict
from dataclasses import dataclass
from sqlalchemy.orm import Session
from app.schemas.VedioAnalysis import VideoAnalysis
from app.models.ScriptGeneration import GeneratedScript


class AgentState(TypedDict, total=False):
    url: str
    vedio_downloaded_path: str
    analized_summary: VideoAnalysis
    generate_script_human_decision: str
    product_details_source_decision: str
    product_details: dict[str, Any]
    generateted_script: GeneratedScript


@dataclass
class ContextSchema:
    db: Session
