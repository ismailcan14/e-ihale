"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { BoltIcon } from "@heroicons/react/24/solid";

//Fonksiyonun genel amacı bir ihaleye herhangi bir şirket tarafından gelen tekliflerden ihale tipine göre en yükseğini veya en düşüğünü seçmesi.
function pickBestPerSupplier(list: any[], auctionType: 'highest' | 'lowest' = 'highest') {
  //parametre olarak tüm teklifleri tutan bir liste ve ihalenin türünü tutan bir değişkene sahip
  const bySupplier = new Map<number, any>();

  for (const b of list) { //gelen teklifler kadar dönecek bir for döngüsü oluşturuyoruz.
    const supplierId = b.supplier_id
    //b.user_info?.id ??
     //b.user_id; 
      //Tedarikçi id yi gelen tekliflerden hangi teklif kimin olduğunu bilmek için supplier_id bilgisini alıyoruz.

    if (!supplierId) continue; //boş değilse devam ediyoruz

    const existing = bySupplier.get(supplierId); //bySuplier bir map(key-value) yapısı ve bu yapıda key tedarikçi id sini tutarken value ise şuana kadar görülen en iyi değer. biz bu yapıda supplierId idsinde(keyinde) bir kayıt var mı diye bakıyoruz. varsa existing değişkenine atıyoruz.
    if (!existing) { //existinge bir değer atılmadıysa yani boşsa if in içerisindeki kod çalışıyor ve bu map(key-value) yapısına id ile o id nin teklif değerini kaydediyoruz.
      bySupplier.set(supplierId, b); //bu tedarikçi için artık en iyi teklif bu.
      continue;//direkt diper teklife geç aşağıdaki kıyaslamaları yapmaya gerek yok.
    }
   //eğer existing değeri varsa yani o id de başka bir teklif daha varsa aşağısı çalışıyor.
    const bTime = new Date(b.timestamp).getTime(); //şuanki teklifin verilme zamanını alıyoruz
    const eTime = new Date(existing.timestamp).getTime(); //existingdeki teklifin verilme zamanını alıyoruz

    let isBetter = false;
    if (auctionType === 'highest') {
      isBetter = b.amount > existing.amount || (b.amount === existing.amount && bTime > eTime);
    } else {
      isBetter = b.amount < existing.amount || (b.amount === existing.amount && bTime > eTime);
    } //highest ve lowest a göre örnek olarak highest olsun şaun incelenen teklif existing de tutulan  yani map deki teklifden büyük mü veya o teklife eşitse zaman olarak hangisi daha yeni kontrol ediyoruz. büyükse veya teklif yeniyse isBetter true oluyor. aynı mantık lowest içinde çalışıyor küçükse  veya eşit ise daha yeni mi diye kontrol ediliyor eğer öyleyse isBetter true oluyor.

    if (isBetter) bySupplier.set(supplierId, b); //isBetter true oldugunda kontrol edilen teklif map e atılıyor. artık o idnin yeni teklifi şuan kontrol edilen teklif. 
  }
  //For döngüsü ile bu şekilde tüm teklifler taranıyor ve id lere göre en iyi teklifler map de tutuluyor.

  const result = Array.from(bySupplier.values()); //map de bulunan valuelar(degerler) dizi formatına getirilip resul a aktarılıyor.
  result.sort((a, b) =>
    auctionType === 'highest' ? b.amount - a.amount : a.amount - b.amount
  ); //burada da ihale tipine göre result dizisinin içerisindeki değerler sıralanıyor. eğer highest ise büyükten küçüğe sırala lowest ise küçükten büyüğe sırala
  return result; //dizinin son halini döndürüyoruz.
}

export default function CustomerAuctionDetailPage() {
  const { id } = useParams();
  const [auction, setAuction] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);

   const colors = [
  "bg-red-100",
  "bg-blue-100",
  "bg-green-100",
  "bg-yellow-100",
  "bg-purple-100",
  "bg-pink-100",
  "bg-indigo-100",
  "bg-teal-100",
]; //teklif divlerini şirkete göre renkli yapmak için renk dizisi

