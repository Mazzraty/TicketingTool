import { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5faf5] flex">
      {/* SIDEBAR */}
      <aside
        className={`fixed left-0 top-0 h-screen bg-white border-r z-50 transition-all duration-300 ${
          collapsed ? "w-20" : "w-[270px]"
        }`}
      >
        <Sidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        />
      </aside>

      {/* CONTENT */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          collapsed ? "ml-20" : "ml-[270px]"
        }`}
      >
        <header className="sticky top-0 z-40 bg-white border-b">
          <Navbar />
        </header>

        <main className="flex-1 p-6 bg-[#f5faf5]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}