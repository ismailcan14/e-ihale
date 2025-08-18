import os, json, time, asyncio, requests, websockets

BASE = os.environ.get("BASE", "http://127.0.0.1:8000")

# ---- DOLDUR ----
CUST_EMAIL = os.environ.get("CUST_EMAIL", "ismail@gmail.com")
CUST_PASS  = os.environ.get("CUST_PASS",  "123")
SUPP_EMAIL = os.environ.get("SUPP_EMAIL", "ibrahim@gmail.com")
SUPP_PASS  = os.environ.get("SUPP_PASS",  "123")

# İstersen doğrudan bir bitmiş ihale ID ver (yoksa script bitmiş bir ihale bulmaya çalışır)
AUCTION_ID = "15"
TIMEOUT = 10  # saniye

def login(email, password):
    # OAuth2PasswordRequestForm username & password bekler
    r = requests.post(
        f"{BASE}/users/login",
        data={"username": email, "password": password},  # <-- JSON değil, FORM DATA
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    r.raise_for_status()
    tok = r.json().get("access_token")
    assert tok, "access_token gelmedi"
    return tok

def get_finished_auction_id(token):
    # Eğer AUCTION_ID verilmişse onu kullan
    if AUCTION_ID:
        return int(AUCTION_ID)

    # Müşterinin bitmiş ihalelerinden birini bul
    r = requests.get(f"{BASE}/auctions/my", headers={"Authorization": f"Bearer {token}"})
    r.raise_for_status()
    arr = r.json()
    for a in arr:
        if a.get("status") == "finished":
            return int(a["id"])
    raise RuntimeError("Bitmiş ihale bulunamadı. Bir ihaleyi finished yap ya da AUCTION_ID ver.")

def ensure_at_least_one_bid(auction_id, supp_token):
    # Teklif var mı?
    r = requests.get(f"{BASE}/bids/auction/{auction_id}")
    r.raise_for_status()
    if r.json():
        return
    # Teklif yoksa 1 tane at
    r2 = requests.post(f"{BASE}/bids/{auction_id}",
                       headers={"Authorization": f"Bearer {supp_token}"},
                       json={"amount": 12345})
    if r2.status_code >= 400:
        raise RuntimeError(f"Teklif atılamadı: {r2.status_code} {r2.text}")

def start_conversation(auction_id, cust_token):
    r = requests.post(f"{BASE}/conversations/start",
                      headers={"Authorization": f"Bearer {cust_token}"},
                      json={"auction_id": auction_id})
    r.raise_for_status()
    conv = r.json()
    cid = conv["id"]
    return cid

async def ws_pair_and_test(conv_id, cust_token, supp_token):
    """
    İki WS bağlantısı açar, ping, typing, WS mesajı ve REST mesajını doğrular.
    """
    url_c = f"ws://{BASE.split('://')[1]}/ws/conversations/{conv_id}?token={cust_token}"
    url_s = f"ws://{BASE.split('://')[1]}/ws/conversations/{conv_id}?token={supp_token}"

    recv_events_c = []
    recv_events_s = []

    async def recv_loop(name, ws, bucket):
        try:
            async for msg in ws:
                bucket.append(json.loads(msg))
        except Exception:
            pass

    async with websockets.connect(url_c, max_size=None) as wc, websockets.connect(url_s, max_size=None) as ws:
        # İlk connected paketleri gelmeli
        start = time.time()
        while len(recv_events_c) == 0 or len(recv_events_s) == 0:
            if time.time() - start > TIMEOUT:
                raise RuntimeError("WS connected olayı gelmedi")
            try:
                msg_c = await asyncio.wait_for(wc.recv(), timeout=0.3)
                recv_events_c.append(json.loads(msg_c))
            except asyncio.TimeoutError:
                pass
            try:
                msg_s = await asyncio.wait_for(ws.recv(), timeout=0.3)
                recv_events_s.append(json.loads(msg_s))
            except asyncio.TimeoutError:
                pass

        # Ping → pong
        await wc.send(json.dumps({"type": "ping"}))
        got_pong = False
        start = time.time()
        while time.time() - start < TIMEOUT and not got_pong:
            try:
                m = await asyncio.wait_for(wc.recv(), timeout=0.5)
                if json.loads(m).get("type") == "pong":
                    got_pong = True
            except asyncio.TimeoutError:
                pass
        assert got_pong, "pong gelmedi"

        # Typing → diğer tarafa düşmeli
        await wc.send(json.dumps({"type": "typing", "payload": {"is_typing": True}}))
        saw_typing_on_s = False
        start = time.time()
        while time.time() - start < TIMEOUT and not saw_typing_on_s:
            try:
                m = await asyncio.wait_for(ws.recv(), timeout=0.5)
                if json.loads(m).get("type") == "typing":
                    saw_typing_on_s = True
            except asyncio.TimeoutError:
                pass
        assert saw_typing_on_s, "typing supplier'a düşmedi"

        # WS ile mesaj gönder → iki tarafa da düşmeli
        await wc.send(json.dumps({"type": "message:new", "payload": {"content": "ws-merhaba"}}))
        ws_msg_ids = []

        async def wait_message_new(sock, label):
            start = time.time()
            while time.time() - start < TIMEOUT:
                try:
                    m = await asyncio.wait_for(sock.recv(), timeout=0.5)
                    data = json.loads(m)
                    if data.get("type") == "message:new":
                        return data["payload"]["id"]
                except asyncio.TimeoutError:
                    pass
            raise RuntimeError(f"{label} tarafında WS message:new görülmedi")

        id_on_c = await wait_message_new(wc, "customer")
        id_on_s = await wait_message_new(ws, "supplier")
        assert isinstance(id_on_c, int) and isinstance(id_on_s, int), "WS mesaj ID gelmedi"

        # Okundu (WS) → müşteri görmeli
        await ws.send(json.dumps({"type": "receipt:read", "payload": {"last_read_message_id": id_on_s}}))
        saw_receipt_on_c = False
        start = time.time()
        while time.time() - start < TIMEOUT and not saw_receipt_on_c:
            try:
                m = await asyncio.wait_for(wc.recv(), timeout=0.5)
                if json.loads(m).get("type") == "receipt:read":
                    saw_receipt_on_c = True
            except asyncio.TimeoutError:
                pass
        assert saw_receipt_on_c, "receipt:read customer'a düşmedi"

        # Döndür: ws üzerinden gelen son message id (okundu testini REST ile bunun üzerinden yapacağız)
        return id_on_s

def rest_message_and_expect_ws(conv_id, cust_token):
    # REST ile mesaj at
    r = requests.post(f"{BASE}/conversations/{conv_id}/messages",
                      headers={"Authorization": f"Bearer {cust_token}"},
                      json={"content": "rest-merhaba"})
    r.raise_for_status()
    mid = r.json()["id"]
    assert isinstance(mid, int), "REST message id yok"
    return mid

def post_read_receipt_and_verify(conv_id, last_id, supp_token, cust_token):
    # REST okundu yaz
    r = requests.post(f"{BASE}/conversations/{conv_id}/read-receipts",
                      headers={"Authorization": f"Bearer {supp_token}"},
                      json={"last_read_message_id": last_id})
    r.raise_for_status()

    # GET conversation ile participant.last_read_message_id doğrula
    r2 = requests.get(f"{BASE}/conversations/{conv_id}",
                      headers={"Authorization": f"Bearer {cust_token}"})
    r2.raise_for_status()
    conv = r2.json()
    participants = conv.get("participants") or []
    assert any((p.get("last_read_message_id") == last_id) for p in participants), "last_read_message_id güncellenmedi"

def main():
    print("[1] Login...")
    cust_token = login(CUST_EMAIL, CUST_PASS)
    supp_token = login(SUPP_EMAIL, SUPP_PASS)

    print("[2] Finished ihale tespiti...")
    auction_id = get_finished_auction_id(cust_token)
    print(f"    AUCTION_ID = {auction_id}")

    print("[3] En az bir teklif sağla...")
    ensure_at_least_one_bid(auction_id, supp_token)

    print("[4] Konuşmayı başlat...")
    conv_id = start_conversation(auction_id, cust_token)
    print(f"    CONV_ID = {conv_id}")

    print("[5] WS ikili bağlantı ve akış testleri...")
    last_ws_msg_id = asyncio.run(ws_pair_and_test(conv_id, cust_token, supp_token))
    print(f"    WS mesaj OK (id={last_ws_msg_id})")

    print("[6] REST mesaj at ve WS’te düşmesini manuel gözlemle (ayrı WS zaten test edildi).")
    mid = rest_message_and_expect_ws(conv_id, cust_token)
    print(f"    REST mesaj OK (id={mid})")

    print("[7] REST okundu yaz ve GET ile doğrula...")
    post_read_receipt_and_verify(conv_id, mid, supp_token, cust_token)

    print("\nALL PASS ✅  (login → finished auction → start conversation → WS ping/typing/message → REST message → read receipts)")

if __name__ == "__main__":
    main()
