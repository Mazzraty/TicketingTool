import { useEffect, useState } from "react";
import api from "../api/axios";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  Package,
  Laptop,
  Printer,
  Smartphone,
  Users,
  FileText,
  Lock,
  DollarSign,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

/* ================= DESIGN TOKENS (Atlassian-style) ================= */
const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, 'Helvetica Neue', sans-serif";

const COLORS = {
  laptops: "#0C66E4",
  printers: "#6E5DC6",
  hht: "#1D9AAA",
  assigned: "#0C66E4",
  available: "#4BCE97",
  damaged: "#E2483D",
  printerService: "#F5CD47", // NEW
  underService: "#E56910", // NEW
};

// Lozenge palette: [background, text]
const STATUS_LOZ = {
  available: ["#DCFFF1", "#216E4E"],
  active: ["#DCFFF1", "#216E4E"],
  assigned: ["#DEEBFF", "#0747A6"],
  damaged: ["#FFEDEB", "#AE2E24"],
  printer_for_service: ["#FFF7D6", "#7F5F01"], // NEW
  under_service: ["#FFE2BD", "#974F0C"], // NEW
  expiring: ["#FFF7D6", "#7F5F01"],
  expired: ["#FFEDEB", "#AE2E24"],
};

/* ================= SMALL UI PIECES ================= */
const Lozenge = ({ status }) => {
  const key = String(status || "").toLowerCase();
  const [bg, fg] = STATUS_LOZ[key] || ["#DFE1E6", "#42526E"];
  return (
    <span
      className="inline-flex items-center h-5 px-1.5 rounded-[3px] text-[11px] font-bold uppercase tracking-wide whitespace-nowrap"
      style={{ backgroundColor: bg, color: fg }}
    >
      {status === "printer_for_service" ? "service" : String(status || "—").replace(/_/g, " ")}
    </span>
  );
};

const Tile = ({ icon: Icon, label, value, hint, tone }) => (
  <div className="px-4 py-3 min-w-0 bg-white">
    <div className="flex items-center gap-2 mb-1.5">
      <Icon
        size={14}
        className={tone === "warning" ? "text-[#B65C02]" : tone === "danger" ? "text-[#C9372C]" : "text-[#626F86]"}
      />
      <p className="text-xs font-medium text-[#626F86] truncate">{label}</p>
    </div>
    <p className="text-[28px] leading-8 font-semibold text-[#172B4D] whitespace-nowrap tabular-nums">{value}</p>
    {hint && (
      <p className={`text-xs mt-1 truncate ${tone === "warning" ? "text-[#B65C02]" : tone === "danger" ? "text-[#C9372C]" : "text-[#626F86]"}`}>
        {hint}
      </p>
    )}
  </div>
);

const Strip = ({ children, cols }) => (
  <section className="border border-[#DCDFE4] rounded-[3px] overflow-hidden bg-[#DCDFE4]">
    <div className={`grid grid-cols-2 gap-px ${cols}`}>{children}</div>
  </section>
);

const Card = ({ title, aside, children }) => (
  <section className="bg-white border border-[#DCDFE4] rounded-[3px]">
    <header className="flex items-center justify-between px-4 py-3 border-b border-[#EBECF0]">
      <h2 className="text-sm font-semibold text-[#172B4D]">{title}</h2>
      {aside && <span className="text-xs text-[#626F86]">{aside}</span>}
    </header>
    {children}
  </section>
);

const Th = ({ children }) => (
  <th className="py-2.5 px-4 text-left text-xs font-semibold text-[#626F86] whitespace-nowrap">{children}</th>
);

const SkeletonRows = () => (
  <div className="animate-pulse divide-y divide-[#EBECF0]">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-4 py-3.5">
        <div className="h-3 w-24 bg-[#EBECF0] rounded" />
        <div className="h-3 flex-1 bg-[#EBECF0] rounded" />
        <div className="h-3 w-16 bg-[#EBECF0] rounded" />
      </div>
    ))}
  </div>
);

const Empty = () => <p className="text-sm text-center text-[#626F86] py-10">No data available</p>;

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#172B4D] text-white text-xs px-2.5 py-1.5 rounded-[3px]">
      {payload[0].name}: <b>{payload[0].value}</b>
    </div>
  );
};

// One row of the allocation legend
const AllocationRow = ({ color, label, value, percent }) => (
  <li className="flex items-center justify-between py-2.5 text-sm">
    <span className="flex items-center gap-2">
      <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: color }} />
      {label}
    </span>
    <span className="text-[#44546F] tabular-nums">
      <b className="font-semibold text-[#172B4D]">{value}</b>
      <span className="ml-2 text-xs">{percent}%</span>
    </span>
  </li>
);

const formatDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date)) return "—";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const pct = (value, total) => (total ? Math.round((value / total) * 100) : 0);

