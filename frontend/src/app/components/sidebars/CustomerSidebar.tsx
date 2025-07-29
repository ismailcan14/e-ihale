"use client";
//Bu dosyanın bir Client Component olduğunu belirtir. Çünkü usePathname gibi React hook'ları sadece client bileşenlerde kullanılabilir.

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { path: "/customer", label: "Profilim", roles: ["admin", "müdür", "personel"] },
  { path: "/customer/create-auction", label: "Yeni İhale Oluştur", roles: ["admin", "müdür"] },
  { path: "/customer/published-auction", label: "Yayınlanmış İhaleler", roles: ["admin", "müdür"] },
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

  const allowedItems = menuItems.filter((item) => item.roles.includes(userRole)); //menuItemsde bunun roles bilgilerini userRole e göre kontrol eder. Eğer userRole den gelen role bilgisi menuItems dizisinin bir satırında yoksa o satırı dahil etmez sadece olanları dahil eder ve allowedItems adlı değişkende bu satırlar tutulur.

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-6 space-y-4 shadow">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Müşteri Paneli</h2>
      {allowedItems.map((item) => (
        <Link
          key={item.path}
          href={item.path}
          className={`block px-4 py-2 rounded font-medium ${
            pathname === item.path
              ? "bg-blue-600 text-white"
              : "hover:bg-blue-100 text-gray-800"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
