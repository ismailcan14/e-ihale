#ana programın ayarlarının olduğu bölüm.Projenin başladığı dosya.

from fastapi import FastAPI
#Bu satır, FastAPI framework’ünden FastAPI sınıfını projene dahil eder.
  
from .database import Base, engine
#Bu satır, kendi projenin içindeki database.py dosyasından iki önemli değişkeni import eder.

from . import models
#Bu satır, kendi projenin modelsinde bulunan tabloları bu sayfaya tanıtır.

app = FastAPI()
#Uygulamayı başlatır ve FastAPI classından app adında bir nesne oluşturur. Bundan sonra app.get() app.post() gibi tüm rotaları bu nesne üzerinden oluştururuz.

Base.metadata.create_all(bind=engine)
#SqlAlchemy ye diyor ki : Base'ten türetilmiş tüm sınıflara bak, ve bunların veritabanındaki tablolarını oluştur.
#Base : tüm model sınıflarının(user, role..) türediği temel sınıftır
#bind=engine: Hangi veritabanına bağlantı kuracağını belirtir (engine, veritabanı bağlantısı).

@app.get("/")
def read_root():
    return {"message": "E-ihale API çalışıyor!"}
#Ana sayfaya (/) GET isteği geldiğinde çalışacak olan fonksiyonu tanımlar.
