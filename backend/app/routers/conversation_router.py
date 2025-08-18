# app/routers/conversation_router.py
from __future__ import annotations
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Path, BackgroundTasks
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, asc

from app.database import SessionLocal
from app.models import (
    Auction, AuctionStatus, Bid, User,
    Conversation, ConversationParticipant, Message,
    ConversationStatus, MessageType
)
from app.schemas.conversation_schema import (
    ConversationCreate, ConversationOut,
    MessageCreate, MessageOut, ReadReceiptCreate
)
from app.routers.user_router import get_current_user
from app.realtime.manager import manager

router = APIRouter(prefix="/conversations", tags=["Conversations"])


#Veritabanı bağlantısı
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


#***Yardımcı Fonksiyonlar***

#Konuşma da o kişi var mı ?
def ensure_participant(db: Session, conversation_id: int, user_id: int) -> ConversationParticipant:
    participant = (
        db.query(ConversationParticipant)
        .filter(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == user_id,
        )
        .first() #Konuşma katılımcılarının bulunduğu tabloda parametreden gelen konuşama id ve user_id var mı ? varsa ilk kaydı getir.
        #Yani belirli bir konuşmada belirli bir kişi var mı ? varsa o kaydı getiriyoruz.
    )
    if not participant:
        raise HTTPException(status_code=403, detail="Konuşmaya erişim yetkiniz yok.")
    return participant # o katılımcı o konuşmada yoksa exception fırlatıyoruz. varsa o kaydı döndürüyoruz


#Kazananı bulma yardımcı fonksiyonumuz.(Kod okunaklığı için ekledim çok gerekli değil)
def resolve_winner_user_id(db: Session, auction: Auction) -> Optional[int]:
    if auction.winner_id:
        return auction.winner_id

    bids = db.query(Bid).filter(Bid.auction_id == auction.id).all()
    if not bids:
        return None

    def better(a: Bid, b: Bid) -> Bid:
        if auction.auction_type == "highest":
            if a.amount > b.amount:
                return a
            elif a.amount < b.amount:
                return b
            else:
                return a if a.timestamp > b.timestamp else b
        else:  # lowest
            if a.amount < b.amount:
                return a
            elif a.amount > b.amount:
                return b
            else:
                return a if a.timestamp > b.timestamp else b

    best = bids[0]
    for bid in bids[1:]:
        best = better(best, bid)
    return best.supplier_id  # = User.id


#Message sınıfından gelen msg adlı nesneyi python sözlüğü haline getiriyoruz.
def serialize_message(msg: Message) -> dict:
    return {
        "id": msg.id,
        "conversation_id": msg.conversation_id,
        "sender_id": msg.sender_id,
        "message_type": msg.message_type.value if isinstance(msg.message_type, MessageType) else msg.message_type,
        "content": msg.content,
        "attachment_url": msg.attachment_url,
        "created_at": msg.created_at,
        "edited_at": msg.edited_at,
        "deleted_at": msg.deleted_at,
    }

#Conversation sınıfından gelen conv adlı nesnedeki bilgileri python sözlüğü halindeki şablonu doldurmak için kullanıyoruz.
def serialize_conversation(conv: Conversation, last_msg: Message | None) -> dict:
    return {
        "id": conv.id,
        "auction_id": conv.auction_id,
        "customer_company_id": conv.customer_company_id,
        "supplier_company_id": conv.supplier_company_id,
        "status": conv.status.value if isinstance(conv.status, ConversationStatus) else conv.status,
        "created_at": conv.created_at,
        "closed_at": conv.closed_at,
        "participants": [
            {
                "id": p.id,
                "user_id": p.user_id,
                "role": p.role,
                "joined_at": p.joined_at,
                "last_read_message_id": p.last_read_message_id,
            }
            for p in (conv.participants or [])
        ],
        "last_message": serialize_message(last_msg) if last_msg else None, #yukarıda bulunan mesajı sözlük haline getirme işlemini uygulayop dönen kaydı last_message adlı kısımda tutuyoruz.
    }
#Bunları yapıyoruz çünkü ws bağlantısı için lazım.


