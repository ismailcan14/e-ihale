from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AuctionCreate(BaseModel):
    product_id:int
    end_time:datetime
    starting_price:float
    
class AuctionOut(BaseModel):
    id:int
    product_id:int
    start_time:datetime
    end_time:datetime
    starting_price:float
    current_price:Optional[float]
    is_active:bool

    class Config:
       form_attributes=True