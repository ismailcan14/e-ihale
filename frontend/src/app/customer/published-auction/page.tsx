'use client'

import { useEffect, useState } from 'react';

export default function MyAuctionsPage() {
  const [auctions, setAuctions] = useState<any[]>([]);
  const [activeAuctions, setActiveAuctions] = useState<any[]>([]);
  const [inactiveAuctions, setInactiveAuctions] = useState<any[]>([]);
  //3 adet state oluşturup bu statelerde 3 adet değişken tutuyoruz. biri tüm ihaleleri,diğer 2 side aktif ve pasif ihaleleri tutacak.

  useEffect(() => {
    const token = localStorage.getItem("token"); //yerel depodan token ı çekiyoruz

    fetch("http://127.0.0.1:8000/auctions/my", {
      headers: {
        Authorization: `Bearer ${token}`,
      }, //get auctions endpointine bir istekte bulunuyoruz token ile beraber.
    })
      .then((res) => res.json()) 
      .then((data) => {//dönen veriyi json formatına çevirip data adlı nesneye aktarıyoruz.
        setAuctions(data);
        setActiveAuctions(data.filter((a: any) => a.is_active));
        setInactiveAuctions(data.filter((a: any) => !a.is_active)); //filtreler ile aktif olanları ve pasif olanları ayırıp gerekli değişkenlere atıyoruz.
      })
      .catch((err) => console.error("İhaleler alınamadı:", err)); //herhangi bir sorunda catch blogu calısırsa ihaleler alınamadı hatası döndrüyoruz
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#1561ad] via-[#1c77ac] to-[#1dbab4] pt-28 p-6 text-white">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-center">Yayınlanan İhalelerim</h1>

        <section className="mb-10">
          <h2 className="text-2xl font-semibold mb-4">Aktif İhaleler</h2>
          {activeAuctions.length === 0 ? (
            <p>Hiç aktif ihale yok.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeAuctions.map((auction) => (
                <div
                  key={auction.id}
                  className="bg-white text-gray-800 rounded-2xl shadow-xl p-6 flex flex-col gap-2 hover:shadow-2xl transition-shadow"
                >
                  <h2 className="text-xl font-semibold">{auction.product?.name || 'Belirsiz Ürün'}</h2>
                  <p><strong>Başlangıç:</strong> {new Date(auction.start_time).toLocaleString()}</p>
                  <p><strong>Bitiş:</strong> {new Date(auction.end_time).toLocaleString()}</p>
                  <p><strong>Başlangıç Fiyatı:</strong> {auction.starting_price} ₺</p>
                  <p><strong>Tip:</strong> {auction.auction_type === 'highest' ? 'En Yüksek Teklif' : 'En Düşük Teklif'}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Pasif İhaleler</h2>
          {inactiveAuctions.length === 0 ? (
            <p>Hiç pasif ihale yok.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inactiveAuctions.map((auction) => (
                <div
                  key={auction.id}
                  className="bg-white text-gray-800 rounded-2xl shadow-xl p-6 flex flex-col gap-2 hover:shadow-2xl transition-shadow"
                >
                  <h2 className="text-xl font-semibold">{auction.product?.name || 'Belirsiz Ürün'}</h2>
                  <p><strong>Başlangıç:</strong> {new Date(auction.start_time).toLocaleString()}</p>
                  <p><strong>Bitiş:</strong> {new Date(auction.end_time).toLocaleString()}</p>
                  <p><strong>Başlangıç Fiyatı:</strong> {auction.starting_price} ₺</p>
                  <p><strong>Tip:</strong> {auction.auction_type === 'highest' ? 'En Yüksek Teklif' : 'En Düşük Teklif'}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
