from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base

class Company(Base):
    __tablename__="companies"

    id=Column(Integer,primary_key=True,index=True)
    name=Column(String(100),nullable=False)
    type=Column(String(20))

    #ilişkiler
    users=relationship("User",back_populates="company")
    products=relationship("Product",back_populates="company")
    auctions = relationship("Auction", back_populates="company")

