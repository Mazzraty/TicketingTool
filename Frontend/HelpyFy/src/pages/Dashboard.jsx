import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import {
  AlertCircle,
  CheckCircle,
  Plus,
  List,
  RotateCw,
  ChevronRight,
  ChevronsUp,
  ChevronUp,
  ChevronDown,
  Minus,
  Ticket as TicketIcon,
  Timer,
} from "lucide-react";

/* =========================
   DESIGN TOKENS (shared with MyTickets / CreateTicket)
========================= */
const STATUS_META = {
  open: { label: "Open", bg: "#E9F2FF", text: "#0C4A9E", dot: "#1D7AFC" },
  "in progress": { label: "In Progress", bg: "#FFF3D6", text: "#7A4B00", dot: "#E59E0B" },
  resolved: { label: "Resolved", bg: "#DFF7E8", text: "#146C3E", dot: "#22A06B" },
  reopened: { label: "Reopened", bg: "#F3EEFF", text: "#5B37AF", dot: "#8270DB" },
  closed: { label: "Closed", bg: "#EEF0F3", text: "#44546F", dot: "#8590A2" },
  rejected: { label: "Rejected", bg: "#FFECEB", text: "#AE2A19", dot: "#E2483D" },
};

const PRIORITY_META = {
  critical: { label: "Critical", color: "#C9372C", Icon: ChevronsUp },
  high: { label: "High", color: "#D9601B", Icon: ChevronUp },
  medium: { label: "Medium", color: "#B7791F", Icon: Minus },
  low: { label: "Low", color: "#22A06B", Icon: ChevronDown },
};

const getStatusMeta = (status) =>
  STATUS_META[status?.toLowerCase()] || STATUS_META.closed;

const getPriorityMeta = (priority) =>
  PRIORITY_META[priority?.toLowerCase()] || {
    label: priority || "-",
    color: "#6b7280",
    Icon: Minus,
  };

/* =========================
   HELPERS
========================= */
const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDuration = (hours) => {
  if (hours < 1) return { value: Math.max(1, Math.round(hours * 60)), unit: "minutes" };
  if (hours < 48) return { value: hours.toFixed(1), unit: "hours" };
  return { value: (hours / 24).toFixed(1), unit: "days" };
};

