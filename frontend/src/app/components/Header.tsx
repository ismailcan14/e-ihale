"use client"

export default function Header() {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
  <header className="fixed top-0 left-0 w-full bg-white shadow p-4 flex justify-between items-center z-50">
  <h1 className="text-lg font-bold text-gray-800">E-İhale Sistemi</h1>
  <button
    onClick={handleLogout}
    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
  >
    Çıkış Yap
  </button>
</header>
  );
}
