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
    return agent_run(url,db,run_id)

@router.post("/resume")
def resume_agent(run_id:str):
    return agent_resume(run_id)