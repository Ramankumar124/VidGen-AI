
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate

def create_user(db:Session,user:UserCreate):
    db_user=User()