export default function AdminDashboardProfessional() {
  /* ================= STATE ================= */
  const [stats, setStats] = useState({
    totalAssets: 0,
    laptops: 0,
    printers: 0,
    hht: 0,
    assigned: 0,
    available: 0,
    damaged: 0,
    printerForService: 0, // NEW
    underService: 0, // NEW
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
  const [lastUpdated, setLastUpdated] = useState(null);

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
        damaged: s.damaged ?? 0,
        printerForService: s.printerForService ?? 0, // NEW
        underService: s.underService ?? 0, // NEW
        employees: s.employees ?? 0,
        openTickets: s.openTickets ?? 0,
        totalActiveLicenses: s.totalActiveLicenses ?? 0,
        expiringThisMonth: s.expiringThisMonth ?? 0,
        expiredServices: s.expiredServices ?? 0,
        annualSoftwareCost: s.annualSoftwareCost ?? 0,
      });

      setRecentAssets(Array.isArray(assetsRes.data) ? assetsRes.data : []);
      setRecentSoftware(Array.isArray(softwareRes.data) ? softwareRes.data : []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    // Auto-refresh every 5 minutes.
    const interval = setInterval(loadDashboard, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formattedLastUpdated = lastUpdated
    ? lastUpdated.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : "—";

  /* ================= DERIVED DATA ================= */
  const assetChart = [
    { name: "Laptops/Desktops", value: stats.laptops || 0, fill: COLORS.laptops },
    { name: "Printers", value: stats.printers || 0, fill: COLORS.printers },
    { name: "Mobile/HHT", value: stats.hht || 0, fill: COLORS.hht },
  ];
  const chartTotal = assetChart.reduce((s, d) => s + d.value, 0);

  // Allocation includes damaged + service statuses
  const statusTotal =
    (stats.assigned || 0) +
    (stats.available || 0) +
    (stats.damaged || 0) +
    (stats.printerForService || 0) +
    (stats.underService || 0);
  const assignedPct = pct(stats.assigned, statusTotal);
  const damagedPct = pct(stats.damaged, statusTotal);
  const printerServicePct = pct(stats.printerForService, statusTotal);
  const underServicePct = pct(stats.underService, statusTotal);
  const availablePct = statusTotal
    ? Math.max(0, 100 - assignedPct - damagedPct - printerServicePct - underServicePct)
    : 0;

  /* ================= RENDER ================= */
  return (
    <div className="min-h-screen bg-[#F7F8F9] text-[#172B4D]" style={{ fontFamily: FONT_STACK }}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-6">

        {/* TITLE */}
        <nav className="text-xs text-[#626F86] mb-2">
          Asset management <span className="mx-1">/</span> Overview
        </nav>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-medium">Dashboard</h1>
            <p className="text-sm text-[#626F86] mt-1">Enterprise asset and operations overview</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#626F86]">
              {loading ? "Updating…" : `Updated ${formattedLastUpdated}`}
            </span>
            <button
              onClick={loadDashboard}
              disabled={loading}
              aria-label="Refresh"
              className="h-8 w-8 inline-flex items-center justify-center rounded-[3px] bg-[#091E420F] hover:bg-[#091E4224] text-[#44546F] focus:outline-none focus:ring-2 focus:ring-[#4C9AFF] disabled:opacity-60"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        <div className="space-y-4">

          {/* ASSETS SUMMARY */}
          <Strip cols="sm:grid-cols-3 lg:grid-cols-5">
            <Tile
              icon={Package}
              label="Total assets"
              value={stats.totalAssets}
              hint={`${stats.assigned} assigned · ${stats.available} available · ${stats.damaged} damaged`}
            />
            <Tile icon={Laptop} label="Laptops / desktops" value={stats.laptops} hint="Managed devices" />
            <Tile icon={Printer} label="Printers" value={stats.printers} hint="Managed devices" />
            <Tile icon={Smartphone} label="Mobile / HHT" value={stats.hht} hint="Hand-held terminals" />
            <Tile icon={Users} label="Employees" value={stats.employees} hint="Active staff" />
          </Strip>

          {/* OPERATIONS SUMMARY */}
          <Strip cols="lg:grid-cols-4">
            <Tile
              icon={FileText}
              label="Open tickets"
              value={stats.openTickets}
              hint="Support requests"
              tone={stats.openTickets > 5 ? "warning" : undefined}
            />
            <Tile
              icon={Lock}
              label="Active licenses"
              value={stats.totalActiveLicenses}
              hint={`${stats.expiringThisMonth} expiring this month`}
              tone={stats.expiringThisMonth > 0 ? "warning" : undefined}
            />
            <Tile
              icon={AlertCircle}
              label="Expired services"
              value={stats.expiredServices}
              hint={stats.expiredServices > 0 ? "Needs renewal" : "None expired"}
              tone={stats.expiredServices > 0 ? "danger" : undefined}
            />
            <Tile
              icon={DollarSign}
              label="Annual software cost"
              value={`QAR ${Number(stats.annualSoftwareCost).toLocaleString()}`}
              hint="Current fiscal year"
            />
          </Strip>

          {/* CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card title="Assets by type" aside={`${chartTotal} total`}>
              <div className="p-4 flex flex-col sm:flex-row items-center gap-6">
                <div className="relative w-[200px] h-[200px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={assetChart}
                        cx="50%"
                        cy="50%"
                        innerRadius={62}
                        outerRadius={92}
                        paddingAngle={chartTotal ? 2 : 0}
                        dataKey="value"
                        nameKey="name"
                        stroke="none"
                      >
                        {assetChart.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-semibold tabular-nums">{chartTotal}</span>
                    <span className="text-xs text-[#626F86]">devices</span>
                  </div>
                </div>

                <ul className="w-full divide-y divide-[#EBECF0]">
                  {assetChart.map((d) => (
                    <AllocationRow
                      key={d.name}
                      color={d.fill}
                      label={d.name}
                      value={d.value}
                      percent={pct(d.value, chartTotal)}
                    />
                  ))}
                </ul>
              </div>
            </Card>

            <Card title="Asset allocation" aside={`${assignedPct}% assigned`}>
              <div className="p-4">
                <div className="flex h-3 w-full rounded-[3px] overflow-hidden bg-[#EBECF0] mb-5">
                  <div style={{ width: `${assignedPct}%`, backgroundColor: COLORS.assigned }} />
                  <div style={{ width: `${availablePct}%`, backgroundColor: COLORS.available }} />
                  <div style={{ width: `${damagedPct}%`, backgroundColor: COLORS.damaged }} />
                  <div style={{ width: `${printerServicePct}%`, backgroundColor: COLORS.printerService }} />
                  <div style={{ width: `${underServicePct}%`, backgroundColor: COLORS.underService }} />
                </div>

                <ul className="divide-y divide-[#EBECF0]">
                  <AllocationRow color={COLORS.assigned} label="Assigned" value={stats.assigned} percent={assignedPct} />
                  <AllocationRow color={COLORS.available} label="Available" value={stats.available} percent={availablePct} />
                  <AllocationRow color={COLORS.damaged} label="Damaged" value={stats.damaged} percent={damagedPct} />
                  <AllocationRow color={COLORS.printerService} label="Service" value={stats.printerForService} percent={printerServicePct} />
                  <AllocationRow color={COLORS.underService} label="Under service" value={stats.underService} percent={underServicePct} />
                </ul>

                <p className="text-xs text-[#626F86] mt-3">
                  {stats.available} of {statusTotal} assets are free to assign
                  {stats.damaged > 0 && ` · ${stats.damaged} damaged need attention`}.
                </p>
              </div>
            </Card>
          </div>

          {/* TABLES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card title="Recent assets">
              {loading && recentAssets.length === 0 ? (
                <SkeletonRows />
              ) : recentAssets.length === 0 ? (
                <Empty />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-[#DCDFE4]">
                        <Th>Asset code</Th>
                        <Th>Type</Th>
                        <Th>Model</Th>
                        <Th>Status</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EBECF0]">
                      {recentAssets.map((a, i) => (
                        <tr key={a._id || a.assetCode || i} className="hover:bg-[#F7F8F9] transition-colors">
                          <td className="py-3 px-4 font-medium whitespace-nowrap">{a.assetCode || "—"}</td>
                          <td className="py-3 px-4 text-[#44546F]">{a.type || "—"}</td>
                          <td className="py-3 px-4 text-[#44546F]">{a.model || "—"}</td>
                          <td className="py-3 px-4"><Lozenge status={a.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <Card title="Recent software">
              {loading && recentSoftware.length === 0 ? (
                <SkeletonRows />
              ) : recentSoftware.length === 0 ? (
                <Empty />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-[#DCDFE4]">
                        <Th>Service</Th>
                        <Th>Vendor</Th>
                        <Th>Expiry date</Th>
                        <Th>Status</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EBECF0]">
                      {recentSoftware.map((s, i) => (
                        <tr key={s._id || i} className="hover:bg-[#F7F8F9] transition-colors">
                          <td className="py-3 px-4 font-medium">{s.serviceName || "—"}</td>
                          <td className="py-3 px-4 text-[#44546F]">{s.vendor || "—"}</td>
                          <td className="py-3 px-4 text-[#44546F] whitespace-nowrap">{formatDate(s.expiryDate)}</td>
                          <td className="py-3 px-4"><Lozenge status={s.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>

          <p className="text-xs text-[#626F86] text-center pt-2">
            Refreshes automatically every 5 minutes
            {lastUpdated && ` · Last sync ${formattedLastUpdated}`}
          </p>
        </div>
      </div>
    </div>
  );
}