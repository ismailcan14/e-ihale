from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import SessionLocal
from app.models.bid import Bid
from app.models.auction import Auction
from app.schemas.bid_schema import BidCreate, BidOut

router = APIRouter(
    prefix="/bids",
    tags=["Bids"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 🔹 Teklif Ver
@router.post("/", response_model=BidOut) #istek sonrası dönen yanıt BidOut modeli seklinde olacak.
def place_bid(bid_data: BidCreate, db: Session = Depends(get_db)):
    #bu endpointe gelen veriler BidCreate modelinde olması bekleniyor ve bid_data da tutulacak.
    auction = db.query(Auction).filter(Auction.id == bid_data.auction_id).first()
    #teklif verilecek ihalenin id si ile kayıtta bir ihale var mı diye kontrol ediliyor varsa ilk kayıt geri döndürülüyor.
    if not auction or not auction.is_active:
        raise HTTPException(status_code=404, detail="İhale bulunamadı veya aktif değil")
        #ihale bulunamazsa hata mesajı
    if bid_data.amount <= auction.current_price:
        raise HTTPException(status_code=400, detail="Teklif, mevcut fiyattan yüksek olmalı")
        #İhalenin güncel fiyatından düşük fiyat verdirmeme.
    bid = Bid(
        auction_id=bid_data.auction_id,
        supplier_id=bid_data.supplier_id,
        amount=bid_data.amount
    )
    #Her şey tamam olduğunda Bid tablosuna kayıt için Bid nesnesi oluşturuluyor ve gerekli alanlar endpointe gelen veriler ile dolduruluyor. ve veritabanına kaydediliyor.

    auction.current_price = bid_data.amount
    #ihalenin güncel fiyatı son teklif ile güncelleniyor.
    db.add(bid)
    db.commit()
    db.refresh(bid)
    return bid
    #teklif veritabanına keydediliyor ve bid nesnesine id gibi created_at gibi kayıt esnasında eklenebilecek sütunlar ekleniyor yani bid nesnesi güncelleniyor ve geri döndürülüyor. 

# 🔹 Belirli bir ihalenin tekliflerini listele
@router.get("/auction/{auction_id}", response_model=list[BidOut])
def get_bids_for_auction(auction_id: int, db: Session = Depends(get_db)):
    return db.query(Bid).filter(Bid.auction_id == auction_id).order_by(Bid.amount.desc()).all()
#Seçilen ihale id sine göre Bid tablosundaki tüm teklifler  çoktan aza doğru getiriliyor ve geri döndürülüyor.
