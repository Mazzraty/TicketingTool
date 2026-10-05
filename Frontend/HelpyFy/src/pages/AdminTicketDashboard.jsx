import { useEffect, useState, useCallback, useMemo } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../auth/AuthContext";
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
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler
);

/* ================= DESIGN TOKENS (Atlassian-style) ================= */
const T = {
  text: "#172B4D",
  subtle: "#44546F",
  muted: "#626F86",
  border: "#DCDFE4",
  borderSoft: "#EBECF0",
  surface: "#FFFFFF",
  canvas: "#F7F8F9",
  brand: "#0C66E4",
  brandSoft: "#E9F2FF",
  good: "#1F845A",
  bad: "#C9372C",
};

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif";

// Lozenge palettes: [background, text]
const LOZENGE = {
  Open: ["#DEEBFF", "#0747A6"],
  "In Progress": ["#FFF0B3", "#7F5F01"],
  Resolved: ["#DCFFF1", "#216E4E"],
  Closed: ["#DFE1E6", "#42526E"],
  Low: ["#E9F2FF", "#0055CC"],
  Medium: ["#FFF7D6", "#7F5F01"],
  High: ["#FFEDEB", "#AE2E24"],
  Critical: ["#C9372C", "#FFFFFF"],
};

const STATUS_COLORS = {
  Open: "#4C9AFF",
  "In Progress": "#F5CD47",
  Resolved: "#4BCE97",
  Closed: "#8590A2",
};

const PRIORITY_COLORS = {
  Low: "#579DFF",
  Medium: "#F5CD47",
  High: "#F87168",
  Critical: "#C9372C",
};

const NEUTRAL_PALETTE = ["#0C66E4", "#6E5DC6", "#1D9AAA", "#E56910", "#22A06B", "#CD519D", "#8590A2"];

/* ================= ICONS ================= */
const Icon = ({ children, className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {children}
  </svg>
);
const IconCalendar = (p) => <Icon {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Icon>;
const IconBuilding = (p) => <Icon {...p}><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18" /><path d="M6 12h12M6 8h12M6 16h12" /><path d="M10 22v-4h4v4" /></Icon>;
const IconRefresh = (p) => <Icon {...p}><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></Icon>;
const IconArrowUp = (p) => <Icon {...p}><path d="M12 19V5M5 12l7-7 7 7" /></Icon>;
const IconArrowDown = (p) => <Icon {...p}><path d="M12 5v14M19 12l-7 7-7-7" /></Icon>;

/* ================= HELPERS ================= */
const toISO = (d) => d.toISOString().split("T")[0];
const todayStr = () => toISO(new Date());
const daysAgoStr = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISO(d);
};
const rangeDays = (from, to) =>
  Math.max(1, Math.round((new Date(to) - new Date(from)) / 86400000) + 1);

// "2d 4h", "3h 12m", "45m", or an em dash when there is nothing to show.
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

const formatSlaHours = (hours) =>
  hours < 1 ? `${Math.round(hours * 60)}m` : `${hours}h`;

// Returns null when there is no previous-period baseline, so we never
// show a misleading "+100%" badge on every card.
const pctChange = (curr, prev) => {
  if (!prev) return null;
  return Math.round(((curr - prev) / prev) * 100);
};

const chartTooltip = {
  backgroundColor: T.text,
  titleFont: { family: FONT_STACK, size: 12, weight: "600" },
  bodyFont: { family: FONT_STACK, size: 12 },
  padding: 10,
  cornerRadius: 3,
  displayColors: false,
};

/* ================= SMALL UI PIECES ================= */
const Lozenge = ({ label, bold }) => {
  const [bg, fg] = LOZENGE[label] || ["#DFE1E6", "#42526E"];
  return (
    <span
      className="inline-flex items-center px-1.5 h-5 rounded-[3px] text-[11px] font-bold uppercase tracking-wide whitespace-nowrap"
      style={{ backgroundColor: bg, color: fg }}
    >
      {label}
    </span>
  );
};

const Card = ({ title, aside, children, className = "" }) => (
  <section
    className={`bg-white rounded-[3px] border ${className}`}
    style={{ borderColor: T.border }}
  >
    {(title || aside) && (
      <header
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: T.borderSoft }}
      >
        <h2 className="text-sm font-semibold" style={{ color: T.text }}>{title}</h2>
        {aside && <span className="text-xs" style={{ color: T.muted }}>{aside}</span>}
      </header>
    )}
    <div className="p-4">{children}</div>
  </section>
);

