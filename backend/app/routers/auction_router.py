from fastapi import APIRouter, Body, Depends, HTTPException, Path
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from sqlalchemy.orm import joinedload
from datetime import timezone

from app.database import SessionLocal
from app.models.auction import Auction, AuctionStatus
from app.models.product import Product, ProductType
from app.schemas.auction_schema import AuctionCreate, AuctionOut,AuctionUpdate
from app.models.user import User
from app.routers.user_router import get_current_user
from app.routers.websocket_router import active_connections

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
    product = db.query(Product).filter(Product.id == auction_data.product_id,Product.company_id==current_user.company_id).first()
    #product adında bir değişken oluşturup Product tablosunda gelen ürünün id sinde bir ürün varmı diye kontrol ediyoruz
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    #Ürün yoksa hata mesajı döndürüyoruz.

    #Gelen ürünün tipine göre ihalenin türünü belirliyoruz.(Bu sonradan değiştirdiğim bir özellik ürün tipi seçildiğinde ihale tipi de otomatik seçilecek.)
    if product.type == ProductType.PRODUCT:
     auction_type = "highest"
    elif product.type == ProductType.SERVICE:
     auction_type = "lowest"
    else:
        raise HTTPException(status_code=400, detail="Geçersiz ürün tipi")

    existing = db.query(Auction).filter(
    Auction.product_id == product.id,
    Auction.status == AuctionStatus.ACTIVE
    ).first()

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
        auction_type=auction_type, #ihale tipi(Bunu kendimiz burada manuel olarak yaptık çünkü kullanıcı frontendde select inputunu değiştiremese bile payloadı değiştirip bize yollayabilir ve bu bir güvenlik sorunu oluşturur. bu şekilde bunun önüne geçtik)
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

#Giriş Yapan Kullanıcıların Tüm İhaleleri Getirme(Eksik açıklama vardı! düzelttim)
@router.get("/my", response_model=list[AuctionOut]) #bir get endpointi oluşturuyoruz ve bu endpointe istek geldiğinde dönecek veri modelinin auctionOut şeklinde olduğunu ve bir liste şeklinde olduğunu belirtiyoruz.
def get_my_auctions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) #fonksiyonumuzu oluşturup db parametresi ile veritabanı bağlantısını fonksiyon kullanıldıkça otomatik açık kapatacak şekilde Depends fonksiyonu ile get_db fonksiyonunu çağırarak yapıyoruz.
    #current_user ise User sınıfı türünde bir nesne ve giriş yapan kullanıcının bilgilerini tutuyor.
):
    auctions = db.query(Auction)\
        .filter(Auction.company_id == current_user.company_id)\
        .options(joinedload(Auction.product))\
        .all() #Burada Auction modeline bir sorgu yazıyoruz sorguda auction tablosundaki company_id ile giriş yapan kullanıcının company id si eşleşen kayıtların ilişkili olduğu Product tablosundaki kayıtların tümünü alıyoruz ve bu kayıtlar auction nesnesinde tutuluyor. K
    return auctions
#Kayıt geri döndürülürken de auctionOut modeline göre eşleşen veriler AuctionOut modeline dolduruluyor ve geri döndürülüyor. AuctionsOut modeline  "product: Optional[ProductOut]" eklemiştik. bu kısmıda ürün bilgilerini auctionOut modeline atabilmek  için yaptık.


