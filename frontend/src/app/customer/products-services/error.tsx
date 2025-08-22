"use client";
export default function Error({ error }: { error: Error }) {
  return <pre style={{ padding: 16 }}>{error.message}</pre>;
}