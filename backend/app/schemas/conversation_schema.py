from __future__ import annotations

from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field, ConfigDict, model_validator

# -----------------------------
# Mesaj şemaları
# -----------------------------
class MessageBase(BaseModel):
    content: Optional[str] = Field(None, max_length=5000)
    attachment_url: Optional[str] = Field(None, max_length=512)


class MessageCreate(MessageBase):
    """content veya attachment_url ikisinden en az biri zorunlu"""
    @model_validator(mode="after")
    def _at_least_one(self):
        if not self.content and not self.attachment_url:
            raise ValueError("Mesaj içeriği veya dosya (attachment_url) zorunlu.")
        return self


class MessageOut(BaseModel):
    # ORM'den okumayı aç + Enum değerlerini otomatik string'e çevir
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    id: int
    conversation_id: int
    sender_id: int
    message_type: Literal["text", "file", "system"]
    content: Optional[str]
    attachment_url: Optional[str]
    created_at: datetime
    edited_at: Optional[datetime]
    deleted_at: Optional[datetime]


# -----------------------------
# Katılımcı şeması
# -----------------------------
class ConversationParticipantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    id: int
    user_id: int
    role: str  # "customer" | "supplier"
    joined_at: datetime
    last_read_message_id: Optional[int]


# -----------------------------
# Konuşma şemaları
# -----------------------------
class ConversationCreate(BaseModel):
    auction_id: int


class ConversationOut(BaseModel):
    # status DB'de Enum(ConversationStatus) olduğundan use_enum_values=True önemli
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    id: int
    auction_id: int
    customer_company_id: int
    supplier_company_id: int
    status: str  # "active" | "closed"
    created_at: datetime
    closed_at: Optional[datetime] = None

    # default [] yerine default_factory=list (paylaşılan referans riskini önler)
    participants: list[ConversationParticipantOut] = Field(default_factory=list)
    last_message: Optional[MessageOut] = None


# -----------------------------
# Okundu bilgisi (read receipts)
# -----------------------------
class ReadReceiptCreate(BaseModel):
    last_read_message_id: int


class MessageReceiptOut(BaseModel):
    # status DB'de Enum(MessageReceiptStatus) -> "delivered"/"read" string olarak dönsün
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    id: int
    message_id: int
    recipient_id: int
    status: Literal["delivered", "read"]
    updated_at: datetime
