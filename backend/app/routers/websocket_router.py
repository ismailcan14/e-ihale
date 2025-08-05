from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
from jose import jwt, JWTError
from app.utils import ALGORITHM, SECRET_KEY
from app.database import SessionLocal
from app.models.user import User

router = APIRouter(
    prefix="/auctions",
    tags=["Auctions"]
)

# Aktif WebSocket bağlantılarını tutan sözlük
active_connections: Dict[int, List[WebSocket]] = {}
#  burada bir sözlük tanımlıyoruz ve ilk parametresi int bir değer diğeri ise bir liste ve WebSocket türünde. bu sözlükte de biz projemizde int yerine auctions_id yi veriyoruz. yani her auctions_id nin değer olarak webSocket bağlantıları olan bir liste bulunuyor. örnek olarak [4,{bağlantı1,bağlantı2,bağlantı3}] gibi. bu bağlantılar ise kullanıcılar. bir kullanıcı detay sayfasına girdiği sırada  bağlantı halinde listeye kaydoluyor. bu sözlük ise ram de tutuluyor.

@router.websocket("/ws/{auction_id}")
async def websocket_endpoint(websocket: WebSocket, auction_id: int):
    #fonksiyonumuz websocket nesnesi ve auctin_id int türünde 2 adet parametre alıyor.
    db = SessionLocal()
    email = None  
    try:
        
        token = websocket.query_params.get("token")
        if not token:
            await websocket.close(code=1008)
            return
        #Token bilgisini url den alıyoruz
        
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            email = payload.get("sub")
            if not email:
                await websocket.close(code=1008)
                return
        except JWTError as e:
            await websocket.close(code=1008)
            return
        # Tokeni jwt.decode ile çzümleyip içerisindeki email bilgisini email adlı değişkenimize gönderiyoruz.

       
        user = db.query(User).filter(User.email == email).first()
        if not user:
            await websocket.close(code=1008)
            return
         #Tokendan çıkan email ile kayıtlı bir kullanıcı var mı diye kontrol ediyoruz varsa user adlı değişkene atıyoruz. Yani şuan giriş yapan ve token sahibi kullanıcının user bilgileri elimizde.

        
        await websocket.accept()
        #WebSocket bağlantısını kabul ediyoruz  

        # 5️⃣ Bağlantıyı kayıt et
        if auction_id not in active_connections:
            active_connections[auction_id] = []
        active_connections[auction_id].append(websocket)
        #Eğer bu aucitons_id için daha önce bir bağlantı yapılmamışsa yani active_conntections sözlüğümüzde auctions_id mize ait bir liste yoksa auction_id için boş bir liste oluşturuyoruz. ve  active_connections[auction_id].append(websocket) satırı ile parametre olarak gelen websocket nesnemizi bu ihaleye canlı olarak bağlıyoruz.

       
        while True:
            await websocket.receive_text() #Dinleme döngüsü(bağlantıya bir şey eklenirse otomatik olarak fark edebilmek için)

    except WebSocketDisconnect:
        if auction_id in active_connections and websocket in active_connections[auction_id]:
            active_connections[auction_id].remove(websocket)
            #internet giderse veya tarayıcıyı kapatırsa hata mesajı fırlatılır. ve ilgili auction_id den çıkarılr.

    finally:
        db.close() #veritabanı bağlantısını kapatıyoruz.
