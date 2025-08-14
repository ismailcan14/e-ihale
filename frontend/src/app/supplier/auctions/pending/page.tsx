'use client';

import { useEffect, useState } from 'react';
import { FaGavel } from 'react-icons/fa';

export default function PendingAuctionsPage() {
  const [pendingAuctions, setPendingAuctions] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<number>(0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("http://127.0.0.1:8000/auctions/pending", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setPendingAuctions(data);
      })
      .catch((err) => console.error("Bekleyen ihaleler alınamadı:", err));
  }, []);

  const formatLocalTime = (utcString: string) => {
    const date = new Date(utcString);
    const localDate = new Date(date.getTime() + 3 * 60 * 60 * 1000);
    return localDate.toLocaleString();
  };

return (
  <div className="min-h-screen bg-white text-gray-900 py-10 px-6">
    <div className="max-w-7xl mx-auto">
       <h1 className="text-3xl font-bold text-center text-gray-800 mb-8 flex items-center justify-center gap-2">
              <FaGavel className="text-green-600" /> Bekleyen İhaleler
            </h1>
      {pendingAuctions.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-100 rounded-xl shadow-md mt-10 max-w-md mx-auto">
          <p className="text-lg font-semibold text-gray-700 text-center">
            Şu anda bekleyen ihale bulunmamaktadır.
          </p>
           <p className="text-sm text-gray-500 text-center mt-1">
            İleri tarihli ihaleler burada listelenecektir
          </p>
         </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center">
          {pendingAuctions.map((auction) => (
            <div
              key={auction.id}
              className="bg-white border border-gray-200 text-gray-800 rounded-2xl shadow-md p-6 w-full max-w-sm transition-transform transform hover:scale-105 hover:shadow-lg hover:border-green-500"
            >
              <h2 className="text-xl font-bold text-green-700 mb-3 truncate" title={auction.product?.name || 'Belirsiz Ürün'}>
                {auction.product?.name || 'Belirsiz Ürün'}
              </h2>

              <div className="space-y-2 text-sm">
                <p><strong>Başlangıç:</strong> {formatLocalTime(auction.start_time)}</p>
                <p><strong>Bitiş:</strong> {formatLocalTime(auction.end_time)}</p>
                <p><strong>Fiyat:</strong> {auction.starting_price} ₺</p>
                <p><strong>Tip:</strong> {auction.auction_type === 'highest' ? 'En Yüksek Teklif' : 'En Düşük Teklif'}</p>
              </div> 
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);
}
