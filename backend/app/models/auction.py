from sqlalchemy import Column, Integer, Float, Boolean, ForeignKey, DateTime, String
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime

class Auction(Base):

 __tablename__="auctions"

 id=Column(Integer,primary_key=True,index=True)
 product_id=Column(Integer,ForeignKey("products.id"))
 winner_id = Column(Integer, ForeignKey("users.id"), nullable=True) #Kazananı belirlemek için oluşturuldu.
 auction_type = Column(String, default="highest")  # ihale veya açık arttırma
 start_time=Column(DateTime,default=datetime.utcnow)
 end_time=Column(DateTime)
 starting_price=Column(Float)
 current_price=Column(Float)
 is_active=Column(Boolean,default=False)

 #ilişkiler
 product=relationship("Product",back_populates="auction")
 bids=relationship("Bid",back_populates="auction",cascade="all,delete")