const getColorForCompany = (companyName: string) => {
  // Şirket ismini hash'leyip, renk listesinden bir tane seç
  let hash = 0;
  for (let i = 0; i < companyName.length; i++) {
    hash = companyName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}; //şirketleri hasleme


  useEffect(() => {
    const token = localStorage.getItem("token");

    // İhale bilgisi çek
    fetch(`http://127.0.0.1:8000/auctions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      
     .then((data) => {
  setAuction(data);
});


    // Teklif bilgisi çek
    fetch(`http://127.0.0.1:8000/bids/auction/${id}`)
      .then((res) => res.json())
      .then((data) => setBids(data));

    // WebSocket bağlantısı
    const socket = new WebSocket(`ws://localhost:8000/auctions/ws/${id}?token=${token}`);

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data); //Sunucudan gelen json formatındaki veriyi javascripts nesnesine çevirip newBid adlı değişkene atıyoruz.

      // Eğer gelen mesaj teklif değilse (örneğin görünürlük değişimi) sadece auction state'ini güncelle
      if (message.type === "toggle_visibility") {
        setAuction((prev) =>
          prev
            ? {
                ...prev,
                is_public_bids: message.is_public_bids,
                current_price: prev.current_price,
                product: prev.product,
              }
            : prev
        );
        return;
      }

      // 1. Teklif listesini güncelle
      setBids((prev) => [message, ...prev]);

      // 2. auction içindeki current_price ve is_public_bids alanlarını güncelle
      setAuction((prev) =>
        prev
          ? {
              ...prev,
              current_price: message.amount,
              is_public_bids: message.is_public_bids ?? prev.is_public_bids,
            }
          : prev
      );
    };

    return () => socket.close();

  }, [id]);

  const bestBids = useMemo(() => {
    if (!auction) return [];
    return pickBestPerSupplier(bids, auction.auction_type);
  }, [bids, auction]);
  //normalde sayfada her state değiştiğinde tüm kodlar yeniden render edilir ve bizim pickBestPerSupplier fonksiyonumuz yeniden çalışır. bu fonksiyon bir tık ağır bir fonksiyon çünkü tüm teklifleri tek tek çekiyor kontrol ediyor yani maaliyetli biz useMemo() kullanarak react a diyoruz ki pickBestPerSupplier fonksiyonumuzu sadece auction ve bids değiştiğinde çağır. aksi halde bu fonksiyonun önceki değerini hafızandan getir. bu sayede performans kaybı yaşamıyoruz.
  if (!auction) return <p className="text-center text-gray-500">Yükleniyor...</p>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-blue-800 mb-6 text-center">
          {auction.product.name}
        </h1>

        <div className="grid grid-cols-2 gap-4 text-gray-700 mb-6">
          <p><span className="font-medium">Başlangıç:</span> {new Date(auction.start_time).toLocaleString()}</p>
          <p><span className="font-medium">Bitiş:</span> {new Date(auction.end_time).toLocaleString()}</p>
          <p><span className="font-medium">İhale Türü:</span> {auction.auction_type === "highest" ? "En Yüksek" : "En Düşük"}</p>
          <p><span className="font-medium text-green-700">Güncel Fiyat:</span> {new Intl.NumberFormat("tr-TR").format(auction.current_price)} ₺</p>
<div className="mb-8">
  <p className="text-sm text-gray-600 mb-2">
    Bu ayar ile tedarikçilerin birbirlerinin tekliflerini görüp göremeyeceğini kontrol edebilirsiniz.
  </p>
  <button
    onClick={async () => {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://127.0.0.1:8000/auctions/${id}/toggle-public-bids`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
     if (res.ok) {
  const result = await res.json();
  setAuction(prev => prev ? { ...prev, is_public_bids: result.is_public_bids } : prev);
}
    }}
     className={`w-full px-4 py-3 rounded-xl font-semibold transition ${
    auction.is_public_bids
      ? 'bg-green-600 hover:bg-green-700 text-white'
      : 'bg-gray-600 hover:bg-gray-700 text-white'
  }`}
>
  {auction.is_public_bids
    ? "Tedarikçiler TÜM teklifleri görebiliyor (Tıklayarak gizle)"
    : "Teklifler GİZLİ (Tıklayarak herkese aç)"}
</button>
</div>

        </div>
       
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <BoltIcon className="h-6 w-6 text-yellow-500" />
          Canlı Teklifler
        </h2>

        <ul className="space-y-3">
          {bestBids.map((bid) => {
            if (!bid.user_info) return null;

            return (
              <li
                key={bid.id}
                className={`p-4 rounded-lg shadow-sm border border-gray-200 ${getColorForCompany(
                  bid.user_info.company
                )}`}
              >  
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
