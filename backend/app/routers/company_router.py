from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.company import Company
from app.models.user import User
from app.schemas.company_schema import CompanyCreate,CompanyOut
from app.utils import hash_password
from app.models.role import Role
from fastapi import HTTPException, status
from app.routers.user_router import get_current_user



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

    #user email kontrolü
    existing_user = db.query(User).filter(User.email == company_data.admin_email).first()
    if existing_user:
     raise HTTPException(status_code=400, detail="Bu emailde bir şirket zaten var")

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

#id ye göre şirket bilgisi
@router.get("/{company_id}", response_model=CompanyOut)
#companies/3 gibi isteklerin tanımıdır. response_model ise schema da oluşturdugumuz companyOut sınıfına göre verilerin geri döneceğini açıklar.
def get_company(
    company_id: int, #1. parametre olarak bir id alır türü int dır.

    db: Session = Depends(get_db), #2. parametre db adlı bir Session(oturum) nesnesidir. burada get_db fonksiyonunu çağırırken Depends i kullanırız. Çünkü get_db normal bir fonksiyon değil bir generator fonksiyon. Yani biz direkt db:session =get_db() dersek get_db de bir return yok geriye bir değer döndüremez. Ama Depends ile çağırınca yield e kadar gelir ve db yi döndürür. Fonksiyonun sonuna gelince ise finally çalışır ve veritabanı kapatılır.

    current_user: User = Depends(get_current_user) #3. parametre olarak current_user adlı ve User sınıfı türünde bir nesnedir. Depends(get_current_user) fonksiyonu çağırır. get_current_user Fonksiyonu user_router da tanımlanan ve tokende bulunan kullanıcı bilgilerini çözümleyip bize çözümlenen  user_id user_name gibi verileri user adlı nesne de geri döndüren bir fonksiyondur.
    # Peki neden yine depends() kullandık ? Çünkü get_current_user() fonksiyonu token gibi veritabanı session gibi parametreler alıyor ancak depends kullanınca bu parametreleri vermeden direkt fonksiyonu çağırabiliyoruz. FastApi tüm bu işleri bizim için kendi yapıyor.
):
    # Şirket var mı?
    company = db.query(Company).filter(Company.id == company_id).first() 
    #Company modelinde bir sorgu hazırlanır. bu sorgu aslında şudur : select * from company where id = company_id bu sorgudan çıkan ilk kaydı bize geri döndürür ve company adlı nesneye atılır.
    if not company: #eğer şirket yoksa
        raise HTTPException(status_code=404, detail="Şirket bulunamadı")
    #şirket yoksa python da hata fırlatmak için kullanılan anahtar kelime "RAİSE" ile 404(Not Found-Şirket Bulunamadı) hatası yollanır.
    
    # Kullanıcı sadece kendi şirket bilgilerine ulaşabilir
    if current_user.company_id != company_id:
        raise HTTPException(status_code=403, detail="Bu şirkete erişme yetkiniz yok")
    #Şirket var ancak tokenda bulunan userın şirket id si ile bulunan kayıttaki şirketin idsi eşleşmediği için erişim izni vermiyoruz.
    return company # her şey tamam ise şirketin verileri geri döndürülüyor.
