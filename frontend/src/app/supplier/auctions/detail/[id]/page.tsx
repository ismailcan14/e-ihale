"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BoltIcon } from "@heroicons/react/24/solid";

export default function AuctionDetailPage() {
  const { id } = useParams(); //Urldeki id bilgisini id adlı değişkene atıyoruz(auction id)
  const [auction, setAuction] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [amount, setAmount] = useState<number | null>(null);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null); //kullanıcının id si


  useEffect(() => {
    const token = localStorage.getItem("token"); //token bilgisini localStorage den çekiyoruz

    fetch("http://127.0.0.1:8000/users/me", {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json())
    .then((data) => {
      setCurrentUserId(data.id);
    })
    .catch((err) => console.error("Kullanıcı ID alınamadı:", err));

    fetch(`http://127.0.0.1:8000/auctions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setAuction(data)); //Belirtilen yola bir api isteği atıyor ve dönen verileri data adlı nesnemizde tutuyoruz. bu data nesnesi detay butonuna tıkladıgımız ihalenin kaydını tutuyor. sonrasında state ile datada bulunan ihalenin verileri auctions adlı değişkene aktarıyoruz.

    fetch(`http://127.0.0.1:8000/bids/auction/${id}`)
      .then((res) => res.json())
      .then((data) => setBids(data));
      //Belirtilen yola bir api isteği atıyoruz dönen verileri data adlı nesnemizde tutuyoruz. dönen veriler ise üstte çektiğimiz ihaleye gelen tekliflerin verileri. sonrasında state ile data da bulunan teklif verilerini bids değikenine aktarıyoruz.

      //auction değişkeni ihale bilgileri, bids değişkeni de ihaleye gelen teklif bilgilerini tutuyor.

    const socket = new WebSocket(
      `ws://localhost:8000/auctions/ws/${id}?token=${token}`
    );
    //ardından socket adında bir WebSocket nesnesi oluşturuyoruz. yani kısaca bağlantı. bu bağlantıyı oluşturabilmek için aynı constructor mantıgı ile çalışıyor ve hemen bir bağlantı açmaya çalışır.
    //bu bir http isteği değil WebSocket handshake protokolüdür. Başarılı olursa sürekli açık bir bağlantı kurulur. 

    setWs(socket);

   socket.onmessage = (event) => { //Sunucudan bir mesaj geldiğinde bu satır otomatik olarak calısır.

  const message = JSON.parse(event.data); //Sunucudan gelen json formatındaki veriyi javascripts nesnesine çevirip newBid adlı değişkene atıyoruz.

  if (message.type === "toggle_visibility") {
    // Eğer müşteri teklif görünürlüğünü değiştirdiyse sadece auction is_public_bids alanını güncelle
    setAuction((prev) =>
  prev
    ? {
        ...prev,
        is_public_bids: message.is_public_bids,
        current_price: prev.current_price, // mevcut fiyatı da koruyalım
        product: prev.product, // ürünü de koruyalım
      }
    : prev
);
  } else {
    const newBid = message;
    setBids((prev) => [newBid, ...prev]); //ile mesajda gelen değerleri teklifleri tutan state e yolluyoruz. state güncellendiği zaman react anlıyor ki benim frontendi güncellemem lazım ve frontendi güncelliyor. 
    setAuction((prev) =>
      prev
        ? {
            ...prev,
            current_price: newBid.amount,
            is_public_bids: newBid.is_public_bids ?? prev.is_public_bids,
          }
        : prev
    ); //ihale  objesinin sadece current_price ini güncelliyoruz.
  }
};


    return () => socket.close(); //cleanup fonksiyonudur sayfa değişirse veya id değişirse otomatık olarak websocket bağlantısını kapatır.
  }, [id]);

const handleBid = async () => {
  const token = localStorage.getItem("token"); //token alınır

  if (amount === null || isNaN(amount)) {
    setError("Lütfen geçerli bir teklif tutarı girin.");
    return;
  } //fiyat bilgisi boş ise hata mesajı

  try {
    const userRes = await fetch("http://127.0.0.1:8000/users/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }); 
    const user = await userRes.json();
    //kullanıcı bilgilerini almak için bir api isteği


    const res = await fetch("http://127.0.0.1:8000/bids", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        auction_id: parseInt(id as string),
        supplier_id: user.id,
        amount: amount,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      setError(errorData.detail || "Teklif gönderilirken hata oluştu.");
      return;
    }
    //auction id , supplier id ve fiyat bilgisi ile bids tablosuna bir post isteği gönderiyoruz. teklif kayıtları için.

    const data = await res.json(); //dönen kaydı json formatına çevirip data adlı nesnede tutuyoruz.
    setAmount(null);
    setError(null); // hata geçmişse temizle

  } catch (err) {
    setError("Sunucu hatası. Lütfen tekrar deneyin.");
  }
};


  if (!auction) return <p className="text-center text-gray-500">Yükleniyor...</p>;

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#f5f7fa] to-[#c3cfe2] py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-blue-800 mb-6 text-center">
          {auction.product.name}
        </h1>

        <div className="grid grid-cols-2 gap-4 text-gray-700 mb-6">
          <p><span className="font-medium">Başlangıç:</span> {new Date(auction.start_time).toLocaleString()}</p>
          <p><span className="font-medium">Bitiş:</span> {new Date(auction.end_time).toLocaleString()}</p>
          <p><span className="font-medium">İhale Türü:</span> {auction.auction_type === "highest" ? "En Yüksek" : "En Düşük"}</p>
          <p>
            <span className="font-medium text-green-700">Güncel Fiyat:</span>{" "}
            {new Intl.NumberFormat("tr-TR").format(auction.current_price)} ₺
          </p>        
          <p className="text-sm text-gray-500">
          Görünürlük durumu (is_public_bids):{" "}
          <strong>{auction?.is_public_bids ? "Açık" : "Gizli"}</strong>
        </p>
        </div>
        <div className="flex gap-2 mb-8 flex-col">
  {error && (
    <div className="text-red-600 font-medium">
      {error}
    </div>
  )}
  <div className="flex gap-2">
<input
  type="number"
  value={amount ?? ""}
  onChange={(e) => setAmount(parseFloat(e.target.value))}
  placeholder="Teklifinizi girin"
  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black placeholder-gray-500"
/>
    <button
      onClick={handleBid}
      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
    >
      Teklif Ver
    </button>
  </div>
</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <BoltIcon className="h-6 w-6 text-yellow-500" />
          Canlı Teklifler
        </h2>

  <ul className="space-y-3">
  {bids.map((bid) => {
    const canSee = auction.is_public_bids || bid.supplier_id === currentUserId;
    if (!canSee) return null;

    return (
      <li key={bid.id} className="bg-gray-100 p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="text-lg font-semibold text-gray-800">{bid.amount} ₺</div>
        <div className="text-sm text-gray-500">{new Date(bid.timestamp).toLocaleTimeString()}</div>
        <div className="text-sm text-gray-700 mt-1 italic">
          {`${bid.user_info.company} şirketinden ${bid.user_info.name} (${bid.user_info.role})`}
        </div>
      </li>
    );
  })}
</ul>

      </div>
    </div>
  );
}