#Konuşma Başlatma (POST) Endpointi
@router.post("/start", response_model=ConversationOut)
def start_conversation(
    payload: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
): #Parametre olarak ConversationCreate modelinde bir nesne bekleniyor. bu nesnede konuşma başlatmak için gerekli değişkenler tutuluyor. Diğer parametrelerde ise veritabanı bağlantısı için db ve giriş yapan kullanıcının bilgisi için current_user adlı değişken tutuluyor.
    
    # *İhale kontrolü*
    auction = (
        db.query(Auction)
        .options(joinedload(Auction.company))
        .filter(Auction.id == payload.auction_id)
        .first()
    )
    if not auction:
        raise HTTPException(status_code=404, detail="İhale bulunamadı.")

    if auction.status != AuctionStatus.FINISHED:
        raise HTTPException(status_code=400, detail="Konuşma sadece bitmiş ihaleler için açılabilir.")
    #Burada Auction tablosunda gelen konuşma nesnesinde (payload) tutulan auction_id ile eşleşen bir kayıt var mı diye kontrol ediliyor. ve yoksa veya ihalenin durumu bitmiş değilse bir exception fırlatılıyor.

    if current_user.company_id != auction.company_id:
        raise HTTPException(status_code=403, detail="Sadece ihalenin sahibi müşteri konuşma başlatabilir.")
    # giriş yapan kullanıcının şirket id si ile gelen ihale nesnesindeki şirket id si eşleşiyor mu kontrol ediyoruz. Eşleşmiyorsa exception fırlatıyoruz.

    winner_user_id = resolve_winner_user_id(db, auction)
    if not winner_user_id:
        raise HTTPException(status_code=400, detail="Kazanan belirlenmemiş veya teklif bulunamadı.")
    #o ihaledeki winner_id yi fonksiyon ile bulup değişkene atıyoruz. yoksa exception.

    winner_user = db.query(User).filter(User.id == winner_user_id).first()
    if not winner_user:
        raise HTTPException(status_code=404, detail="Kazanan kullanıcı bulunamadı.")
    #Kazanan kullanıcıyı winner_id den gelen id ye göre buluyoruz. yoksa exception fırlatıyoruz.

    # 4) Aynı ihale için konuşma var mı? Varsa getir
    conv = (
        db.query(Conversation)
        .options(
            joinedload(Conversation.participants),
            joinedload(Conversation.messages).joinedload(Message.sender),
        )
        .filter(Conversation.auction_id == auction.id)
        .first()
    )
    #Konuşma tablosundaki kayıtlardan önceden çektiğimiz ihale nesnesinin id si ile eşleşen bir kayıt varsa bu kayıtla ilgili satırı,katılımcıları ve mesajları getir ve conv adlı değişkende bu bilgileri tut.

    if conv:
        last_msg = (
            db.query(Message)
            .filter(Message.conversation_id == conv.id)
            .order_by(desc(Message.created_at))
            .first()
        )
        payload_dict = serialize_conversation(conv, last_msg)
        return JSONResponse(content=jsonable_encoder(payload_dict))
    #Eğer eşleşen bir kayıt olursa ve conv değişkeninde bu bilgiler tutuluyorsa if bloğunun içi çalışıyor ve Message tablosuna bir sorgu atıyoruz. bu sorguda Message tablosundaki kayıtlardan konuşma id si conv adlı değişkende tutulan id ile eşleşen mesaj kayıtlarını oluşma zamanına göre tersten sıralayıp ilk kaydı getiriyoruz. bu sayede atılan son mesaj artık last_msg adlı değişkende tutuluyor. Ardından bu konuşmayı ve son mesajı serialize_conversation fonksiyonumuza yolluyoruz ve json dostu bir sözlük haline getirip dönen kaydı payload_dict adlı değişkende tutuyoruz. ardından bu nesneyi json cevabı olarak geriye döndürüyoruz.

    # Eğer conv adlı nesne boş olursa bu kısım çalışıyor
    conv = Conversation(
        auction_id=auction.id,
        customer_company_id=auction.company_id,
        supplier_company_id=winner_user.company_id,
        status=ConversationStatus.ACTIVE,
        created_at=datetime.utcnow(),
    ) #Conversation(Konuşma) nesnesi oluşturup gerekli alanları dolduruyoruz.
    db.add(conv) #Veritabanına gönder
    db.flush()  #bu kod ile kaydı veritabanına commit olmadan insert eder ve veritabanında oluşan id gibi kayıtlar conv adlı nesneye doldurulur.

    participants = [
        ConversationParticipant(conversation_id=conv.id, user_id=current_user.id, role="customer"),
        ConversationParticipant(conversation_id=conv.id, user_id=winner_user.id, role="supplier"),
    ] #Katılımcıları oluşturup bir diziye atıyoruz.
    db.add_all(participants)#dizideki tüm değerleri veritabanına ekle
    db.commit()#kayıtları veritabanına kaydet
    db.refresh(conv)#refresh ile son halini geri döndür.

    payload_dict = serialize_conversation(conv, last_msg=None) #conv nesnesinin son halini json dostu bir sözlüğe çevirip return ile json cevabı olarak geri döndürüyoruz.
    return JSONResponse(content=jsonable_encoder(payload_dict))


