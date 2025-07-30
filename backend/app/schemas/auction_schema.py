from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Literal

from app.schemas.product_schema import ProductOut

class AuctionCreate(BaseModel):
    product_id: int
    start_time: Optional[datetime] = None
    end_time: datetime
    starting_price: float
    auction_type: Literal["highest", "lowest"] = "highest"  # varsayılan değeri highest

class AuctionOut(BaseModel):
    id: int
    product_id: int
    start_time: datetime
    end_time: datetime
    starting_price: float
    current_price: Optional[float]
    is_active: bool
    auction_type: str
    product: Optional[ProductOut] #ihalelein ürün adlarını gösterebilmek için yaptık*

    class Config:
        orm_mode = True