"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import ChatWidget from "../../../components/ChatWidget";
import { API_BASE, authHeaders } from "../../../components/api";

type User = { id: number; name?: string; email?: string; company_id?: number };
type Conversation = {
  id: number;
  auction_id: number;
  customer_company_id: number;
  supplier_company_id: number;
  status: "active" | "closed" | string;
  created_at: string;
  participants: { user_id: number; role: "customer" | "supplier" | string }[];
  last_message?: any;
};

export default function CustomerConversationPage() {
  const params = useParams<{ id: string }>();
  const convId = Number(params.id);

  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<User | null>(null);
  const [conv, setConv] = useState<Conversation | null>(null);
  const [companyName, setCompanyName] = useState<string>(""); 
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, []);

  useEffect(() => {
    if (!token || !convId) return;
    let alive = true;
    (async () => {
      try {
        const [meRes, convRes] = await Promise.all([
          fetch(`${API_BASE}/users/me`, { headers: authHeaders(token, false), cache: "no-store" }),
          fetch(`${API_BASE}/conversations/${convId}`, {
            headers: authHeaders(token, false),
            cache: "no-store",
          }),
        ]);
        if (!meRes.ok || !convRes.ok) {
          if (alive) {
            setAllowed(false);
            setLoading(false);
          }
          return;
        }
        const [meData, convData] = await Promise.all([meRes.json(), convRes.json()]);
        if (alive) {
          setMe(meData);
          setConv(convData);
          setAllowed(true);
          setLoading(false);
        }
      } catch {
        if (alive) {
          setAllowed(false);
          setLoading(false);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [token, convId]);

  useEffect(() => {
    if (!token || !conv || !me?.company_id) return;

    const myCompanyId = me.company_id;
    const counterpartyCompanyId =
      myCompanyId === conv.customer_company_id ? conv.supplier_company_id : conv.customer_company_id;

    (async () => {
      try {
        const r = await fetch(`${API_BASE}/companies/${counterpartyCompanyId}`, {
          headers: authHeaders(token, false),
          cache: "no-store",
        });
        if (!r.ok) return;
        const data = await r.json();
        setCompanyName(data?.name || "");
      } catch {}
    })();
  }, [token, conv, me]);

  const counterpartyRole = useMemo(() => {
    if (!me || !conv) return null;
    const other = conv.participants.find((p) => p.user_id !== me.id);
    return other?.role ?? null;
  }, [me, conv]);

  if (!token) return <div className="p-6">Giriş gerekiyor.</div>;
  if (loading) return <div className="p-6">Yükleniyor…</div>;
  if (allowed === false || !conv) return <div className="p-6">Erişim yok.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white" data-app-header>
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-500">Konuşma #{conv.id}</div>
            <h1 className="text-lg font-semibold text-gray-900">
              {counterpartyRole === "supplier" ? "Tedarikçi ile Sohbet" : "Müşteri ile Sohbet"}
            </h1>
          </div>
          <div>
            <span
              className={
                "px-3 py-1 rounded-full text-xs font-semibold " +
                (conv.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700")
              }
            >
              {conv.status === "active" ? "AKTİF" : "KAPALI"}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4">
        <div className="max-w-5xl mx-auto">
          <div className="mt-6 flex justify-center">
            <div className="w-full max-w-2xl">
              <ChatWidget
                key={convId}
                conversationId={convId}
                token={token}
                currentUserId={me?.id ?? 0}
                title={companyName || "Sohbet"}
                initialPageSize={50}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
