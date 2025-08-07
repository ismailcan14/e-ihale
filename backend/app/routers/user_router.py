from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.schemas.user_schema import UserCreate, UserDetailOut, UserOut, UserRegisterCreate, UserUpdate
from app.database import SessionLocal
from app.models.user import User
from app.utils import ALGORITHM, SECRET_KEY, create_access_token, hash_password, verify_password
from jose import JWTError, jwt
from sqlalchemy.orm import joinedload



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
@router.post("/register", response_model=UserOut) #Burada bulunan response_model, gelen istek başarıyla gerçekleştiğinde dönen cevvabın yapısını ifade eder.
def create_user(user: UserRegisterCreate, db: Session = Depends(get_db)): # kullanıcı kayıt fonksiyonumuzu yazıyoruz. bu fonksiyonumuz 2 adet parametre alıyor birincisi user nesnesi userCreate(schemada oluşturduğumuz) türünde ve ileride frontendden şimdi ise swaggerdan yolladığımız verilerin fonksiyon içinde doldurulduğu parametre. Yani frontda formda verileri doldurduğumuzda ve bu apiye istek attığımızda veriler UserCreate modeline göre gelmeli ve isimleri uyuşmalı.!!!

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


#KULLANICI GETİRME
@router.get("/", response_model=list[UserOut]) #gelecek kayıtların nasıl geceleğini response_model ile seçiyoruz. yani gelen kayıtta hangi veriler gözükecek bunu belirliyoruz. Bunlar UserOut classında verilen değişkenlerin şeklinde gelecekler. ve gelen veriler liste türünde olacak çünkü bir çok kayıt(satır) gelebilir.
def get_users(db: Session = Depends(get_db)): #get_users fonksiyonumuzda ise 1 adet parametre var bu da db. db adlı parametre session veri türünde olacak ve depends sayesinde get_db bağımlılık fonksiyonunu çağırıyoruz. depends kullandık çünkü get_db çağırıldığıında geriye db nesnesini (oturum nesnesi) döndürüyor ve bu fonksiyon tamamlandığında finally: çalışıp veritabanı bağlantısını (oturumunu) kapatıyor.
    return db.query(User).all() #User tablosundaki tüm kayıtları(satırları) getirir. ve UserOut da bulunan alanları doldurup sadece o alanları her kullanıcıya göre liste şeklinde geri döndürür.


#Login(Giriş) işlemleri
@router.post("/login") #users/login yoluna gelen her istekte bu router fonksiyonu çalışır.
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    #login adlı bu fonksiyonda form_data bir değişkendir ve OAuth2PasswordRequestForm tipinde olduğunu belirtiriz. depends() ise FastApi ye bu bileşeni otomatik olarak enjekte etmesini söyler. 
    #db: Session = Depends(get_db) burada ise db adlı ikinci parametre oluşturulur tipi SqlAlchemy session dır. ve depends(get_db) ile get_db fonksiyonunu çalıştır ve db adlı nesneye at demektir. Yani her istek için veritabanını açar ve istek bitince veritabanını kapatır.
    user = db.query(User).filter(User.email == form_data.username).first()
    #user adlı bir değişken oluşturuluyor ve bir veritabanı sorgusu oluşturuluyor. Bu sorgu select*from User where email==form_data.username bu sorgudan dönen ilk kaydı user adlı değişkene atıyoruz.

    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=401, detail="Geçersiz e-posta veya şifre")
    #Eğer user değişkeni boş ise veya form_data.password ile user değişkenindeki password uyuşmuyorsa kod if in içine giriyor ve hata mesajı veriliyor.

    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}
    # Kod ifin içine girmezse acces_token adlı bir değişken oluşturulup create_access_token adlı fonksiyon ile kullanıcının mail ine göre bir token oluşturuluyor ve bu token tipi ile beraber geri döndürülüyor.
     
    #şifre karşılaştırma ve token oluşturma fonksiyonları utils.py adlı dosyada!


#TOKEN DOĞRULAMA
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="users/login") #Kullanıcı users/login endpointine bir istek attığında bu isteğin içinde bir token varsa OAuth2PasswordBearer sınıfı ile o tokenı çıkarır oauth2_scheme adlı değişkene atarız.

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)): #gelen istekten tokeni çıkarıp oauth2_scheme ye atmıştık onu da token adlı parametreye yolluyoruz. db ile veritabanı bağlantısını açıyoruz.
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token geçersiz",
        headers={"WWW-Authenticate": "Bearer"},
    ) #token da bir hata olursa çıkacak hata mesajı!

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM]) #gelen token ı çözer. 2. parametre belirlediğimiz sifredir.
        email: str = payload.get("sub") # email adlı değişkene token da bulunan sub bilgisini atar. biz tokenda sub bilgisi olarak zaten email i saklıyoruz.
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception # email bossa veya token da bir hata olursa hata mesajı döndürür.

    user = db.query(User).filter(User.email == email).first() # veritabanına bir sorgu atar . bu sorguda tokenda gelen email bilgisine sahip kullanıcı geri döndürülür.
    if user is None:
        raise credentials_exception # gelen kullanıcı yoksa veya kayıtlar bossa hata mesajı dondurulur

    return user # kullanıcı geri döndürülür.

