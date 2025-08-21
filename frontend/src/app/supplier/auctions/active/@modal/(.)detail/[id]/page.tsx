"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type Auction = {
  id: number;
  product?: { name?: string };
  start_time?: string;
  end_time?: string;
  auction_type?: "highest" | "lowest";
  current_price?: number;
  starting_price?: number;
  is_public_bids?: boolean;
};

type Bid = {
  id: number;
  amount: number;
  timestamp: string;
  user_info?: { company?: string; name?: string };
};


export default function InterceptedAuctionPeek() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
    
  const [auction, setAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`http://127.0.0.1:8000/auctions/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setAuction(data));

    fetch(`http://127.0.0.1:8000/bids/auction/${id}`)
      .then((r) => r.json())
      .then((data) => setBids((data as Bid[]).slice(0, 5)));
  }, [id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  const formatLocal = (s?: string) =>
    s ? new Date(s).toLocaleString() : "-";

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auction-peek-title"
      >
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => router.back()}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.18 }}
          className="relative mx-auto mt-16 w-full max-w-3xl rounded-2xl bg-white shadow-2xl"
        >
          <button
            onClick={() => router.back()}
            className="absolute -top-3 -right-3 bg-white border shadow px-3 py-1 rounded-full text-sm hover:bg-gray-50"
            aria-label="Kapat"
          >
            ×
          </button>

          <div className="p-6">
            {!auction ? (
              <div>Yükleniyor…</div>
            ) : (
              <>
                <h1
                  id="auction-peek-title"
                  className="text-2xl font-bold text-green-700 mb-1"
                >
                  {auction.product?.name || "Belirsiz Ürün"}
                </h1>
                <div className="text-sm text-gray-500 mb-4">#{auction.id}</div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                  <div>
                    <div className="font-medium text-gray-600">Başlangıç</div>
                    <div>{formatLocal(auction.start_time)}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-600">Bitiş</div>
                    <div>{formatLocal(auction.end_time)}</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-600">Tip</div>
                    <div>
                      {auction.auction_type === "highest"
                        ? "En Yüksek Teklif"
                        : "En Düşük Teklif"}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-600">Güncel Fiyat</div>
                    <div className="font-semibold text-green-700">
                      {auction.current_price ?? auction.starting_price} ₺
                    </div>
                  </div>

                </div>

                <h2 className="mt-6 mb-2 text-gray-600 font-semibold">Son Teklifler (özet)</h2>
                <ul className="max-h-56 overflow-auto border rounded-lg divide-y">
                  {bids.length ? (
                    bids.map((b) => (
                      <li
                        key={b.id}
                        className="p-3 text-sm flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium text-green-400">{b.amount} ₺</div>
                          <div className="text-gray-500 text-xs">
                            {new Date(b.timestamp).toLocaleString()}
                          </div>
                        </div>
                        {b.user_info && (
                          <div className="text-gray-600 text-xs">
                            {`${b.user_info.company ?? ""}${
                              b.user_info.company ? " – " : ""
                            }${b.user_info.name ?? ""}`}
                          </div>
                        )}
                      </li>
                    ))
                  ) : (
                    <li className="p-3 text-sm text-gray-500">
                      Henüz teklif yok.
                    </li>
                  )}
                </ul>

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    onClick={() => router.back()}
                    className="px-4 py-2 rounded-lg border bg-red-500 hover:bg-red-600"
                  >
                    Kapat
                  </button>
                  <a
                    href={`/supplier/auctions/active/detail/${auction.id}`}
                    className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                  >
                    Tam sayfa aç (Teklif ver)
                  </a>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
