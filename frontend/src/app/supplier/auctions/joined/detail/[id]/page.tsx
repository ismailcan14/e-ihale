"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { FaCrown } from "react-icons/fa";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

const add3h = (ts: string | number | Date) =>
  new Date(new Date(ts).getTime() + 3 * 60 * 60 * 1000);

/*** AÇIKLAMASI CUSTOMER/AUCTIONS/ACTIVE/DETAIL SAYFASINDA MEVCUT  ***/
function pickBestPerSupplier(
  list: any[],
  auctionType: "highest" | "lowest" = "highest"
) {
  const bySupplier = new Map<number, any>();
  for (const b of list) {
    const supplierId = b.supplier_id ?? b.user_info?.id ?? b.user_id;
    if (!supplierId) continue;

    const existing = bySupplier.get(supplierId);
    if (!existing) {
      bySupplier.set(supplierId, b);
      continue;
    }

    const bTime = new Date(b.timestamp).getTime();
    const eTime = new Date(existing.timestamp).getTime();

    let isBetter = false;
    if (auctionType === "highest") {
      isBetter =
        b.amount > existing.amount ||
        (b.amount === existing.amount && bTime > eTime);
    } else {
      isBetter =
        b.amount < existing.amount ||
        (b.amount === existing.amount && bTime > eTime);
    }

    if (isBetter) bySupplier.set(supplierId, b);
  }

  const result = Array.from(bySupplier.values());
  result.sort((a, b) =>
    auctionType === "highest" ? b.amount - a.amount : a.amount - b.amount
  );
  return result;
}

