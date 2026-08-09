import { useEffect, useState, useCallback, useMemo } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler
);

/* ================= ICONS ================= */
const Icon = ({ children, className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    {children}
  </svg>
);
const IconTicket = (p) => <Icon {...p}><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" /><path d="M9 4v3M9 17v3M9 10.5v3" /></Icon>;
const IconCircle = (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /></Icon>;
const IconClock = (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></Icon>;
const IconCheckCircle = (p) => <Icon {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></Icon>;
const IconArchive = (p) => <Icon {...p}><rect x="2" y="4" width="20" height="5" rx="1" /><path d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9M10 13h4" /></Icon>;
const IconAlertTriangle = (p) => <Icon {...p}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" /><path d="M12 9v4M12 17h.01" /></Icon>;
const IconZap = (p) => <Icon {...p}><path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z" /></Icon>;
const IconCalendar = (p) => <Icon {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Icon>;
const IconTrendUp = (p) => <Icon {...p}><path d="m22 7-8.5 8.5-5-5L2 17" /><path d="M16 7h6v6" /></Icon>;
const IconTrendDown = (p) => <Icon {...p}><path d="m22 17-8.5-8.5-5 5L2 7" /><path d="M16 17h6v-6" /></Icon>;
const IconTimer = (p) => <Icon {...p}><path d="M10 2h4M12 14l3-3" /><circle cx="12" cy="14" r="8" /></Icon>;

/* ================= HELPERS ================= */
const todayStr = () => new Date().toISOString().split("T")[0];
const daysAgoStr = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
};
const rangeDays = (from, to) =>
  Math.max(1, Math.round((new Date(to) - new Date(from)) / 86400000) + 1);

// Formats a millisecond duration into a compact human string:
// "2d 4h", "3h 12m", "45m". Returns an em dash when there's
// nothing to show (no resolved tickets in range).
const formatDuration = (ms) => {
  if (!ms || ms <= 0) return "—";
  const totalMinutes = Math.round(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

const FONT_STACK =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const STATUS_COLORS = {
  Open: "#2563eb",
  "In Progress": "#d97706",
  Resolved: "#059669",
  Closed: "#64748b",
};

const PRIORITY_COLORS = {
  Low: "#2563eb",
  Medium: "#d97706",
  High: "#ea580c",
  Critical: "#dc2626",
};

const NEUTRAL_PALETTE = ["#2563eb", "#7c3aed", "#0891b2", "#d97706", "#059669", "#db2777", "#64748b"];

const KPI_CARDS = [
  { key: "totalTickets", label: "Total Tickets", icon: IconTicket, tint: "bg-slate-50 text-slate-600" },
  { key: "openTickets", label: "Open", icon: IconCircle, tint: "bg-blue-50 text-blue-600" },
  { key: "inProgressTickets", label: "In Progress", icon: IconClock, tint: "bg-amber-50 text-amber-600" },
  { key: "resolvedTickets", label: "Resolved", icon: IconCheckCircle, tint: "bg-emerald-50 text-emerald-600" },
  { key: "closedTickets", label: "Closed", icon: IconArchive, tint: "bg-slate-50 text-slate-500" },
  { key: "criticalTickets", label: "Critical", icon: IconZap, tint: "bg-red-50 text-red-600" },
  { key: "slaBreached", label: "SLA Breached", icon: IconAlertTriangle, tint: "bg-red-50 text-red-600" },
];

export default function AdminTicketDashboard() {
  const user = JSON.parse(localStorage.getItem("user")); // ADDED

  const [range, setRange] = useState({ from: daysAgoStr(30), to: todayStr() });
  const [activeQuick, setActiveQuick] = useState(30);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState(null);
  const [prevKpis, setPrevKpis] = useState(null);
  const [trend, setTrend] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [priorityData, setPriorityData] = useState([]);
  const [departmentData, setDepartmentData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [avgResolution, setAvgResolution] = useState(null);
  const [prevAvgResolution, setPrevAvgResolution] = useState(null);
  const [avgFirstResponse, setAvgFirstResponse] = useState(null);
  const [prevAvgFirstResponse, setPrevAvgFirstResponse] = useState(null);
  const [slaPolicy, setSlaPolicy] = useState(null);

  // ADDED: company filter — super_admin only, since that's the one role
  // that sees tickets across every company rather than just its own.
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(""); // "" = all companies

  const normalizeArray = (value) => (Array.isArray(value) ? value : []);

  // ADDED: fetch the company list once, only for super_admin
  useEffect(() => {
    if (user?.role !== "super_admin") return;
    api
      .get("/companies")
      .then((res) => {
        const payload = res?.data;
        const normalizedCompanies = normalizeArray(payload?.companies) || normalizeArray(payload?.data) || normalizeArray(payload);
        setCompanies(normalizedCompanies);
      })
      .catch((err) => console.error("Failed to load companies", err));
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        from: range.from,
        to: range.to,
        // ADDED: only sent when a specific company is selected
        ...(selectedCompany ? { companyId: selectedCompany } : {}),
      };

      // Previous period, same length, for trend comparison on KPI cards
      const spanDays = rangeDays(range.from, range.to);
      const prevTo = new Date(range.from);
      prevTo.setDate(prevTo.getDate() - 1);
      const prevFrom = new Date(prevTo);
      prevFrom.setDate(prevFrom.getDate() - (spanDays - 1));
      const prevParams = {
        from: prevFrom.toISOString().split("T")[0],
        to: prevTo.toISOString().split("T")[0],
        // ADDED
        ...(selectedCompany ? { companyId: selectedCompany } : {}),
      };

      const [
        kpisRes,
        prevKpisRes,
        trendRes,
        statusRes,
        priorityRes,
        departmentRes,
        categoryRes,
        avgResRes,
        prevAvgResRes,
        avgFirstResRes,
        prevAvgFirstResRes,
      ] = await Promise.all([
        api.get("/ticket-dashboard/kpis", { params }),
        api.get("/ticket-dashboard/kpis", { params: prevParams }),
        api.get("/ticket-dashboard/trend", { params }),
        api.get("/ticket-dashboard/status", { params }),
        api.get("/ticket-dashboard/priority", { params }),
        api.get("/ticket-dashboard/department", { params }),
        api.get("/ticket-dashboard/category", { params }),
        api.get("/ticket-dashboard/avg-resolution-time", { params }),
        api.get("/ticket-dashboard/avg-resolution-time", { params: prevParams }),
        api.get("/ticket-dashboard/avg-first-response-time", { params }),
        api.get("/ticket-dashboard/avg-first-response-time", { params: prevParams }),
      ]);

      setKpis(kpisRes.data);
      setPrevKpis(prevKpisRes.data);
      setTrend(normalizeArray(trendRes.data));
      setStatusData(normalizeArray(statusRes.data));
      setPriorityData(normalizeArray(priorityRes.data));
      setDepartmentData(normalizeArray(departmentRes.data));
      setCategoryData(normalizeArray(categoryRes.data));
      setAvgResolution(avgResRes.data);
      setPrevAvgResolution(prevAvgResRes.data);
      setAvgFirstResponse(avgFirstResRes.data);
      setPrevAvgFirstResponse(prevAvgFirstResRes.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [range, selectedCompany]); // CHANGED: re-fetch when company filter changes too

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // SLA policy is static config, not date-filtered — fetch once on mount
  // rather than every time the date range changes.
  useEffect(() => {
    api
      .get("/ticket-dashboard/sla-policy")
      .then((res) => setSlaPolicy(res.data))
      .catch((err) => console.error("Failed to load SLA policy", err));
  }, []);

  // "8" -> "8h", "0.5" -> "30m" — policy values are in hours.
  const formatSlaHours = (hours) => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    return `${hours}h`;
  };

  const handleRangeChange = (field) => (e) => {
    setActiveQuick(null);
    setRange((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const applyQuickRange = (days) => {
    setActiveQuick(days);
    setRange({ from: daysAgoStr(days), to: todayStr() });
  };

  const pctChange = (curr, prev) => {
    if (!prev) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  // For resolution time, a smaller number is the "good" direction —
  // unlike ticket counts where growth is usually good.
  const avgResChange =
    avgResolution && prevAvgResolution
      ? pctChange(avgResolution.avgResolutionMs, prevAvgResolution.avgResolutionMs)
      : 0;

  const avgFirstResChange =
    avgFirstResponse && prevAvgFirstResponse
      ? pctChange(avgFirstResponse.avgResponseMs, prevAvgFirstResponse.avgResponseMs)
      : 0;

  /* ================= TREND CHART ================= */
  const trendChartData = useMemo(
    () => {
      const normalizedTrend = normalizeArray(trend);
      return {
        labels: normalizedTrend.map((t) =>
          new Date(t._id).toLocaleDateString(undefined, { month: "short", day: "numeric" })
        ),
        datasets: [
          {
            label: "Tickets",
            data: normalizedTrend.map((t) => t.tickets),
          borderColor: "#2563eb",
          borderWidth: 2,
          backgroundColor: (ctx) => {
            const { chart } = ctx;
            const { ctx: c, chartArea } = chart;
            if (!chartArea) return "rgba(37,99,235,0.08)";
            const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, "rgba(37,99,235,0.20)");
            gradient.addColorStop(1, "rgba(37,99,235,0.00)");
            return gradient;
          },
          fill: true,
          tension: 0.35,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: "#2563eb",
          pointHoverBorderColor: "#fff",
          pointHoverBorderWidth: 2,
        },
      ],
    }),
    [trend]
  );

  const trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0f172a",
        titleFont: { family: FONT_STACK, size: 12, weight: "600" },
        bodyFont: { family: FONT_STACK, size: 12 },
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: FONT_STACK, size: 11 }, color: "#94a3b8" },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { precision: 0, font: { family: FONT_STACK, size: 11 }, color: "#94a3b8" },
        grid: { color: "#f1f5f9" },
        border: { display: false },
      },
    },
  };

  /* ================= HORIZONTAL BAR BUILDERS ================= */
  const buildBarData = (data, colorMap) => {
    const arrayData = normalizeArray(data);
    const sorted = [...arrayData].sort((a, b) => b.value - a.value);
    return {
      labels: sorted.map((d) => d._id || "Unassigned"),
      datasets: [
        {
          data: sorted.map((d) => d.value),
          backgroundColor: sorted.map(
            (d, i) => (colorMap && colorMap[d._id]) || NEUTRAL_PALETTE[i % NEUTRAL_PALETTE.length]
          ),
          borderRadius: 6,
          barThickness: 18,
        },
      ],
    };
  };

  const barOptions = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#0f172a",
        titleFont: { family: FONT_STACK, size: 12, weight: "600" },
        bodyFont: { family: FONT_STACK, size: 12 },
        padding: 10,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { precision: 0, font: { family: FONT_STACK, size: 11 }, color: "#94a3b8" },
        grid: { color: "#f1f5f9" },
        border: { display: false },
      },
      y: {
        ticks: { font: { family: FONT_STACK, size: 12, weight: "500" }, color: "#334155" },
        grid: { display: false },
        border: { display: false },
      },
    },
  };

  const totalForShare = (data) => data.reduce((s, d) => s + d.value, 0) || 1;

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: FONT_STACK }}>
      <div className="max-w-6xl mx-auto w-full p-6 md:p-8">

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

          <div className="flex flex-wrap items-end gap-2">
            {/* ADDED: company filter, super_admin only */}
            {user?.role === "super_admin" && (
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2.5 shadow-sm">
                <IconTicket className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="border-0 bg-transparent text-xs font-medium text-slate-600 outline-none max-w-[180px]"
                >
                  <option value="">All Companies</option>
                  {(Array.isArray(companies) ? companies : []).map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* DATE FILTER */}
            <div className="flex flex-wrap items-end gap-2 bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm">
              <div className="flex gap-1 mr-1">
                {[
                  { label: "7D", days: 7 },
                  { label: "30D", days: 30 },
                  { label: "90D", days: 90 },
                ].map((q) => (
                  <button
                    key={q.label}
                    onClick={() => applyQuickRange(q.days)}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                      activeQuick === q.days
                        ? "bg-blue-600 text-white"
                        : "bg-transparent text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
              <div className="w-px h-7 bg-slate-200" />
              <div className="flex items-center gap-1.5 px-1">
                <IconCalendar className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="date"
                  className="border-0 bg-transparent text-xs font-medium text-slate-600 outline-none w-[110px]"
                  value={range.from}
                  max={range.to}
                  onChange={handleRangeChange("from")}
                />
                <span className="text-slate-300 text-xs">→</span>
                <input
                  type="date"
                  className="border-0 bg-transparent text-xs font-medium text-slate-600 outline-none w-[110px]"
                  value={range.to}
                  min={range.from}
                  max={todayStr()}
                  onChange={handleRangeChange("to")}
                />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-24 text-center text-sm text-slate-400">Loading dashboard…</div>
        ) : (
          <>
            {/* KPI CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-3 mb-6">
              {KPI_CARDS.map((card) => {
                const value = kpis?.[card.key] ?? 0;
                const prevValue = prevKpis?.[card.key] ?? 0;
                const change = pctChange(value, prevValue);
                const isGoodDirection = ["resolvedTickets", "closedTickets"].includes(card.key)
                  ? change >= 0
                  : change <= 0;
                const CardIcon = card.icon;
                return (
                  <div
                    key={card.key}
                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${card.tint}`}>
                        <CardIcon className="w-3.5 h-3.5" />
                      </div>
                      {prevKpis && change !== 0 && (
                        <div
                          className={`flex items-center gap-0.5 text-[10px] font-semibold ${
                            isGoodDirection ? "text-emerald-600" : "text-red-500"
                          }`}
                        >
                          {change > 0 ? (
                            <IconTrendUp className="w-2.5 h-2.5" />
                          ) : (
                            <IconTrendDown className="w-2.5 h-2.5" />
                          )}
                          {Math.abs(change)}%
                        </div>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-slate-900 leading-none mb-1">{value}</p>
                    <p className="text-[11px] font-medium text-slate-400">{card.label}</p>
                  </div>
                );
              })}

              {/* AVG RESOLUTION TIME CARD */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-violet-50 text-violet-600">
                    <IconTimer className="w-3.5 h-3.5" />
                  </div>
                  {prevAvgResolution && avgResChange !== 0 && (
                    <div
                      className={`flex items-center gap-0.5 text-[10px] font-semibold ${
                        avgResChange <= 0 ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {avgResChange > 0 ? (
                        <IconTrendUp className="w-2.5 h-2.5" />
                      ) : (
                        <IconTrendDown className="w-2.5 h-2.5" />
                      )}
                      {Math.abs(avgResChange)}%
                    </div>
                  )}
                </div>
                <p className="text-2xl font-bold text-slate-900 leading-none mb-1">
                  {formatDuration(avgResolution?.avgResolutionMs)}
                </p>
                <p className="text-[11px] font-medium text-slate-400">
                  Avg Resolution{avgResolution?.count ? ` (${avgResolution.count})` : ""}
                </p>
              </div>

              {/* AVG FIRST RESPONSE (SLA) TIME CARD */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-cyan-50 text-cyan-600">
                    <IconZap className="w-3.5 h-3.5" />
                  </div>
                  {prevAvgFirstResponse && avgFirstResChange !== 0 && (
                    <div
                      className={`flex items-center gap-0.5 text-[10px] font-semibold ${
                        avgFirstResChange <= 0 ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {avgFirstResChange > 0 ? (
                        <IconTrendUp className="w-2.5 h-2.5" />
                      ) : (
                        <IconTrendDown className="w-2.5 h-2.5" />
                      )}
                      {Math.abs(avgFirstResChange)}%
                    </div>
                  )}
                </div>
                <p className="text-2xl font-bold text-slate-900 leading-none mb-1">
                  {formatDuration(avgFirstResponse?.avgResponseMs)}
                </p>
                <p className="text-[11px] font-medium text-slate-400">
                  Avg SLA Response{avgFirstResponse?.count ? ` (${avgFirstResponse.count})` : ""}
                </p>
              </div>
            </div>

            {/* SLA POLICY REFERENCE TABLE */}
            {slaPolicy && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-6">
                <h2 className="text-sm font-semibold text-slate-800 mb-4">SLA Targets</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide pb-2 pr-4">
                          Priority
                        </th>
                        <th className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide pb-2 pr-4">
                          First Response Target
                        </th>
                        <th className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide pb-2">
                          Resolution Target
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(slaPolicy).map(([priority, targets]) => (
                        <tr key={priority} className="border-b border-slate-50 last:border-0">
                          <td className="py-2.5 pr-4">
                            <span
                              className="inline-flex items-center gap-1.5 text-xs font-semibold"
                              style={{ color: PRIORITY_COLORS[priority] || "#334155" }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: PRIORITY_COLORS[priority] || "#94a3b8" }}
                              />
                              {priority}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 text-xs font-medium text-slate-600">
                            {formatSlaHours(targets.firstResponse)}
                          </td>
                          <td className="py-2.5 text-xs font-medium text-slate-600">
                            {formatSlaHours(targets.resolution)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TREND CHART */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-800">Ticket Volume Trend</h2>
                <span className="text-[11px] font-medium text-slate-400">
                  {trend.reduce((s, t) => s + t.tickets, 0)} tickets in range
                </span>
              </div>
              {trend.length === 0 ? (
                <p className="text-sm text-slate-400 py-16 text-center">No tickets in this date range</p>
              ) : (
                <div style={{ height: 260 }}>
                  <Line data={trendChartData} options={trendChartOptions} />
                </div>
              )}
            </div>

            {/* BAR CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-800 mb-4">By Status</h2>
                {statusData.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-10">No data</p>
                ) : (
                  <div style={{ height: Math.max(120, statusData.length * 44) }}>
                    <Bar data={buildBarData(statusData, STATUS_COLORS)} options={barOptions} />
                  </div>
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-800 mb-4">By Priority</h2>
                {priorityData.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-10">No data</p>
                ) : (
                  <div style={{ height: Math.max(120, priorityData.length * 44) }}>
                    <Bar data={buildBarData(priorityData, PRIORITY_COLORS)} options={barOptions} />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-800 mb-4">By Department</h2>
                {departmentData.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-10">No data</p>
                ) : (
                  <div className="space-y-3">
                    {[...departmentData]
                      .sort((a, b) => b.value - a.value)
                      .map((d, i) => {
                        const total = totalForShare(departmentData);
                        const pct = Math.round((d.value / total) * 100);
                        return (
                          <div key={d._id || i}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-slate-600">
                                {d._id || "Unassigned"}
                              </span>
                              <span className="text-xs font-semibold text-slate-800">
                                {d.value} <span className="text-slate-400 font-normal">({pct}%)</span>
                              </span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: NEUTRAL_PALETTE[i % NEUTRAL_PALETTE.length],
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-800 mb-4">By Category</h2>
                {categoryData.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-10">No data</p>
                ) : (
                  <div className="space-y-3">
                    {[...categoryData]
                      .sort((a, b) => b.value - a.value)
                      .map((d, i) => {
                        const total = totalForShare(categoryData);
                        const pct = Math.round((d.value / total) * 100);
                        return (
                          <div key={d._id || i}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-slate-600">
                                {d._id || "Uncategorized"}
                              </span>
                              <span className="text-xs font-semibold text-slate-800">
                                {d.value} <span className="text-slate-400 font-normal">({pct}%)</span>
                              </span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${pct}%`,
                                  backgroundColor: NEUTRAL_PALETTE[i % NEUTRAL_PALETTE.length],
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}