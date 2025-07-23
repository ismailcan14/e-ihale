#ana programın ayarlarının olduğu bölüm.Projenin başladığı dosya.

from fastapi import FastAPI
#Bu satır, FastAPI framework’ünden FastAPI sınıfını projene dahil eder.
  
from .database import Base, engine
# projenin içindeki database.py dosyasından base ve engine adlı 2 değişkeni import eder.

from . import models
#kendi projenin modelinde bulunan tabloları bu sayfaya tanıtır.

from .routers import company_router,user_router
#company routerını main sayfamıza tantıyıoruz.

app = FastAPI()
#Uygulamayı başlatır ve FastAPI classından app adında bir nesne oluşturur. Bundan sonra app.get() app.post() gibi tüm rotaları bu nesne üzerinden oluştururuz.

###
app.include_router(company_router.router)
app.include_router(user_router.router)


Base.metadata.create_all(bind=engine)
#SqlAlchemy ye diyor ki : Base'ten türetilmiş tüm sınıflara bak, ve bunların veritabanındaki tablolarını oluştur.
#Base : tüm model sınıflarının(user, role..) türediği temel sınıftır
#bind=engine: Hangi veritabanına bağlantı kuracağını belirtir (engine, veritabanı bağlantısı).

@app.get("/")
def read_root():
    return {"message": "E-ihale API çalışıyor!"}
#Ana sayfaya (/) GET isteği geldiğinde çalışacak olan fonksiyonu tanımlar.
