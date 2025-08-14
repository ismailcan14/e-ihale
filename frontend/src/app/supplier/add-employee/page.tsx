'use client';

import { useState } from 'react';
import { FaUser, FaEnvelope, FaLock, FaUserTag, FaGavel, FaPlus } from 'react-icons/fa';
export default function AddEmployeePage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role_id: '',
  });
  //kullanıcı ekleme fonksiyonunu oluşturuyor ve formData adlı bir state tanımlıyoruz. doldurulacak alanları da tanımlıyoruz bu state ilk etapta boş olacak.

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value }); //inputa bir değer girildiğinde ilk olarak handleChange fonksiyonu çalışıyor. ister input olsun ister select itemi. bu fonksiyon da setFormData yı çalıştırıyor. bu setFormData ise ...formData ile formData değişkenini kopyalıyor ve hangi input veya selectte değişiklik olduysa onun target.name keyine göre gelen e.target.value ile güncelliyor. asıl formData nesnesi değişik olduğunu kopyası oluşturulduğu için anlıyor ve kendini güncelliyor. kendini güncelledikten sonra input değeri de formData ya göre güncelleniyor. yani kısaca input kısmına bir şey yazdığımızda ilk olarak inputForm güncelleniyor sonrasında ise input değeri güncelleniyor çünkü input değerini formData dan alıyor.
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); //sayfanın yenilenmesini engeller.

    const token = localStorage.getItem("token"); //yerel depodan tokenı alırız

    const res = await fetch("http://127.0.0.1:8000/users/add-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(formData),
    }); //token ile beraber kullanıcı ekle endpointine bir post isteği gönderilir bu post isteği içerisinde formData nesnesi string türünde ve json formatında gönderilir.

    const data = await res.json(); //dönen istek json formatına çevrilip data nesnesine aktarılır.

    if (res.ok) {
      alert("Çalışan başarıyla eklendi");
      setFormData({ name: '', email: '', password: '', role_id: '' });
    } else {
      alert(data.detail || "Bir hata oluştu");
    } //çalışan başarılı bir şekilde eklenirse setFormData ile formData nesnesi yine null hale getirilir. aksi halde bir hata mesajı döndürülür.
  };

 return (
    <div className="bg-white flex items-start justify-center pt-[72px] px-4 pb-10">
      <div className="w-full max-w-md bg-white border border-gray-300 rounded-xl p-6">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-5 flex items-center justify-center gap-2">
          <FaUserTag className="text-green-600" /> Yeni Çalışan Ekle
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 text-gray-800">
          <div>
            <label className="font-semibold mb-1 flex items-center gap-2">
              <FaUser /> Ad Soyad
            </label>
            <input
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Ad Soyad"
              required
            />
          </div>

          <div>
            <label className="font-semibold mb-1 flex items-center gap-2">
              <FaEnvelope /> E-posta
            </label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="E-posta"
              required
            />
          </div>

          <div>
            <label className="font-semibold mb-1 flex items-center gap-2">
              <FaLock /> Şifre
            </label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Şifre"
              required
            />
          </div>

          <div>
            <label className="font-semibold mb-1 flex items-center gap-2">
              <FaUserTag /> Rol
            </label>
            <select
              name="role_id"
              value={formData.role_id}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Rol Seçin</option>
              <option value="2">Müdür</option>
              <option value="3">Personel</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2"
          >
            <FaPlus /> Kaydet
          </button>
        </form>
      </div>
    </div>
  );
}