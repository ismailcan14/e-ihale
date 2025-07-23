from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__="users"
    id=Column(Integer,primary_key=True,index=True)
    company_id=Column(Integer,ForeignKey("companies.id"))
    role_id=Column(Integer,ForeignKey("roles.id"))
    name=Column(String(100))
    email=Column(String(100),unique=True,nullable=False)
    password=Column(String,nullable=False)

    #İlişkiler
    company=relationship("Company",back_populates="users")
    role=relationship("Role",back_populates="users")
    bids = relationship("Bid", back_populates="supplier", cascade="all, delete")

