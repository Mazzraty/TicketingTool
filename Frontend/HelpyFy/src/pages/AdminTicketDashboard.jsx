import { useEffect, useState, useCallback } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

/* ================= HELPERS ================= */
const todayStr = () => new Date().toISOString().split("T")[0];
const daysAgoStr = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};

const STATUS_COLORS = {
  Open: "#3b82f6",
  "In Progress": "#f59e0b",
  Resolved: "#10b981",
  Closed: "#64748b",
};

const PRIORITY_COLORS = {
  Low: "#3b82f6",
  Medium: "#f59e0b",
  High: "#f97316",
  Critical: "#ef4444",
};

const KPI_CARDS = [
  { key: "totalTickets", label: "Total Tickets", color: "text-slate-900" },
  { key: "openTickets", label: "Open", color: "text-blue-600" },
  { key: "inProgressTickets", label: "In Progress", color: "text-amber-600" },
  { key: "resolvedTickets", label: "Resolved", color: "text-emerald-600" },
  { key: "closedTickets", label: "Closed", color: "text-slate-500" },
  { key: "criticalTickets", label: "Critical", color: "text-red-600" },
  { key: "slaBreached", label: "SLA Breached", color: "text-red-600" },
];

export default function AdminTicketDashboard() {
  const [range, setRange] = useState({ from: daysAgoStr(30), to: todayStr() });
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState(null);
  const [trend, setTrend] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [priorityData, setPriorityData] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = { from: range.from, to: range.to };

      const [
        kpisRes,
        trendRes,
        statusRes,
        priorityRes,
        departmentRes,
        categoryRes,
      ] = await Promise.all([
        api.get("/ticket-dashboard/kpis", { params }),
        api.get("/ticket-dashboard/trend", { params }),
        api.get("/ticket-dashboard/status", { params }),
        api.get("/ticket-dashboard/priority", { params }),
        api.get("/ticket-dashboard/department", { params }),
        api.get("/ticket-dashboard/category", { params }),
      ]);

      setKpis(kpisRes.data);
      setTrend(trendRes.data);
      setStatusData(statusRes.data);
      setPriorityData(priorityRes.data);
      setDepartmentData(departmentRes.data);
      setCategoryData(categoryRes.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleRangeChange = (field) => (e) => {
    setRange((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const applyQuickRange = (days) => {
    setRange({ from: daysAgoStr(days), to: todayStr() });
  };

  /* ================= CHART DATA ================= */
  const trendChartData = {
    labels: trend.map((t) => t._id),
    datasets: [
      {
        label: "Tickets",
        data: trend.map((t) => t.tickets),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.1)",
        fill: true,
        tension: 0.3,
        pointRadius: 3,
      },
    ],
  };

  const trendChartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
    },
  };

  const buildDoughnutData = (data, colorMap) => ({
    labels: data.map((d) => d._id || "Unassigned"),
    datasets: [
      {
        data: data.map((d) => d.value),
        backgroundColor: data.map(
          (d, i) =>
            (colorMap && colorMap[d._id]) ||
            ["#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#64748b"][
              i % 6
            ]
        ),
        borderWidth: 0,
      },
    ],
  });

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 11 } } },
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-6 md:p-8">
      <div className="max-w-6xl mx-auto w-full">

        {/* HEADER */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Ticket Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Overview of ticket volume, status, and SLA performance
            </p>
          </div>

          {/* DATE FILTER */}
          <div className="flex flex-wrap items-end gap-2 bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
            <div className="flex flex-col">
              <label className="text-[11px] font-medium text-slate-500 mb-1">From</label>
              <input
                type="date"
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                value={range.from}
                max={range.to}
                onChange={handleRangeChange("from")}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[11px] font-medium text-slate-500 mb-1">To</label>
              <input
                type="date"
                className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                value={range.to}
                min={range.from}
                max={todayStr()}
                onChange={handleRangeChange("to")}
              />
            </div>
            <div className="flex gap-1.5">
              {[
                { label: "7D", days: 7 },
                { label: "30D", days: 30 },
                { label: "90D", days: 90 },
              ].map((q) => (
                <button
                  key={q.label}
                  onClick={() => applyQuickRange(q.days)}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100 transition"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center text-sm text-slate-400">
            Loading dashboard…
          </div>
        ) : (
          <>
            {/* KPI CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
              {KPI_CARDS.map((card) => (
                <div
                  key={card.key}
                  className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm"
                >
                  <p className="text-[11px] font-medium text-slate-400 mb-1">
                    {card.label}
                  </p>
                  <p className={`text-2xl font-bold ${card.color}`}>
                    {kpis?.[card.key] ?? 0}
                  </p>
                </div>
              ))}
            </div>

            {/* TREND CHART */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-6">
              <h2 className="text-sm font-semibold text-slate-700 mb-4">
                Ticket Volume Trend
              </h2>
              {trend.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">
                  No tickets in this date range
                </p>
              ) : (
                <Line data={trendChartData} options={trendChartOptions} />
              )}
            </div>

            {/* DOUGHNUT CHARTS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-700 mb-4">Status</h2>
                {statusData.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No data</p>
                ) : (
                  <Doughnut
                    data={buildDoughnutData(statusData, STATUS_COLORS)}
                    options={doughnutOptions}
                  />
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-700 mb-4">Priority</h2>
                {priorityData.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No data</p>
                ) : (
                  <Doughnut
                    data={buildDoughnutData(priorityData, PRIORITY_COLORS)}
                    options={doughnutOptions}
                  />
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-700 mb-4">Department</h2>
                {departmentData.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No data</p>
                ) : (
                  <Doughnut data={buildDoughnutData(departmentData)} options={doughnutOptions} />
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-700 mb-4">Category</h2>
                {categoryData.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No data</p>
                ) : (
                  <Doughnut data={buildDoughnutData(categoryData)} options={doughnutOptions} />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}