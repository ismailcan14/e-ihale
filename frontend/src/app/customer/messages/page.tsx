"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000";

type ConvItem = {
  id: number;
  auction_id: number;
  status: string;
  created_at: string | null;
  counterparty: { user_id: number; role: string; company_name?: string | null } | null;
  last_message: {
    id: number;
    content: string | null;
    created_at: string | null;
    sender_id: number;
  } | null;
  unread_count: number;
};

export default function CustomerInboxPage() {
  const [token, setToken] = useState<string | null>(null);
  const [list, setList] = useState<ConvItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const fetchList = async () => {
      try {
        const r = await fetch(`${API_BASE}/conversations/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) throw new Error(await r.text());
        const data = (await r.json()) as ConvItem[];
        if (!cancelled) {
          setList(data);
          setLoading(false);
        }
      } catch (e) {
        console.error("inbox fetch error:", e);
        if (!cancelled) setLoading(false);
      }
    };
    
    fetchList();
    const t = setInterval(fetchList, 10000); 
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [token]);

  if (!token) return <div className="p-6">Giriş gerekiyor.</div>;
  if (loading) return <div className="p-6">Yükleniyor…</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow p-5">
          <h1 className="text-2xl font-bold">Mesajlar</h1>
        </div>

        <div className="bg-white rounded-xl shadow divide-y">
          {list.length === 0 && (
            <div className="p-6 text-gray-600">Henüz konuşma yok.</div>
          )}

          {list.map((c) => (
            <Link
              key={c.id}
              href={`/customer/messages/conversations/${c.id}`}
              className="flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-gray-900 truncate">
                    {c.counterparty?.company_name ?? "Karşı taraf"}
                  </div>
                  <div className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                    İhale #{c.auction_id}
                  </div>
                </div>
                <div className="text-sm text-gray-600 truncate mt-1">
                  {c.last_message?.content ?? "(mesaj yok)"}
                </div>
              </div>

              <div className="flex items-end gap-3">
                <div className="text-xs text-gray-500">
                  {c.last_message?.created_at
                    ? new Date(c.last_message.created_at).toLocaleString()
                    : ""}
                </div>
                {c.unread_count > 0 && (
                  <div className="text-xs min-w-6 h-6 px-2 flex items-center justify-center rounded-full bg-blue-600 text-white">
                    {c.unread_count}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
