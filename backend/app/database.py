from sqlalchemy import create_engine
#sqlalchemy kütüphanesinden create_engine fonksiyonunu kullanmamızı sağlar.
from sqlalchemy.ext.declarative import declarative_base
#SQLAlchemy'de modellerin (tabloların) temel sınıfını oluşturmak için kullanılır.
#declarative_base() fonksiyonu sayesinde, modelleri class User(Base): gibi yazabilirsin.
#Bu Base, tüm modellerin (tabloların) ortak atasıdır.

from sqlalchemy.orm import sessionmaker
#veritabanında ekleme silme gibi işlemleri yapabilmek için session nesnesi gerekir. bunun için dahil ediyoruz.


DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "eihale"
DB_USER = "postgres"
DB_PASS = "very2002"
# Veritabanına bağlanmak için gerekli değişkenleri oluşturuyoruz.


SQLALCHEMY_DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
# db connection linkini bu şekilde oluşturuyoruz. Sqlalchemy ye özel bir link. bu linki veritabanı bağlantısında kullanırız.


engine = create_engine(SQLALCHEMY_DATABASE_URL)
#veritabanına bağlanmak için motor oluşturulur ve parametre içerisine bağlantı linki verilir. Engine tüm DB işlemlerini bu bağlantı üzerinden yapar.

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
#local sessionımızı sessionmaker ile oluşturuyoruz.


Base = declarative_base()
# tüm tablo sınıflarının kalıtım alacağı temel sınıfı tanımlar. burada Base i tanımlıyoruz ve models klasörü içindeki model sınıflarında tablo oluştururken kullanıyoruz. Eğer kullanmazsak SqlAlchemy oluşturdugumuz model sınıfları tanımaz.
