'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {//Giriş yap butonuna bastığımızda bu fonksiyon çalışır. asenkrondur yani bir isteği beklerken fonksiyon çalışmaya devam edebilir veya await anahtar kelimesi ile yanıtın gelmesini bekleyebiliriz.Await kelimesini kullandığımızda işi bekler ancak await satırının kullanıldığı fonksiyon haricinde çalışan fonksiyonlar vb. şeyler varsa onlar çalışmaya devam eder yani await tüm uygulamayı durdurmaz parametre olarak React.FormEvent türünde e nesnesini alır. bu e nesnesi form olayını(eventini) temsil eder.
    e.preventDefault(); //form gönderildiğinde sayfanın yenilenmesini engeller.


    const formData = new URLSearchParams();//URLSearchhParam tarayıcıda yerleşik bulunan bir js sınıfıdır. key=value çiftleri şeklinde URL encode edilmiş (url de boşluk olmaz normalde o boşluk yerine %20 gibi karakterler yazılarak ifade edilir. örneğin username=ali%20kaya&password=abc123 şeklindedir). veri oluşturmak için kullanılır.

    formData.append("username", email);
    formData.append("password", password);//useState hookundan çekilmiş email ve password veriliri formData da bulunan username ve password verilerine key=value  şeklinde aktarıyoruz. burada username ve password alanları backendin beklediği şekilde uyuşmalıdır.

    try {
      const res = await fetch("http://127.0.0.1:8000/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

     //user/login adresine bir post isteği atıyoruz ve bu isteğin gövde tipininin "application/x-www-form-urlencoded" olduğunu belirtiyoruz. Çünkü biz formData nesnemizi URLSearchParams() sınıfından türetmiştik ve bu türde veri tuttuğunu açıklamıştık. bodysinde ise string türünde formData nesnesini tutuyoruz.

      const data = await res.json(); //Yapılan api isteğinin cevabı res değişkenine gelmişti ancak register/page.tsx de açıkladığım gibi res de sadece res.statu yani 404,500 gibi gelen kodlar ve res.ok yani istek başarılı mı ? bunlar vb. şeyler dönüyordu. dönen veri ham haldeydi bunu json formatına cevirip data adlı değişkene aktarıyoruz.

      if (res.ok) {
        alert("Giriş başarılı!");
        localStorage.setItem("token", data.access_token);
      //Eğer istek başarılı olursa yani res.ok true ise Giriş başarılı yanıtını döndürüp localStorage ye yani yerel depoya token anahtarı ve res de ham olarak tutulup json formatında data adlı değişkene aktarılan token değerini kaydediyoruz. Tarayıcıyı kapatsak bile localStrorage veriyi tutar.

        const userRes = await fetch("http://127.0.0.1:8000/users/me", {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
          },
        });
        //users/me adresine bir istek yolluyoruz ve bu istek içerisinde ek bilgi(örneğin kimlik doğrulama bilgisi, içerik tipi, dil vs.) göndermek için headers ı kullanıyoruz. içerisinde Authorization var yani  kimlik doğrulamak için kullanılan bir başlık Bearer ise  belirttiğimiz tokenı taşır.
        //Ayrıca users/me korumalı bir endpointtir. yalnızca geçerli bir jwt tokenı olan kullanıcılar erişebilir.

        const userData = await userRes.json(); //gelen yanıt json formatına çevrilir ve userData adlı değişkene aktarılır.
        // /users/me endpointinde gelen tokene göre token geçerli ise o kullanıcı geri döndürülür.

        const companyRes = await fetch(`http://127.0.0.1:8000/companies/${userData.company_id}`, {
          headers: {
            Authorization: `Bearer ${data.access_token}`,
          },
        });
        //Burada id ye göre şirketler tablosuna bir istekte bulunuluyor yine token ile beraber.
 
        const companyData = await companyRes.json(); // Gelen istek json formatına çevrilip companyData adlı değişkene aktarılıyor. burada şirket verileri var. 
        if (!companyRes.ok) {
  console.error("Şirket bilgisi alınamadı", await companyRes.text());
  return;
}
       console.log(companyData.type)
        if (companyData.type === "customer") {
          router.push("/customer");
        } else if (companyData.type === "supplier") {
          router.push("/supplier");
        } else {
          router.push("/dashboard");
        }
        //Şirketin tipine göre hangi sayfaya yönlendirilecekse o sayfaya yönlendirme yapılıyor.
      } else {
        alert(data.detail || "Giriş başarısız");
      } //dönen veride hata mesajı varsa giriş başarısız uyarısı ve hata mesajı veriliyor.
    } catch (err) {
      alert("Sunucuya bağlanılamadı.");
      console.error(err); //Sunucuda bir hata varsa catch çalışıyor ve hata döndürülüyor.
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-[#1561ad] via-[#1c77ac] to-[#1dbab4] p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-lg flex flex-col items-center gap-6">
        <div className="w-20 h-20 bg-[#fc5226] rounded-full flex items-center justify-center shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11H9v2h2V7zm0 4H9v4h2v-4z" clipRule="evenodd" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-[#1561ad]">E-İhale Giriş</h1>

        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
        <input
  type="email"
  placeholder="Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className="w-full p-3 border border-[#1c77ac] rounded-xl 
             placeholder-gray-500 
             text-gray-800 text-opacity-100
             focus:outline-none focus:ring-2 focus:ring-[#1dbab4]"
  required
/>


          <input
  type="password"
  placeholder="Şifre"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  className="w-full p-3 border border-[#1c77ac] rounded-xl 
             placeholder-gray-500 
             text-gray-800 text-opacity-100
             focus:outline-none focus:ring-2 focus:ring-[#1dbab4]"
  required
/>

          <button
            type="submit"
            className="bg-[#fc5226] hover:bg-[#e14a1e] text-white font-bold py-3 rounded-xl transition-shadow shadow-md hover:shadow-lg"
          >
            Giriş Yap
          </button>
        </form>
      </div>
    </div>
  );
}
