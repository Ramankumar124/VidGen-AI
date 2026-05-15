from sqlalchemy import Column,Integer,String,ForeignKey
from sqlalchemy.orm import mapped_column,Mapped, relationship
from app.db.database import Base
from sqlalchemy.dialects.postgresql import JSONB


class AnalisedVideo(Base):
    __tablename__ = "analyzedVedio"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    url:Mapped[str]=mapped_column(String)
    analysis: Mapped[dict] = mapped_column(JSONB)
    # user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    # user: Mapped["User"] = relationship("User", back_populates="videos")