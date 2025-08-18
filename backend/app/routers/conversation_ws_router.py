# app/routers/conversation_ws.py
from __future__ import annotations
import json
import traceback
from typing import Any, List

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.realtime.manager import manager
from app.models.user import User
from app.models.conversation import (
    Conversation,
    ConversationParticipant,
    Message,
    MessageType,
)
from app.utils import SECRET_KEY, ALGORITHM  # projendeki sabitler

ws_router = APIRouter()

# ---- Yardımcılar ----
def _get_user_from_token(db: Session, token: str) -> User | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            return None
        return db.query(User).filter(User.email == email).first()
    except JWTError as e:
        print("[WS] JWT decode error:", e)
        return None
    #Tokeni çözme işlemi

def _get_participant(db: Session, conversation_id: int, user_id: int) -> ConversationParticipant | None:
    return (
        db.query(ConversationParticipant)
        .filter(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == user_id,
        )
        .first()
    ) #Katılımcılar tablosundaki kayıtlardan parametrede gelen konuşma id si ve kullanıcı id si ile eşleşen katılımcıyı geriye döndürür.


                                    # *** ANA ENDPOİNT ***

@ws_router.websocket("/ws/conversations/{conversation_id}")
async def conversation_ws(websocket: WebSocket, conversation_id: int, token: str = Query(None)): 
    #parametre olarak bir websocket nesnesi bir conversation_id ve token alır.
    db: Session = SessionLocal() #veritabanı bağlantısı için localSessiondan db nesnesini oluşturuyoruz.(get_db fonksiyonunda yaptığımız işlem)

    await websocket.accept()  # ilk olarak websocket nesnemiz ile websocket i  başlatıyoruz.
    print(f"[WS] CONNECT attempt conv={conversation_id} client={websocket.client}")

    try:
        # Token kontrolü
        if not token: 
            await websocket.send_json({"type": "error", "message": "Missing token"})
            await websocket.close(code=1008, reason="Missing token")
            return
        #token yok ise  websocket üzerinden bir hata mesajı gönderip websocketi kapatıyoruz.
        user = _get_user_from_token(db, token) #tokeni çözüp o tokenin kullanıcısını fonksiyon ile döndürüyoruz
        if not user:
            await websocket.send_json({"type": "error", "message": "Invalid token"})
            await websocket.close(code=1008, reason="Invalid token")
            return # token çözülemezse websocket üzerinden bir hata mesajı gönderip websocketi kapatıyoruz.

        # Konuşma-katılımcı kontrolü
        conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
        if not conv:
            await websocket.send_json({"type": "error", "message": "Konuşma bulunamadı."})
            await websocket.close(code=1003, reason="Conversation not found")
            return  #parametreden gelen konuşma id si ile eşleşen konuşma kaydını geri döndürüyoruz eğer yoksa websocket ile bir hata mesajı yayınlayıp websocketi kapatıyoruz

        participant = _get_participant(db, conversation_id, user.id)#Katılımcılar tablosunda parametrelerdeki konuşma id sinde ve user_id de bir kayıt varsa o kaydı(katılımcıyı) fonksiyon ile geri döndürüyoruz ve participant(katılımcı) adlı değişkende tutuyoruz.
        if not participant:
            await websocket.send_json({"type": "error", "message": "Bu konuşmaya erişim yetkiniz yok."})
            await websocket.close(code=1008, reason="Not a participant")
            return #katılımcı yoksa websocket üzerinden bir hata mesajı gönderip websocketi kapatıyoruz.

        # Odaya al
        await manager.connect(conversation_id, websocket)
        print(f"[WS] CONNECTED conv={conversation_id} user={user.id}") #bağlantıyı o id de bir oda varsa odaya ekliyoruz. o id de bir oda yoksa o id de bir oda oluşturup bağlantıyı ekliyoruz. bunu manager dosyasında bulunan connect fonksiyonu yapıyor.

        # Karşılama
        await websocket.send_json({
            "type": "connected",
            "payload": {"conversation_id": conversation_id, "user_id": user.id}
        }) #bağlantı odaya başarılı bir şekilde alınırsa yani bağlantı olursa konuşma id ve user id nin bulunduğu bir mesaj websocket üzerinden gönderiliyor.

        # 5) Event döngüsü
        while True: #istemciden gelen istekleri dinlemeye aralıksız devam ediyoruz.
            try:
                raw = await websocket.receive_text() #istemciden bir text frame gelene kadar bekler gelince raw adlı değişkene atılır.
                print(f"[WS] raw event: {raw}") #gelen ham meddi terminalde yazdırıyoruz. debugging yapıyoruz
            except WebSocketDisconnect: #karşı uç bağlantıyı kapattı ya da internet gitti
                print(f"[WS] DISCONNECT conv={conversation_id} user={user.id}")
                break
            except Exception as e: #veya receive_text() esnasında yukarıdaki hatadan farklı olarak başka bir hata oldu.
                print("[WS] receive error:", repr(e)) #debugging
                break #bu breakden sonra finally çalışır.

            if not raw: #raw boş string ise es geç ve döngünün başına dön
                continue

            try:
                evt = json.loads(raw) #gelen metini json formatına çevirmeyi deniyoruz
            except Exception as e:#dönüşüm sırasında bir hata olursa exception fırlatıyoruz ve
                print("[WS] JSON parse error:", repr(e)) #debugging
                await websocket.send_json({"type": "error", "message": "Geçersiz JSON"}) #websocket üzerinden hatayı gönder
                continue #döngünün başına dön

            evt_type = evt.get("type") #olay türünü değişkene atıyoruz örnek olarak message:new", "typing", "receipt:read", "ping".
            payload: dict[str, Any] = evt.get("payload") or {} #evt değişkeninde bulunan veri kümesini sözlüğe kaydediyoruz eğer boş ise aşağıdaki kodlar kolay aksın diye boş olarak sözlüğü oluşturuyoruz.
         
            #MESSAGE OLUŞTURMA
            if evt_type == "message:new": #evt_type message ise yani gelen recive_text bir message ise;
                try:
                    content = (payload.get("content") or "").strip() #mesajın içeriği çekilir boş ise trimlenmiş boş string olur
                    attachment_url = payload.get("attachment_url") #dosya yolu çekilir
                    if not content and not attachment_url: #ikisinden biri boş ise iş kuralı olarak hata mesajı döndürülür
                        await websocket.send_json({"type": "error", "message": "Mesaj içeriği veya dosya zorunlu."})
                        continue #döngü başına dön

                    msg_type = MessageType.FILE if (attachment_url and not content) else MessageType.TEXT # dosyaı yolu var ancak içerik yoksa mesaj tipini FILE yap haricinde text yap.
                    msg = Message(
                        conversation_id=conversation_id,
                        sender_id=user.id,
                        message_type=msg_type,
                        content=content or None,
                        attachment_url=attachment_url or None,
                    ) #Message sınıfından msg adlı bir nesne oluşturup bu nesneyi dolduruyoruz.
                    db.add(msg)
                    db.commit()
                    db.refresh(msg) #veritabanına nesneyi kaydediyoruz. ve id gibi bilgiler sonradan gelebileceği için güncelliyoruz.
                    #msg adlı nesnemiz son halini alıyor.

                    await manager.broadcast(conversation_id, {
                        "type": "message:new",
                        "payload": {
                            "id": msg.id,
                            "conversation_id": msg.conversation_id,
                            "sender_id": msg.sender_id,
                            "message_type": msg.message_type.value,
                            "content": msg.content,
                            "attachment_url": msg.attachment_url,
                            "created_at": msg.created_at.isoformat(),
                        }
                    }) #manager adlı dosyamızdan broadcast adlı fonksiyonumuz 2 adet parametre alıyor birincisi konuşmanın id si ikincisi ise  tip ve içerik
                   #   konuşma odası (conversation_id) içindeki tüm bağlı WebSocket’lere aynı olayı göndermek için broadcast fonksiyonunu kullanıyoruz.
                except Exception as e:
                    print("[WS] message:new error:", repr(e))
                    print(traceback.format_exc())
                    await websocket.send_json({"type": "error", "message": "Internal server error"}) #hata olddugunda hata mesajı verilir.

            elif evt_type == "typing": #evt_type eğer typing ise
                is_typing = bool(payload.get("is_typing")) # typing değerini true false a çeviriyor
                await manager.broadcast(conversation_id, {
                    "type": "typing",
                    "payload": {"user_id": user.id, "is_typing": is_typing}
                }, exclude=websocket) #Oda içindeki tüm diğer kullanıcılara yayın yapar (gönderen hariç).

            elif evt_type == "receipt:read": #evt_type i okundu bilgisi ise 
                last_id = payload.get("last_read_message_id") # son okunan mesajın id si last idye aktarılır.
                if isinstance(last_id, int): #last_id int ise true 
                    participant.last_read_message_id = last_id # katılımcının son okunan mesaj id değeri last_id değeri oluyor.
                    db.commit()#veritabanını güncellioruz
                    await manager.broadcast(conversation_id, {
                        "type": "receipt:read",
                        "payload": {"user_id": user.id, "last_read_message_id": last_id}
                    }, exclude=websocket) # Oda içindeki tüm kullanıcılara okundu bilgisi gösterilir.

            elif evt_type == "ping": #bağlantının canlı olup olmadıgını kontrol ediyoruz
                await websocket.send_json({"type": "pong"}) #canlı ise bir pong dönüyor.

            else:
                await websocket.send_json({"type": "error", "message": f"Bilinmeyen event: {evt_type}"}) #canlı depil ise bilinmeyen bir olay ile hata döndürüyoruz.

    except Exception as e:
        print("[WS] Unhandled exception:", repr(e))
        print(traceback.format_exc())
        try:
            await websocket.send_json({"type": "error", "message": "Internal server error"})
        except Exception:
            pass #Döngü dışına sarkan yada beklenmeyen tum hataları yakalr ve hatayı bize bildirir.
    finally:# her durumda (normal çıkış, disconnect, hata) çalışır
        try:
            manager.disconnect(conversation_id, websocket) #odadan bağlantıyı çıkarır. oda boş ise odanın kaydı silinir.
        except Exception as e:
            print("[WS] manager.disconnect error:", repr(e))
        db.close() #veritabanı bağlantısı kapatılır.
        print(f"[WS] connection closed conv={conversation_id}")
