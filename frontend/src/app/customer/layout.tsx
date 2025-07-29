"use client";

import { useEffect, useState } from "react";
import Header from "../components/Header";
import CustomerSidebar from "../components/sidebars/CustomerSidebar";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const [userRole, setUserRole] = useState<"admin" | "müdür" | "personel" | null>(null);
  //role bilgisini tutacak userRole değişeni ilk olarak null olur. bu bilgiyi setUserRole ile çekicez.

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    //useEffect fonksiyonu ile sayfa yüklendiğinde çalıaşacak şekilde token adlı değişkene yerel depoda token keyi ile bulunan token bilgisi atıyoruz . Bu değer boş ise fonksiyondan çıkılıyor.

    fetch("http://127.0.0.1:8000/users/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      }, //Belirtilen yola bir get isteği atıyoruz. bu istek jwt token doğrulanmış kişiyi bize geri döndürüyor. İsteği atarken token ile atıyoruz. çünkü ben giriş yaptım ve bu da tokenım diyoruz. bu istekten bize giriş yapan kullanıcının tüm bilgileri dönüyor.
    })
      .then((res) => res.json()) //Gelen istek json formatına dönştürülüyor. res ise Response sınıfının bir nesnesi. dönüşüm asenkron oldugu için then zincirine ekleniyor.
      .then((user) => { //Burada gelen verinin artık user nesnesinde tutulduğunu belirtiyoruz.
        const roleMap = {
          1: "admin",
          2: "müdür",
          3: "personel",
        } as const; //Burada bir rol eşleşme yapısı oluşturuyoruz. gelen verideki role_id hangi sayıyla eşleşirse  o değer geri döndürülüyor.

        setUserRole(roleMap[user.role_id]); //role id yi roleMap e atıyoruz ve rolümüzü string olarak elde ediyoruz.
      })
      .catch((err) => console.error("Rol alınamadı:", err)); //Role alınamazsa hata mesajı donduruyoruz.
  }, []);

  if (!userRole) return <p>Yükleniyor...</p>; //userRole null olarak başladığından dolayı eğer hala null ise return kısmı renderlenmeden yükleniyor yazısı ile sistem bekletiliyor.

  return (
    <div className="min-h-screen flex bg-gray-100">
      <CustomerSidebar userRole={userRole} />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-10 bg-white flex-1">{children}</main>
      </div>
    </div>
  );
}