#id ye göre Conversation(Konuşma) getirme

@router.get("/{conversation_id}", response_model=ConversationOut)
def get_conversation(
    conversation_id: int = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # parametre olarak konuşma id si, veritabanı bağlantısı için db nesnesi ve giriş yapan kullanıcı için current_user parametresini alıyor.

    conv = (
        db.query(Conversation)
        .options(joinedload(Conversation.participants))
        .filter(Conversation.id == conversation_id)
        .first()
    )
    #Conversation tablosunda parametreden gelen id ile eşleşen ilk kaydı ve bu kayıtla eşleşen katılımcıları getiren bir sorgu yazıyoruz.
    if not conv:
        raise HTTPException(status_code=404, detail="Konuşma bulunamadı.")
    #sorgudan kayıt dönmezse bir exception fırlatıyoruz.

    ensure_participant(db, conversation_id, current_user.id) #giriş yapan kullanıcı konuşmada var mı fonksiyon ile kontrol ediyoruz.

    last_msg = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(desc(Message.created_at))
        .first()
    ) # Message tablosunda ki conversation_id ile parametreden gelen conversation_id eşleşiyor bu diye bakıyoruz eşleşiyor ise o kayıtları oluşuturulma zamanına göre tersten sıralayıp ilk kaydı değişkene atıyoruz yani son mesajı değişkende tutuyoruz.

    payload_dict = serialize_conversation(conv, last_msg) #conv adlı değişkende conversation ve katılımcı bilgileri, last_msg de ise son mesaj bilgisi tutuluyordu bunları fonksiyon ile json dostu bir python sözlüğüne çevirip bu değişkeni json cevabı olarak geri dödndürüyoruz.
    return JSONResponse(content=jsonable_encoder(payload_dict))


#tüm mesajları listeleme
@router.get("/{conversation_id}/messages/list", response_model=list[MessageOut])
def list_messages(
    conversation_id: int = Path(...), #urlden conversation_id yi alır.
    before: int | None = Query(None), #önceki mesajın id sini tutan değişken
    after: int | None = Query(None),#sonraki mesajın id sini tutan değişken
    limit: int = Query(50, ge=1, le=200),# max 200 min 1 varsayılan 50 kayıt
    db: Session = Depends(get_db), #veritabanı bağlantısı
    current_user: User = Depends(get_current_user), #giriş yapan kullanıcı
):#parametreler
    ensure_participant(db, conversation_id, current_user.id) #giriş yapan kullanıcı bu konuşmanın bir katılımcısı mıdır ?

    q = db.query(Message).filter(Message.conversation_id == conversation_id) # o konuşmanın tüm mesajlarını q adlı nesneye atıyoruz

    if before is not None: #before boş değilse
        ref = db.query(Message).filter(
            Message.id == before,
            Message.conversation_id == conversation_id
        ).first() # mesaj tablosunda before adlı parametreden gelen id ile eşleşen ve konuşma id leri eşleşen kayıt geri döndürülür.
        if ref:
            q = q.filter(Message.created_at < ref.created_at) # öyle bir kayıt varsa o kayıttan daha eski mesajlar q adlı değişkende tutulur

    if after is not None: # after boş değilse
        ref = db.query(Message).filter(
            Message.id == after,
            Message.conversation_id == conversation_id
        ).first() # mesaj tablosundaki after adlı parametreden gelen id ile eşleşen ve konuşma id leri eşleşen kayıt geri döndürülür.
        if ref:
            q = q.filter(Message.created_at > ref.created_at) #eğer öyle bir kayıt varsa o kayıttan daha yeni mesajlar q adlı değişkende tutulur.

    messages = q.order_by(asc(Message.created_at)).limit(limit).all()
    return messages 
    #q değişkenindeki kayıtlar oluşturulma zamanına göre sıralanır ve belirtilen limit kadarı messages adlı değişkene aktarılır. ardından geri döndürülür.