export default function SupplierFinishedAuctionDetailPage() {
  const { id } = useParams();
  const [auction, setAuction] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) return;
    Promise.all([
      fetch(`http://127.0.0.1:8000/auctions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(`http://127.0.0.1:8000/bids/auction/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
      fetch(`http://127.0.0.1:8000/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json()),
    ]) 
      .then(([auctionData, bidsData, meData]) => {
        setAuction(auctionData);
        setBids(Array.isArray(bidsData) ? bidsData : []);
        setMe(meData);
      })
      .finally(() => setLoading(false));
  }, [id, token]); //id veya token değiştiğinde kısaca sayfaya giriş yapıldığında ihale teklifler ve giriş yapan kullanıcının bilgileri çekilip değişlkenlere atılır.

  const myUserId = me?.id ?? null;
  const isPublic = auction?.is_public_bids === true; //ihale herkese açık mı ?
  const auctionType: "highest" | "lowest" = auction?.auction_type ?? "highest";  //ihalenin türü
  


  const myBids = useMemo(() => {
    if (!myUserId) return [];
    return bids.filter(
      (b) =>
        (b.supplier_id ?? b.user_info?.id ?? b.user_id) === myUserId
    );
  }, [bids, myUserId]); //gelen tekliflerden giriş yapan kullanıcının id si ile eşleşenleri getiren useMemo fonksiyonumuz. sadece teklifler ve id değiştiğinde çağrılıyor.
 
  //?
  const visibleBase = useMemo(() => {
    return isPublic ? bids : myBids;
  }, [isPublic, bids, myBids]);
  //ispublic alanı true ise tüm teklifleri kullanabileceğiz eğer false ise sadece kendi tekliflerimizi kullanabileceğimizi belirliyoruz.

  const leaderboard = useMemo(() => {
    if (!auction) return [];
    return pickBestPerSupplier(visibleBase, auctionType);
  }, [visibleBase, auction, auctionType]); //en iyi teklifler fonksiyonunu kullanarak liderlik tablosu için teklif objelerini çağırıyoruz.

  const winnerBid = useMemo(() => {
    if (!auction) return null;
    const allBest = pickBestPerSupplier(bids, auctionType);
    return allBest[0] ?? null;
  }, [bids, auctionType, auction]); //en iyi teklifler fonksiyonunu çağırıp geriye dönen kayıttan ilk indeksi yani en iyi teklifi kazanan olarak gösteriyoruz.

  const didWin = useMemo(() => {
    if (!winnerBid || !myUserId) return null;
    const wId =
      winnerBid.supplier_id ?? winnerBid.user_info?.id ?? winnerBid.user_id;
    return wId === myUserId;
  }, [winnerBid, myUserId]); //yukarıda bulunan kazananı belirleyen useMemoyu kullanarak kazanan teklifin id si ile giriş yapan kullanıcının id si eşit ise true değil ise false döndrüyoruz.

  /** Benim en iyi teklifim */
  const myBestBid = useMemo(() => {
    if (!myBids.length) return null;
    return pickBestPerSupplier(myBids, auctionType)[0] ?? null;
  }, [myBids, auctionType]);  //en iyi teklifi belirleme fonksiyonuna sadece kendi tekliflerimizi yollarayak en iyi kendi teklifimizi buluyoruz.

  const myRank = useMemo(() => {
    if (!isPublic || !myBestBid) return null;
    const list = pickBestPerSupplier(bids, auctionType);
    const idx = list.findIndex(
      (b) =>
        (b.supplier_id ?? b.user_info?.id ?? b.user_id) ===
        (myBestBid.supplier_id ??
          myBestBid.user_info?.id ??
          myBestBid.user_id)
    );
    return idx >= 0 ? idx + 1 : null;
  }, [isPublic, myBestBid, bids, auctionType]); //ihale herkese kapalı ise boş herkese açık ise en iyi teklifleri list adlı değişkene atıp o list üzerinden kendi id mizin kaçıncı indexde oldugunu bulup +1 ile teklifimizin geneldeki sıralamasını buluyoruz. 

  /** Grafik (görebildiği veri) */
  const chartData = useMemo(() => {
    return visibleBase
      .slice()
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
      .map((b) => ({
        time: add3h(b.timestamp).toLocaleTimeString(),
        amount: Number(b.amount),
      }));
  }, [visibleBase]);

  const totalVisibleSuppliers = leaderboard.length;
  const totalVisibleBids = visibleBase.length;

  /**PERFORMANS ANALİZİ HESAPLAMALARI***/
  const winnerAmount = winnerBid ? Number(winnerBid.amount) : null; //Genel en yüksek teklif
  const myBestAmount = myBestBid ? Number(myBestBid.amount) : null; //Kendi en yüksek teklifimiz

  const gapAbs = useMemo(() => {
    if (winnerAmount == null || myBestAmount == null) return null;
    if (auctionType === "highest") return winnerAmount - myBestAmount; // + ise kazanana göre geridesiniz
    return myBestAmount - winnerAmount; // + ise kazanana göre daha pahalı (lowest)
  }, [winnerAmount, myBestAmount, auctionType]);

  const gapPct = useMemo(() => {
    if (winnerAmount == null || myBestAmount == null) return null;
    if (winnerAmount === 0) return null;
    const diff =
      auctionType === "highest"
        ? winnerAmount - myBestAmount
        : myBestAmount - winnerAmount;
    return (diff / winnerAmount) * 100;
  }, [winnerAmount, myBestAmount, auctionType]); 
  //ihale türüne göre kazanana tl ve % cinsinden uzaklıklarımız.

  const mySorted = useMemo(() => {
    return myBids
      .slice()
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
  }, [myBids]); //teklifler arasındaki zaman


  const myBidsCount = mySorted.length; //teklif sayımız 
  const myFirstTime = myBidsCount ? add3h(mySorted[0].timestamp) : null; //ilk teklifimizin zamanı
  const myLastTime = myBidsCount //son tekifimizin zamanı
    ? add3h(mySorted[myBidsCount - 1].timestamp)
    : null; 


  const avgIntervalMin = useMemo(() => {
    if (myBidsCount < 2) return null;
    let sum = 0;
    for (let i = 1; i < myBidsCount; i++) {
      const t1 = new Date(mySorted[i - 1].timestamp).getTime();
      const t2 = new Date(mySorted[i].timestamp).getTime();
      sum += (t2 - t1) / 60000;
    }
    return sum / (myBidsCount - 1);
  }, [mySorted, myBidsCount]);
  //dakika cinsinden ortalama teklif aralığı(teklifler arasında ortalama kaç dakika var)

  const participationRatio = useMemo(() => {
    if (!auction || !myFirstTime || !myLastTime) return null;
    const totalMs =
      new Date(auction.end_time).getTime() -
      new Date(auction.start_time).getTime();
    if (totalMs <= 0) return null;
    const activeMs =
      myLastTime.getTime() - myFirstTime.getTime();
    if (activeMs < 0) return 0;
    return (activeMs / totalMs) * 100;
  }, [auction, myFirstTime, myLastTime]);
  //ihalenin oluşturuldugu zaman ile bittiği zamanı birbirinden çıakrıp ne kadar zaman aktif kaldığını bulup ardından kendimizin ilk teklifi ile son teklifi arasındaki zamanı buluyoruz. sonrasında bölüp 100 ile çarpıyoruz ve toplam katılımı buluyoruz(çok tutarlı bir veri değil !)

  const minutesBeforeEnd = useMemo(() => {
    if (!auction || !myLastTime) return null;
    const end = new Date(auction.end_time).getTime();
    const last = myLastTime.getTime() - 3 * 60 * 60 * 1000; // myLastTime already +3h
    return (end - last) / 60000;
  }, [auction, myLastTime]); //son teklifimiz bitime kaç dakika kala verildi onu hesaplıyoruz.


  const last10minCount = useMemo(() => {
    if (!auction) return null;
    const endMs = new Date(auction.end_time).getTime();
    const startWindow = endMs - 10 * 60000;
    return mySorted.filter(
      (b) => new Date(b.timestamp).getTime() >= startWindow
    ).length;
  }, [mySorted, auction]); 
  //son 10 dakikada kaç teklif verdik. ihalelerin son dakikaları çok daha önemli olduğu için bunu da göstermek istedim.


  const compareData = useMemo(() => {
    if (winnerAmount == null && myBestAmount == null) return [];
    return [
      { label: "Siz", amount: myBestAmount ?? 0 },
      { label: "Kazanan", amount: winnerAmount ?? 0 },
    ];
  }, [winnerAmount, myBestAmount]); //Kazanan ile bizim aramızdaki fiyat farkını grafik olarak gösteriyoruz.(çok önemli değil)

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
                {add3h(auction?.start_time).toLocaleString()} -{" "}
                {add3h(auction?.end_time).toLocaleString()}
              </p>
              <p className="mt-1 text-sm font-medium text-green-900">
                {auctionType === "highest"
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

          <div className="mt-4">
            {didWin === true && (
              <div className="w-full rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-green-800 font-semibold flex items-center gap-2">
                🎉 Tebrikler! Bu ihaleyi KAZANDINIZ.
              </div>
            )}
            {didWin === false && (
              <div className="w-full rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-rose-800 font-semibold flex items-center gap-2">
                😔 Üzgünüz, bu ihaleyi KAYBETTİNİZ.
              </div>
            )}
            {didWin === null && (
              <div className="w-full rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-gray-800 font-semibold">
                Kazanan bilgisi belirlenemedi.
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            title="Kazanan Teklif"
            value={winnerBid ? `${Number(winnerBid.amount)} ₺` : "-"}
            icon={<FaCrown className="text-yellow-500" />}
          />
          <KpiCard
            title="Görüntülenen Tedarikçi"
            value={totalVisibleSuppliers}
          />
          <KpiCard title="Görüntülenen Teklif" value={totalVisibleBids} />
          {isPublic && myRank && <KpiCard title="Sıralamanız" value={`#${myRank}`} />}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Sizin En İyi Teklifiniz
          </h2>
          {myBestBid ? (
            <div>
              <p className="text-gray-900">
                <span className="font-semibold">Teklif:</span>{" "}
                {Number(myBestBid.amount)} ₺
              </p>
              <p className="text-gray-900">
                <span className="font-semibold">Zaman:</span>{" "}
                {add3h(myBestBid.timestamp).toLocaleString()}
              </p>
              {!isPublic && (
                <p className="text-gray-900 mt-2">
                  Bu ihalede teklifler gizliydi. Sadece kendi tekliflerinizi
                  görüntüleyebilirsiniz.
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-900">Bu ihaleye teklif vermemişsiniz.</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Kendi Performans Analizi
          </h2>
          <p className="text-sm text-gray-700 mb-4">
            Aşağıdaki metrikler yalnızca sizin tekliflerinize göre hesaplanır.
            (Kazananla kıyaslamada sadece toplam kazanan teklifi kullanılır.)
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <Metric label="Toplam Teklif" value={myBidsCount || "-"} />
            <Metric
              label="İlk Teklif"
              value={myFirstTime ? myFirstTime.toLocaleString() : "-"}
            />
            <Metric
              label="Son Teklif"
              value={myLastTime ? myLastTime.toLocaleString() : "-"}
            />
            <Metric
              label="Ort. Teklif Aralığı"
              value={
                avgIntervalMin != null
                  ? `${avgIntervalMin.toFixed(1)} dk`
                  : "-"
              }
            />
            <Metric
              label="Katılım Oranı"
              value={
                participationRatio != null
                  ? `${participationRatio.toFixed(1)}%`
                  : "-"
              }
            />
            <Metric
              label="Bitişe Kalan (Son Teklif)"
              value={
                minutesBeforeEnd != null
                  ? `${minutesBeforeEnd.toFixed(1)} dk`
                  : "-"
              }
            />
            
            <Metric
              label="Son 10 dk'daki Teklif"
              value={last10minCount != null ? last10minCount : "-"}
            />
            <Metric
              label="Kazanana Uzaklık"
              value={
                gapAbs != null
                  ? `${gapAbs >= 0 ? "+" : ""}${gapAbs.toFixed(2)} ₺`
                  : "-"
              }
            />
            <Metric
              label="Kazanana Uzaklık (%)"
              value={
                gapPct != null
                  ? `${gapPct >= 0 ? "+" : ""}${gapPct.toFixed(2)}%`
                  : "-"
              }
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Karşılaştırma: Siz vs Kazanan
              </h3>
              {compareData.length ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={compareData}>
                    <CartesianGrid stroke="#eee" />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="amount" name="Teklif (₺)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-900">Karşılaştırma için veri yok.</p>
              )}
            </div>
          </div>
        </div>

        {isPublic && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Lider Tablosu
            </h2>
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
                {leaderboard.map((bid, index) => {
                  const idOf =
                    bid.supplier_id ?? bid.user_info?.id ?? bid.user_id;
                  const isMeRow = myUserId && idOf === myUserId;
                  return (
                    <tr
                      key={bid.id}
                      className={
                        "border-b hover:bg-gray-50 " +
                        (isMeRow ? "bg-green-50/60" : "")
                      }
                    >
                      <td className="p-3 text-gray-900">{index + 1}</td>
                      <td className="p-3 text-gray-900">
                        {bid.user_info?.company ?? `#${idOf}`}
                        {isMeRow && (
                          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-semibold">
                            Siz
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-semibold text-gray-900">
                        {Number(bid.amount)} ₺
                      </td>
                      <td className="p-3 text-gray-900">
                        {add3h(bid.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {isPublic
              ? "Fiyat Değişim Grafiği (Genel)"
              : "Fiyat Değişim Grafiği (Sizin Teklifleriniz)"}
          </h2>
          {chartData.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid stroke="#eee" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#16a34a"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-900">Grafik için yeterli veri yok.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: any;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center justify-center">
      {icon && <div className="text-3xl mb-2">{icon}</div>}
      <h3 className="text-sm text-gray-900">{title}</h3>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="text-xs text-gray-600">{label}</div>
      <div className="text-lg font-semibold text-gray-900 mt-1">{value}</div>
    </div>
  );
}
