"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function MyProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Giriş yapmadınız.");
          setLoading(false);
          return;
        }

        const userRes = await fetch("http://127.0.0.1:8000/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const userData = await userRes.json();
        const companyId = userData.company_id;

      const productRes = await fetch("http://127.0.0.1:8000/products/my", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        });
           const productData = await productRes.json();

        const companyProducts = productData.filter(
          (p: any) => p.company_id === companyId
        );

        setProducts(companyProducts.filter((p) => p.type === "PRODUCT"));
        setServices(companyProducts.filter((p) => p.type === "SERVICE"));
      } catch (err) {
        setError("Veriler alınırken hata oluştu.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <p className="text-center mt-10">Yükleniyor...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-700">
          Ürün ve Hizmetlerim
        </h1>

        {/* Ürünler */}
        <section className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Ürünler</h2>
          {products.length === 0 ? (
            <p className="text-gray-600">Hiç ürün eklenmemiş.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow p-4 border border-gray-200"
                >
                  <h3 className="text-xl font-semibold text-gray-800">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 mt-1">{product.description}</p>
                  <p className="mt-2 text-sm text-gray-500">
                    Fiyat: <span className="font-semibold">{product.price} ₺</span>
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Stok: <span className="font-semibold">{product.stock}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Hizmetler */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Hizmetler</h2>
          {services.length === 0 ? (
            <p className="text-gray-600">Hiç hizmet eklenmemiş.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="bg-white rounded-lg shadow p-4 border border-gray-200"
                >
                  <h3 className="text-xl font-semibold text-gray-800">
                    {service.name}
                  </h3>
                  <p className="text-gray-600 mt-1">{service.description}</p>
                  <p className="mt-2 text-sm text-gray-500">
                    Fiyat: <span className="font-semibold">{service.price} ₺</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
         <Link
              href={`/customer/create-product`}
              className="flex items-center justify-between p-4 text-gray-600 hover:bg-red-500"
            >Ürün Ekleme</Link>
      </div>
    </div>
  );
}
