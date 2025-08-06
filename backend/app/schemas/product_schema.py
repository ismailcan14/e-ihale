from pydantic import BaseModel
from typing import Literal, Optional

class ProductCreate(BaseModel):
    name:str
    description:Optional[str]=None
    price:float
    stock:int
    type: Literal["PRODUCT", "SERVICE"] = "PRODUCT"

class ProductOut(BaseModel):
    id:int
    name:str
    description:Optional[str]=None
    price:float
    stock:int
    company_id:int
    type: str

    class Config:
        orm_mode = True