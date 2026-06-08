import { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import AIAssistant from "../components/AIAssitant";
import { Outlet } from "react-router-dom";
import IdleLogout from "../components/IdleLogout";
export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="min-h-screen bg-[#f5f6f7]">
       {/* AUTO LOGOUT AFTER 1 HOUR IDLE */}
      <IdleLogout />
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <Navbar />
      </header>

      {/* BODY */}
      <div className="flex pt-16">

        {/* SIDEBAR */}
        <aside
          className={`fixed left-0 top-16 h-[calc(100vh-64px)] z-40 transition-all duration-300 ${
            collapsed ? "w-[90px]" : "w-[280px]"
          }`}
        >
          <Sidebar
            collapsed={collapsed}
            setCollapsed={setCollapsed}
          />
        </aside>

        {/* PAGE CONTENT */}
        <main
          className={`flex-1 p-6 overflow-auto min-h-[calc(100vh-64px)] transition-all duration-300 ${
            collapsed ? "ml-[90px]" : "ml-[280px]"
          }`}
        >
          <Outlet />
        </main>

      </div>

      {/* 🔥 AI ASSISTANT (GLOBAL FLOATING WIDGET) */}
      <AIAssistant />

    </div>
  );
}