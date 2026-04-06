from fastapi import APIRouter,Depends
from app.schemas.user import UserCreate
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.services.user_sevice import create_user
router=APIRouter(prefix="/users",tags=["users"])


@router.post("/",response_model=UserCreate)
def create_new_user(user:UserCreate,db:Session=Depends(get_db)):
    return create_user(db,user)