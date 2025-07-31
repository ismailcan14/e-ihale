from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, String, Enum
from sqlalchemy.orm import relationship
from app.database import Base
from datetime import datetime
import enum

class AuctionStatus(enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    FINISHED = "finished"

class Auction(Base):
    __tablename__ = "auctions"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    company_id = Column(Integer, ForeignKey("companies.id"))
    winner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    auction_type = Column(String, default="highest")
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime)
    starting_price = Column(Float)
    current_price = Column(Float)

    status = Column(
        Enum(AuctionStatus, name="auction_status", native_enum=False),
        default=AuctionStatus.PENDING
    )

    # ilişkiler
    product = relationship("Product", back_populates="auction")
    bids = relationship("Bid", back_populates="auction", cascade="all,delete")
    company = relationship("Company", back_populates="auctions")
