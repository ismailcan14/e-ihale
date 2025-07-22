from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Product(Base):
    
    __tablename__="products"

    id=Column(Integer,primary_key=True,index=True)
    company_id=Column(Integer,ForeignKey("companies.id"),nullable=False)
    name=Column(String(100),nullable=False)
    description=Column(String(200),nullable=True)
    price=Column(Float,nullable=False)
    stock=Column(Integer,default=0)

    #İlişkiler
    company=relationship("Company",back_populates="products")
    auction=relationship("Auction",back_populates="product",uselist=False)
    
    
