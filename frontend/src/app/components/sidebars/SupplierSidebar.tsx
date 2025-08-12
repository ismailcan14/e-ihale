"use client";
//Mantığı customerSidebar ile birebir aynı
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const menuItems = [
  { path: "/supplier", label: "Profilim", roles: ["admin", "müdür", "personel"] },
  {
    label: "İhaleler",
    roles: ["admin", "müdür","personel"],
    subItems: [
      { path: "/supplier/auctions/active", label: "Aktif İhaleler", roles: ["admin", "müdür"], key: "active" },
      { path: "/supplier/auctions/joined", label: "Katıldığım İhaleler", roles: ["admin", "müdür"], key: "finished" },
    ],
  },
  { path: "/supplier/bid-history", label: "Teklif Geçmişi", roles: ["admin", "müdür", "personel"] },
  { path: "/supplier/live-bidding", label: "Canlı Teklifler", roles: ["admin", "müdür", "personel"] },
  { path: "/supplier/reports", label: "Raporlar", roles: ["admin", "müdür"] },
  { path: "/supplier/add-employee", label: "Çalışan Ekle", roles: ["admin"] },
];

interface SupplierSidebarProps {
  userRole: "admin" | "müdür" | "personel";
}

export default function SupplierSidebar({ userRole }: SupplierSidebarProps) {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const allowedItems = menuItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <div className="w-64 fixed top-0 left-0 h-screen bg-white border-r border-gray-200 p-6 space-y-4 shadow">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Tedarikçi Paneli</h2>

      {allowedItems.map((item) => (
        <div key={item.path || item.label}>
          {item.subItems ? (
            <div
              onClick={() => toggleMenu(item.label)}
              className="cursor-pointer px-4 py-2 rounded font-medium text-gray-800 hover:bg-green-100 transition flex justify-between items-center"
            >
              <span>{item.label}</span>
              <span className="text-sm">
                {openMenus.includes(item.label) ? "▲" : "▼"}
              </span>
            </div>
          ) : (
            <Link
              href={item.path}
              className={`block px-4 py-2 rounded font-medium ${
                pathname === item.path
                  ? "bg-green-600 text-white"
                  : "hover:bg-green-100 text-gray-800"
              }`}
            >
              {item.label}
            </Link>
          )}

          {item.subItems && openMenus.includes(item.label) && (
            <div className="ml-4 mt-1 space-y-1">
              {item.subItems.map((subItem) => (
                <Link
                  key={subItem.path}
                  href={subItem.path}
                  className={`block px-4 py-1 rounded text-sm ${
                    pathname === subItem.path
                      ? "bg-green-500 text-white"
                      : "hover:bg-green-100 text-gray-700"
                  }`}
                >
                  {subItem.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
