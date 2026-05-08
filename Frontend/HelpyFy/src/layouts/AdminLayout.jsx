import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex bg-[#f5faf5]">

      {/* LEFT SIDEBAR (fixed navigation) */}
      <aside className="w-[280px] shrink-0 border-r bg-white">
        <Sidebar />
      </aside>

      {/* RIGHT SIDE */}
      <div className="flex flex-col flex-1">

        {/* TOP NAVBAR (fixed header) */}
        <header className="h-16 border-b bg-white sticky top-0 z-10">
          <Navbar />
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 overflow-y-auto">
          <Outlet />
        </main>

      </div>

    </div>
  );
}