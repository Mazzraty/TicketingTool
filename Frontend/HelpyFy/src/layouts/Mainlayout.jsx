import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-[#f5faf5] flex">

      {/* SIDEBAR (FIXED LEFT) */}
      <aside className="w-[270px] fixed left-0 top-0 h-screen bg-white border-r z-50">
        <Sidebar />
      </aside>

      {/* RIGHT CONTENT AREA */}
      <div className="flex-1 ml-[270px] flex flex-col min-h-screen">

        {/* TOP NAVBAR */}
        <header className="sticky top-0 z-40 bg-white border-b">
          <Navbar />
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-6 bg-[#f5faf5]">
          <Outlet />
        </main>

      </div>

    </div>
  );
}