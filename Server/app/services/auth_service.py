from sqlalchemy.orm import  Session
from app.schemas.auth_schema import UserLogin,UserRegister
from app.models.user import User
from app.core.security import verify_password,hash_password
from fastapi import HTTPException
from app.utils.jwt import create_access_token
from app.utils.response import success_response


def register_user(user:UserRegister,db:Session):
     db_user=  db.query(User).filter(User.email==user.email).first()
     if  db_user:
        raise HTTPException(status_code=401, detail="User Already Exsist with this email")
     
     new_user=User(
      #   name:user.name,
        email=user.email,
      #   password:hash_password(user.password)
    )    


def login_user(user:UserLogin,db:Session):
     db_user=  db.query(User).filter(User.email==user.email).first()

     if not db_user or not  verify_password(user.password,db_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
     
     access_token=create_access_token({"sub":user.email})
     return success_response(
        "Login successful",
        {
            "access_token": access_token,
        }
    )
   


