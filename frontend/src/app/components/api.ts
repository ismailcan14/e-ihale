export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000";

export function httpToWs(base: string) {
  const isHttps = base.startsWith("https://");
  const host = base.replace(/^https?:\/\//, "");
  return `${isHttps ? "wss://" : "ws://"}${host}`;
}

export function authHeaders(token: string, isJson = true) {
  const h: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (isJson) h["Content-Type"] = "application/json";
  return h;
}
