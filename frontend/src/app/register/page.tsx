'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterCompanyPage() {
  const router = useRouter(); //Kullanıcıları sayfalara yönlendirmek için kullanılan bir fonksiyondur.
  const [formData, setFormData] = useState({
    company_name: "",
    admin_name: "",
    admin_email: "",
    admin_password: "",
    type: "customer",
  });
  //UseState 2 adet değer tutar. 1. formData : kayıt formunun tüm elemanlarını tutan bir nesnedir. 2. setFormData ise formData nesnesindeki tutulan elemanları doldurmak için kullanılan bir fonksiyon. 

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  //handleChange fonksiyonu hem input hem de select bileşenleri her değiştiğinde çalışan bir fonksiyondur. Html de onChange'e bu fonksiyonu veririz. e ise onchange olayında gelen olay(event) nesnesidir.
   //setFormData da ise ...formData ile formData nesnesi kopyalanır çünkü React da state doğrudan değiştirilemez. e.target.name ise inputtaki name alanını temsil eder. e.target.value ise bu alandaki değeri temsil eder. 
   //Özetlemek gerekirse formData nesnesi kopyalanır ve e.target.name alanında örnek olarak email gelsin e-mail alanının değeri gelen e.target.value değeri ile güncellenir. React state in değiştini farkeder ve bileşeni yeniden render eder. Bu sırada inputlar yeni formData ya göre doldurulur.
    //Ben eskiden inputları bizim yazdığımız şekilde oluyor sanıyordum ancak react da input içindeki veri formData dan gelen veridir. value=formData.company_name gibi alanlar var. biz input üzerinde bir tuşa bastığımızda input değeri değişmeden HandleChange fonksiyonu çalışıyor. handleChange de setFormData yı çalıştırıyor. setFormData formData nın bir kopyasını oluşturup kopya üzerinde değişiklik yapıyor. React bu değişikliği algılayıp gerçek formData yı renderlıyor yani güncelliyor. formData güncellenince bizim inputlar da güncelleniyor.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Submit butonuna basıldığında handleSubmit fonksiyonu çalışır. bu fonksiyon asenkron bir fonksiyondur yani örnek olarak bir istek atıldığında cevabı beklemeden fonksiyon çalışmaya devam eder. e.preventDefault() fonksiyonu ile butona basılmasına rağmen sayfa yenilenmesi engellenir.

    try {
      const res = await fetch("http://127.0.0.1:8000/companies/", //fetch fonksiyonu ile verilen adrese istek yollanır. await anahtar kelimesi ile cevap gelene kadar beklenir. Gelen cevap res de tutulur.
        {
        method: "POST",
        headers: {
          "Content-Type": "application/json", //gönderilen verinin json formatında olduğu belirtilir. Bu sayede sunucu veriyi doğru şekilde çözümleyebilir.
        },
        body: JSON.stringify(formData), //Gönderilen isteğin gövdesinde formData adlı nesne gönderilir. formData bizim tüm form verilerimizi tutan nesnedir. Bu nesne string türünde ve json formatındadır.
      });

      const data = await res.json(); //res bir response nesnesidir. Cevabı içerir ancak veriyi doğrudan içermez ham olarak tutar. İçerdiği şeyler res.status yani durum kodu (200,404,500 gibi), res.ok yani istek başarılı oldu mu ? Biz data=await res.json(); diyerek içerideki veriye ulaşırız. data verisi data = { detail: "Bu isimde bir şirket zaten var"} vb. bir şekil alır.
      //yani res http cevabının bir kapıdır. içindeki gerçek veriye ulaşmak için .json() u kullanmak gerekir.

      if (res.ok) { 
        alert("Şirket kaydı başarılı!");
        router.push("/login");
        //res değişkeni statu,ok gibi değerleri tutuyordu zaten burada soruyoruz ok mu ? yani istek başarılı oldu mu ? eğer cevap true ise kullanıcıyı bilgilendirir ve router.push ile istediğimiz sayfaya yönlendiririz.
      } else {
        alert(data.detail || "Kayıt başarısız.");
        //eğer res.ok değilse yani istek başarısız olduysa data ya res in içinde bulunan veriyi parselleyip atmıştık. data içindeki detail kısmını ekrana yazdırırız.
      }
    } catch (err) {
      console.error(err);
      alert("Sunucu hatası oluştu.");
      //eğer try da bir hata oluşursa catch bloğu çalışır ve hata mesajı döndürürüz.
    }
  };
  // Submit butonuna basıldığında handleSubmit fonksiyonu çalışır. bu fonksiyon asenkron bir fonksiyondur yani örnek olarak bir istek atıldığında cevabı beklemeden fonksiyon çalışmaya devam eder. e.preventDefault() fonksiyonu ile butona basılmasına rağmen sayfa yenilenmesi engellenir. 
   
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-[#1561ad] via-[#1c77ac] to-[#1dbab4] p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-lg flex flex-col items-center gap-6">
        <div className="w-20 h-20 bg-[#fc5226] rounded-full flex items-center justify-center shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11H9v2h2V7zm0 4H9v4h2v-4z" clipRule="evenodd" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-[#1561ad]">Şirket Kaydı</h1>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <input
            type="text"
            name="company_name"
            placeholder="Şirket Adı"
            value={formData.company_name}
            onChange={handleChange}
            className="w-full p-3 border border-[#1c77ac] rounded-xl 
                       text-gray-800 text-opacity-100
                       placeholder-gray-500 placeholder-opacity-100
                       focus:outline-none focus:ring-2 focus:ring-[#1dbab4]"
            required
          />

          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full p-3 border border-[#1c77ac] rounded-xl 
                       text-gray-800 text-opacity-100
                       placeholder-gray-500 placeholder-opacity-100
                       focus:outline-none focus:ring-2 focus:ring-[#1dbab4]"
          >
            <option value="customer">Müşteri</option>
            <option value="supplier">Tedarikçi</option>
          </select>

          <input
            type="text"
            name="admin_name"
            placeholder="Admin Adı"
            value={formData.admin_name}
            onChange={handleChange}
            className="w-full p-3 border border-[#1c77ac] rounded-xl 
                       text-gray-800 text-opacity-100
                       placeholder-gray-500 placeholder-opacity-100
                       focus:outline-none focus:ring-2 focus:ring-[#1dbab4]"
            required
          />

          <input
            type="email"
            name="admin_email"
            placeholder="Admin Email"
            value={formData.admin_email}
            onChange={handleChange}
            className="w-full p-3 border border-[#1c77ac] rounded-xl 
                       text-gray-800 text-opacity-100
                       placeholder-gray-500 placeholder-opacity-100
                       focus:outline-none focus:ring-2 focus:ring-[#1dbab4]"
            required
          />

          <input
            type="password"
            name="admin_password"
            placeholder="Admin Şifre"
            value={formData.admin_password}
            onChange={handleChange}
            className="w-full p-3 border border-[#1c77ac] rounded-xl 
                       text-gray-800 text-opacity-100
                       placeholder-gray-500 placeholder-opacity-100
                       focus:outline-none focus:ring-2 focus:ring-[#1dbab4]"
            required
          />

          <button
            type="submit"
            className="bg-[#fc5226] hover:bg-[#e14a1e] text-white font-bold py-3 rounded-xl transition-shadow shadow-md hover:shadow-lg"
          >
            Kaydol
          </button>
        </form>
      </div>
    </div>
  );
}
