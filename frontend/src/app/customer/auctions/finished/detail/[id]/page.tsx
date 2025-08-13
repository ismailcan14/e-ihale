"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { FaCrown, FaFilePdf, FaFileCsv } from "react-icons/fa";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"; //kullandıgımız iconları import ettik

export default function FinishedAuctionDetailPage() {
  const { id } = useParams(); //urlden id yi aldık
  const [auction, setAuction] = useState<any>(null); //ihaleleri çeken state(kanca)
  const [bids, setBids] = useState<any[]>([]); //teklifleri çeken state
  const [loading, setLoading] = useState(true); //yükleniyor
  const [currentUserId, setCurrentUserId] = useState<number | null>(null); //giriş yapan kullanıcının id si

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) return;

    Promise.all([
      fetch(`http://127.0.0.1:8000/auctions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),//ihaleleri çekiyoruz
      fetch(`http://127.0.0.1:8000/bids/auction/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),//teklifleri çekiyoruz
      fetch("http://127.0.0.1:8000/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => res.json()),//giriş yapan kullanıcı bilgilerini çekiyoruz
    ])
      .then(([auctionData, bidsData, me]) => {
        setAuction(auctionData);
        setBids(bidsData);
        setCurrentUserId(me?.id ?? null);
        setLoading(false); //state fonkisyonları ile gelen verileri değişkenlere aktarıyoruz.
      })
      .catch((err) => {
        console.error("Detay verileri alınamadı:", err);
        setLoading(false);
      });
  }, [id, token]);


   /*** AYNI YAPI CUSTOMER ACTİVE DETAİL SAYFASINDA FONKSİYON KULLANARAK VAR BU SEFER DİREKT USEMEMO NUN İÇİNE YAZDIM AYNI MANTIKT ***/
  const bestBids = useMemo(() => {
    if (!bids.length) return []; 
    const bySupplier = new Map<number, any>(); //bir map(key,value) yapısı oluşturuyoruz
    bids.forEach((bid) => { //tüm teklifleri inceleyeceğimiz yapı
      if (!bySupplier.has(bid.supplier_id)) {  //mapimizde bu id de bir değer yoksa if içi blok çalışıyor
        bySupplier.set(bid.supplier_id, bid); // map in key alanına o teklifin supplier_id si value alanına ise teklif objesi yazdırılıyor.
      } else {//eğer map içerisinde bu id de bir değer varsa else içi blok çalışıyor
        const existing = bySupplier.get(bid.supplier_id); //mapde bulununan bu keydeki bid objesinden supplier_id değeri çekiliyor
        if (auction?.auction_type === "highest") { //ihale tipi inceleniyor
          if (bid.amount > existing.amount || (bid.amount === existing.amount && new Date(bid.timestamp).getTime() > new Date(existing.timestamp).getTime())) {
            bySupplier.set(bid.supplier_id, bid);
          }
        } else {
          if (bid.amount < existing.amount || (bid.amount === existing.amount && new Date(bid.timestamp).getTime() > new Date(existing.timestamp).getTime())) {
            bySupplier.set(bid.supplier_id, bid); //incelenen teklif map deki aynı supplier_id de bulunan tekliften ihale türüne göre büyük ya da küçük ise ona göre map e dahil oluyor ya da olmuyor.
          }
        }
      }
    });
    //teklif yapan her tedarikçinin en iyi tekliflerini bu şekilde buluyoruz.
    const result = Array.from(bySupplier.values()); //map deki value alanlarını dizi formatına çevirip result adlı diziye atıyoruz.
    result.sort((a, b) =>
      auction?.auction_type === "highest" ? b.amount - a.amount : a.amount - b.amount //ihale türüne göre teklifleri büyükteb küçüğe veya küçükten büyüğe sıralıyoruz.
    );
    return result; //teklif objeleri bulunan dizimizi geriye döndürüyoruz.
  }, [bids, auction]); //bu useMemo bids ve auction da bir değişiklik olduğunda otomatik olarak tetikleniyor.

 

  const chartData = useMemo(() => {
    return bids
      .slice() //orjinal bids verisini değiştirmemek için kopyasını alıyoruz
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() //Teklifleri en eski teklif  en yeni teklif sırasına koyuyor.
      )
      .map((b) => ({
        time: new Date(
          new Date(b.timestamp).getTime() + 3 * 60 * 60 * 1000 //utc den tr formatına çevirme
        ).toLocaleTimeString(),
        amount: b.amount,
      })); //ardından map formatında bu bilgileri kaydediyoruz. map ise time ve amount bilgilerini tutuyor yani hangi zamanda hangi teklif verildi grafik şeklinde görebiliyoruz.
  }, [bids]);

  const totalSuppliers = bestBids.length; //toplam tedarikçi
  const totalBids = bids.length;//toplam teklif sayısı
  const winnerBid = bestBids[0];//kazanan teklif

  const improvement = //ihale türüne göre ne kadar tasarruf etti veya artış sağladı
    auction?.auction_type === "highest"
      ? ((winnerBid?.amount - auction?.starting_price) / auction?.starting_price) * 100
      : ((auction?.starting_price - winnerBid?.amount) / auction?.starting_price) * 100;

   const handleDownloadPdf = () => { //Rapor oluşturma ve indirme
    const token = localStorage.getItem("token");
    if (!token) {
      alert("PDF indirilemedi: Giriş yapılmamış.");
      return;
    }

    fetch(`http://127.0.0.1:8000/reports/${id}/report-pdf`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Rapor indirilemedi: ${res.status}`);
        }
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ihale_${id}_raporu.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch((err) => {
        console.error("PDF indirme hatası:", err);
        alert("PDF indirilemedi. Yetki eksik veya sistemsel bir hata oluştu.");
      });
  };



  if (loading) {
    return <div className="text-center mt-20 text-gray-800">Yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {auction?.product?.name}
              </h1>
              <p className="text-gray-900">
                {new Date(new Date(auction?.start_time).getTime() + 3 * 60 * 60 * 1000).toLocaleString()} -{" "}
                {new Date(new Date(auction?.end_time).getTime() + 3 * 60 * 60 * 1000).toLocaleString()}
              </p>
              <p className="mt-1 text-sm font-medium text-green-900">
                {auction?.auction_type === "highest"
                  ? "En Yüksek Teklif"
                  : "En Düşük Teklif"}{" "}
                İhalesi
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="bg-red-100 text-red-700 px-4 py-1 rounded-full font-semibold">
                BİTMİŞ
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard title="Kazanan Teklif" value={winnerBid ? `${winnerBid.amount} ₺` : "-"} icon={<FaCrown className="text-yellow-500" />} />
          <KpiCard title="Toplam Tedarikçi" value={totalSuppliers} />
          <KpiCard title="Toplam Teklif" value={totalBids} />
          <KpiCard
            title={auction?.auction_type === "highest" ? "Fiyat Artışı" : "Tasarruf"}
            value={Number.isFinite(improvement) ? `${improvement?.toFixed(2)}%` : "-"}
          />
        </div>

       <div className="bg-white rounded-xl shadow-md p-6">
  <h2 className="text-xl font-bold text-gray-900 mb-4">Kazanan Bilgisi</h2>
  {winnerBid ? (
    <div>
      <p className="font-semibold text-gray-900">{winnerBid.user_info?.company}</p>
      <p className="text-gray-900">{winnerBid.user_info?.name}</p>
      <p className="mt-2 text-green-700 font-bold">{winnerBid.amount} ₺</p>
      <p className="text-sm text-gray-900">
        Teklif Zamanı:{" "}
        {new Date(
          new Date(winnerBid.timestamp).getTime() + 3 * 60 * 60 * 1000
        ).toLocaleString()}
      </p>
      <button
        className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
        onClick={() => {
          console.log("İletişime Geç tıklandı (şimdilik pasif)");
        }}
      >
        İletişime Geç
      </button>
    </div>
  ) : (
    <p className="text-gray-900">Kazanan bulunamadı.</p>
  )}
</div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Lider Tablosu</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3 text-gray-900">Sıra</th>
                <th className="p-3 text-gray-900">Şirket</th>
                <th className="p-3 text-gray-900">Teklif</th>
                <th className="p-3 text-gray-900">Zaman</th>
              </tr>
            </thead>
            <tbody>
              {bestBids.map((bid, index) => {
                const isMe = bid.supplier_id === currentUserId;
                return (
                  <tr
                    key={bid.id}
                    className={
                      "border-b hover:bg-gray-50 " +
                      (isMe ? "bg-green-50/60" : "")
                    }
                  >
                    <td className="p-3 text-gray-900">{index + 1}</td>
                    <td className="p-3 text-gray-900">
                      {bid.user_info?.company}
                      {isMe && <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-semibold">Siz</span>}
                    </td>
                    <td className="p-3 font-semibold text-gray-900">{bid.amount} ₺</td>
                    <td className="p-3 text-gray-900">
                      {new Date(new Date(bid.timestamp).getTime() + 3 * 60 * 60 * 1000).toLocaleTimeString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Fiyat Değişim Grafiği</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid stroke="#eee" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="amount" stroke="#16a34a" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
          <div className="mt-8 flex justify-end">
          <button
            onClick={handleDownloadPdf}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Raporu PDF Olarak İndir
          </button>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, icon }: { title: string; value: any; icon?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center justify-center">
      {icon && <div className="text-3xl mb-2">{icon}</div>}
      <h3 className="text-sm text-gray-900">{title}</h3>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
