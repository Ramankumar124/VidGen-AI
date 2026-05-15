import uuid
from fastapi import APIRouter, Body,Depends,UploadFile,File
from pydantic import BaseModel
from app.schemas.user import UserCreate
from sqlalchemy.orm import Session
from app.dependencies import get_db
from typing import Any,List
from app.services.agent_service import agent_resume, agent_run
from fastapi.exceptions import HTTPException
from pathlib import Path
import os
router=APIRouter(prefix="/agent",tags=["agent"])

class ResumeRequest(BaseModel):
    run_id: str
    decision: Any

@router.post("/run")
def run_agent(url:str=Body(
    ...,
    example='https://www.instagram.com/p/DV1GrR5CJc5/'
),db:Session=Depends(get_db)):
    run_id = str(uuid.uuid4())
    result = agent_run(url, run_id, db)
    return {
        "run_id": run_id,
        "status": result["status"],
        "interrupt": result["interrupt"],
         "data":result['data']
    }

@router.post("/resume")
def resume_agent(payload:ResumeRequest,db:Session=Depends(get_db)):
    result = agent_resume(payload.run_id, payload.decision, db)
    return {
        "run_id": payload.run_id,
        "status": result["status"],
        "interrupt": result["interrupt"],
        "data":result["data"]
    }


@router.post("/upload-product-images")
async def upload_image(files:List[UploadFile]=File(...)):
    os.makedirs('uploads', exist_ok=True)
    saved_files=[]

    for file in files:
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Only images allowed")
        
        content=await file.read()

        file_id = str(uuid.uuid4())
        extension=Path(file.filename).suffix
        file_path=f"uploads/{file_id}{extension}"
        with open(file_path,"wb") as f:
            f.write(content)
        
        saved_files.append(file_path)
    return {
        "status":"done",
        "message":"file uploaded successfully",
        "data":saved_files
        }