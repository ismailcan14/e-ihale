"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaUser, FaEnvelope, FaLock, FaUserTag, FaSave, FaTimes } from "react-icons/fa";

interface FormDataType {
  name: string;
  email: string;
  password: string;
  role_id: number | string;
}

export default function UpdateEmployeeModal() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [formData, setFormData] = useState<FormDataType>({
    name: "",
    email: "",
    password: "",
    role_id: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && router.back();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`http://127.0.0.1:8000/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setFormData({
          name: data.name ?? "",
          email: data.email ?? "",
          password: "",
          role_id: String(data.role?.id ?? data.role_id ?? ""),
        });
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const payload: any = { ...formData };
    if (!payload.password) delete payload.password;

    const res = await fetch(`http://127.0.0.1:8000/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert("Çalışan güncellendi.");
      router.back(); 
    } else {
      const data = await res.json();
      alert(data.detail || "Bir hata oluştu.");
    }
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={() => router.back()} />
      <div className="relative mx-auto mt-16 w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <button
          onClick={() => router.back()}
          className="absolute -top-3 -right-3 bg-white border shadow px-3 py-1 rounded-full text-sm hover:bg-gray-50"
          aria-label="Kapat"
        >
          <FaTimes />
        </button>

        <div className="p-6">
          {isLoading ? (
            <p className="text-gray-600">Yükleniyor…</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-gray-800">
              <h2 className="text-xl font-bold text-center mb-2">Çalışan Güncelle</h2>

              <div>
                <label className="font-semibold mb-1 flex items-center gap-2">
                  <FaUser /> Ad Soyad
                </label>
                <input
                  name="name"
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
                  <FaLock /> Yeni Şifre (opsiyonel)
                </label>
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Boş bırakırsan değişmez"
                  className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  disabled={Number(formData.role_id) === 1}
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

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-900 py-2 px-4 rounded-lg"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg"
                >
                  <FaSave className="inline mr-2" />
                  Kaydet
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