#Giriş yapan kullanıcıyı döndüren endpoint
@router.get("/me", response_model=UserDetailOut)
def read_current_user(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # joinedload ile role ilişkisini getir
    user = db.query(User).options(joinedload(User.role)).filter(User.id == current_user.id).first()
    return user

#KULLANICI EKLEME
@router.post("/add-user", response_model=UserOut) #dönüş değeri olarak UserOut şablonu örnek alınacak. yani UserOut da hangi değerler varsa sadece o değerler döndürülecek.
def add_user(
    user: UserCreate, #Frontendden gelen form verisini temsil eder. UserCreate sınıfı ile form verileri uyuşmalıdır..
    db: Session = Depends(get_db), #Depend fonksiyonu ile get_db çağırılır ve veritabanı bağlantısı fonksiyon çalışana kadar açık kalır.
    current_user: User = Depends(get_current_user) #Depend fonksiyonu ile get_current_user fonksiyonunu çağırıyoruz get_current_user fonksiyonu bize giriş yapan kullanıcının tokenını doğruluyor ve giriş yapan kullanıcının bilgilerini bize ulaştırıyor. Bu sayede role, şirket id si gibi bilgilere ulaşabiliyoruz.
): 

    if current_user.role.name != "admin":
        raise HTTPException(status_code=403, detail="Sadece admin kullanıcılar kullanıcı ekleyebilir") 
    #Gelen role bilgisi admin değil ise hata mesajı döndürme

    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email zaten kayıtlı")
    #kayıtta kullanılan email zaten varsa hata mesajı döndürme

    new_user = User(
        name=user.name,
        email=user.email,
        password=hash_password(user.password),
        role_id=user.role_id,
        company_id=current_user.company_id 
    ) 
    #Bir User nesnesi oluşturup formdan gelen verileri bu nesneye doldurma

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    #veritabanına eklemeye hazır hale gitirip commit ile gerçek olarak ekleme ve refresh ile get_time id gibi sonradan gelen verileri new_user nesnemize atıp bu nesneyi geri döndürüyoruz.

    return new_user

#Şirkete Ait Kullanıcıları Getiren Endpoint
@router.get("/by-company", response_model=list[UserDetailOut])
def get_users_by_company(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    users = (
        db.query(User)
        .options(joinedload(User.role))
        .filter(User.company_id == current_user.company_id)
        .all()
    )
    #User tablosundaki company id ile giriş yapan kullanıcının company id si ile eşleşen tüm kayıtları getir.
    return users


#Id ye Göre Kullanıcıyı Getiren Endpoint
@router.get("/{user_id}", response_model=UserDetailOut)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user = (
        db.query(User)
        .options(joinedload(User.role))
        #ms sqlden bildiğimiz inner join mantığı ile çalışıyor. ilişkili tablolarda beraber kayıt getirmek için kullanıyoruz.
        #sql sorugusu ile yazdıgımızda : select*from User join Role on Users.role_id=roles_id where users.id=(parametreden gelen id)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")

    if user.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Bu kullanıcıya erişim izniniz yok")

    return user


#User Güncelleme (Put) Endpointi
@router.put("/{user_id}", response_model=UserDetailOut)
def update_user(
    user_id: int,
    updated_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    #fonksiyon parametre olarak id, güncel user kaydının bulundugu nesne, veritabanı baglantısı ıcn db nesnesi ve giriş yapan kullanıcının bilgilerini tutan nesneyi alıyor.
    user_to_update = (
        db.query(User)
        .options(joinedload(User.role))
        .filter(User.id == user_id)
        .first()
    )
#Güncellenecek kaydı role bilgisi ile beraber veritabanından çekiyoruz

    if not user_to_update:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")

    if current_user.role.name == "admin":
        pass
    elif current_user.role.name == "müdür":
        if user_to_update.role.name == "admin":
            raise HTTPException(status_code=403, detail="Müdür admini güncelleyemez")
    elif current_user.role.name == "personel":
        if current_user.id != user_to_update.id:
            raise HTTPException(status_code=403, detail="Sadece kendi bilgilerinizi güncelleyebilirsiniz")
    else:
        raise HTTPException(status_code=403, detail="Yetkisiz erişim") 
    #Yetki Kontrolleri ! Bunu suan kullanmıyorum frontda yetki kontrolünü sağlıyorum ileride belki aktif ederim***

    update_data = updated_data.dict(exclude_unset=True)
    #update_data adlı nesnemizde formdan gelen güncel değerlerin bulunduğu kayıt bulunuyordu. bunu dict ile python sözlüğüne çeviriyoruz ve exclude_unset=true ile nesne de doldurulmayan alanları yok gibi sayıyoruz. örnek olarak kullanıcı adı güncelledi ancak formda email kısmı boş nesnemizde o alanı yokmuş gibi sayıoruz.

    if "password" in update_data and update_data["password"]:
        update_data["password"] = hash_password(update_data["password"])
        #password alanı nesnede var mı ve varsa dolu mu ? diye kontrol edip if in içerisine girerse nesnedeki password alanını hashliyoruz. 
    elif "password" in update_data:
        update_data.pop("password")  
        #password alanı varsa ancak boş ise update_data nesnesinden pop ile çıkartıyoruz.
        
    for key, value in update_data.items():
        setattr(user_to_update, key, value)

    db.commit()
    db.refresh(user_to_update)
    #Gelen her alan için veritabanı nesnesinin ilgili alanları güncellenir. ve veritabanına yazdırılır. ardından refresh ile kaydın son hali geri döndürülür.

    return user_to_update