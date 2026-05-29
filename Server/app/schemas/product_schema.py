from pydantic import BaseModel
from typing import List, Optional


class ProductCreate(BaseModel):
    product_name: str
    brand: str
    category: str
    price: str
    description: str


class ProductRead(BaseModel):
    id: int
    product_name: str
    brand: str
    category: str
    price: str
    description: str
    product_images: List[str] = []

    class Config:
        from_attributes = True
