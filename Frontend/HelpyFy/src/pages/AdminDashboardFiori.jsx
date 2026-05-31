import { useEffect, useState } from "react";
import api from "../api/axios";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function AdminDashboardFiori() {
  const [stats, setStats] = useState(null);
  const [recentAssets, setRecentAssets] = useState([]);
  const [recentSoftware, setRecentSoftware] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const [statsRes, assetsRes, softwareRes] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/dashboard/recent-assets"),
        api.get("/dashboard/recent-software"),
      ]);

      setStats(statsRes.data || {});
      setRecentAssets(assetsRes.data || []);
      setRecentSoftware(softwareRes.data || []);
    } catch (err) {
      console.error("Dashboard error:", err);
      setStats({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  /* ================= SAFE FALLBACK ================= */
  const s = stats || {};

  const assetChart = [
    { name: "Laptops", value: s.laptops ?? 0 },
    { name: "Printers", value: s.printers ?? 0 },
    { name: "HHT", value: s.hht ?? 0 },
  ];

  const assetStatus = [
    { name: "Assigned", value: s.assigned ?? 0 },
    { name: "Available", value: s.available ?? 0 },
  ];

  const softwareChart = [
    { name: "Active", value: s.totalActiveLicenses ?? 0 },
    { name: "Expiring", value: s.expiringThisMonth ?? 0 },
    { name: "Expired", value: s.expiredServices ?? 0 },
  ];

  const COLORS = ["#60a5fa", "#34d399", "#f87171"];

  const Tile = ({ title, value, color }) => (
    <div className="bg-[#1f2937] border border-gray-700 rounded-2xl p-5 shadow-lg">
      <p className="text-gray-400 text-sm">{title}</p>
      <h2 className={`text-3xl font-bold mt-2 ${color || "text-white"}`}>
        {value ?? 0}
      </h2>
    </div>
  );

  /* ================= LOADING SAFE ================= */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1220] text-white flex items-center justify-center">
        <div className="text-gray-400">Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1220] text-white p-6">

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-400">SAP Fiori Dark Mode Overview</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Tile title="Total Assets" value={s.totalAssets} />
        <Tile title="Assigned" value={s.assigned} color="text-blue-400" />
        <Tile title="Available" value={s.available} color="text-green-400" />
        <Tile title="Employees" value={s.employees} color="text-purple-400" />
        <Tile title="Open Tickets" value={s.openTickets} color="text-red-400" />
        <Tile title="Active Licenses" value={s.totalActiveLicenses} color="text-blue-300" />
        <Tile title="Expiring" value={s.expiringThisMonth} color="text-yellow-400" />
        <Tile title="Annual Cost" value={`QAR ${s.annualSoftwareCost || 0}`} />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

        {/* PIE */}
        <div className="bg-[#1f2937] border border-gray-700 rounded-2xl p-5 h-[320px]">
          <h2 className="mb-4 font-semibold">Asset Distribution</h2>

          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie data={assetChart} dataKey="value" nameKey="name" outerRadius={90}>
                {assetChart.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* BAR */}
        <div className="bg-[#1f2937] border border-gray-700 rounded-2xl p-5 h-[320px]">
          <h2 className="mb-4 font-semibold">Asset Status</h2>

          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={assetStatus}>
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip />
              <Bar dataKey="value" fill="#60a5fa" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SOFTWARE */}
      <div className="bg-[#1f2937] border border-gray-700 rounded-2xl p-5 mb-6 h-[350px]">
        <h2 className="mb-4 font-semibold">Software Overview</h2>

        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={softwareChart}>
            <XAxis dataKey="name" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip />
            <Bar dataKey="value" fill="#34d399" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* TABLES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ASSETS */}
        <div className="bg-[#1f2937] border border-gray-700 rounded-2xl p-5">
          <h2 className="font-semibold mb-4">Recent Assets</h2>

          <table className="w-full text-sm">
            <tbody>
              {recentAssets.map((a) => (
                <tr key={a._id} className="border-b border-gray-700">
                  <td className="p-2">{a.assetCode}</td>
                  <td className="p-2">{a.type}</td>
                  <td className="p-2">{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SOFTWARE */}
        <div className="bg-[#1f2937] border border-gray-700 rounded-2xl p-5">
          <h2 className="font-semibold mb-4">Recent Software</h2>

          <table className="w-full text-sm">
            <tbody>
              {recentSoftware.map((s) => (
                <tr key={s._id} className="border-b border-gray-700">
                  <td className="p-2">{s.serviceName}</td>
                  <td className="p-2">{s.vendor}</td>
                  <td className="p-2">{s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}