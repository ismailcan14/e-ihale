import Header from "../components/Header";
import CustomerSidebar from "../components/sidebars/CustomerSidebar";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gray-100">
      <CustomerSidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-10 bg-white flex-1">{children}</main>
      </div>
    </div>
  );
}
