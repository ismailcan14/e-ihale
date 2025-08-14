'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaUserTag,
  FaSave,
  FaArrowLeft,
} from 'react-icons/fa';

interface FormDataType {
  name: string;
  email: string;
  password: string;
  role_id: number | string; // Sayı veya string olabilir
}

export default function UpdateEmployeePage() {
  const { id } = useParams();
  const router = useRouter();

  const [formData, setFormData] = useState<FormDataType>({
    name: '',
    email: '',
    password: '',
    role_id: '',
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');

    fetch(`http://127.0.0.1:8000/users/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        setFormData({
          name: data.name || '',
          email: data.email || '',
          password: '',
          role_id: String(data.role?.id || data.role_id || ''),
        });
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Kullanıcı bilgisi alınamadı:', err);
        setIsLoading(false);
      });
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem('token');

    const payload = { ...formData };
    if (!payload.password) delete payload.password;

    const res = await fetch(`http://127.0.0.1:8000/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert('Çalışan başarıyla güncellendi.');
       router.push('/customer/employees');
    } else {
      const data = await res.json();
      alert(data.detail || 'Bir hata oluştu.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600 text-lg">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="bg-white flex items-start justify-center pt-[72px] px-4 pb-10 min-h-screen">
      <div className="w-full max-w-md bg-white border border-gray-300 rounded-xl p-6 shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-5 flex items-center justify-center gap-2">
          <FaUserTag className="text-green-600" /> Çalışan Güncelle
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
              required
            />
          </div>

          <div>
            <label className="font-semibold mb-1 flex items-center gap-2">
              <FaLock /> Yeni Şifre (İsteğe bağlı)
            </label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Yeni şifre girin (değiştirmek için)"
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Şifreyi değiştirmek istemiyorsan boş bırak.
            </p>
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
        disabled={Number(formData.role_id) === 1} // Admin ise değiştirilemez
      >
        {Number(formData.role_id) === 1 ? (
          <option value="1">Admin</option>
        ) : (
          <>
            <option value="">Rol Seçin</option>
            <option value="2">Müdür</option>
            <option value="3">Personel</option>
          </>
        )}
      </select>
    </div>

          <div className="flex justify-between gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              <FaArrowLeft /> Geri
            </button>

            <button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2"
            >
              <FaSave /> Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
