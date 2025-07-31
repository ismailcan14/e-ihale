'use client'

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';  // URL'deki dinamik parametreleri almak için kullanılır

export default function EditAuctionPage() {
  const { id } = useParams();
   // URL'deki /edit-auction/[id] kısmından id parametresini alıyoruz.
  // Örneğin: /edit-auction/5 → id = 5
  const [auction, setAuction] = useState<any>(null);
  //url deki id ile eşleşen auctions verilerini tutmak için bir state oluşturuyoruz. state içerisindeki auction nesnesi ile formdaki inputları dolduracağaız.
  const [formData, setFormData] = useState({
    start_time: '',
    end_time: '',
    starting_price: '',
    auction_type: 'highest',
  });
  //Formu doldurmak için statei oluşturuyoruz

  useEffect(() => {
    const token = localStorage.getItem("token");
    //token ı localStrorage den çekiyoruz
    fetch(`http://127.0.0.1:8000/auctions/my`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        const found = data.find((a: any) => a.id.toString() === id);
        //tüm ihaleleri çekip arasında url de bulunan id ile eşleşen ihaleyi bulup found değişkenine aktarıyoruz.
        if (found && found.status === "pending") { //statusu pending(bekliyor) ise if bloğunun içerisine giriyor
          setAuction(found); //bulunan ihaleyi state e kaydediyoruz
          setFormData({
            start_time: found.start_time.slice(0, 16),
            end_time: found.end_time.slice(0, 16),
              // Datetime-local input için 'YYYY-MM-DDTHH:mm' formatında olması gerekiyor.
            // slice(0,16) bu formatı sağlıyor.
            starting_price: found.starting_price.toString(),
            auction_type: found.auction_type,
          });
        }
        //founda bulunan ihale verilerini state ile formData nesnesine kaydediyoruz. formData ile güncelleme formundaki inputları dolduracağız.

      });
  }, [id]); // eğer id değişirse useEffect tekrar çalışacak normalde sayfa her yüklendiğinde bir kere çalışan bir fonksiyondu

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
 // handleChange fonksiyonu form inputlarında herhangi bir değişiklik olduğunda çalışır.  Etkilenen inputun name değerini ve yeni değerini alır, formData içinde günceller. detaylı olarak açıklamak gerekirse inputta bir değişiklik olduğunda input değişmeden hemen önce handleChange fonksiyonu   parametre olarak e event nesnesi ile çalıştırılır. ... formData ile formData nesnesinin bir kopyası oluşturulur ve e üzerinden gelen target.name ile eşleşen kopya formData daki satır ın değer kısmı target.value ile güncellenir ve react formData nın kopyası oluşturulduğunda değişiklik olduğunu anlayıp formData yı günceller.
   

 const toUtcISOString = (local: string) => {
  const localDate = new Date(local);
  const utcDate = new Date(localDate.getTime() + localDate.getTimezoneOffset() * 60000);
  return utcDate.toISOString();
};
//Tarayıcının yerel saatinde girilen zamanı UTC formatına çevirir.

  const handleSubmit = async (e: React.FormEvent) => { //submit butonuna basınca calısan fonksiyon
    e.preventDefault(); //sayfanın yenilenmesini önler
    const token = localStorage.getItem("token"); //localStorage den token verisi alınır

    const payload = {
      start_time: toUtcISOString(formData.start_time),
      end_time: toUtcISOString(formData.end_time),
      starting_price: parseFloat(formData.starting_price),
      auction_type: formData.auction_type,
    }; //formdata üzerinden veriler istenilen formatlara fonksiyonlar ile dönüştürülerek sunucuya gönderilecek payload nesnesi üzerindeki değişkenlere kaydedilir.
    //console.log("Gönderilen payload:", payload);

    const res = await fetch(`http://127.0.0.1:8000/auctions/${id}`, {
      method: 'PUT',
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });//urlden aldığımız id değeri ile put(güncelleme) isteği token ile beraber gönderilir. Token kullanıcının bu isteği atarken giriş yapmış bir kullanıcı olduğunu ifade eder. içerisinde payload nesnesi vardır.

    if (res.ok) {
      alert("İhale başarıyla güncellendi.");
    } else {
      const data = await res.json();
      alert(data.detail || "Hata oluştu.");
    }
  }; //istekten dönen ham veri res değişkeninde tutulur ve ok ise ihale başarıyla güncellendi yanıtı döndürülür. ham veri data üzerine json formatına çevrilerek atılır ve bir hata varsa hata mesajı data nesnesi üzerinden  kullanıcıya iletilir.

  if (!auction) {
    return (
      <p className="text-center mt-20 text-gray-700">
        İhale yükleniyor veya güncellenemez durumda (sadece bekleyen ihaleler güncellenebilir).
      </p>
    ); //bu bir koşullu render örneğidir eğer auctions nesnesi boş veya false ise sadece p etiketini render eder aşağıda bulunan return çalışmaz.
  }

  return (
    <div className="max-w-xl mx-auto mt-20 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4 text-gray-800">İhaleyi Güncelle</h1>
      <form onSubmit={handleSubmit} className="space-y-4 text-gray-800">
        <input
          type="datetime-local"
          name="start_time"
          value={formData.start_time}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
        <input
          type="datetime-local"
          name="end_time"
          value={formData.end_time}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        />
         <input
            type="number"
           name="starting_price"
           value={formData.starting_price}
           onChange={handleChange}
           required
           className="w-full p-2 border rounded"
           step="0.01"
           min="0"
        />
        <select
          name="auction_type"
          value={formData.auction_type}
          onChange={handleChange}
          required
          className="w-full p-2 border rounded"
        >
          <option value="highest">En Yüksek Teklif Kazanır</option>
          <option value="lowest">En Düşük Teklif Kazanır</option>
        </select>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Güncelle
        </button>
      </form>
    </div>
  );
}
