import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import SessionLocal
from app.models.bid import Bid
from app.models.auction import Auction, AuctionStatus
from app.schemas.bid_schema import BidCreate, BidOut, BidUserInfo
from app.routers.websocket_router import active_connections
from app.models.user import User


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

#  Teklif Ver
@router.post("/", response_model=BidOut) #istek sonrası dönen yanıt BidOut modeli seklinde olacak.
async def place_bid(bid_data: BidCreate, db: Session = Depends(get_db)):
    #bu endpointe gelen veriler BidCreate modelinde olması bekleniyor ve bid_data da tutulacak.
    auction = db.query(Auction).filter(Auction.id == bid_data.auction_id).first()
    #teklif verilecek ihalenin id si ile kayıtta bir ihale var mı diye kontrol ediliyor varsa ilk kayıt geri döndürülüyor.
    if not auction or auction.status != AuctionStatus.ACTIVE:
        raise HTTPException(status_code=404, detail="İhale bulunamadı veya aktif değil")
    #ihale bulunamazsa hata mesajı

    # İhale türüne göre teklif kontrolü
    if auction.auction_type == "lowest":
        if bid_data.amount >= auction.current_price or bid_data.amount >= auction.starting_price:
            raise HTTPException(
                status_code=400,
                detail="Teklif, hem açılış fiyatından hem de mevcut fiyattan daha düşük olmalıdır."
            )
    elif auction.auction_type == "highest":
        if bid_data.amount <= auction.current_price or bid_data.amount <= auction.starting_price:
            raise HTTPException(
                status_code=400,
                detail="Teklif, hem açılış fiyatından hem de mevcut fiyattan daha yüksek olmalıdır."
            )
    else:
        raise HTTPException(status_code=400, detail="Geçersiz ihale tipi.") 
    #Eğer ihale türü lowest ise ihale başlangıç tutarı ve son tekliften daha düşük teklif verdirmeme
    
    bid = Bid(
        auction_id=bid_data.auction_id,
        supplier_id=bid_data.supplier_id,
        amount=bid_data.amount
    )
    #bid nesnesini oluşturuyoruz

    auction.current_price = bid_data.amount
    #ihalenin güncel fiyatı son teklif ile güncelleniyor.

    db.add(bid)
    db.commit()
    db.refresh(bid)
    db.refresh(auction)
    #teklif veritabanına keydediliyor ve bid nesnesine id gibi created_at gibi kayıt esnasında eklenebilecek sütunlar ekleniyor yani bid nesnesi güncelleniyor ve geri döndürülüyor. 

    
    user = db.query(User).filter(User.id == bid_data.supplier_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")

    role_name = user.role.name if user.role else "Bilinmiyor"
    company_name = user.company.name if user.company else "Bilinmiyor"
    #Kullanıcı bilgilerini teklif veren kullanıcının idsine göre veritabanından alma

    for connection in active_connections.get(bid_data.auction_id, []):
        print("Aktif bağlantı sayısı:", len(active_connections.get(bid_data.auction_id, [])))
        try:
            await connection.send_text(json.dumps({
                "id": bid.id,
                "amount": bid.amount,
                "timestamp": bid.timestamp.isoformat(),
                "supplier_id": bid.supplier_id,
                "user_info": {
                    "name": user.name,
                    "company": company_name,
                    "role": role_name
                }
            }))
        except Exception as e:
            print(f"WebSocket gönderim hatası: {e}")
    # Oluşturdugumuz websocket bağlantısına teklifi gönderiyoruz. Bu apiye bir istek geldiğinde biz de send_text ile bir mesaj yolluyoruz bu mesaj frondaki onMessage fonksiyonuna gider. açıklamanın devamı orada...

    return BidOut(
        id=bid.id,
        auction_id=bid.auction_id,
        supplier_id=bid.supplier_id,
        amount=bid.amount,
        timestamp=bid.timestamp,
        user_info=BidUserInfo(
            name=user.name,
            role=role_name,
            company=company_name
        )
        #api çağırıldığında BidOut nesnesini döndür.
    )

#  Belirli bir ihalenin tekliflerini listele
@router.get("/auction/{auction_id}", response_model=list[BidOut])
def get_bids_for_auction(auction_id: int, db: Session = Depends(get_db)):
    bids = db.query(Bid).filter(Bid.auction_id == auction_id).order_by(Bid.amount.desc()).all()
    #Bid tablosundaki auction id si endpointe yolladıgımız id ile eşleşen teklif kayıtların hepsini bids nesnesine atıyoruz.
    result = []
    #boş bir dizi.

    for bid in bids:
        user = db.query(User).filter(User.id == bid.supplier_id).first()
        if user:
            role = user.role.name if user.role else "Bilinmiyor"
            company = user.company.name if user.company else "Bilinmiyor"
            user_info = BidUserInfo(
                name=user.name,
                role=role,
                company=company
            )
        else:
            user_info = BidUserInfo(name="Bilinmiyor", role="Bilinmiyor", company="Bilinmiyor")
      #Gelen her teklif kaydında bulunana tedarikçi id sindeki id ile User tablosunda ki id leri eşlesen yani kısaca teklifi veren kullanıcıyı user tablosundan bulup ad,role ve şirket bilgilerini user_info nesnemizde tutuyoruz.
        result.append(BidOut(
            id=bid.id,
            auction_id=bid.auction_id,
            supplier_id=bid.supplier_id,
            amount=bid.amount,
            timestamp=bid.timestamp,
            user_info=user_info
        )) 
   #boş dizimiz olan result u BidOut nesnelerini oluşturup dolduruyoruz ve son olarak dizimizi geriye döndürüyoruz. dizimiz teklif bilgilerini ve teklifi veren kullanıcının isim role ve sirket bilgisini içeren nesneleri tutuyor. 
    return result
