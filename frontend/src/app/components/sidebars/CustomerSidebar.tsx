"use client";
//Bu dosyanın bir Client Component olduğunu belirtir. Çünkü usePathname gibi React hook'ları sadece client bileşenlerde kullanılabilir.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const menuItems = [
  { path: "/customer", label: "Profilim", roles: ["admin", "müdür", "personel"] },
  { path: "/customer/create-auction", label: "Yeni İhale Oluştur", roles: ["admin", "müdür"] },
{
  label: "İhalelerim",
  roles: ["admin", "müdür", "personel"],
  subItems: [
    { path: "/customer/auctions/active", label: "Aktif", roles: ["admin", "müdür", "personel"], key: "active" },
    { path: "/customer/auctions/pending", label: "Bekleyen", roles: ["admin", "müdür", "personel"], key: "pending" },
    { path: "/customer/auctions/finished", label: "Bitmiş", roles: ["admin", "müdür", "personel"], key: "finished" },
  ],
},
  { path: "/customer/offers", label: "Gelen Teklifler", roles: ["admin", "müdür"] },
  { path: "/customer/winner-selection", label: "Kazanan Belirleme", roles: ["admin"] },
  { path: "/customer/update-auction", label: "İhale Güncelleme", roles: ["admin", "müdür"] },
  { path: "/customer/auction-history", label: "İhale Geçmişi", roles: ["admin", "müdür", "personel"] },
  { path: "/customer/supplier-management", label: "Tedarikçi Yönetimi", roles: ["admin"] },
  { path: "/customer/reports", label: "Raporlar", roles: ["admin", "müdür"] },
  { path: "/customer/add-employee", label: "Çalışan Ekle", roles: ["admin"] }, 
];

// path tıklandığında açılacak sayfanın yolunu label tıklanan yazıyı roles ise hangi rollerde bu özelliğin gözükeceğini ifade eder.


interface CustomerSidebarProps {
  userRole: "admin" | "müdür" | "personel";
} //layouttan   <CustomerSidebar userRole={userRole} /> şeklinde yolladığımız userRole propu burada kontrol ediliyor. Eğer bu 3 değerden biri değilse hata mesajı döner. bu 3ünden biri olduğunda ise alttaki fonksiyona parametre olarak gidiyor.

export default function CustomerSidebar({ userRole }: CustomerSidebarProps) {
  //fonksiyon oluşturuyoruz ve parametre olarak userRole değişkenini parametre olarak alıyoruz. bu parametre CustomerSidebarPropsundan gelcek ifade oluyor.
  const pathname = usePathname(); //mevcut sayfa yolunu bize veriyor.
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

 
  const allowedItems = menuItems.filter((item) => item.roles.includes(userRole)); //menuItemsde bunun roles bilgilerini userRole e göre kontrol eder. Eğer userRole den gelen role bilgisi menuItems dizisinin bir satırında yoksa o satırı dahil etmez sadece olanları dahil eder ve allowedItems adlı değişkende bu satırlar tutulur.

   return (
    <div className="w-64 fixed top-0 left-0 h-screen bg-white border-r border-gray-200 p-6 space-y-4 shadow" >
      <h2 className="text-xl font-bold text-gray-800 mb-6">Müşteri Paneli</h2>

      {allowedItems.map((item) => (
        <div key={item.path || item.label}>
          {item.subItems ? (
            <div
              onClick={() => toggleMenu(item.label)}
              className="cursor-pointer px-4 py-2 rounded font-medium text-gray-800 hover:bg-blue-100 transition flex justify-between items-center"
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
                  ? "bg-blue-600 text-white"
                  : "hover:bg-blue-100 text-gray-800"
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
                      ? "bg-blue-500 text-white"
                      : "hover:bg-blue-100 text-gray-700"
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
