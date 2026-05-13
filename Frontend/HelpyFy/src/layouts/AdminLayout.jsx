import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-[#f5faf5]">

      {/* SIDEBAR */}
      <Sidebar />

      {/* RIGHT SIDE */}
      <div className="flex-1 flex flex-col">

        {/* TOP NAV */}
        <Navbar />

        {/* CONTENT */}
        <main className="flex-1 p-4 bg-[#f5faf5]">
          <Outlet />
        </main>

      </div>

    </div>
  );
}