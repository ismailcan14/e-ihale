# app/scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import SessionLocal
from app.models.auction import Auction
from app.models.bid import Bid
from app.models.auction import Auction, AuctionStatus


scheduler = BackgroundScheduler()

def activate_auctions():
    db: Session = SessionLocal()
    now = datetime.utcnow()
    auctions = db.query(Auction).filter(
        Auction.start_time <= now,
        Auction.status == AuctionStatus.PENDING
    ).all()

    for auction in auctions:
        auction.status = AuctionStatus.ACTIVE

    db.commit()
    db.close()
    #Aktif etme kısmı oldukça basit çalışıyor db nesnesi ile veritabanı bağlantısını açıyoruz ve şimdiki zamanı utc formatında alıyoruz. now değişkeninde tutuluyor bu zaman. sonrasında bir sorgu yazıyoruz Auction tablosunda start_time değeri şimdiki zamandan küçükse ve active lik durumu false ise o kaydı veya kayıtları alıp auctions adlı nesne de tutuyoruz.
    #  Sonrasında ne kadar dönen kayıt varsa onları for döngüsüne sokup hepsinin auctions.is_active değerlerini aktif ediyoruz ve veritabanımıza yollayıp bağlantıyı kapatıyoruz.

def deactivate_auctions_and_select_winner():
    db: Session = SessionLocal()
    now = datetime.utcnow()

    auctions = db.query(Auction).filter(
        Auction.end_time <= now,
        Auction.status == AuctionStatus.ACTIVE
    ).all()

    for auction in auctions:
        auction.status = AuctionStatus.FINISHED

        if auction.auction_type == "highest":
            winning_bid = db.query(Bid).filter(
                Bid.auction_id == auction.id
            ).order_by(Bid.amount.desc()).first()

        elif auction.auction_type == "lowest":
            winning_bid = db.query(Bid).filter(
                Bid.auction_id == auction.id
            ).order_by(Bid.amount.asc()).first()
        else:
            winning_bid = None

        if winning_bid:
            auction.winner_id = winning_bid.supplier.id

    db.commit()
    db.close()

    #Burada da mantık aynı sadece farklı olarak ihaleyi kazananıda buradan seçiyoruz. ilk olarak yine sorgu ile süresi bitmiş ihaleyi veya ihaleleri bulup onları for döngüsüne sokuyoruz döngüde ise ilk olarak aktiflikleri false hale getiriyor ve ihalenin türüne göre açık arttırma mı yoksa standart ihalem i belirliyoruz eğer açık arttırma ise o ihaleye gelen en yüksek teklifi kazanan olarak belirliyor eğer standart ihale ise en düşük teklifi kazanan olarak belirliyoruz sonrasında o ihalenin kaydındaki winner_id ye hangi kullanıcı o teklifi vermiş ise onun id sini yazıyoruz ve veritabanına kaydı commitleyip veritabanı bağlantısını kapatıyoruz.

def start():
    scheduler.add_job(activate_auctions, "interval", seconds=30)
    scheduler.add_job(deactivate_auctions_and_select_winner, "interval", seconds=30)
    scheduler.start()
    #scheduler fonksiyonları için kaç saniyede bir kontrol yapacak bu ayarlamaları yapıp start() ile scheduler (zamanlayıcı) ı başlatıyoruz.
