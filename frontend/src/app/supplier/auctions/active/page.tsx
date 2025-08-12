"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaGavel } from "react-icons/fa";

export default function ActiveSupplierAuctionsPage() {
  const [activeAuctions, setActiveAuctions] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("http://127.0.0.1:8000/auctions/active", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const active = data.filter((a: any) => a.status === "active");
        setActiveAuctions(active);
      })
      .catch((err) =>
        console.error("Aktif ihaleler alınamadı (supplier):", err)
      );
  }, []);

  const formatLocalTime = (utcString: string) => {
    const date = new Date(utcString);
    const localDate = new Date(date.getTime() + 3 * 60 * 60 * 1000);
    return localDate.toLocaleString();
  };

  return (
    <div className="bg-white min-h-screen py-10 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8 flex items-center justify-center gap-2">
          <FaGavel className="text-green-600" /> Aktif İhaleler
        </h1>

        {activeAuctions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-gray-100 rounded-xl shadow-md mt-10 max-w-md mx-auto">
            <svg
              className="w-20 h-20 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-lg font-semibold text-gray-700 text-center">
              Şu anda aktif ihale bulunmamaktadır.
            </p>
            <p className="text-sm text-gray-500 text-center mt-1">
              Yeni ihaleler yakında burada listelenecektir.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 justify-items-center">
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
                  <p className="flex items-center">
                    <span className="font-medium text-gray-600 mr-2 min-w-[90px]">
                      Başlangıç:
                    </span>
                    <span>{formatLocalTime(auction.start_time)}</span>
                  </p>
                  <p className="flex items-center">
                    <span className="font-medium text-gray-600 mr-2 min-w-[90px]">
                      Bitiş:
                    </span>
                    <span>{formatLocalTime(auction.end_time)}</span>
                  </p>
                  <p className="flex items-center">
                    <span className="font-medium text-gray-600 mr-2 min-w-[90px]">
                      Fiyat:
                    </span>
                    <span className="text-base font-bold text-green-600">
                      {auction.current_price || auction.starting_price} ₺
                    </span>
                  </p>
                  <p className="flex items-center">
                    <span className="font-medium text-gray-600 mr-2 min-w-[90px]">
                      Tip:
                    </span>
                    <span>
                      {auction.auction_type === "highest"
                        ? "En Yüksek Teklif"
                        : "En Düşük Teklif"}
                    </span>
                  </p>
                </div>

                <button
                  onClick={() =>
                    router.push(`/supplier/auctions/active/detail/${auction.id}`)
                  }
                  className="mt-5 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
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
