'use client';

import { useState, useEffect } from 'react';
import { FaPlus, FaCalendarAlt, FaDollarSign, FaBoxOpen, FaGavel } from 'react-icons/fa';
export default function CreateAuctionPage() {
  const [products, setProducts] = useState<any[]>([]); //ürünü tutacak değişkenin ve onu çekecek fonksiyonun statini boş olarak oluşturuyoruz.
  const [formData, setFormData] = useState({
    product_id: '',
    start_time: '',
    end_time: '',
    starting_price: '',
    auction_type: 'highest',
  });
 //inputları doldurduğumuz formdata ve formData yı doldurduğumuz setFormData nın stateini oluşturuyoruz ve forma gönderilecek verilerin şablonunu hazırlıyoruz. 
  useEffect(() => { //Sayfa yüklendiğinde bir kere çalışan fonksiyondur !
    const token = localStorage.getItem("token");

    fetch("http://127.0.0.1:8000/products", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error("Ürünler alınamadı:", err));
  }, []);
  //ürün apisine bir get isteği atıyoruz. isteğin gövdesinde token bilgisi de bulunuyor yani bak ben giriş yapmış bir kullancıyım diyoruz ardından istekten dönen mesaj res üzerinde tutuluyor önceden de açıkladığım gibi dönen ham veri res e geliyor bunu json formatına çevirip data adlı nesneye aktarıyoruz. gelen veriler artık data da tutuluyor. sonrasında state in setProduct fonksiyonu ile gelen ürün verisni state e yolluyoruz.

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  //inputların veya selectlerin herhangi birinde bir değişiklik olduğu zaman tetiklenecek fonksiyonu oluşturduk. burada hangi inputta veya selectte bir değişiklik olduysa event nesnesi olan e ile fonksiyona parametre olarak geliyor ve e nin üzerinden hangi targe.name e sahip inputun veya selectin değerini value sunun son halini elde ediyoruz ve ...formData ile formData nın kopyasını oluşturup kopya üzerine diğerlerine dokunmadan sadece güncellenen değeri ekliyoruz. Kopyası oluşan formData değişikliği farkediyor ve kendini kopyasına göre güncelliyor. Ardından input veya selecttedi deker formData dan value sunu çekip son haline geliyor.

  // Yerel zamanı UTC'ye çevir (timezone offset ile)
  const toUtcISOString = (local: string) => {
    const localDate = new Date(local);
    const utcDate = new Date(localDate.getTime() + localDate.getTimezoneOffset() * 60000);
    return utcDate.toISOString();
  };
  //fronttan gelen yerel zaman değerinin formatını utc ye çeviriyoruz ve saati 3 saat geri alıyoruz çünkü Scheduler zaman kontrolü yaparken utc zaman formatına ve Türkiye zaman diliminden 3 saat geri bir zaman dilimine göre çalışıyor.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); //sayfanın yenilenmesini engeller
    const token = localStorage.getItem("token"); //token değerini yerel depodan çekip değişkene atıyoruz.

    const payload = {
      ...formData,
      start_time: toUtcISOString(formData.start_time),
      end_time: toUtcISOString(formData.end_time),
    }; //apiye post isteği olarak gönderilecek nesneyi oluşturuyoruz ve zamanları utc formatına çevirmek için dönüşüm fonksiyonuna gönderiyoruz.

    const res = await fetch("http://127.0.0.1:8000/auctions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }); //actions apisine bir post isteği oluşturup gönderilen içeriğin tipinin json olduğunu belirtiyoruz. ve isteğin içerisinde payload nesnesini gönderiyoruz.

    const data = await res.json(); //istekten gelen yanıt json formatına çevrilip data adlı nesneye gönderiliyor.

    if (res.ok) {
      alert("İhale başarıyla oluşturuldu");
      setFormData({
        product_id: '',
        start_time: '',
        end_time: '',
        starting_price: '',
        auction_type: 'highest',
      });
    } else {
      alert(data.detail || "Hata oluştu");
      //istek başarılı olursa res.ok true oluyor ve ifin içerisine giriyor sonrasında formData nesnesinin içindeki değerler null yapılıyor bu sayede frontdaki formumuz tekrar boş hale geliyor
    }
  };

return (
  <div className="bg-white flex items-start justify-center pt-[72px] px-4 pb-10">
    <div className="w-full max-w-md bg-white border border-gray-300 rounded-xl p-6">
      <h1 className="text-2xl font-bold text-center text-gray-800 mb-5 flex items-center justify-center gap-2">
        <FaGavel className="text-blue-600" /> Yeni İhale Oluştur
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4 text-gray-800">
        <div>
          <label className="font-semibold mb-1 flex items-center gap-2">
            <FaBoxOpen /> Ürün-Hizmet Seçin
          </label>
          <select
            name="product_id"
            value={formData.product_id}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Ürün-Hizmet Seçin</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-semibold mb-1 flex items-center gap-2">
            <FaCalendarAlt /> Başlangıç Zamanı
          </label>
          <input
            type="datetime-local"
            name="start_time"
            value={formData.start_time}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="font-semibold mb-1 flex items-center gap-2">
            <FaCalendarAlt /> Bitiş Zamanı
          </label>
          <input
            type="datetime-local"
            name="end_time"
            value={formData.end_time}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="font-semibold mb-1 flex items-center gap-2">
            <FaDollarSign /> Başlangıç Fiyatı
          </label>
          <input
            type="number"
            name="starting_price"
            value={formData.starting_price}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="₺"
            required
          />
        </div>

        <div>
          <label className="font-semibold mb-1 flex items-center gap-2">
            <FaGavel /> İhale Tipi
          </label>
          <select
            name="auction_type"
            value={formData.auction_type}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="highest">En Yüksek Teklif Kazanır</option>
            <option value="lowest">En Düşük Teklif Kazanır</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2"
        >
          <FaPlus /> İhaleyi Oluştur
        </button>
      </form>
    </div>
  </div>
);
}