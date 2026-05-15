from sqlalchemy import JSON, Column, ForeignKey, Integer, String
from sqlalchemy.orm import mapped_column, Mapped
from typing import List
from app.db.database import Base


class Product(Base):
    __tablename__ = "products"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    product_name: Mapped[str] = mapped_column(String)
    brand:Mapped[str]=mapped_column(String)
    category:Mapped[str]=mapped_column(String)
    price: Mapped[str] = mapped_column(String)
    description: Mapped[str] = mapped_column(String)
    product_images: Mapped[List[str]] = mapped_column(JSON)
