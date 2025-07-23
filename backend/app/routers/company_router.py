from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.company import Company
from app.models.user import User
from app.schemas.company_schema import CompanyCreate,CompanyOut
from app.utils import hash_password
from app.models.role import Role
from fastapi import HTTPException, status



router=APIRouter(
    prefix="/companies", #prefix özelliği ile bu routerdaki tüm endpointlerin url lerinin başına companies/ ekler.
    tags=["Companies"]   #tags ise swaggerdaki endpointlerin bu başlıklar altında gruplanmasını sağlar. eğer tags kullanmazsak tüm endpointler alt alta sıralanır ve düzenli olmaz.
)

def get_db(): #Bu fonksiyon fastapi uygulamalarında en çok kullanılan fonksiyonlardan biridir. veritabanı bağlantısını yönetmek amacıyla kullanılan bir bağımlılık(dependency) fonksiyonudur.
    db=SessionLocal()
    #database.py adlı sayfamızda sessionLocal adında veritabanı bağlantısını içeren bir oturum oluşturuyoruz. Buradada db adlı nesnemiz ile bu session ı fonksiyonumuzda kullanıyoruz.
    try:
        yield db #hangi endpointte çağırıldıysa yield db ile o endpointe db nesnesi gönderilir. içinde veritabanı bağlantısı vardır.
    finally:
        db.close() #endpoint işini bitirince bu fonksiyonun finally: kısmı çalışır ve db.close() ile veritabanı bağlantısını kapatır.


#Şirket Ekleme
@router.post("/", response_model=CompanyOut)
def create_company(company_data: CompanyCreate, db: Session = Depends(get_db)):
    #Burada frontendden gelen api isteğindeki json türündeki veriler CompanyCreate schemasındaki alanlar ile eşleştirilir. Türler kontrol edilir ve eksik bir alan var mı bakılır. Eğer hepsi geçerliyse company_data adında bir nesne oluşturulur.

    # Şirket adı kontrolü
    if db.query(Company).filter(Company.name == company_data.company_name).first():
        raise HTTPException(status_code=400, detail="Bu isimde bir şirket zaten var")
    #Burada SQLAlchemy ile Company adlı tabloda kontrol yapılacak. Eğer Company.name yani company tablosundaki şirket adlarından  bizim formdan gelen ve şimdi company_data da bulunan şirket bilgilerinden şirket adı uyuşan yani aynı olan varsa geriye ilk kaydı döndür.

    # Şirketi oluştur
    company = Company(name=company_data.company_name,type=company_data.type )
    db.add(company)
    db.commit()
    db.refresh(company)
    #company adında bir değişken oluşturuyoruz ve Company tablosuna name ve type i dolduruyor ardından veritabanına company değişkenini ekleyip commitliyoruz. yani veritabanına kalıcı olarak yazıyoruz. 
    # Ardından db.refresh(company) ile company adlı değişkeni Company tablosundaki tüm değerleri getirtiyoruz. bu ne için önemli çünkü aşağıda admin_user ile user tablosuna kayıt yapıcaz ve bunun için Company tablosunda bulunan ve kayıt esnasında otomatik olarak oluşturulan company_id gibi değerler bize user kaydında lazım. refresh ile bu degerlerde artık company değişkenimizde. company değişkenindeki değerleri de kullanop aşağıda user kaydımızı da oluşturuyoruz ve db.add(admin_user) ile user kaydımızı da yapıyoruz.

    # Rol 1: Admin olarak kabul edilir
    admin_user = User(
        name=company_data.admin_name,
        email=company_data.admin_email,
        password=hash_password(company_data.admin_password),
        #hash_password fonksiyonu utils.py adlı dosyanın içinde tanımlanmış ve bycrpt ile hasleme işlemini yapıyor. parametre ile biz kendi sifremizi yolluyoruz ve hash_password fonksiyonu geriye hashlenmiş sifreyi bize döndürüyor.
        company_id=company.id,
        role_id=1  # 1 = Admin
    )

    db.add(admin_user)
    db.commit()

    return company