"use client";

import { useEffect, useState } from "react";
import {
  FaUser,
  FaEnvelope,
  FaBuilding,
  FaUserShield,
  FaIndustry,
} from "react-icons/fa"; //porifl panelinde kullandıgımız iconları projeye tanımlıyoruz

export default function SupplierProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  //user ve şirket bilgileri tutacağımız değişkenlerin buluğunduğu ve bu değişkenleri dolduracağımız fonksiyonların bulundugu 2 adet state oluşturuyoruz

  useEffect(() => { //sayfa her yüklendiğinde 1 kere çalışan özel fonksiyonumuz useEffect fonksiyonumuzu oluşturuyoruz
    const token = localStorage.getItem("token"); //token verisini localStorage den çektik
    if (!token) return;

    fetch("http://127.0.0.1:8000/users/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      }, //giriş yapan kullanıcının verilerini almak için bir api isteği gönderiyoruz bu api isteği ile beraber tokenımız da gönderiliyor bu sayede backend bizim giriş yaptığımız bir kullanıcı oldugumuzu anlıyor ve bilgileri bize veriyor.
    })
      .then((res) => res.json())
      .then((data) => {
        setUser(data); //gelen veri res değişkeninde ham halde bulunuyor daha önce acıkladıgım gibi sadece belli özelliklere ulasabılıyoruz bu durumda res.ok veya başarılı veya başarısırız hata kodları gibi. veriye ulasmak icin data adlı değişkene res.json ile veriyi json formatına çevirip yolluyoruz. Ardından setUser ile data adlı değişkeni state e yolluyoruz. State de gelen verileri user adlı değişkende tutuyor. Bu sayede gelen verileri alt kısımda bulunan render edilecek return kısmında kullanabileceğiz.

        return fetch(`http://127.0.0.1:8000/companies/${data.company_id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      })
      .then((res) => res.json())
      .then((companyData) => {
        setCompany(companyData);
      })
      .catch((err) => {
        console.error("Veriler alınırken hata oluştu:", err);
      });
  }, []); //yukarıdaki mantıkla aynı şekilde userdan gelen şirket id si ile beraber apiye bir istekte bulunuyor ve şirket verileri çekip state e gönderiyoruz. şirket verilerimiz de company adlı nesnede tutulacak.

  if (!user || !company)
    return <p className="text-gray-600">Yükleniyor...</p>; //şirket ve user verileri hala boş ise yükleniyor şeklinde kullanıcıyı bekletiyoruz

  return (
    <div className="min-h-screen bg-white flex items-start justify-center pt-[72px] px-4 pb-10">
      <div className="w-full max-w-md bg-white border border-gray-300 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6 flex items-center justify-center gap-2">
          <FaUser className="text-green-600" /> Tedarikçi Profil Bilgileri
        </h2>

        <div className="space-y-4">
          <ProfileItem icon={<FaUser />} label="Ad" value={user.name} />
          <ProfileItem
            icon={<FaUserShield />}
            label="Rol"
            value={
              user.role_id === 1
                ? "Admin"
                : user.role_id === 2
                ? "Müdür"
                : user.role_id === 3
                ? "Personel"
                : "Bilinmeyen Rol"
            }
          />
          <ProfileItem icon={<FaEnvelope />} label="Email" value={user.email} />
          <ProfileItem icon={<FaBuilding />} label="Şirket Adı" value={company.name} />
          <ProfileItem
            icon={<FaIndustry />}
            label="Şirket Tipi"
            value={
              company?.type === "customer"
                ? "Müşteri"
                : company?.type === "supplier"
                ? "Tedarikçi"
                : "Bilinmeyen"
            }
          />
        </div>
      </div>
    </div>
  );
}

function ProfileItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center border border-gray-200 rounded-lg px-4 py-3">
      <div className="text-green-600 text-xl mr-4">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-semibold text-gray-800">{value}</p>
      </div>
    </div>
  );
}
