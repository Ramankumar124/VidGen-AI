import uuid
from fastapi import APIRouter, Body,Depends
from pydantic import BaseModel
from app.schemas.user import UserCreate
from sqlalchemy.orm import Session
from app.dependencies import get_db
from typing import Any
from app.services.agent_service import agent_resume, agent_run
router=APIRouter(prefix="/agent",tags=["agent"])

class ResumeRequest(BaseModel):
    run_id: str
    decision: Any

@router.post("/run")
def run_agent(url:str=Body(
    ...,
    example='https://www.youtube.com/shorts/uMZg_yD9fiQ'
),db:Session=Depends(get_db)):
    run_id = str(uuid.uuid4())
    result = agent_run(url, run_id, db)
    return {
        "run_id": run_id,
        "status": result["status"],
        "interrupt": result["interrupt"]
    }

@router.post("/resume")
def resume_agent(payload:ResumeRequest,db:Session=Depends(get_db)):
    result = agent_resume(payload.run_id, payload.decision, db)
    return {
        "run_id": payload.run_id,
        "status": result["status"],
        "interrupt": result["interrupt"]
    }



