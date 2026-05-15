from pydantic import BaseModel,Field,EmailStr


class UserLogin(BaseModel):
    email:str
    password:str

class UserRegister(BaseModel):
    email:EmailStr
    password:str=Field(min_length=8,max_length=50)
    name:str=Field(min_length=2,max_length=50)