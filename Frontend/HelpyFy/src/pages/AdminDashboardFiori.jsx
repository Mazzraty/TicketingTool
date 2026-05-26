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

  const [recentAssets, setRecentAssets] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);

  /* ================= LOAD DASHBOARD ================= */
  const loadDashboard = async () => {
    try {
      const [statsRes, assetsRes, ticketsRes] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/dashboard/recent-assets"),
        api.get("/dashboard/recent-tickets"),
      ]);

      setStats(statsRes.data || {});
      setRecentAssets(assetsRes.data || []);
      setRecentTickets(ticketsRes.data || []);
    } catch (err) {
      console.error("Dashboard error:", err);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f7fa] p-6">

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Admin Dashboard
        </h1>
        <p className="text-gray-500">
          SAP Fiori Control Center
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
        <Tile title="Total Assets" value={stats.totalAssets} />
        <Tile title="Assigned" value={stats.assigned} />
        <Tile title="Available" value={stats.available} />
        <Tile title="Employees" value={stats.employees} />

        <Tile title="Open Tickets" value={stats.openTickets} />
        <Tile title="Laptops" value={stats.laptops} />
        <Tile title="Printers" value={stats.printers} />
        <Tile title="HHT" value={stats.hht} />
      </div>

      {/* QUICK ACTIONS */}
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

      {/* REAL DATA SECTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* RECENT ASSETS */}
        <div className="bg-white rounded-2xl p-5 border shadow-sm">
          <h3 className="font-semibold mb-3">Recent Assets</h3>

          <div className="space-y-3 text-sm text-gray-600">
            {recentAssets.length === 0 ? (
              <p>No recent assets</p>
            ) : (
              recentAssets.map((a) => (
                <p key={a._id}>
                  📦 {a.assetCode} ({a.type}) - {a.status}
                </p>
              ))
            )}
          </div>
        </div>

        {/* RECENT TICKETS */}
        <div className="bg-white rounded-2xl p-5 border shadow-sm">
          <h3 className="font-semibold mb-3">Recent Tickets</h3>

          <div className="space-y-3 text-sm text-gray-600">
            {recentTickets.length === 0 ? (
              <p>No recent tickets</p>
            ) : (
              recentTickets.map((t) => (
                <p key={t._id}>
                  🎫 {t.title} - {t.status}
                </p>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

/* ================= TILE ================= */
function Tile({ title, value }) {
  return (
    <div className="bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition">
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className="text-3xl font-bold mt-2 text-blue-600">
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