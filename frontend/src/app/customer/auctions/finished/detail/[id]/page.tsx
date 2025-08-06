"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BoltIcon } from "@heroicons/react/24/solid";

export default function FinishedAuctionDetailPage() {
  const { id } = useParams();
  const [auction, setAuction] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [winnerBidId, setWinnerBidId] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`http://127.0.0.1:8000/auctions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setAuction(data));

    fetch(`http://127.0.0.1:8000/bids/auction/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setBids(data);

        if (data.length > 0) {
          const sorted = [...data].sort((a, b) =>
            auction?.auction_type === "lowest"
              ? a.amount - b.amount
              : b.amount - a.amount
          );
          setWinnerBidId(sorted[0].id); // ilk teklif kazanan
        }
      });
  }, [id, auction?.auction_type]);

  

  if (!auction) return <p className="text-center text-gray-500">Yükleniyor...</p>;

  const formatTime = (time: string) =>
    new Date(time).toLocaleString("tr-TR", { hour12: false });

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-100 to-slate-200 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white shadow-xl rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-blue-800 mb-6 text-center">
          {auction.product?.name || "İhale Detayı"}
        </h1>

        <div className="grid grid-cols-2 gap-4 text-gray-700 mb-6">
          <p><span className="font-medium">Başlangıç:</span> {formatTime(auction.start_time)}</p>
          <p><span className="font-medium">Bitiş:</span> {formatTime(auction.end_time)}</p>
          <p><span className="font-medium">Tip:</span> {auction.auction_type === "highest" ? "En Yüksek" : "En Düşük"}</p>
          <p><span className="font-medium">Başlangıç Fiyatı:</span> {auction.starting_price} ₺</p>
          <p><span className="font-medium text-green-700">Kapanış Fiyatı:</span> {auction.current_price} ₺</p>

        <button
  onClick={() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("PDF indirilemedi: Giriş yapılmamış.");
      return;
    }

    fetch(`http://127.0.0.1:8000/reports/${id}/report-pdf`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Rapor indirilemedi: ${res.status}`);
        }
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ihale_${id}_raporu.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => {
        console.error("PDF indirme hatası:", err);
        alert("PDF indirilemedi. Yetki eksik veya sistemsel bir hata oluştu.");
      });
  }}
  className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
>
  Raporu PDF Olarak İndir
</button>


        </div>

        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <BoltIcon className="h-6 w-6 text-yellow-500" />
          Tüm Teklifler
        </h2>

        {bids.length === 0 ? (
          <p className="text-center text-gray-500">Hiç teklif verilmemiş.</p>
        ) : (
          <ul className="space-y-3">
            {bids.map((bid) => (
              <li
                key={bid.id}
                className={`p-4 rounded-lg border ${
                  bid.id === winnerBidId
                    ? "bg-green-100 border-green-400 shadow-md"
                    : "bg-gray-100 border-gray-300"
                }`}
              >
                <div className="text-lg font-semibold text-gray-800">{bid.amount} ₺</div>
                <div className="text-sm text-gray-500">{new Date(bid.timestamp).toLocaleTimeString()}</div>
                <div className="text-sm text-gray-700 italic">
                  {`${bid.user_info.company} şirketinden ${bid.user_info.name} (${bid.user_info.role})`}
                </div>
                {bid.id === winnerBidId && (
                  <div className="mt-2 text-green-700 font-bold text-sm">✅ Kazanan Teklif</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
