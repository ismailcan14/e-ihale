import type { ReactNode } from "react";

export default function EmployeesLayout({
  children,
  modal,
}: { children: ReactNode; modal: ReactNode }) {
  return (
    <>
      {children}
      {modal }
    </>
  );
}