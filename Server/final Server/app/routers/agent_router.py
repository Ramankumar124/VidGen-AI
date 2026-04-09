import uuid
from fastapi import APIRouter,Depends
from app.schemas.user import UserCreate
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.services.agent_service import agent_resume, agent_run
router=APIRouter(prefix="/agent",tags=["agent"])


@router.post("/run")
def run_agent(url:str,db:Session=Depends(get_db)):
    run_id = str(uuid.uuid4())
    event = agent_run(url, run_id)

    return {
        "thread_id": run_id,   # ✅ send to frontend
        "interrupt": event.get("__interrupt__") if event else None
    }

@router.post("/resume")
def resume_agent(run_id:str,decision:str):
    return agent_resume(run_id,decision)