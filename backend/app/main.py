#ana programın ayarlarının olduğu bölüm.Projenin başladığı dosya.

from fastapi import FastAPI

from .database import Base, engine
# projenin içindeki database.py dosyasından base ve engine adlı 2 değişkeni import eder.

from . import models
#kendi projenin modelinde bulunan tabloları bu sayfaya tanıtır.

from .routers import (
    company_router,
    user_router,
    product_router,
    auction_router,
    bid_router,
    websocket_router,
    report_router,
    conversation_router,
)
# ⬇️ DOSYA ADINA GÖRE DOĞRU IMPORT (conversation_ws_router.py)
from app.routers import conversation_ws_router
from fastapi.middleware.cors import CORSMiddleware
#Cors ayarları için gerekli kütüphaneyi import ediyoruz

from app.scheduler import start as start_scheduler
#APScheduler in dosyasını main.py ye dahil ediyoruz.

app = FastAPI()
#Uygulamayı başlatır ve FastAPI classından app adında bir nesne oluşturur. Bundan sonra app.get() app.post() gibi tüm rotaları bu nesne üzerinden oluştururuz.

###
# HTTP Routers
app.include_router(company_router.router)
app.include_router(user_router.router)
app.include_router(product_router.router)
app.include_router(auction_router.router)
app.include_router(bid_router.router)
app.include_router(websocket_router.router)
app.include_router(report_router.router)
app.include_router(conversation_router.router)

# WS Router (APIRouter değişkeni 'ws_router' olmalı)
app.include_router(conversation_ws_router.ws_router)


Base.metadata.create_all(bind=engine)
#SqlAlchemy ye diyor ki : Base'ten türetilmiş tüm sınıflara bak, ve bunların veritabanındaki tablolarını oluştur.
#Base : tüm model sınıflarının(user, role..) türediği temel sınıftır
#bind=engine: Hangi veritabanına bağlantı kuracağını belirtir (engine, veritabanı bağlantısı).

# CORS ayarları
app.add_middleware(
    CORSMiddleware,  # type: ignore
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
) #Frontend den her giriş yaptığımda sunucuya bağlanamadı hatası alıyordum. Cors ayarlarını yaptıktan sonra bu sorun çözüldü.

@app.get("/")
def read_root():
    return {"message": "E-ihale API çalışıyor!"}
#Ana sayfaya (/) GET isteği geldiğinde çalışacak olan fonksiyonu tanımlar.

start_scheduler() #scheduleri baslatıyoruz
