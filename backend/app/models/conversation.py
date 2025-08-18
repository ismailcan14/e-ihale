from __future__ import annotations

from datetime import datetime
import enum
from sqlalchemy import (
    Column, Integer, ForeignKey, DateTime, String, Text, Boolean,
    Enum, UniqueConstraint, Index
)
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.database import Base


class ConversationStatus(enum.Enum):
    ACTIVE = "active"
    CLOSED = "closed"


class MessageType(enum.Enum):
    TEXT = "text"
    FILE = "file"
    SYSTEM = "system"

#Konuşma Tablosu
class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    auction_id: Mapped[int] = mapped_column(Integer, ForeignKey("auctions.id"), nullable=False)
    customer_company_id: Mapped[int] = mapped_column(Integer, ForeignKey("companies.id"), nullable=False)
    supplier_company_id: Mapped[int] = mapped_column(Integer, ForeignKey("companies.id"), nullable=False)

    status: Mapped[ConversationStatus] = mapped_column(
        Enum(ConversationStatus, name="conversation_status", native_enum=False),
        default=ConversationStatus.ACTIVE,
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # ilişkiler
    auction = relationship("Auction")
    customer_company = relationship("Company", foreign_keys=[customer_company_id])
    supplier_company = relationship("Company", foreign_keys=[supplier_company_id])

    participants = relationship(
        "ConversationParticipant",
        back_populates="conversation",
        cascade="all, delete-orphan"
    )
    messages = relationship(
        "Message",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="Message.created_at"
    )

    __table_args__ = (
        # Aynı ihale için bir konuşma kuralı (müşteri + kazanan tedarikçi)
        UniqueConstraint("auction_id", name="uq_conversation_auction"),
        Index("ix_conversation_customer_supplier", "customer_company_id", "supplier_company_id"),
    )

#Konuşma Katılımcısı
class ConversationParticipant(Base):
    __tablename__ = "conversation_participants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    conversation_id: Mapped[int] = mapped_column(Integer, ForeignKey("conversations.id"), nullable=False)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # "customer" | "supplier"

    joined_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    last_read_message_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("messages.id"), nullable=True)

    # ilişkiler
    conversation = relationship("Conversation", back_populates="participants")
    user = relationship("User")
    last_read_message = relationship("Message", foreign_keys=[last_read_message_id])

    __table_args__ = (
        UniqueConstraint("conversation_id", "user_id", name="uq_participant_conversation_user"),
        Index("ix_participant_conversation", "conversation_id"),
    )

#Mesaj Tablosu
class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    conversation_id: Mapped[int] = mapped_column(Integer, ForeignKey("conversations.id"), nullable=False)
    sender_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)

    message_type: Mapped[MessageType] = mapped_column(
        Enum(MessageType, name="message_type", native_enum=False),
        default=MessageType.TEXT,
        nullable=False
    )
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    attachment_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    edited_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # ilişkiler
    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User")

    __table_args__ = (
        Index("ix_message_conversation_created", "conversation_id", "created_at"),
    )


class MessageReceiptStatus(enum.Enum):
    DELIVERED = "delivered"
    READ = "read"

#Gönderildi-Alındı Bilgisi İçin
class MessageReceipt(Base):
    __tablename__ = "message_receipts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    message_id: Mapped[int] = mapped_column(Integer, ForeignKey("messages.id"), nullable=False)
    recipient_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    status: Mapped[MessageReceiptStatus] = mapped_column(
        Enum(MessageReceiptStatus, name="message_receipt_status", native_enum=False),
        default=MessageReceiptStatus.DELIVERED,
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # ilişkiler
    message = relationship("Message")
    recipient = relationship("User")

    __table_args__ = (
        UniqueConstraint("message_id", "recipient_id", name="uq_receipt_message_recipient"),
        Index("ix_receipt_message", "message_id"),
    )
