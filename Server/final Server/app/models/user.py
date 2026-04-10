from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import mapped_column, Mapped, relationship
from typing import List
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    password: Mapped[str] = mapped_column(String)
    name: Mapped[str] = mapped_column(String)
    videos: Mapped[list["AnalisedVideo"]] = relationship("AnalisedVideo", back_populates="user")