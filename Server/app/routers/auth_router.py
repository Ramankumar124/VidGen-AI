from fastapi import APIRouter, Depends
from app.schemas.auth_schema import UserLogin, UserRegister
from sqlalchemy.orm import Session
from app.dependencies import get_db
from app.services.auth_service import login_user, register_user
from app.utils.jwt import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post('/login')
def login(user: UserLogin, db: Session = Depends(get_db)):
    return login_user(user, db)


@router.post("/register")
def register(user: UserRegister, db: Session = Depends(get_db)):
    return register_user(user, db)


@router.get("/me")
def get_me(current_user: str = Depends(get_current_user)):
    return {"message": f"Hello {current_user}", "email": current_user}