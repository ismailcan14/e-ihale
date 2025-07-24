from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import SessionLocal
from app.models.auction import Auction
from app.models.product import Product
from app.schemas.auction_schema import AuctionCreate, AuctionOut

router=APIRouter(
    prefix="/auctions",
    tags=["Auctions"]
)

def get_db():
    db=SessionLocal()
    try:
      yield db
    finally:
      db.close()


#İhale Oluşturma
@router.post("/", response_model=AuctionOut) 
#response_model ile istek sonrası dönen kayıtta hangi veriler tutulacak onu AuctionOut da belirliyoruz. kısaca istediğimiz verileri geriye döndürüyoruz.
def create_auction(auction_data: AuctionCreate, db: Session = Depends(get_db)):
    #gelen veriler AuctionCreate modeline göre bekleniyor ve auction_data da tutuluyor. db ile veritabanı oturumunu başlatıyoruz.
    product = db.query(Product).filter(Product.id == auction_data.product_id).first()
    #product adında bir değişken oluşturup Product tablosunda gelen ürünün id sinde bir ürün varmı diye kontrol ediyoruz
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    #Ürün yoksa hata mesajı döndürüyoruz.

    existing = db.query(Auction).filter(Auction.product_id == product.id, Auction.is_active == True).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu ürün için zaten aktif bir ihale var")
    #o ürünün aktif ihalesi varsa geriye hata mesajı döndürüyoruz.

    auction = Auction(
        product_id=auction_data.product_id,
        end_time=auction_data.end_time,
        starting_price=auction_data.starting_price,
        current_price=auction_data.starting_price
    )
    #Her şey tamamsa bir Auction nesnesi oluşturup gerekli verileri dolduruyoruz. Altta da bu nesneyi veritabanına Auction tablosuna kaydedip nesneyi güncelliyoruz.
    db.add(auction)
    db.commit()
    db.refresh(auction)
    return auction

