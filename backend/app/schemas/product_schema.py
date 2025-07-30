from pydantic import BaseModel
from typing import Optional

class ProductCreate(BaseModel):
    name:str
    description:Optional[str]=None
    price:float
    stock:int
    company_id:int

class ProductOut(BaseModel):
    id:int
    name:str
    description:Optional[str]=None
    price:float
    stock:int
    company_id:int

    class Config:
        orm_mode = True