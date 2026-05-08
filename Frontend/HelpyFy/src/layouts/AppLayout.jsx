export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eaf7e3] via-[#f7fff4] to-[#e2f3dc]">
      {/* optional soft overlay */}
      <div
        className="fixed inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "url('https://www.transparenttextures.com/patterns/grass.png')",
        }}
      />

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}