// goodWhenDown: for duration / breach metrics, lower is better.
const Delta = ({ change, goodWhenDown }) => {
  if (change === null || change === 0) return null;
  const up = change > 0;
  const good = goodWhenDown ? !up : up;
  const Arrow = up ? IconArrowUp : IconArrowDown;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-xs font-medium"
      style={{ color: good ? T.good : T.bad }}
      title="Change vs previous period"
    >
      <Arrow className="w-3 h-3" />
      {Math.abs(change)}%
    </span>
  );
};

const StatTile = ({ label, value, accent, change, goodWhenDown, hint }) => (
  <div className="px-4 py-3 min-w-0">
    <div className="flex items-center gap-2 mb-1.5">
      {accent && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: accent }} />}
      <p className="text-xs font-medium truncate" style={{ color: T.muted }}>{label}</p>
    </div>
    <div className="flex items-baseline gap-2">
      <p className="text-[28px] leading-8 font-semibold whitespace-nowrap" style={{ color: T.text }}>
        {value}
      </p>
      <Delta change={change} goodWhenDown={goodWhenDown} />
    </div>
    {hint && <p className="text-[11px] mt-0.5" style={{ color: T.muted }}>{hint}</p>}
  </div>
);

const Skeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-20 bg-slate-200/70 rounded-[3px]" />
    <div className="h-20 bg-slate-200/70 rounded-[3px]" />
    <div className="h-40 bg-slate-200/70 rounded-[3px]" />
    <div className="h-72 bg-slate-200/70 rounded-[3px]" />
  </div>
);

const Empty = ({ text = "No data for this period" }) => (
  <p className="text-sm text-center py-10" style={{ color: T.muted }}>{text}</p>
);

const inputBase =
  "h-8 rounded-[3px] border bg-white text-sm px-2 outline-none focus:ring-2 focus:ring-[#4C9AFF] hover:bg-[#F7F8F9]";

