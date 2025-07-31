'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PendingAuctionsPage() {
  const [pendingAuctions, setPendingAuctions] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch("http://127.0.0.1:8000/auctions/my", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter((a: any) => a.status === "pending");
        setPendingAuctions(filtered);
      })
      .catch((err) => console.error("Bekleyen ihaleler alınamadı:", err));
  }, []);


  const formatLocalTime = (utcString: string) => {
    const date = new Date(utcString);
    const localDate = new Date(date.getTime() + 3 * 60 * 60 * 1000);
    return localDate.toLocaleString();
  };
  //active sayfası ile aynı olduğu için açıklamaya gerek yok

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 py-10 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-5xl font-extrabold mb-4 text-center text-blue-800 dark:text-blue-400 tracking-tight">
          Bekleyen İhalelerim
        </h1>
        <p className="text-lg text-center text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
          Başlangıç zamanı henüz gelmemiş ve onay bekleyen tüm ihalelerinizi buradan takip edebilirsiniz.
        </p>

        {pendingAuctions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg mt-10 max-w-md mx-auto">
            <svg className="w-20 h-20 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p className="text-xl font-semibold text-gray-600 dark:text-gray-300 text-center">
              Şu anda bekleyen ihale bulunmamaktadır.
            </p>
            <p className="text-md text-gray-500 dark:text-gray-400 text-center mt-2">
              Yeni ihaleler oluşturduğunuzda veya onaylandığında burada listelenecektir.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center">
            {pendingAuctions.map((auction) => (
              <div
                key={auction.id}
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-3xl shadow-xl p-7 flex flex-col gap-4
                           transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:border-blue-500 border border-transparent
                           w-full max-w-sm"
              >
                <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-300 mb-2 truncate" title={auction.product?.name || 'Belirsiz Ürün'}>
                  {auction.product?.name || 'Belirsiz Ürün'}
                </h2>

                <div className="space-y-2 text-sm">
                  <p className="flex items-center">
                    <span className="font-semibold text-gray-600 dark:text-gray-400 mr-2 min-w-[90px]">Başlangıç:</span>
                    <span className="text-gray-800 dark:text-gray-200">{formatLocalTime(auction.start_time)}</span>
                  </p>
                  <p className="flex items-center">
                    <span className="font-semibold text-gray-600 dark:text-gray-400 mr-2 min-w-[90px]">Bitiş:</span>
                    <span className="text-gray-800 dark:text-gray-200">{formatLocalTime(auction.end_time)}</span>
                  </p>
                  <p className="flex items-center">
                    <span className="font-semibold text-gray-600 dark:text-gray-400 mr-2 min-w-[90px]">Fiyat:</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">{auction.starting_price} ₺</span>
                  </p>
                  <p className="flex items-center">
                    <span className="font-semibold text-gray-600 dark:text-gray-400 mr-2 min-w-[90px]">Tip:</span>
                    <span className="text-gray-800 dark:text-gray-200">
                      {auction.auction_type === 'highest' ? 'En Yüksek Teklif' : 'En Düşük Teklif'}
                    </span>
                  </p>
                </div>

                <button
                  onClick={() => router.push(`/customer/edit-auction/${auction.id}`)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  ✏️ Güncelle
                </button> 
                {/* Burada useRouter sınıfı ile butona tıkandığuında id ile beraber edit-auction/id sayfasına yönlnedirme yapıyoruz. */}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
