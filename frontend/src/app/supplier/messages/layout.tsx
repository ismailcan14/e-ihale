export default function Layout({
  children,
  conversation,        
}: {
  children: React.ReactNode;
  conversation: React.ReactNode;
}) {
  return (
    <div className="min-h-screen p-4">
      <div className="mx-auto max-w-6xl grid gap-4 lg:grid-cols-[1fr_420px]">
        {/* Sol: ana içerik (liste/konuşmalar) */}
        <div className="bg-white rounded-xl shadow">{children}</div>

        {/* Sağ: modal/yan panel */}
        <aside className="bg-white rounded-xl shadow lg:sticky lg:top-20 h-fit">
          { conversation ?? <div className="p-6 text-gray-500">Panel yok</div>}
        </aside>
      </div>
    </div>
  );
}