/* ================= PAGE ================= */
export default function AdminTicketDashboard() {
  const { user } = useAuth();

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

  const [companies, setCompanies] = useState([]);
  const [companyFilter, setCompanyFilter] = useState("All");

  /* ---------- data loading (unchanged logic) ---------- */
  useEffect(() => {
    if (user?.role !== "super_admin") return;
    api
      .get("/companies")
      .then((res) => setCompanies(res.data.companies || []))
      .catch((err) => console.error("Failed to load companies", err));
  }, [user?.role]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const companyParams =
        user?.role === "super_admin" && companyFilter !== "All"
          ? { companyId: companyFilter }
          : {};
      const params = { from: range.from, to: range.to, ...companyParams };

      const spanDays = rangeDays(range.from, range.to);
      const prevTo = new Date(range.from);
      prevTo.setDate(prevTo.getDate() - 1);
      const prevFrom = new Date(prevTo);
      prevFrom.setDate(prevFrom.getDate() - (spanDays - 1));
      const prevParams = { from: toISO(prevFrom), to: toISO(prevTo), ...companyParams };

      const [
        kpisRes, prevKpisRes, trendRes, statusRes, priorityRes, departmentRes,
        categoryRes, avgResRes, prevAvgResRes, avgFirstResRes, prevAvgFirstResRes,
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
      setTrend(trendRes.data);
      setStatusData(statusRes.data);
      setPriorityData(priorityRes.data);
      setDepartmentData(departmentRes.data);
      setCategoryData(categoryRes.data);
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
  }, [range, companyFilter, user?.role]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    api
      .get("/ticket-dashboard/sla-policy")
      .then((res) => setSlaPolicy(res.data))
      .catch((err) => console.error("Failed to load SLA policy", err));
  }, []);

  const handleRangeChange = (field) => (e) => {
    setActiveQuick(null);
    setRange((prev) => ({ ...prev, [field]: e.target.value }));
  };
  const applyQuickRange = (days) => {
    setActiveQuick(days);
    setRange({ from: daysAgoStr(days), to: todayStr() });
  };

  const delta = (key) => pctChange(kpis?.[key] ?? 0, prevKpis?.[key] ?? 0);
  const avgResChange =
    avgResolution && prevAvgResolution
      ? pctChange(avgResolution.avgResolutionMs, prevAvgResolution.avgResolutionMs)
      : null;
  const avgFirstResChange =
    avgFirstResponse && prevAvgFirstResponse
      ? pctChange(avgFirstResponse.avgResponseMs, prevAvgFirstResponse.avgResponseMs)
      : null;

  // SLA compliance = share of tickets that did not breach.
  const total = kpis?.totalTickets ?? 0;
  const breached = kpis?.slaBreached ?? 0;
  const compliance = total ? Math.round(((total - breached) / total) * 100) : null;

  /* ---------- charts ---------- */
  const trendChartData = useMemo(
    () => ({
      labels: trend.map((t) =>
        new Date(t._id).toLocaleDateString(undefined, { month: "short", day: "numeric" })
      ),
      datasets: [
        {
          label: "Tickets created",
          data: trend.map((t) => t.tickets),
          borderColor: T.brand,
          borderWidth: 2,
          backgroundColor: (ctx) => {
            const { chart } = ctx;
            const { ctx: c, chartArea } = chart;
            if (!chartArea) return "rgba(12,102,228,0.08)";
            const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            g.addColorStop(0, "rgba(12,102,228,0.16)");
            g.addColorStop(1, "rgba(12,102,228,0)");
            return g;
          },
          fill: true,
          tension: 0.2,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: T.brand,
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
    plugins: { legend: { display: false }, tooltip: chartTooltip },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: FONT_STACK, size: 11 }, color: T.muted, maxTicksLimit: 12, maxRotation: 0 },
        border: { color: T.border },
      },
      y: {
        beginAtZero: true,
        ticks: { precision: 0, font: { family: FONT_STACK, size: 11 }, color: T.muted },
        grid: { color: T.borderSoft },
        border: { display: false },
      },
    },
  };

  const buildBarData = (data, colorMap) => {
    const sorted = [...data].sort((a, b) => b.value - a.value);
    return {
      labels: sorted.map((d) => d._id || "Unassigned"),
      datasets: [
        {
          data: sorted.map((d) => d.value),
          backgroundColor: sorted.map(
            (d, i) => (colorMap && colorMap[d._id]) || NEUTRAL_PALETTE[i % NEUTRAL_PALETTE.length]
          ),
          borderRadius: 3,
          barThickness: 16,
        },
      ],
    };
  };

  const barOptions = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: chartTooltip },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { precision: 0, font: { family: FONT_STACK, size: 11 }, color: T.muted },
        grid: { color: T.borderSoft },
        border: { display: false },
      },
      y: {
        ticks: { font: { family: FONT_STACK, size: 12 }, color: T.text },
        grid: { display: false },
        border: { display: false },
      },
    },
  };

  const totalForShare = (data) => data.reduce((s, d) => s + d.value, 0) || 1;

  const BreakdownList = ({ data, fallback }) =>
    data.length === 0 ? (
      <Empty />
    ) : (
      <ul className="space-y-3">
        {[...data].sort((a, b) => b.value - a.value).map((d, i) => {
          const pct = Math.round((d.value / totalForShare(data)) * 100);
          return (
            <li key={d._id || i}>
              <div className="flex items-center justify-between mb-1 text-sm">
                <span style={{ color: T.text }}>{d._id || fallback}</span>
                <span style={{ color: T.subtle }}>
                  <b className="font-semibold" style={{ color: T.text }}>{d.value}</b>
                  <span className="ml-1.5 text-xs">{pct}%</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: T.borderSoft }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${pct}%`, backgroundColor: NEUTRAL_PALETTE[i % NEUTRAL_PALETTE.length] }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    );

  const trendTotal = trend.reduce((s, t) => s + t.tickets, 0);
  const quick = [{ label: "7D", days: 7 }, { label: "30D", days: 30 }, { label: "90D", days: 90 }];

  return (
    <div className="min-h-screen" style={{ fontFamily: FONT_STACK, backgroundColor: T.canvas, color: T.text }}>
      <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-10 py-6">

        {/* BREADCRUMB + TITLE */}
        <nav className="text-xs mb-2" style={{ color: T.muted }}>
          Service desk <span className="mx-1">/</span> Reports
        </nav>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl font-medium" style={{ color: T.text }}>Ticket dashboard</h1>
            <p className="text-sm mt-1" style={{ color: T.muted }}>
              Ticket volume, status and SLA performance
            </p>
          </div>

          {/* TOOLBAR */}
          <div className="flex flex-wrap items-center gap-2">
            {user?.role === "super_admin" && (
              <div className="relative">
                <IconBuilding className="w-4 h-4 absolute left-2 top-2 pointer-events-none" style={{ color: T.muted }} />
                <select
                  aria-label="Company"
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className={`${inputBase} pl-8 pr-2 max-w-[260px]`}
                  style={{ borderColor: T.border, color: T.text }}
                >
                  <option value="All">All companies</option>
                  {companies.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Segmented range buttons */}
            <div className="inline-flex rounded-[3px] border overflow-hidden" style={{ borderColor: T.border }} role="group" aria-label="Quick range">
              {quick.map((q, i) => {
                const active = activeQuick === q.days;
                return (
                  <button
                    key={q.label}
                    onClick={() => applyQuickRange(q.days)}
                    aria-pressed={active}
                    className="h-8 px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#4C9AFF]"
                    style={{
                      backgroundColor: active ? T.brandSoft : "#fff",
                      color: active ? T.brand : T.subtle,
                      borderLeft: i ? `1px solid ${T.border}` : "none",
                    }}
                  >
                    {q.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-1.5">
              <IconCalendar className="w-4 h-4" style={{ color: T.muted }} />
              <input
                type="date" aria-label="From"
                className={inputBase}
                style={{ borderColor: T.border, color: T.text }}
                value={range.from} max={range.to}
                onChange={handleRangeChange("from")}
              />
              <span className="text-xs" style={{ color: T.muted }}>to</span>
              <input
                type="date" aria-label="To"
                className={inputBase}
                style={{ borderColor: T.border, color: T.text }}
                value={range.to} min={range.from} max={todayStr()}
                onChange={handleRangeChange("to")}
              />
            </div>

            <button
              onClick={fetchAll}
              disabled={loading}
              aria-label="Refresh"
              className="h-8 w-8 inline-flex items-center justify-center rounded-[3px] border bg-white hover:bg-[#F7F8F9] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#4C9AFF]"
              style={{ borderColor: T.border, color: T.subtle }}
            >
              <IconRefresh className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {loading && !kpis ? (
          <Skeleton />
        ) : (
          <div className={`space-y-4 transition-opacity ${loading ? "opacity-60" : ""}`}>

            {/* WORK ITEM SUMMARY */}
            <section className="bg-white rounded-[3px] border" style={{ borderColor: T.border }}>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-x divide-y lg:divide-y-0" style={{ borderColor: T.borderSoft }}>
                <StatTile label="Total tickets" value={kpis?.totalTickets ?? 0} change={delta("totalTickets")} goodWhenDown={false} />
                <StatTile label="Open" value={kpis?.openTickets ?? 0} accent={STATUS_COLORS.Open} change={delta("openTickets")} goodWhenDown />
                <StatTile label="In progress" value={kpis?.inProgressTickets ?? 0} accent={STATUS_COLORS["In Progress"]} change={delta("inProgressTickets")} goodWhenDown />
                <StatTile label="Resolved" value={kpis?.resolvedTickets ?? 0} accent={STATUS_COLORS.Resolved} change={delta("resolvedTickets")} />
                <StatTile label="Closed" value={kpis?.closedTickets ?? 0} accent={STATUS_COLORS.Closed} change={delta("closedTickets")} />
              </div>
            </section>

            {/* SLA PERFORMANCE SUMMARY */}
            <section className="bg-white rounded-[3px] border" style={{ borderColor: T.border }}>
              <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0" style={{ borderColor: T.borderSoft }}>
                <StatTile
                  label="SLA compliance"
                  value={compliance === null ? "—" : `${compliance}%`}
                  hint={total ? `${total - breached} of ${total} within SLA` : undefined}
                  accent={compliance !== null && compliance < 80 ? T.bad : T.good}
                />
                <StatTile
                  label="SLA breached"
                  value={breached}
                  accent={T.bad}
                  change={delta("slaBreached")}
                  goodWhenDown
                />
                <StatTile
                  label="Avg time to resolution"
                  value={formatDuration(avgResolution?.avgResolutionMs)}
                  hint={avgResolution?.count ? `${avgResolution.count} resolved tickets` : undefined}
                  change={avgResChange}
                  goodWhenDown
                />
                <StatTile
                  label="Avg time to first response"
                  value={formatDuration(avgFirstResponse?.avgResponseMs)}
                  hint={avgFirstResponse?.count ? `${avgFirstResponse.count} tickets responded` : undefined}
                  change={avgFirstResChange}
                  goodWhenDown
                />
              </div>
            </section>

            {/* TREND + SLA TARGETS */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <Card
                title="Tickets created"
                aside={`${trendTotal} tickets in range`}
                className="xl:col-span-2"
              >
                {trend.length === 0 ? (
                  <Empty text="No tickets in this date range" />
                ) : (
                  <div style={{ height: 280 }}>
                    <Line data={trendChartData} options={trendChartOptions} />
                  </div>
                )}
              </Card>

              <Card title="SLA targets">
                {!slaPolicy ? (
                  <Empty text="SLA policy not available" />
                ) : (
                  <div className="overflow-x-auto -mx-1">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b" style={{ borderColor: T.border }}>
                          <th className="py-2 px-1 text-xs font-semibold" style={{ color: T.muted }}>Priority</th>
                          <th className="py-2 px-1 text-xs font-semibold" style={{ color: T.muted }}>First response</th>
                          <th className="py-2 px-1 text-xs font-semibold" style={{ color: T.muted }}>Resolution</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(slaPolicy).map(([priority, targets]) => (
                          <tr key={priority} className="border-b last:border-0" style={{ borderColor: T.borderSoft }}>
                            <td className="py-3 px-1"><Lozenge label={priority} /></td>
                            <td className="py-3 px-1" style={{ color: T.text }}>{formatSlaHours(targets.firstResponse)}</td>
                            <td className="py-3 px-1" style={{ color: T.text }}>{formatSlaHours(targets.resolution)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>

            {/* STATUS + PRIORITY */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card title="By status">
                {statusData.length === 0 ? <Empty /> : (
                  <div style={{ height: Math.max(130, statusData.length * 44) }}>
                    <Bar data={buildBarData(statusData, STATUS_COLORS)} options={barOptions} />
                  </div>
                )}
              </Card>
              <Card title="By priority">
                {priorityData.length === 0 ? <Empty /> : (
                  <div style={{ height: Math.max(130, priorityData.length * 44) }}>
                    <Bar data={buildBarData(priorityData, PRIORITY_COLORS)} options={barOptions} />
                  </div>
                )}
              </Card>
            </div>

            {/* DEPARTMENT + CATEGORY */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card title="By department">
                <BreakdownList data={departmentData} fallback="Unassigned" />
              </Card>
              <Card title="By category">
                <BreakdownList data={categoryData} fallback="Uncategorized" />
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}