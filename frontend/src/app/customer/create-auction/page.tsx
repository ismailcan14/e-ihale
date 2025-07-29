'use client';

import { useState, useEffect } from 'react';

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
    <div className="max-w-xl mx-auto mt-20 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">Yeni İhale Oluştur</h1>
      <form onSubmit={handleSubmit} className="space-y-4 font-medium text-gray-800">

        <select
          name="product_id"
          value={formData.product_id}
          onChange={handleChange}
          className="w-full p-2 border rounded font-medium text-gray-800"
          required
        >
          <option value="">Ürün Seçin</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>

        <input
          type="datetime-local"
          name="start_time"
          value={formData.start_time}
          onChange={handleChange}
          className="w-full p-2 border rounded font-medium text-gray-800"
          required
        />

        <input
          type="datetime-local"
          name="end_time"
          value={formData.end_time}
          onChange={handleChange}
          className="w-full p-2 border rounded font-medium text-gray-800"
          required
        />

        <input
          type="number"
          name="starting_price"
          value={formData.starting_price}
          onChange={handleChange}
          className="w-full p-2 border rounded font-medium text-gray-800"
          placeholder="Başlangıç Fiyatı"
          required
        />

        <select
          name="auction_type"
          value={formData.auction_type}
          onChange={handleChange}
          className="w-full p-2 border rounded font-medium text-gray-800"
          required
        >
          <option value="highest">En Yüksek Teklif Kazanır</option>
          <option value="lowest">En Düşük Teklif Kazanır</option>
        </select>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold"
        >
          İhaleyi Oluştur
        </button>
      </form>
    </div>
  );
}
