import { useEffect, useState } from "react";
import api from "../api/axios";

export default function AdminDashboardFiori() {
  const [stats, setStats] = useState({
    totalAssets: 0,
    laptops: 0,
    printers: 0,
    hht: 0,
    assigned: 0,
    available: 0,
    employees: 0,
    openTickets: 0,
  });

  const loadStats = async () => {
    try {
      const res = await api.get("/dashboard/stats");
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f7fa] p-6">

      {/* ================= HEADER ================= */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Admin Dashboard
        </h1>
        <p className="text-gray-500">
          SAP Fiori Control Center
        </p>
      </div>

      {/* ================= KPI TILES ================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">

        <Tile title="Total Assets" value={stats.totalAssets} color="blue" />
        <Tile title="Assigned" value={stats.assigned} color="green" />
        <Tile title="Available" value={stats.available} color="purple" />
        <Tile title="Employees" value={stats.employees} color="indigo" />

        <Tile title="Open Tickets" value={stats.openTickets} color="red" />
        <Tile title="Laptops" value={stats.laptops} color="blue" />
        <Tile title="Printers" value={stats.printers} color="green" />
        <Tile title="HHT" value={stats.hht} color="purple" />

      </div>

      {/* ================= QUICK ACTIONS ================= */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-gray-700">
          Quick Actions
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

          <ActionTile label="Add Asset" path="/admin/assets" />
          <ActionTile label="Assign Asset" path="/admin/assets" />
          <ActionTile label="Upload Excel" path="/admin/assets/upload-excel" />
          <ActionTile label="Asset History" path="/admin/assets/history" />

        </div>
      </div>

      {/* ================= ACTIVITY + STATUS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Activity Feed */}
        <div className="bg-white rounded-2xl p-5 border shadow-sm">
          <h3 className="font-semibold mb-3">Recent Activity</h3>

          <div className="space-y-3 text-sm text-gray-600">
            <p>📦 Laptop A123 assigned to John</p>
            <p>🎫 Ticket #245 created</p>
            <p>📱 HHT device updated</p>
            <p>🖨️ Printer returned to stock</p>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-2xl p-5 border shadow-sm">
          <h3 className="font-semibold mb-3">System Status</h3>

          <div className="space-y-3 text-sm">

            <Status label="Backend API" status="online" />
            <Status label="Database" status="online" />
            <Status label="Asset Service" status="online" />

          </div>
        </div>

      </div>

    </div>
  );
}

/* ================= TILE ================= */
function Tile({ title, value, color }) {
  const colors = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    red: "text-red-600",
    indigo: "text-indigo-600",
  };

  return (
    <div className="bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition">
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className={`text-3xl font-bold mt-2 ${colors[color]}`}>
        {value}
      </h2>
    </div>
  );
}

/* ================= ACTION TILE ================= */
function ActionTile({ label, path }) {
  return (
    <a
      href={path}
      className="bg-white border rounded-2xl p-4 text-center hover:bg-blue-50 hover:border-blue-300 transition font-semibold text-gray-700"
    >
      {label}
    </a>
  );
}

/* ================= STATUS ================= */
function Status({ label, status }) {
  return (
    <div className="flex justify-between items-center">
      <span>{label}</span>
      <span
        className={`px-3 py-1 rounded-full text-xs font-bold ${
          status === "online"
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
        }`}
      >
        {status}
      </span>
    </div>
  );
}