'use client';

import { useState } from 'react';

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
 <div className="max-w-xl mx-auto mt-12 p-6 bg-white rounded shadow">
  <h1 className="text-2xl font-bold text-gray-900 mb-6">Yeni Çalışan Ekle</h1>
  <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="block mb-1 text-sm font-semibold text-gray-800">
            Ad Soyad
          </label>
          <input
            name="name"
            type="text"
            id="name"
            placeholder="Ad Soyad"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-3 border rounded text-gray-900"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="block mb-1 text-sm font-semibold text-gray-800">
            E-posta
          </label>
          <input
            name="email"
            type="email"
            id="email"
            placeholder="E-posta"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 border rounded text-gray-900"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block mb-1 text-sm font-semibold text-gray-800">
            Şifre
          </label>
          <input
            name="password"
            type="password"
            id="password"
            placeholder="Şifre"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-3 border rounded text-gray-900"
            required
          />
        </div>

        <div>
          <label htmlFor="role_id" className="block mb-1 text-sm font-semibold text-gray-800">
            Rol
          </label>
          <select
            name="role_id"
            id="role_id"
            value={formData.role_id}
            onChange={handleChange}
            className="w-full p-3 border rounded text-gray-900"
            required
          >
            <option value="">Rol Seçin</option>
            <option value="2">Müdür</option>
            <option value="3">Personel</option>
          </select>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 font-semibold"
        >
          Kaydet
        </button>
      </form>
    </div>
  );
}
