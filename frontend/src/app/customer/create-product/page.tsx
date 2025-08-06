"use client";

import { useState } from "react";
import { FaPlus, FaBoxOpen, FaDollarSign } from "react-icons/fa";

export default function CreateProductPage() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    type: "product",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

    if (res.ok) {
      alert("Ürün başarıyla oluşturuldu");
      setFormData({
        name: "",
        description: "",
        price: "",
        stock: "",
        type: "product",
      });
    } else {
      alert(data.detail || "Hata oluştu");
      console.log("Hata Detayı:", data);
    }
  };

  return (
    <div className="bg-white flex items-start justify-center pt-[72px] px-4 pb-10">
      <div className="w-full max-w-md bg-white border border-gray-300 rounded-xl p-6">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-5 flex items-center justify-center gap-2">
          <FaPlus className="text-blue-600" /> Yeni Ürün Oluştur
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 text-gray-800">
          <div>
            <label className="font-semibold mb-1 flex items-center gap-2">
              <FaBoxOpen /> Ürün Adı
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2"
          >
            <FaPlus /> Ürünü Oluştur
          </button>
        </form>
      </div>
    </div>
  );
}
