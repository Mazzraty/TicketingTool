import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-[#f5f6f7]">

      {/* TOP NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b">
        <Navbar />
      </header>

      {/* BODY */}
      <div className="flex pt-16">

        {/* SIDEBAR */}
        <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] z-40">
          <Sidebar />
        </aside>

        {/* PAGE CONTENT */}
        <main className="flex-1 ml-[280px] p-6 overflow-auto">
          <Outlet />
        </main>

      </div>
    </div>
  );
}