from fastapi import APIRouter,Depends
from app.schemas.user import UserCreate
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.services.agent_service import agent_run
router=APIRouter(prefix="/agent",tags=["agent"])


@router.post("/run")
def run_agent(url:str,db:Session=Depends(get_db)):
    return agent_run(url,db)