#Mesaj oluşturma ve ws ile yayınlama
@router.post("/{conversation_id}/messages", response_model=MessageOut)
def create_message(
    conversation_id: int,
    payload: MessageCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user), #parametreler
):
    ensure_participant(db, conversation_id, current_user.id) #Katılımcıyı doğrula 

    if not payload.content and not payload.attachment_url: #payload parametresinden gelen veride içerik olmasını ve dosya yolunun  zorunlu olduğunu belirtiyoruz.
        raise HTTPException(status_code=422, detail="Mesaj içeriği veya dosya zorunlu.")

    msg_type = MessageType.FILE if payload.attachment_url and not payload.content else MessageType.TEXT #her iki alan doluysa TEXT kabul ediyoruz

    msg = Message(
        conversation_id=conversation_id,
        sender_id=current_user.id,
        message_type=msg_type,
        content=payload.content,
        attachment_url=payload.attachment_url,
        created_at=datetime.utcnow(),
    )
    db.add(msg)
    db.commit()
    db.refresh(msg) #msg adlı şablonumuzu gelen parametrelere göre doldurup veritabanına kaydediyoruz. ve refresh ile id gibi sonradan eklenen kısımları şablonumuzda dolduruyoruz.

    payload_dict = {
        "id": msg.id,
        "conversation_id": msg.conversation_id,
        "sender_id": msg.sender_id,
        "message_type": msg.message_type.value if isinstance(msg.message_type, MessageType) else msg.message_type,
        "content": msg.content,
        "attachment_url": msg.attachment_url,
        "created_at": msg.created_at,
        "edited_at": msg.edited_at,
        "deleted_at": msg.deleted_at,
    } # payload_dict adında bir şablon hazırlayıp bu şablondaki verileri veritabanına kayıtta kullandığımız msg adlı nesne ile dolduruyoruz. 
    encoded = jsonable_encoder(payload_dict) # fastapinin bu yardımcı fonksiyonu ile tarih formatlarını güncelleme enumları string yapma gibi çözümlemeleri uyguluyoruz. bu sayede payload_dict şablonumuz jsona dönüştürülebilir bir obje haline geliyor.

    # REST -> WS yayın (arkaplan)
    background_tasks.add_task(  #bir arkaplan görevi tanımlama
        manager.broadcast,
        conversation_id,
        {"type": "message:new", "payload": encoded}
    )
     #manager adlı dosyada bulunan broadcast adlı fonksiyona conversation_id ile tipi message:new olan ve yük olarak da encoded adlı objemizi yolluyoruz.

    return JSONResponse(content=encoded) #geriye json cevabı olarak encoded objesini döndürüyoruz.


#Okundu Bilgisi Post Endpointi
@router.post("/{conversation_id}/read-receipts")
def post_read_receipt(
    conversation_id: int,
    payload: ReadReceiptCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user), #Parametreler
):
    participant = ensure_participant(db, conversation_id, current_user.id) #Katılımcı

    msg = (
        db.query(Message)
        .filter(Message.id == payload.last_read_message_id, Message.conversation_id == conversation_id)
        .first()
    ) #Message tablosunda id si payload adlı nesneden gelen lat_read_message_id adlı id ile eşleşen ve conversation_id leri eşleşen kayıtlardan ilki geri döndürülüyor.
    if not msg:
        raise HTTPException(status_code=404, detail="Mesaj bulunamadı.")
    #kayıt dönmezse exception fırlatıyoruz.
    participant.last_read_message_id = payload.last_read_message_id #katılımcı kaydındaki last_read_message_id sütünuna payload adlı nesneden gelen last_read_message_id idsini veriyoruz 
    db.commit()
    return {"ok": True, "last_read_message_id": payload.last_read_message_id} #veritabanına commitleyip geriye id yi döndürüyoruz.