/* =========================
   SMALL UI PIECES
========================= */
const StatusLozenge = ({ status }) => {
  const meta = getStatusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap"
      style={{ background: meta.bg, color: meta.text }}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${status === "In Progress" ? "animate-pulse" : ""}`}
        style={{ background: meta.dot }}
      />
      {status ? meta.label : "Unknown"}
    </span>
  );
};

const PriorityTag = ({ priority }) => {
  const meta = getPriorityMeta(priority);
  const Icon = meta.Icon;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium">
      <Icon className="w-4 h-4" strokeWidth={2.5} style={{ color: meta.color }} />
      <span className="text-gray-900">{meta.label}</span>
    </span>
  );
};

const Button = ({ variant = "primary", icon: Icon, children, onClick, className = "" }) => {
  const base =
    "inline-flex items-center justify-center gap-1.5 rounded-md h-9 px-4 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f4a35]";

  const variants = {
    primary: "bg-[#1f4a35] text-white hover:bg-[#173a29]",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
  };

  return (
    <button onClick={onClick} className={`${base} ${variants[variant]} ${className}`}>
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
};

// one cell of the KPI strip
const StatCell = ({ label, value, hint, dot }) => (
  <div className="px-5 py-4 min-w-0">
    <div className="flex items-center gap-2">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />
      <p className="text-xs font-medium text-gray-500 truncate">{label}</p>
    </div>
    <p className="mt-1.5 text-3xl font-semibold text-gray-900 tabular-nums leading-none">
      {value}
    </p>
    <p className="mt-1.5 text-xs text-gray-400 truncate">{hint}</p>
  </div>
);

/* =========================
   PAGE
========================= */
export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [counts, setCounts] = useState(null); // per-status counts from the API
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/tickets/my?page=1");
      setTickets(res.data.data || []);
      setCounts(res.data.counts || null);
    } catch (err) {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const ticketId = (t) => t._id || t.id;
  const countByStatus = (s) =>
    tickets.filter((t) => t.status?.toLowerCase() === s).length;

  // Prefer the server-side counts (whole account). Fall back to the loaded
  // page if the API doesn't return them.
  const stats = counts
    ? {
      total: counts.all ?? 0,
      open: counts.Open ?? 0,
      progress: counts["In Progress"] ?? 0,
      resolved: counts.Resolved ?? 0,
      closed: counts.Closed ?? 0,
    }
    : {
      total: tickets.length,
      open: countByStatus("open"),
      progress: countByStatus("in progress"),
      resolved: countByStatus("resolved"),
      closed: countByStatus("closed"),
    };

  const completed = stats.resolved + stats.closed;
  const completionRate =
    stats.total > 0 ? Math.round((completed / stats.total) * 100) : null;

  // Average resolution time from the recent tickets that have both dates.
  // (The API returns createdAt / resolvedAt.)
  const timed = tickets.filter((t) => (t.createdAt || t.created_at) && (t.resolvedAt || t.resolved_at));
  const avgHours =
    timed.length > 0
      ? timed.reduce((sum, t) => {
        const start = new Date(t.createdAt || t.created_at);
        const end = new Date(t.resolvedAt || t.resolved_at);
        return sum + (end - start) / (1000 * 60 * 60);
      }, 0) / timed.length
      : null;
  const avg = avgHours !== null ? formatDuration(avgHours) : null;

  const recentTickets = tickets.slice(0, 5);

  const rowGrid =
    "grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[120px_minmax(0,1fr)_100px_120px] items-center gap-4 px-5";

  return (
    <div className="min-h-screen bg-[#f4f6f5]">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {/* PAGE HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
          <div>
            <p className="text-xs text-gray-500 mb-1.5">
              My workspace <span className="mx-1 text-gray-300">/</span> Dashboard
            </p>
            <h1 className="text-2xl font-semibold text-gray-900">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {user?.name ? (
                <>
                  Welcome back,{" "}
                  <span className="font-medium text-gray-800">{user.name}</span>
                </>
              ) : (
                "Overview of your support requests"
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={RotateCw} onClick={load}>
              Refresh
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => navigate("/create")}>
              New ticket
            </Button>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-md border border-red-200 border-l-4 border-l-red-500 bg-red-50 px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-700 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">Could not load your dashboard</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={load}
              className="text-sm font-medium text-red-700 hover:underline shrink-0 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          /* LOADING SKELETON */
          <div className="space-y-5">
            <div className="bg-white border border-gray-200 rounded-md grid grid-cols-2 lg:grid-cols-4 divide-x divide-gray-200">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="px-5 py-4 space-y-2.5">
                  <div className="h-3 w-20 rounded bg-gray-100 animate-pulse" />
                  <div className="h-8 w-12 rounded bg-gray-100 animate-pulse" />
                  <div className="h-2.5 w-28 rounded bg-gray-50 animate-pulse" />
                </div>
              ))}
            </div>
            <div className="bg-white border border-gray-200 rounded-md h-64 animate-pulse" />
          </div>
        ) : (
          <div className="space-y-5">
            {/* NEEDS YOUR ACTION */}
            {stats.resolved > 0 && (
              <div className="flex flex-wrap items-center gap-3 rounded-md border border-[#BCEBD0] border-l-4 border-l-[#22A06B] bg-[#F1FBF5] px-4 py-3">
                <CheckCircle className="w-4 h-4 text-[#146C3E] shrink-0" />
                <p className="flex-1 min-w-[220px] text-sm text-[#146C3E]">
                  <span className="font-semibold">
                    {stats.resolved} ticket{stats.resolved === 1 ? " is" : "s are"} waiting for your confirmation.
                  </span>{" "}
                  Check the fix and close {stats.resolved === 1 ? "it" : "them"}, or reopen if the
                  problem is still there.
                </p>
                <button
                  onClick={() => navigate("/tickets")}
                  className="inline-flex items-center gap-1 rounded-md bg-[#1f4a35] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#173a29] transition-colors cursor-pointer"
                >
                  Review tickets
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* KPI STRIP */}
            <div className="bg-white border border-gray-200 rounded-md grid grid-cols-2 lg:grid-cols-4 divide-x divide-gray-200 [&>*:nth-child(n+3)]:border-t [&>*:nth-child(n+3)]:border-gray-200 lg:[&>*:nth-child(n+3)]:border-t-0">
              <StatCell
                label="Open"
                value={stats.open}
                hint="Waiting for IT to pick up"
                dot="#1D7AFC"
              />
              <StatCell
                label="In progress"
                value={stats.progress}
                hint="Being worked on"
                dot="#E59E0B"
              />
              <StatCell
                label="Awaiting confirmation"
                value={stats.resolved}
                hint="Resolved, needs your OK"
                dot="#22A06B"
              />
              <StatCell
                label="Closed"
                value={stats.closed}
                hint={`${stats.total} ticket${stats.total === 1 ? "" : "s"} in total`}
                dot="#8590A2"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-5 items-start">
              {/* RECENT TICKETS */}
              <section className="bg-white border border-gray-200 rounded-md overflow-hidden">
                <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-gray-200">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Recent tickets</h2>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Your latest {recentTickets.length} request
                      {recentTickets.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  {tickets.length > 0 && (
                    <button
                      onClick={() => navigate("/tickets")}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#1f4a35] hover:underline cursor-pointer"
                    >
                      View all
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {tickets.length > 0 ? (
                  <>
                    {/* column headers (hidden on mobile) */}
                    <div
                      className={`${rowGrid} hidden sm:grid py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600`}
                    >
                      <span>Number</span>
                      <span>Summary</span>
                      <span>Priority</span>
                      <span>Status</span>
                    </div>

                    {recentTickets.map((ticket) => (
                      <div
                        key={ticketId(ticket)}
                        onClick={() => navigate(`/tickets/${ticketId(ticket)}`)}
                        className={`${rowGrid} py-3.5 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-[#f4f8f4] transition-colors`}
                      >
                        <span className="hidden sm:block text-[13px] font-medium text-[#1f4a35] break-all font-mono">
                          {ticket.ticketNumber || "-"}
                        </span>

                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {ticket.title || `Ticket #${ticketId(ticket)}`}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500 truncate">
                            {ticket.description || "No description provided"}
                            {(ticket.createdAt || ticket.created_at) &&
                              ` · ${formatDate(ticket.createdAt || ticket.created_at)}`}
                          </p>
                        </div>

                        <div className="hidden sm:block">
                          {ticket.priority ? <PriorityTag priority={ticket.priority} /> : "-"}
                        </div>

                        <div>
                          <StatusLozenge status={ticket.status} />
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  /* EMPTY STATE (the "New ticket" button is already in the page header) */
                  <div className="py-14 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#eef3ee] mb-3">
                      <TicketIcon className="w-5 h-5 text-[#1f4a35]" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">
                      You have no tickets yet
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Use New ticket above to raise a request. It will show up here.
                    </p>
                  </div>
                )}
              </section>

              {/* SIDE COLUMN */}
              <div className="space-y-5">
                {/* RESOLUTION SUMMARY */}
                <section className="bg-white border border-gray-200 rounded-md overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-200">
                    <h2 className="text-sm font-semibold text-gray-900">Resolution summary</h2>
                  </div>

                  <div className="p-5 space-y-5">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                        <Timer className="w-3.5 h-3.5" />
                        Average resolution time
                      </div>
                      {avg ? (
                        <>
                          <p className="mt-1.5 flex items-baseline gap-1.5">
                            <span className="text-2xl font-semibold text-gray-900 tabular-nums">
                              {avg.value}
                            </span>
                            <span className="text-sm text-gray-500">{avg.unit}</span>
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            Across {timed.length} recent resolved ticket
                            {timed.length === 1 ? "" : "s"}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="mt-1.5 text-lg font-semibold text-gray-300">No data yet</p>
                          <p className="mt-1 text-xs text-gray-400">
                            Shows once a ticket has been resolved
                          </p>
                        </>
                      )}
                    </div>

                    <div className="border-t border-gray-100 pt-5">
                      <div className="flex items-center justify-between text-xs font-medium text-gray-500">
                        <span>Tickets completed</span>
                        <span className="text-gray-900 tabular-nums">
                          {completionRate !== null ? `${completionRate}%` : "-"}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#1f4a35] transition-all duration-500"
                          style={{ width: `${completionRate || 0}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-gray-400">
                        {completed} of {stats.total} resolved or closed
                      </p>
                    </div>
                  </div>
                </section>

                {/* QUICK ACTIONS */}
                <section className="bg-white border border-gray-200 rounded-md overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-gray-200">
                    <h2 className="text-sm font-semibold text-gray-900">Quick actions</h2>
                  </div>

                  <div className="divide-y divide-gray-100">
                    <button
                      onClick={() => navigate("/create")}
                      className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-[#f4f8f4] transition-colors cursor-pointer"
                    >
                      <span className="w-8 h-8 rounded-md bg-[#eef3ee] flex items-center justify-center shrink-0">
                        <Plus className="w-4 h-4 text-[#1f4a35]" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium text-gray-900">
                          Create a ticket
                        </span>
                        <span className="block text-xs text-gray-500">Report a new problem</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </button>

                    <button
                      onClick={() => navigate("/tickets")}
                      className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-[#f4f8f4] transition-colors cursor-pointer"
                    >
                      <span className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center shrink-0">
                        <List className="w-4 h-4 text-gray-600" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium text-gray-900">
                          View all tickets
                        </span>
                        <span className="block text-xs text-gray-500">
                          Filter, search and track status
                        </span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </button>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}