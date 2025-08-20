"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE, authHeaders, httpToWs } from "./api";

type WSMessage =
  | { type: "connected"; payload: { conversation_id: number; user_id: number } }
  | { type: "message:new"; payload: any }
  | { type: "typing"; payload: { user_id: number; is_typing: boolean } }
  | { type: "receipt:read"; payload: { user_id: number; last_read_message_id: number } }
  | { type: "pong" }
  | { type: "error"; message: string };

type ChatWidgetProps = {
  conversationId: number;
  token: string;
  currentUserId?: number;
  initialPageSize?: number;
  title?: string;
};

export default function ChatWidget({
  conversationId,
  token,
  currentUserId,
  initialPageSize = 50,
  title = "Sohbet",
}: ChatWidgetProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [meId, setMeId] = useState<number | null>(currentUserId ?? null);
  const [showScrollDown, setShowScrollDown] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // currentUserId gelmediyse kendimi çek
  useEffect(() => {
    if (currentUserId != null) {
      setMeId(currentUserId);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/users/me`, { headers: authHeaders(token, false) });
        if (!r.ok) return;
        const me = await r.json();
        if (!cancelled) setMeId(me?.id ?? null);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [currentUserId, token]);

  // ilk mesajlar
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(
          `${API_BASE}/conversations/${conversationId}/messages/list?limit=${initialPageSize}`,
          { headers: authHeaders(token, false), cache: "no-store" }
        );
        if (!r.ok) throw new Error(await r.text());
        const data = await r.json();
        if (!cancelled) setMessages(data);
      } catch (e) {
        console.error("Mesajlar alınamadı:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId, token, initialPageSize]);

  // ws
  useEffect(() => {
    const url = `${httpToWs(API_BASE)}/ws/conversations/${conversationId}?token=${encodeURIComponent(
      token
    )}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      ws.send(JSON.stringify({ type: "ping" }));
    };
    ws.onmessage = (ev) => {
      try {
        const evt = JSON.parse(ev.data) as WSMessage;
        if (evt.type === "message:new") {
          setMessages((prev) => [...prev, evt.payload]);
        } else if (evt.type === "typing") {
          setTyping(evt.payload.is_typing);
        }
      } catch {}
    };
    ws.onclose = () => {
      setWsConnected(false);
      wsRef.current = null;
    };

    return () => {
      try {
        ws.close();
      } catch {}
    };
  }, [conversationId, token]);

  // yazıyor bilgisi
  const sendTyping = (isTyping: boolean) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: "typing", payload: { is_typing: isTyping } }));
  };

  // mesaj gönder (önce WS, kapalıysa REST’e düş)
  const sendMessage = async () => {
    const text = input.trim();
    if (!text) return;

    const tryWs = () => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return false;
      wsRef.current.send(JSON.stringify({ type: "message:new", payload: { content: text } }));
      return true;
    };

    const viaWs = tryWs();
    if (!viaWs) {
      const r = await fetch(`${API_BASE}/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ content: text }),
      });
      if (!r.ok) {
        console.error("REST send failed", await r.text());
        return;
      }
    }

    setInput("");
    autoResizeTextArea();
    sendTyping(false);
  };

  // okundu + autoscroll
  useEffect(() => {
    if (!messages.length) return;
    const last = messages[messages.length - 1];
    if (last?.id && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ type: "receipt:read", payload: { last_read_message_id: last.id } })
      );
    }
    scrollToBottom(false);
  }, [messages]);

  // textarea auto-resize
  const autoResizeTextArea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  };
  useEffect(() => {
    autoResizeTextArea();
  }, [input]);

  // scroll kontrolü
  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 64;
    setShowScrollDown(!nearBottom);
  };
  const scrollToBottom = (smooth = true) => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  };

  // gün ayıracı
  const sections = useMemo(() => {
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const today = fmt(new Date());
    const yesterday = fmt(new Date(Date.now() - 24 * 60 * 60 * 1000));
    const out: { key: string; label: string; items: any[] }[] = [];
    let currentKey = "";
    let currentLabel = "";
    let bucket: any[] = [];
    for (const m of messages) {
      const k = fmt(new Date(m.created_at));
      if (k !== currentKey) {
        if (bucket.length) out.push({ key: currentKey, label: currentLabel, items: bucket });
        currentKey = k;
        currentLabel =
          k === today ? "Bugün" : k === yesterday ? "Dün" : new Date(m.created_at).toLocaleDateString();
        bucket = [m];
      } else {
        bucket.push(m);
      }
    }
    if (bucket.length) out.push({ key: currentKey, label: currentLabel, items: bucket });
    return out;
  }, [messages]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
      {/* üst çubuk */}
      <div className="px-4 py-3 border-b bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`h-2.5 w-2.5 rounded-full ${
                wsConnected ? "bg-emerald-500" : "bg-gray-400"
              } animate-pulse`}
              title={wsConnected ? "WS bağlı" : "WS kapalı (REST ile gönderilir)"}
            />
            <div className="text-sm font-semibold text-gray-900">{title}</div>
          </div>
          <div />
        </div>
      </div>

      {/* mesaj liste */}
      <div ref={listRef} onScroll={onScroll} className="h-[520px] overflow-y-auto p-4 bg-gray-50 relative">
        {sections.map((sec) => (
          <div key={sec.key}>
            <div className="sticky top-2 z-10 flex justify-center mb-3">
              <span className="text-[11px] px-2 py-1 rounded-full bg-gray-200 text-gray-700 shadow-sm">
                {sec.label}
              </span>
            </div>

            {sec.items.map((m: any) => {
              const mine = meId != null && m.sender_id === meId;
              const time = m.created_at ? new Date(m.created_at).toLocaleTimeString() : "";
              const isText = m.message_type === "text";
              return (
                <div key={m.id} className={`mb-3 flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[78%] rounded-2xl px-3 py-2 shadow-sm ${
                      mine ? "bg-blue-600 text-white rounded-br-none" : "bg-white text-gray-900 rounded-bl-none border"
                    }`}
                  >
                    {isText ? (
                      <p className="whitespace-pre-wrap break-words leading-relaxed">{m.content}</p>
                    ) : (
                      <p className="italic opacity-70">desteklenmeyen içerik</p>
                    )}
                    <div className={`mt-1 text-[11px] ${mine ? "text-blue-100" : "text-gray-500"}`}>{time}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {typing && (
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-pulse" />
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-pulse [animation-delay:120ms]" />
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-pulse [animation-delay:240ms]" />
            </div>
            yazıyor…
          </div>
        )}

        {showScrollDown && (
          <button
            onClick={() => scrollToBottom()}
            className="absolute right-4 bottom-4 rounded-full bg-white border shadow px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
            title="En alta in"
          >
            ↓ En alta in
          </button>
        )}
      </div>

      {/* composer */}
      <div className="px-4 py-3 bg-white border-t">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              sendTyping(true);
            }}
            onBlur={() => sendTyping(false)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Mesaj yaz…"
            className="flex-1 resize-none leading-6 rounded-xl border border-gray-300 bg-white px-3 py-2 text-[15px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="select-none inline-flex items-center gap-2 rounded-xl bg-blue-600 text-white px-4 py-2.5 text-sm font-medium shadow hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title={wsConnected ? "Gönder (WS)" : "Gönder (REST yedek)"}
          >
            Gönder
          </button>
        </div>
      </div>
    </div>
  );
}
