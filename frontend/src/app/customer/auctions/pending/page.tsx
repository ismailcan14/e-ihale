'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PendingAuctionsPage() {
  const [pendingAuctions, setPendingAuctions] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");

    
    fetch("http://127.0.0.1:8000/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setUserRole(data.role_id)) 
      .catch(err => console.error("Kullanıcı bilgileri alınamadı:", err));
  // apiye istek atarak kullanıcı bilgileri çekip json formatında data nesnesine atıyoruz. ardından setUserRole fonksiyonu ile data da bulunan role bilgisini state e yolluyoruz state gelen değeri userRole değişkeninde tutuyor
    
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

  const handleEditClick = (auctionId: number) => {
    if (userRole === 3) {
      alert("Yetkisiz erişim! Bu işlemi yapma izniniz yok.");
    } else {
      router.push(`/customer/edit-auction/${auctionId}`);
    }
  }; // Güncelle butonuna basıldığındna calısacak bir fonksiyon parametre olarak auction ın id sini tutuyor. içerideki kontrolde eğer role ü personel ise butona bastığında uyarı mesajı veriyor haricinde güncelleme sayfasına yönlendiriyor.

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
            <p className="text-xl font-semibold text-gray-600 dark:text-gray-300 text-center">
              Şu anda bekleyen ihale bulunmamaktadır.
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
                  <p><strong>Başlangıç:</strong> {formatLocalTime(auction.start_time)}</p>
                  <p><strong>Bitiş:</strong> {formatLocalTime(auction.end_time)}</p>
                  <p><strong>Fiyat:</strong> {auction.starting_price} ₺</p>
                  <p><strong>Tip:</strong> {auction.auction_type === 'highest' ? 'En Yüksek Teklif' : 'En Düşük Teklif'}</p>
                </div>

                <button
                  onClick={() => handleEditClick(auction.id)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
                >
                  ✏️ Güncelle
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
