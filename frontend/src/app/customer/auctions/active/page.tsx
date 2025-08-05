"use client";

import { useEffect, useState } from 'react';
import { FaGavel } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

export default function ActiveAuctionsPage() {
  const [activeAuctions, setActiveAuctions] = useState<any[]>([]); //active ihaleleri tutmak ve bu değişkeni doldurmak için bir state oluşturudk.
  const router = useRouter();//Detay butonu ile yönlendirmek için
 

  useEffect(() => { //useEffect fonksiyonunu oluşturuyoruz. bu fonksiyon her sayfa yüklendiğinde 1 kere çalışır.
    const token = localStorage.getItem("token"); //tokenı yerel depodan çektik

    fetch("http://127.0.0.1:8000/auctions/my", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const active = data.filter((a: any) => a.status === "active");
        setActiveAuctions(active);
      })
      .catch((err) => console.error("Aktif ihaleler alınamadı:", err));
  }, []);  //ihale apisine bir get isteği atıyoruz token ile beraber. token ile atmamızın sebebi giriş yapan bir kullanıcı olduğumuzu belirtmek dönen ham veri res üzerinde tutuluyor ve bunu json formatına çevirip data ya aktarıyoruz. data içerisindeki verileri statusü active olanları filtrelerip active adlı diziye aktarıyoruz ve setActiveAuction fonksiyonu ile bu dizideki verileri state de bulunana activeAuctions adlı değişkene gönderiyoruz.

  const formatLocalTime = (utcString: string) => {
    const date = new Date(utcString);
    const localDate = new Date(date.getTime() + 3 * 60 * 60 * 1000);
    return localDate.toLocaleString();
  }; //utc formatındaki saati Türkiye formatına çevirmek için 3 saat ileri alma fonksiyonu

return (
  <div className="bg-white min-h-screen py-10 px-6">
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8 flex items-center justify-center gap-2">
        <FaGavel className="text-blue-600" /> Aktif İhalelerim
      </h1>

      {activeAuctions.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-100 rounded-xl shadow-md mt-10 max-w-md mx-auto">
          <p className="text-lg font-semibold text-gray-700 text-center">
            Şu anda aktif ihale bulunmamaktadır.
          </p>
          <p className="text-sm text-gray-500 text-center mt-1">
            Tarihi gelen ihaleler burada listelenecektir.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center">
          {activeAuctions.map((auction) => (
           <div
  key={auction.id}
  className="bg-white border border-gray-200 text-gray-800 rounded-2xl shadow-md p-6 w-full max-w-sm transition-transform transform hover:scale-105 hover:shadow-lg hover:border-blue-500"
>
  <h2 className="text-xl font-bold text-blue-700 mb-3 truncate" title={auction.product?.name || 'Belirsiz Ürün'}>
    {auction.product?.name || 'Belirsiz Ürün'}
  </h2>

  <div className="space-y-2 text-sm">
    <p className="flex items-center">
      <span className="font-medium text-gray-600 mr-2 min-w-[90px]">Başlangıç:</span>
      <span>{formatLocalTime(auction.start_time)}</span>
    </p>
    <p className="flex items-center">
      <span className="font-medium text-gray-600 mr-2 min-w-[90px]">Bitiş:</span>
      <span>{formatLocalTime(auction.end_time)}</span>
    </p>
    <p className="flex items-center">
      <span className="font-medium text-gray-600 mr-2 min-w-[90px]">Fiyat:</span>
      <span className="text-base font-bold text-green-600">{auction.starting_price} ₺</span>
    </p>
    <p className="flex items-center">
      <span className="font-medium text-gray-600 mr-2 min-w-[90px]">Tip:</span>
      <span>{auction.auction_type === 'highest' ? 'En Yüksek Teklif' : 'En Düşük Teklif'}</span>
    </p>
  </div>
   <button
    onClick={() => router.push(`/customer/auctions/active/detail/${auction.id}`)}
    className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition"
  >
    Detay
  </button>
</div>
          ))}
        </div>
      )}
    </div>
  </div>
);
}