from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Literal
from app.models.auction import AuctionStatus

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
    status: AuctionStatus
    auction_type: str
    product: Optional[ProductOut] #ihalelein ürün adlarını gösterebilmek için yaptık*

    class Config:
        orm_mode = True

class AuctionUpdate(BaseModel): #İhale güncellemek için gerekli schema hepsi optinal yani doldurmasak da olur.
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    starting_price: Optional[float]
    auction_type: Optional[Literal["highest", "lowest"]]