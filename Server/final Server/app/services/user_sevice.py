
from sqlalchemy.orm import Session
from app.schemas.user import UserCreate
from app.models.user import User
from app.core.security import hash_password
def create_user(db:Session,user:UserCreate):
    print("RAW USER:", user)
    print("USERNAME:", user.username)
    print("PASSWORD:", user.password)
    print("TYPE:", type(user.password))
    print("LEN:", len(user.password))
    print("BYTES:", len(user.password.encode("utf-8")))
    db_user=User(username=user.username,password_hash=hash_password(user.password))
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
