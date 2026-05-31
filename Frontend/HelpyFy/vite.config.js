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
  /* ================= SAFE STATE ================= */
  const [stats, setStats] = useState({
    totalAssets: 0,
    laptops: 0,
    printers: 0,
    hht: 0,
    assigned: 0,
    available: 0,
    employees: 0,
    openTickets: 0,
    totalActiveLicenses: 0,
    expiringThisMonth: 0,
    expiredServices: 0,
    annualSoftwareCost: 0,
  });

  const [recentAssets, setRecentAssets] = useState([]);
  const [recentSoftware, setRecentSoftware] = useState([]);

  /* ================= LOAD DASHBOARD ================= */
  const loadDashboard = async () => {
    try {
      const [statsRes, assetsRes, softwareRes] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/dashboard/recent-assets"),
        api.get("/dashboard/recent-software"),
      ]);

      const s = statsRes.data || {};

      setStats({
        totalAssets: s.totalAssets ?? 0,
        laptops: s.laptops ?? 0,
        printers: s.printers ?? 0,
        hht: s.hht ?? 0,
        assigned: s.assigned ?? 0,
        available: s.available ?? 0,
        employees: s.employees ?? 0,
        openTickets: s.openTickets ?? 0,
        totalActiveLicenses: s.totalActiveLicenses ?? 0,
        expiringThisMonth: s.expiringThisMonth ?? 0,
        expiredServices: s.expiredServices ?? 0,
        annualSoftwareCost: s.annualSoftwareCost ?? 0,
      });

      setRecentAssets(Array.isArray(assetsRes.data) ? assetsRes.data : []);
      setRecentSoftware(Array.isArray(softwareRes.data) ? softwareRes.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  /* ================= SAFE CHART DATA ================= */
  const assetChart = [
    { name: "Laptops", value: Number(stats.laptops || 0) },
    { name: "Printers", value: Number(stats.printers || 0) },
    { name: "HHT", value: Number(stats.hht || 0) },
  ];

  const assetStatus = [
    { name: "Assigned", value: Number(stats.assigned || 0) },
    { name: "Available", value: Number(stats.available || 0) },
  ];

  const softwareChart = [
    { name: "Active", value: Number(stats.totalActiveLicenses || 0) },
    { name: "Expiring", value: Number(stats.expiringThisMonth || 0) },
    { name: "Expired", value: Number(stats.expiredServices || 0) },
  ];

  const COLORS = ["#3b82f6", "#10b981", "#ef4444"];

  /* ================= TILE ================= */
  const Tile = ({ title, value }) => (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <p className="text-gray-500 text-sm">{title}</p>
      <h2 className="text-3xl font-bold mt-2 text-gray-800">
        {value}
      </h2>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-gray-900 p-6">

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Admin Dashboard
        </h1>
        <p className="text-gray-500">
          SAP Fiori Enterprise Overview
        </p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

        <Tile title="Total Assets" value={stats.totalAssets} />
        <Tile title="Assigned" value={stats.assigned} />
        <Tile title="Available" value={stats.available} />
        <Tile title="Employees" value={stats.employees} />

        <Tile title="Open Tickets" value={stats.openTickets} />
        <Tile title="Active Licenses" value={stats.totalActiveLicenses} />
        <Tile title="Expiring Licenses" value={stats.expiringThisMonth} />
        <Tile
          title="Annual Software Cost"
          value={`QAR ${Number(stats.annualSoftwareCost).toLocaleString()}`}
        />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

        {/* PIE CHART */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="mb-4 font-semibold text-gray-700">
            Asset Distribution
          </h2>

          <ResponsiveContainer width="100%" height={250}>
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

        {/* BAR CHART */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="mb-4 font-semibold text-gray-700">
            Asset Status
          </h2>

          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={assetStatus}>
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SOFTWARE CHART */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
        <h2 className="mb-4 font-semibold text-gray-700">
          Software Overview
        </h2>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={softwareChart}>
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Bar dataKey="value" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* RECENT ASSETS */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
        <h2 className="font-semibold mb-4 text-gray-700">
          Recent Assets
        </h2>

        <table className="w-full text-sm">
          <thead className="text-gray-500 border-b">
            <tr>
              <th className="p-2 text-left">Code</th>
              <th className="p-2 text-left">Type</th>
              <th className="p-2 text-left">Model</th>
              <th className="p-2 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {recentAssets.map((a) => (
              <tr key={a._id} className="border-b hover:bg-gray-50">
                <td className="p-2">{a.assetCode}</td>
                <td className="p-2">{a.type}</td>
                <td className="p-2">{a.model || "-"}</td>
                <td className="p-2">{a.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* RECENT SOFTWARE */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h2 className="font-semibold mb-4 text-gray-700">
          Recent Software
        </h2>

        <table className="w-full text-sm">
          <thead className="text-gray-500 border-b">
            <tr>
              <th className="p-2 text-left">Service</th>
              <th className="p-2 text-left">Vendor</th>
              <th className="p-2 text-left">Expiry</th>
              <th className="p-2 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {recentSoftware.map((s) => (
              <tr key={s._id} className="border-b hover:bg-gray-50">
                <td className="p-2">{s.serviceName}</td>
                <td className="p-2">{s.vendor}</td>
                <td className="p-2">
                  {new Date(s.expiryDate).toLocaleDateString()}
                </td>
                <td className="p-2">{s.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}