'use client'

import { useEffect, useState } from "react"
console.log("🚨 DashboardPage ÇALIŞTI!");
export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState<any>(null) 
  const [company, setCompany] = useState<any>(null)
  //useState yapısını öğrenmiştim zaten. 2 adet veri tutan bir dizi oluşturulur birinde değeri atacağımız veri diğerinde ise o veriyi dolduracağımız fonksiyon bulunur. useState boş olarak oluşturulur ve setUser ile setCompany adlı fonksiyonlar veriyi çekip user ve company adlı değişkenlere atarlar. Kanca denmesinin sebebi de budur aslında. Veriyi tutar ve çeker. 

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return

    // 1. Kullanıcıyı al
    fetch("http://127.0.0.1:8000/users/me", {
      headers: {
        Authorization: `Bearer ${token}`, //burada users/me yoluna giden istekler sadece giriş yapmış kullanıcılar için geçerlidir. harici olarak ulaşılamaz. Biz JWT Token ı Authorization başlığı ile göndererek "ben giriş yapmış kullanıcıyım" diyoruz.FastApi bu token ı çözüp  kullancıyı doğrularsa kimliğimizi onaylar ve bize geri yanıt döner. Bearer(taşıyıcı) ise Token ile kimlik doğrulama yapılan şemadır.FastAPI gibi backend sistemleri bu formatı bekler ve bu şekilde token'ı çözümler. Yani kısaca Token ın çözümlenmesi için gereken schemadır.
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setUser(data)

        //burada fetch fonksiyonu ile token ile beraber api yoluna bir istekte bulunuyoruz. bu yol bize giriş yapan kullanıcının verilerini geri döndürüyor. dönen verinin json formatı alınır ve data adlı nesneye yollanır. setUser kancası ile de data nesnesi yollanır yukarıda user nesnesine veriler aktarılır.


        // 2. Şirket bilgilerini al
        return fetch(`http://127.0.0.1:8000/companies/${data.company_id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      })
      .then((res) => res.json())
      .then((companyData) => {
        setCompany(companyData)
      })
      .catch((err) => {
        console.error("Veriler alınırken hata oluştu:", err)
      })
  }, [])
 
  if (!user || !company) return <p className="text-gray-600">Yükleniyor...</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Profil Bilgileri</h2>
<p className="mb-2">
  <span className="font-semibold text-black">Ad:</span> <span className="text-black">{user.name}</span>
</p>
<p className="mb-2">
  <span className="font-semibold text-black">Email:</span> <span className="text-black">{user.email}</span>
</p>
<p className="mb-2">
  <span className="font-semibold text-black">Şirket ID:</span> <span className="text-black">{user.company_id}</span>
</p>
<p className="mb-2">
  <span className="font-semibold text-black">Rol:</span>{" "}
  <span className="text-black">
    {user.role_id === 1
      ? "Admin"
      : user.role_id === 2
      ? "Müdür"
      : user.role_id === 3
      ? "Personel"
      : "Bilinmeyen Rol"}
  </span>
</p>
<p className="mb-2">
  <span className="font-semibold text-black">Şirket Tipi:</span>{" "}
  <span className="text-black">
    {company?.type === "customer"
      ? "Müşteri"
      : company?.type === "supplier"
      ? "Tedarikçi"
      : "Bilinmeyen"}
  </span>
</p>

    </div>
  );
}