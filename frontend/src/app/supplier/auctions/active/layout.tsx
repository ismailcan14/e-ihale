import type { ReactNode } from "react";

export default function Layout({
  children, //ihalelerin sergilendiği sayfa
  modal,    //ihaleye tıklandığında çıkan detay kutucuğu
}: {
  children: ReactNode; 
  modal: ReactNode;
}) {
  return (
    <>
      {children}    {/* ana sayfa sergilenmeye devam etsin */}
      {modal ?? null}   {/* modal yani detay kutucuğu boş değilse sergilensin*/}
    </> 
  );
}
