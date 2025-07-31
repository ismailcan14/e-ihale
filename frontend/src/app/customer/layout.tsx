"use client";

import { useEffect, useState } from "react";
import Header from "../components/Header";
import CustomerSidebar from "../components/sidebars/CustomerSidebar";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const [userRole, setUserRole] = useState<"admin" | "müdür" | "personel" | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch("http://127.0.0.1:8000/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((user) => {
        const roleMap = {
          1: "admin",
          2: "müdür",
          3: "personel",
        } as const;

        setUserRole(roleMap[user.role_id]);
      })
      .catch((err) => console.error("Rol alınamadı:", err));
  }, []);

  return (
    <div className="min-h-screen flex bg-gray-100">
      <div className="w-64 flex-shrink-0"> 
        {userRole ? (
          <CustomerSidebar userRole={userRole} />
        ) : (
          <div className="text-gray-500 p-4">Yükleniyor...</div>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-10 bg-white flex-1"> 
          {children}
        </main>
      </div>
    </div>
  );
}