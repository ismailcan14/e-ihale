from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from sqlalchemy.orm import joinedload


from app.database import SessionLocal
from app.models.auction import Auction
from app.models.product import Product
from app.schemas.auction_schema import AuctionCreate, AuctionOut
from app.models.user import User
from app.routers.user_router import get_current_user

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
def create_auction(auction_data: AuctionCreate, db: Session = Depends(get_db),current_user: User = Depends(get_current_user)):
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

    if auction_data.start_time and auction_data.start_time.tzinfo is None:
        #auction_data.start_time ile frontendden bir zaman gönderildi mi ? yani auction_data.start_time değişkeni bir zaman değeri tutuyor mu ve zaman değeri tutuyorsa auction_data.start_time.tzinfo is None yani bu zaman değerinin bir zaman dilimi var mı ? yani UTC (Evrensel Zaman Birimi) vb. bir zaman dilimi var mı ? yoksa if in içerisine giriyor 
        auction_data.start_time = auction_data.start_time.replace(tzinfo=timezone.utc)
        #Burada da gelen zaman dilimi utc ymiş gibi damgalıyoruz.
        #Bunu neden yaptık ? Çünkü inputtan saat 10.00 girdiğimizde veritabanımıza 10.00 olarak kaydoluyor. Bunu backendde düzeltmemiz lazım çünkü APScheduler utc zaman dilimine göre çalışıyor. 
        #Biz zaten frontda düzeltip yolladık bunu neden yaptık ? Çünkü teoride ne kadar gereksiz olsa da gerçek hayatta frontend her zaman düzgün davranmaz. kullanıcı farklı bir tarayıcıdan girebilir mobilden girebilir herhangi bir sorun olabilir onun için biz gelen veriyi tekrardan utc formatında damgalıyoruz ve işimizi garantiye alıyoruz :)

    if auction_data.end_time and auction_data.end_time.tzinfo is None:
        auction_data.end_time = auction_data.end_time.replace(tzinfo=timezone.utc)

    auction = Auction(
        product_id=auction_data.product_id,
        company_id=current_user.company_id,
        auction_type=auction_data.auction_type, #ihale tipi
        start_time=auction_data.start_time or datetime.utcnow().replace(tzinfo=timezone.utc), #eğer zaman bilgisi girilmişse onu kullanır boş ise şimdiki zamanın utc formatında damgalanmış halini kullanır.
        end_time=auction_data.end_time,
        starting_price=auction_data.starting_price,
        current_price=auction_data.starting_price
    )
    #Her şey tamamsa bir Auction nesnesi oluşturup gerekli verileri dolduruyoruz. Altta da bu nesneyi veritabanına Auction tablosuna kaydedip nesneyi güncelliyoruz.
    db.add(auction)
    db.commit()
    db.refresh(auction)
    return auction

@router.get("/my", response_model=list[AuctionOut])
def get_my_auctions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    auctions = db.query(Auction)\
        .filter(Auction.company_id == current_user.company_id)\
        .options(joinedload(Auction.product))\
        .all()
    return auctions


