from sqlalchemy import Column, Integer, Float, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class Auction(Base):

 __tablename__="auctions"

 id=Column(Integer,primary_key=True,index=True)
 product_id=Column(Integer,ForeignKey("products.id"))
 start_time=Column(DateTime,default=datetime.utcnow)
 end_time=Column(DateTime)
 starting_price=Column(Float)
 current_price=Column(Float)
 is_active=Column(Boolean,default=True)

 #ilişkiler
 product=relationship("Product",back_populates="auciton")
 bids=relationship("Bid",back_populates="auction",cascade="all,delete")




