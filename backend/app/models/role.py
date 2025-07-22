from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base

class Role(Base):
    __tablename__="roles"
    id=Column(Integer,primary_key=True,index=True)
    name=Column(String(100))

    #ilişkiler
    user=relationship("User",back_populates="roles")
