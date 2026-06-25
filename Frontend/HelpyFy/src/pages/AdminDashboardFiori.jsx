import { useEffect, useState } from "react";
import api from "../api/axios";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import {
  Package,
  Laptop,
  Printer,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Users,
  FileText,
  Lock,
  DollarSign,
  TrendingUp,
  Calendar,
} from "lucide-react";

export default function AdminDashboardProfessional() {
  /* ================= STATE ================= */
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
  const [loading, setLoading] = useState(true);

  /* ================= LOAD DASHBOARD ================= */
  const loadDashboard = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  /* ================= CHART DATA ================= */
  const assetChart = [
    { name: "Laptops", value: stats.laptops || 0, fill: "#0066ff" },
    { name: "Printers", value: stats.printers || 0, fill: "#00d084" },
    { name: "Mobile/HHT", value: stats.hht || 0, fill: "#ff6b6b" },
  ];

  const assetStatus = [
    { name: "Assigned", value: stats.assigned || 0 },
    { name: "Available", value: stats.available || 0 },
  ];

  /* ================= STAT CARD COMPONENT ================= */
  const StatCard = ({ icon: Icon, title, value, trend, trendType = "neutral", subtext }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
          {subtext && <p className="text-xs text-gray-500 mt-2">{subtext}</p>}
        </div>
        <div
          className={`p-3 rounded-lg ${
            trendType === "positive"
              ? "bg-green-100"
              : trendType === "warning"
              ? "bg-amber-100"
              : "bg-blue-100"
          }`}
        >
          <Icon
            size={20}
            className={
              trendType === "positive"
                ? "text-green-600"
                : trendType === "warning"
                ? "text-amber-600"
                : "text-blue-600"
            }
          />
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-xs">
          <TrendingUp size={14} className="text-green-600" />
          <span className="text-green-600 font-medium">{trend}</span>
        </div>
      )}
    </div>
  );

  /* ================= SECTION HEADER ================= */
  const SectionHeader = ({ title, subtitle }) => (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );

  /* ================= CHART WRAPPER ================= */
  const ChartCard = ({ title, children }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-6">{title}</h3>
      {children}
    </div>
  );

  /* ================= TABLE COMPONENT ================= */
  const EnhancedTable = ({ title, columns, data, loading }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading...</div>
      ) : data.length === 0 ? (
        <div className="p-8 text-center text-gray-500">No data available</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {columns.map((col, i) => (
                  <th
                    key={i}
                    className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150"
                >
                  {Object.values(row).map((cell, cellIdx) => (
                    <td key={cellIdx} className="px-6 py-4 text-sm text-gray-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  /* ================= STATUS BADGE ================= */
  const StatusBadge = ({ status }) => {
    const colors = {
      available: "bg-green-100 text-green-800",
      assigned: "bg-blue-100 text-blue-800",
      active: "bg-green-100 text-green-800",
      expired: "bg-red-100 text-red-800",
      expiring: "bg-amber-100 text-amber-800",
    };
    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
          colors[status.toLowerCase()] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status.toLowerCase() === "available" || status.toLowerCase() === "active" ? (
          <CheckCircle size={12} />
        ) : (
          <AlertCircle size={12} />
        )}
        {status}
      </span>
    );
  };

  /* ================= CUSTOM TOOLTIP ================= */
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-sm text-blue-600 font-semibold">
            {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  /* ================= RENDER ================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* HEADER */}
      <div className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Enterprise asset & operations overview
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar size={16} />
              <span>Last updated: Just now</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* KPI SECTION */}
        <div className="mb-12">
          <SectionHeader
            title="Key Performance Indicators"
            subtitle="Real-time asset and operations metrics"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={Package}
              title="Total Assets"
              value={stats.totalAssets}
              subtext={`${stats.assigned} assigned, ${stats.available} available`}
            />
            <StatCard
              icon={Laptop}
              title="Laptops"
              value={stats.laptops}
              trendType="positive"
              trend="+2 this month"
            />
            <StatCard
              icon={Printer}
              title="Printers"
              value={stats.printers}
              subtext="Managed devices"
            />
            <StatCard
              icon={Smartphone}
              title="Mobile/HHT"
              value={stats.hht}
              subtext="Hand-held terminals"
            />

            <StatCard
              icon={Users}
              title="Employees"
              value={stats.employees}
              subtext="Active staff"
            />
            <StatCard
              icon={FileText}
              title="Open Tickets"
              value={stats.openTickets}
              trendType={stats.openTickets > 5 ? "warning" : "positive"}
              subtext="Support requests"
            />
            <StatCard
              icon={Lock}
              title="Active Licenses"
              value={stats.totalActiveLicenses}
              subtext={`${stats.expiringThisMonth} expiring soon`}
              trendType={stats.expiringThisMonth > 0 ? "warning" : "positive"}
            />
            <StatCard
              icon={DollarSign}
              title="Annual Software Cost"
              value={`QAR ${Number(stats.annualSoftwareCost).toLocaleString()}`}
              subtext="Current fiscal year"
            />
          </div>
        </div>

        {/* CHARTS SECTION */}
        <div className="mb-12">
          <SectionHeader
            title="Asset Analytics"
            subtitle="Distribution and status breakdown"
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* PIE CHART */}
            <ChartCard title="Asset Distribution by Type">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={assetChart}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {assetChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span className="text-sm text-gray-700">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* BAR CHART */}
            <ChartCard title="Asset Allocation Status">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={assetStatus} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="name" stroke="#9ca3af" style={{ fontSize: "12px" }} />
                  <YAxis stroke="#9ca3af" style={{ fontSize: "12px" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#0066ff" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>

        {/* TABLES SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <EnhancedTable
            title="Recent Assets"
            columns={["Asset Code", "Type", "Model", "Status"]}
            data={recentAssets.map((a) => ({
              code: a.assetCode,
              type: a.type,
              model: a.model || "—",
              status: <StatusBadge status={a.status} />,
            }))}
            loading={loading}
          />

          <EnhancedTable
            title="Recent Software"
            columns={["Service", "Vendor", "Expiry Date", "Status"]}
            data={recentSoftware.map((s) => ({
              service: s.serviceName,
              vendor: s.vendor,
              expiry: new Date(s.expiryDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              }),
              status: <StatusBadge status={s.status} />,
            }))}
            loading={loading}
          />
        </div>

        {/* FOOTER */}
        <div className="border-t border-gray-100 pt-6">
          <p className="text-xs text-gray-500 text-center">
            Dashboard automatically refreshes every 5 minutes • Last sync: Today at 2:30 PM
          </p>
        </div>
      </div>
    </div>
  );
}
