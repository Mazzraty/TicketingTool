import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <>
      <Navbar />

      <div className="p-6 bg-gray-100 min-h-screen">
        <Outlet />
      </div>
    </>
  );
}