# İhale Güncelleme
@router.put("/{auction_id}", response_model=AuctionOut) #güncelleme(put) endpointini id li şekilde oluşturuyoruz ve fonksiyondan dönen nesnenin auctionOut scheması şeklinde olduğunu bildiriyoruz.
def update_auction(
    auction_id: int = Path(..., description="Güncellenecek ihalenin ID’si"),
    updated_data: AuctionUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
): #Güncelleme fonksiyonumuz var ve 4 adet parametre alıyor. auction_id api isteği atarken url ye yazdıgımız id yi temsil ediyor
    #updated_data istekte gelen form verisinin auctionUpdate scheması şeklinde gelmesini bekliyor
    #db bildiğimiz gibi get_db fonksiyonu ile fonksiyon çalışana kadar veritabanı bağlantısı sağlıyor.
    #current_user nesneside User modelinde ve get_current_user fonksiyonu ile giriş yapan kullanıcının bilgilerini tutuyor.
    auction = db.query(Auction).filter(
        Auction.id == auction_id,
        Auction.company_id == current_user.company_id
    ).first()
    #auction modelinde bir sorgu yapıyoruz bu sorgu Auction tablosunda istek urlsinde gelen ve auction_id değişkeninde tutulan id deki ve giriş yapan kullanıcının şirket id sinde ki eşleşen kayıtların ilkini(zaten o auction id de 1 kayıt olur başka kayıt gelmez) bize döndürüyor ve auction nesnesinde bu kaydı tutuyoruz. 

    if not auction:
        raise HTTPException(status_code=404, detail="İhale bulunamadı") #Hata mesajı

    if auction.status == AuctionStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Aktif ihaleler güncellenemez") #gelen ihaledeki status bilgisi active ise yani ihale aktif ise güncellenemez diye uyarı mesajı gönderiyoruz.

    data = updated_data.dict(exclude_unset=True)
    #gelen formVerileri update_data adlı nesnede tutuluyordu bu nesneyi sözlük haline çevirip yani bir anahtar ve bir değer şekline çeviriyoruz. exclude_unset=True ise parametre olarak update_data değişkeni auctionupdate scheması seklınde beklenıyordu eğer beklenen değişkenlerden örnek olarak sadece 1 tanesi geliyorsa sadece kullanıcı tarafından gönderileni alırız ancak exclude_unset=false olsaydı 1 değişken değişseydi diğer 3 ü boş olarak kalırdı ve bu büyük sorunlara yol açabilirdi.
    if "start_time" in data and data["start_time"] and data["start_time"].tzinfo is None:
        data["start_time"] = data["start_time"].replace(tzinfo=timezone.utc)
    if "end_time" in data and data["end_time"] and data["end_time"].tzinfo is None:
        data["end_time"] = data["end_time"].replace(tzinfo=timezone.utc)
        #Gelen zaman değişkenlerinde utc formatına çeviriyoruz. Bunun detaylı açıklaması createAuction da var

    for key, value in data.items():
        setattr(auction, key, value)
  #data sözlüğündeki her bir alanı auction nesnesine uyguluyoruz ornek olarak "starting_price": 100.0 varsa → setattr(auction, "starting_price", 100.0) işlemi yapılır.
    db.commit()
    db.refresh(auction)
    return auction
#veritabanımıza commitleyip refresh ile auction nesnesinin son halini çekip return ile geri döndürüyoruz.

#Aktif Tüm İhaleleri Getiren Get Endpointi
@router.get("/active", response_model=list[AuctionOut])
def get_active_auctions(db: Session = Depends(get_db)):
    return db.query(Auction)\
        .filter(Auction.status == AuctionStatus.ACTIVE)\
        .options(joinedload(Auction.product))\
        .all() 
#get endpointi oluşturup yolunu auctions/active olarak belirliyoruz ve response_modeli yani cevap modeli olarak auctionOut modelini belirliyoruz. ardından depends ile veritabanı bağlantımızı açıp bi Auction modeline statusu aktif olan modelleri getir sorgusunu çalıştırıp geriye dönen tüm modelleri AuctionOut modeli şeklinde geriye döndürüyoruz.

# Id ye Göre Tek Bir İhaleyi Getirme
@router.get("/{auction_id}", response_model=AuctionOut)
def get_auction_by_id(
    auction_id: int,
    db: Session = Depends(get_db)
):
    auction = db.query(Auction)\
        .options(joinedload(Auction.product))\
        .filter(Auction.id == auction_id)\
        .first()

    if not auction:
        raise HTTPException(status_code=404, detail="İhale bulunamadı")

    return auction
 

 #Butona basıldığında tekliflerin görünümünü açık hale getiren endpoint

import json
from app.routers.websocket_router import active_connections

@router.put("/{auction_id}/toggle-public-bids")
async def toggle_public_bids(
    auction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    auction = db.query(Auction).filter(Auction.id == auction_id).first()
    if not auction:
        raise HTTPException(status_code=404, detail="İhale bulunamadı")
    if auction.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Bu ihaleye erişiminiz yok")

    # is_public_bids tersine çevrilir
    auction.is_public_bids = not auction.is_public_bids
    db.commit()

    # WebSocket üzerinden görünürlük değişimini bildir
    connections = active_connections.get(auction_id, [])
    for connection in connections:
        try:
            await connection.send_text(json.dumps({
                "type": "toggle_visibility",
                "is_public_bids": auction.is_public_bids
            }))
        except Exception as e:
            print("WebSocket gönderim hatası (toggle-public-bids):", e)

    return {"is_public_bids": auction.is_public_bids}




