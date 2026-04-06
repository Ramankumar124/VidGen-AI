from sqlalchemy import Column,Integer,String
from sqlalchemy.orm import mapped_column,Mapped
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    password: Mapped[str] = mapped_column(String)
    name:Mapped[str]=mapped_column(String)