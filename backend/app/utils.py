import bcrypt
from datetime import datetime, timedelta
from jose import jwt



SECRET_KEY = "secretkey_123"  # Gerçek projede env içine al!
ALGORITHM = "HS256"

# Şifre hash'le
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# Şifre karşılaştır
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

# JWT token oluşturma
def create_access_token(data: dict, expires_minutes: int = 30):
    #Token oluşturma fonksiyonumuz 2 adet parametre alır. Bunlardan biri data token içine gömülecek kullanıcı bilgilerinin tutulduğu değişken ve expires_minutes da bu tokenin kaç dakika saklanacağıdır.
    to_encode = data.copy() #to_encode adlı değişkene gelen verileri bozmamak için kopyasını aktarıyoruz.
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes) #expire değişkeni gerçek zamanda tokenın ne zaman sona erdireleceğini tutar. şuan ki zaman + 30 dakika
    to_encode.update({"exp": expire}) #token içinde gömülü bilgilere ek olarak ne zaman sona ereceğini de ekleriz.
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
#jwt.encode ile tokeni oluştururuz. ilk parametre olan to_encode ile kullanıcı bilgileri ve tokenın bitis süresini, ikinci parametre Secret_Key ile gizli anahtarı, algorithm ile de şifreleme algoritmasını kullanırız. Geriye eyJhbGciOiJIUzI1NiIsInR5cCI... şeklinde bir token döndürülür.


