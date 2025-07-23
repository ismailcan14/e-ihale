from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.user_schema import UserCreate, UserOut
from app.database import SessionLocal
from app.models.user import User
from app.utils import hash_password


router = APIRouter(
    prefix="/users", #bu routerdaki tüm endpointlerin urllerinin başına users eklenir.
    tags=["Users"] #Swagger da bu routerdaki veriler Users başlığı altında toplanır.
)

def get_db(): #Detaylı anlatım company_routerda
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 

#kullanıcı kayit
@router.post("/", response_model=UserOut) #Burada bulunan response_model, gelen istek başarıyla gerçekleştiğinde dönen cevvabın yapısını ifade eder.
def create_user(user: UserCreate, db: Session = Depends(get_db)): # kullanıcı kayıt fonksiyonumuzu yazıyoruz. bu fonksiyonumuz 2 adet parametre alıyor birincisi user nesnesi userCreate(schemada oluşturduğumuz) türünde ve ileride frontendden şimdi ise swaggerdan yolladığımız verilerin fonksiyon içinde doldurulduğu parametre. Yani frontda formda verileri doldurduğumuzda ve bu apiye istek attığımızda veriler UserCreate modeline göre gelmeli ve isimleri uyuşmalı.!!!

    existing_user = db.query(User).filter(User.email == user.email).first() # veritabanına bir sorgu atıyoruz. bu sorgu formdan gelen email veritabanında var mı ? varsa ilk kaydı döndür demek ve cevap existing_user adlı değişkende tutuluyor.
    if existing_user:
        raise HTTPException(status_code=400, detail="Email zaten kayıtlı") # burada bir if kontrolü var eğer existing_user true ise raise ile kullanıcıya bir mesaj yolluyoruz. email zaten var diye. yoksa aşağıdaki adımlar gerçekleşiyor.

    new_user = User(
        name=user.name,
        email=user.email,
        password=hash_password(user.password),
        company_id=user.company_id,
        role_id=user.role_id
    ) #Burada new_user adında bir nesne oluşturuyoruz User modelimiz türünde. Bu modele göre gerekli değişkenleri formdan gelen ve user adlı değişkende tutulan veriler ile dolduruyoruz.

    db.add(new_user) #new_user adlı değişkeni veritabanına ekleyeceğimizi sqlAlchemye bildiriyoruz.
    db.commit() #add fonksiyonu ile bildirdiğimiz verileri gerçek anlamda veritabanına gönderiyoruz.
    db.refresh(new_user) #ardından id gibi created_at gibi kayıt esnasında eklenen veriler olabilir onlar new_user modelinde yok onları da bu modele ekleyiyoruz yani modeli güncelliyoruz.
    return new_user #modelin son halini geriye döndürüyoruz.

#kullancilari getirme
@router.get("/", response_model=list[UserOut]) #gelecek kayıtların nasıl geceleğini response_model ile seçiyoruz. yani gelen kayıtta hangi veriler gözükecek bunu belirliyoruz. Bunlar UserOut classında verilen değişkenlerin şeklinde gelecekler. ve gelen veriler liste türünde olacak çünkü bir çok kayıt(satır) gelebilir.
def get_users(db: Session = Depends(get_db)): #get_users fonksiyonumuzda ise 1 adet parametre var bu da db. db adlı parametre session veri türünde olacak ve depends sayesinde get_db bağımlılık fonksiyonunu çağırıyoruz. depends kullandık çünkü get_db çağırıldığıında geriye db nesnesini (oturum nesnesi) döndürüyor ve bu fonksiyon tamamlandığında finally: çalışıp veritabanı bağlantısını (oturumunu) kapatıyor.
    return db.query(User).all() #User tablosundaki tüm kayıtları(satırları) getirir. ve UserOut da bulunan alanları doldurup sadece o alanları her kullanıcıya göre liste şeklinde geri döndürür.

