"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaPlus, FaBoxOpen, FaDollarSign } from "react-icons/fa";
import { useSearchParams } from "next/navigation";

export default function CreateProductModalPage() {
      const sp = useSearchParams();
  if (sp.get("fullscreen") === "1") return null;
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    type: "PRODUCT" as "PRODUCT" | "SERVICE",
  });

  // Esc ile kapatma
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://127.0.0.1:8000/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data?.detail || "Hata oluştu");
        console.log("Hata Detayı:", data);
        return;
      }

      alert("Ürün başarıyla oluşturuldu");
      setFormData({
        name: "",
        description: "",
        price: "",
        stock: "",
        type: "PRODUCT",
      });

      router.back();

    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Ürün Oluştur"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => router.back()}
      />

      {/* Modal kutusu */}
      <div
        className="relative z-10 w-full max-w-md bg-white border border-gray-300 rounded-2xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Başlık + Kapat */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
            <FaPlus className="text-blue-600" />
            Yeni Ürün-Hizmet Oluştur
          </h2>
          <button
            onClick={() => router.back()}
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm"
          >
            Kapat
          </button>
        </div>

        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4 text-gray-800">
            <div>
              <label className="font-semibold mb-1 flex items-center gap-2">
                <FaBoxOpen /> Ürün-Hizmet Adı
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="font-semibold mb-1">Açıklama</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="font-semibold mb-1 flex items-center gap-2">
                <FaDollarSign /> Fiyat (₺)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="font-semibold mb-1">Stok</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                min="0"
                step="1"
              />
            </div>

            <div>
              <label className="font-semibold mb-1">Tür</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="PRODUCT">Ürün</option>
                <option value="SERVICE">Hizmet</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2"
            >
              <FaPlus /> {submitting ? "Gönderiliyor..." : "Ürünü Oluştur"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
