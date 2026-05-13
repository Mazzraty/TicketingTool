import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-[#f5faf5]">

      {/* TOP NAV */}
      <Navbar />

      {/* CONTENT */}
      <main className="flex-1 p-4 bg-[#f5faf5]">
        <Outlet />
      </main>

    </div>
  );
}