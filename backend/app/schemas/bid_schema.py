from pydantic import BaseModel
from datetime import datetime

class BidCreate(BaseModel):
    auction_id:int
    supplier_id:int
    amount:int

class BidUserInfo(BaseModel):
    name: str
    role: str
    company: str

class BidOut(BaseModel):
    id:int
    auction_id:int
    supplier_id:int
    amount:float
    timestamp:datetime
    user_info: BidUserInfo

    class Config:
        orm_mode = True