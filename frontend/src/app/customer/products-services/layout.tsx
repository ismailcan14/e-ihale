import type { ReactNode } from "react";

export default function ProductLayout({
  children,
  modal,
}: { children: ReactNode; modal: ReactNode }) {
  return (
<>{children}{modal ?? null}</>

  );
}











