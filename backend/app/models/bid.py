from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Bid(Base):
   
   __tablename__="bids"
   id=Column(Integer,primary_key=True,index=True)
   auction_id=Column(Integer,ForeignKey("auctions.id"))
   supplier_id=Column(Integer,ForeignKey("users.id"))
   amount=Column(Float,nullable=False)
   timestamp=Column(DateTime, default=datetime.utcnow)

   #ilişkiler
   auction=relationship("Auction",back_populates="bids")
   supplier=relationship("User",back_populates="bids")