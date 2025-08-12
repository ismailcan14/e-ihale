"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaHandshake } from "react-icons/fa";

export default function JoinedAuctionsPage() {
  const [activeAuctions, setActiveAuctions] = useState<any[]>([]);
  const [finishedAuctions, setFinishedAuctions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    Promise.all([
      fetch("http://127.0.0.1:8000/auctions/joined/active", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),

      fetch("http://127.0.0.1:8000/auctions/joined/finished", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),
    ])
      .then(([activeData, finishedData]) => {
        setActiveAuctions(activeData);
        setFinishedAuctions(finishedData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Katıldığım ihaleler alınamadı:", err);
        setLoading(false);
      });
  }, []);

  const formatLocalTime = (utcString: string) => {
    const date = new Date(utcString);
    const localDate = new Date(date.getTime() + 3 * 60 * 60 * 1000);
    return localDate.toLocaleString();
  };

  if (loading) {
    return <div className="text-center text-gray-500 mt-20">Yükleniyor...</div>;
  }

  return (
    <div className="bg-white min-h-screen py-10 px-6">
      <div className="max-w-7xl mx-auto">

        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8 flex items-center justify-center gap-2">
          <FaHandshake className="text-green-600" /> Katıldığım Aktif İhaleler
        </h1>

        {activeAuctions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-gray-100 rounded-xl shadow-md mt-6 max-w-md mx-auto">
            <p className="text-lg font-semibold text-gray-700 text-center">
              Katıldığınız aktif ihale bulunmamaktadır.
            </p>
            <p className="text-sm text-gray-500 text-center mt-1">
              Yeni ihaleler yakında burada listelenecektir.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center mb-12">
            {activeAuctions.map((auction) => (
              <div
                key={auction.id}
                className="bg-white border border-gray-200 text-gray-800 rounded-2xl shadow-md p-6 w-full max-w-sm transition-transform transform hover:scale-105 hover:shadow-lg hover:border-green-500"
              >
                <h2
                  className="text-xl font-bold text-green-700 mb-3 truncate"
                  title={auction.product?.name || "Belirsiz Ürün"}
                >
                  {auction.product?.name || "Belirsiz Ürün"}
                </h2>

                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Başlangıç:</span> {formatLocalTime(auction.start_time)}</p>
                  <p><span className="font-medium">Bitiş:</span> {formatLocalTime(auction.end_time)}</p>
                  <p><span className="font-medium">Fiyat:</span> <span className="text-green-600 font-bold">{auction.current_price} ₺</span></p>
                  <p><span className="font-medium">Tip:</span> {auction.auction_type === "highest" ? "En Yüksek Teklif" : "En Düşük Teklif"}</p>
                </div>

                <button
                  onClick={() => router.push(`/supplier/auctions/active/detail/${auction.id}`)}
                  className="mt-5 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                >
                  İhaleye Git
                </button>
              </div>
            ))}
          </div>
        )}

        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8 flex items-center justify-center gap-2">
          <FaHandshake className="text-gray-500" /> Katıldığım Bitmiş İhaleler
        </h1>

        {finishedAuctions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-gray-100 rounded-xl shadow-md mt-6 max-w-md mx-auto">
            <p className="text-lg font-semibold text-gray-700 text-center">
              Katıldığınız bitmiş ihale bulunmamaktadır.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center">
            {finishedAuctions.map((auction) => (
              <div
                key={auction.id}
                className="bg-gray-50 border border-gray-200 text-gray-800 rounded-2xl shadow-md p-6 w-full max-w-sm transition-transform transform hover:scale-105 hover:shadow-lg hover:border-gray-400"
              >
                <h2
                  className="text-xl font-bold text-gray-700 mb-3 truncate"
                  title={auction.product?.name || "Belirsiz Ürün"}
                >
                  {auction.product?.name || "Belirsiz Ürün"}
                </h2>

                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Başlangıç:</span> {formatLocalTime(auction.start_time)}</p>
                  <p><span className="font-medium">Bitiş:</span> {formatLocalTime(auction.end_time)}</p>
                  <p><span className="font-medium">Fiyat:</span> <span className="text-green-600 font-bold">{auction.current_price} ₺</span></p>
                  <p><span className="font-medium">Tip:</span> {auction.auction_type === "highest" ? "En Yüksek Teklif" : "En Düşük Teklif"}</p>
                </div>

                <button
                  onClick={() => router.push(`/supplier/auctions/joined/detail/${auction.id}`)}
                  className="mt-5 w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition"
                >
                  Detaya Git
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
