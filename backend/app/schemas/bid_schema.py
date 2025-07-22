from pydantic import BaseModel
from datetime import datetime

class BidCreate(BaseModel):
    auction_id:int
    supplier_id:int
    amount:int

class BidOut(BaseModel):
    id:int
    auction_id:int
    supplier_id:int
    amount:float
    timestamp:datetime

    class Config:
        form_attributes=True