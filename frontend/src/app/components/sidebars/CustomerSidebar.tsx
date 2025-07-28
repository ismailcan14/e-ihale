"use client"
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { path: "/customer", label: "Profilim" },
  { path: "/customer/create-auction", label: "Yeni İhale Oluştur" },       
  { path: "/customer/published-auction", label: "Yayınlanmış İhaleler" }, 
  { path: "/customer/offers", label: "Gelen Teklifler" },                  
  { path: "/customer/winner-selection", label: "Kazanan Belirleme" },      
  { path: "/customer/update-auction", label: "İhale Güncelleme" },         
  { path: "/customer/auction-history", label: "İhale Geçmişi" },           
  { path: "/customer/supplier-management", label: "Tedarikçi Yönetimi" }, 
  { path: "/customer/reports", label: "Raporlar" },                        
];

export default function CustomerSidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white border-r border-gray-200 p-6 space-y-4 shadow">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Müşteri Paneli</h2>
      {menuItems.map((item) => (
        <Link
          key={item.path}
          href={item.path}
          className={`block px-4 py-2 rounded font-medium ${
            pathname === item.path ? "bg-blue-600 text-white" : "hover:bg-blue-100 text-gray-800"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
