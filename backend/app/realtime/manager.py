# app/realtime/manager.py
from typing import Dict, Set
from starlette.websockets import WebSocket

class ConnectionManager:
    def __init__(self):
        # conversation_id -> aktif websocket set'i
        self.rooms: Dict[int, Set[WebSocket]] = {} #odalar adında bir sözlük. 2 parametre alıyor. biri conversation_id diğer ws bağlantıları örnek : rooms = { 42: {ws1, ws2}, 77: {ws3} }

    async def connect(self, conversation_id: int, websocket: WebSocket): #async bir fonksiyon parametre olarak konuşma id si ve websocket bağlantısı içeriyor.
        self.rooms.setdefault(conversation_id, set()).add(websocket) #burada conversation_id de bir oda varsa bağlantıyı bu odaya ekler. o id de bir oda yoksa boş bir oda oluşturur.

    def disconnect(self, conversation_id: int, websocket: WebSocket):
        if conversation_id in self.rooms:
            self.rooms[conversation_id].discard(websocket) #parametreden gelen konuşma id sinin odası varsa parametreden gelen bağlantıyı o odadan çıkarır.
            if not self.rooms[conversation_id]:
                del self.rooms[conversation_id] #odada hiç aktif bağlantı yoksa oda silinir.

    async def broadcast(self, conversation_id: int, message: dict, exclude: WebSocket | None = None):  #konuşmanın id sini ve mesaj içeriğini sözlük türünde parametre olarak bekliyor
        if conversation_id not in self.rooms: # konuşma odalarında conversation_id keyine sahip bir oda yoksa boş return yapıyoruz.
            return
        dead = [] # boş bir liste oluşturyoruz. bu liste gönderim sırasında hata veren kopmuş soketleri temizlemek için tutacak.
        for ws in list(self.rooms[conversation_id]):  #o idye ait odanın kopyasını alır. ve o odadda bulunan her websocket bağlantısı için for döngüsü başlar. ws ise her bir bağlantıyı tek tek temsil eder.
            if exclude is not None and ws is exclude:
                continue #yazıyor veya okundu olayları gibi durumlarda o sokete yayın göndermiyoruz.
            try:
                await ws.send_json(message) #tüm ws bağlantılarına mesaj gönderilir.
            except Exception:
                dead.append(ws) #hata olusursa dead listesine bu bağlantı eklenir ve diğerleri için devam edilir.
        for ws in dead: 
            self.disconnect(conversation_id, ws) #sorunlu bağlantılar odadan çıkartılır. Eğer odada son bir bağlantı kaldıysa ve o da haytalıysa o da çıkartılır ve o odanın anahtarını silinir.

manager = ConnectionManager()
