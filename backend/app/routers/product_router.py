from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.product import Product
from app.schemas.product_schema import ProductOut,ProductCreate

router = APIRouter(
    prefix="/products",
    tags=["Products"]
)

def get_db():
    db=SessionLocal()
    try:
        yield db
    finally:db.close()

#Ürün oluşturma
@router.post("/",response_model=ProductOut) #docs/products yoluna gelen post isteğinde bu fonksiyon çalışır. responseModel ile istek sonrası geri dönen kaydın hangi verileri(satırları) içecereceğini productOut classıyla belirliyoruz.
def create_product(product:ProductCreate,db:Session=Depends(get_db)):
    #2 adet parametre alıyor birincisi product ve ProductCreate türünde formdan gelen verileri bu şablona doldurucağız. db ile de veritabanı bağlantısın açıyoruz.
    new_product = Product(**product.model_dump())  
 #product bir pydantic sözlüğüdür yani bir ProductCreate dir. product.dict() i model_dump() ile değiştirdik ikiside aynı işlevi görüyor ancak pydantic v1 de dict() kullanılırken pydantic v2 de model_dump() kullanılır işlevi ise product nesnesini bir  python sözlüğüne çevirir. python sözlüğü, anahtar ve değer çiftlerinden oluşan bir veri tipidir. Json formatına çok benziyor.
    # ** ile de product.dict te bulunan değerleri Product modeline aktarırız. Aynı biçimde olan anahtarlara karşılıkları yazılır. bunu da new_product adlı Product nesnesi üzerinde tutarız. (Constructorlı bir sınıfa nesne oluşturur gibi.)
    db.add(new_product) #bu nesneyi veritabanına eklemek üzere hazır hale getirir 
    db.commit() #commit ile veritabanına gerçek olarak kaydı ekleriz
    db.refresh(new_product) #kaydı ekledikten sonra gelen id, created_at gibi değişkenleri new_product nesnemize aktarırız yani güncelleriz 
    return new_product  #Geriye nesnenin son halini döndürürüz.
@router.get("/",response_model=list[ProductOut])
def get_products(db:Session=Depends(get_db)):
    return db.query(Product).all() #Depends ile get_db fonksiyonunu db parametresine enjekte edip Product tablosundan gelen verileri ProductOut a göre kullanıcıya gösteririz. gelen verilerin tamamını geriye döndürürüz.
    

