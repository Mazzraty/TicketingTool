import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import {
  AlertCircle,
  Clock,
  CheckCircle,
  TrendingUp,
  Plus,
  List,
  RotateCw,
  ArrowRight,
} from "lucide-react";

/**
 * Restyled to match the Admin Tickets design system (white/slate surfaces,
 * rounded-xl cards with shadow-sm, left accent bars, STATUS_THEME-style
 * badges) so the user-facing dashboard and the admin panel read as one
 * product. Sans-serif throughout — the earlier Fraunces serif heading is
 * dropped here to stay consistent with the rest of the app; kept the brand
 * green (#1f4a35) only for the primary action button.
 */

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tickets, setTickets] = useState([]);
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
    } catch (err) {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const ticketId = (t) => t._id || t.id;

  const open = tickets.filter((t) => t.status?.toLowerCase() === "open").length;
  const progress = tickets.filter((t) => t.status?.toLowerCase() === "in progress").length;
  const resolved = tickets.filter((t) => t.status?.toLowerCase() === "resolved").length;
  const total = tickets.length;

  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : null;

  const resolvedWithTimes = tickets.filter(
    (t) => t.status?.toLowerCase() === "resolved" && t.created_at && t.resolved_at
  );
  const avgResolutionTime =
    resolvedWithTimes.length > 0
      ? (
          resolvedWithTimes.reduce((sum, t) => {
            const hours =
              (new Date(t.resolved_at) - new Date(t.created_at)) / (1000 * 60 * 60);
            return sum + hours;
          }, 0) / resolvedWithTimes.length
        ).toFixed(1)
      : null;

  const recentTickets = tickets.slice(0, 5);

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "critical":
      case "high":
        return "text-red-600";
      case "medium":
        return "text-amber-600";
      case "low":
        return "text-blue-600";
      default:
        return "text-slate-500";
    }
  };

  // STATUS_THEME-style badges — same shape/weight/dot pattern as
  // AdminTickets.jsx so status pills look identical across the app.
  const getStatusBadge = (status) => {
    const s = status?.toLowerCase();
    const theme = {
      open: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
      "in progress": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-400" },
      resolved: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
    }[s] || { bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200", dot: "bg-slate-400" };

    return (
      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${theme.bg} ${theme.text} ${theme.border}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
        {status || "Unknown"}
      </span>
    );
  };

  // Same stat-card pattern as AdminTickets: white surface, left accent
  // bar, icon in a soft pastel badge, big tabular number.
  const KPICard = ({ icon: Icon, label, value, subtitle, theme }) => {
    const themes = {
      amber: { bar: "bg-amber-400", iconBg: "bg-amber-50", iconText: "text-amber-600" },
      blue: { bar: "bg-blue-500", iconBg: "bg-blue-50", iconText: "text-blue-600" },
      emerald: { bar: "bg-emerald-500", iconBg: "bg-emerald-50", iconText: "text-emerald-600" },
    };
    const c = themes[theme];

    return (
      <div className="relative bg-white border border-slate-200 rounded-xl p-4 sm:p-5 overflow-hidden shadow-sm">
        <span className={`absolute left-0 top-0 bottom-0 w-1 ${c.bar}`} />
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
          <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${c.iconBg}`}>
            <Icon className={`w-4.5 h-4.5 ${c.iconText}`} />
          </span>
        </div>
        <p className="text-3xl font-bold text-slate-900 tabular-nums">{value}</p>
        {subtitle && <p className="mt-1.5 text-xs text-slate-400">{subtitle}</p>}
      </div>
    );
  };

  const Button = ({ variant = "primary", icon: Icon, children, onClick, className = "" }) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition active:scale-95";

    const variants = {
      primary: "bg-[#1f4a35] text-white hover:bg-[#173a29]",
      secondary: "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50",
      tertiary: "bg-slate-100 text-slate-600 hover:bg-slate-200",
    };

    return (
      <button onClick={onClick} className={`${baseStyles} ${variants[variant]} ${className}`}>
        {Icon && <Icon className="w-4 h-4" />}
        {children}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 md:p-8 font-sans">
      <div className="max-w-[1400px] mx-auto w-full">

        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            IT Service Dashboard
          </h1>
          {user?.name && (
            <p className="mt-1 text-sm text-slate-600">
              Welcome back, <span className="font-semibold text-slate-900">{user.name}</span>
            </p>
          )}
          <p className="mt-0.5 text-sm text-slate-400">
            Real-time overview of your service tickets and system health
          </p>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 text-sm">Error loading data</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={load}
              className="text-sm font-medium text-red-700 hover:text-red-900 underline shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* LOADING STATE */}
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-16 text-center shadow-sm">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-slate-100 mb-3">
              <RotateCw className="w-5 h-5 text-slate-500 animate-spin" />
            </div>
            <p className="text-sm text-slate-500 font-medium">Loading dashboard…</p>
          </div>
        ) : (
          <>
            {/* KPI GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <KPICard
                icon={AlertCircle}
                label="Open Tickets"
                value={open}
                theme="amber"
                subtitle="Waiting for action"
              />
              <KPICard
                icon={Clock}
                label="In Progress"
                value={progress}
                theme="blue"
                subtitle="Being actively worked on"
              />
              <KPICard
                icon={CheckCircle}
                label="Resolved"
                value={resolved}
                theme="emerald"
                subtitle={
                  resolutionRate !== null
                    ? `${resolutionRate}% of your tickets`
                    : "Completed successfully"
                }
              />
            </div>

            {/* HEALTH METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Average Resolution Time
                  </h3>
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                {avgResolutionTime !== null ? (
                  <>
                    <div className="flex items-baseline gap-1.5">
                      <p className="text-2xl font-bold text-slate-900">{avgResolutionTime}</p>
                      <p className="text-sm text-slate-500">hours</p>
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Based on {resolvedWithTimes.length} resolved ticket
                      {resolvedWithTimes.length === 1 ? "" : "s"} with recorded resolution time
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-semibold text-slate-300">No data yet</p>
                    <p className="mt-2 text-xs text-slate-400">
                      Shows once a ticket has been resolved
                    </p>
                  </>
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">System Health</h3>
                  <CheckCircle className={`w-4 h-4 ${total > 0 ? "text-emerald-600" : "text-slate-300"}`} />
                </div>
                <p className={`text-2xl font-bold ${total > 0 ? "text-emerald-600" : "text-slate-300"}`}>
                  {total > 0 ? "Healthy" : "No activity"}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  {total} total ticket{total === 1 ? "" : "s"} on this page
                </p>
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm mb-6">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Quick Actions</h3>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" icon={Plus} onClick={() => navigate("/create")}>
                  Create Ticket
                </Button>
                <Button variant="secondary" icon={List} onClick={() => navigate("/tickets")}>
                  View All Tickets
                </Button>
                <Button variant="tertiary" icon={RotateCw} onClick={load}>
                  Refresh
                </Button>
              </div>
            </div>

            {/* RECENT TICKETS */}
            {tickets.length > 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="border-b border-slate-100 p-4 sm:p-5">
                  <h3 className="text-sm font-bold text-slate-900">Recent Tickets</h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Your latest {recentTickets.length} ticket{recentTickets.length === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="divide-y divide-slate-100">
                  {recentTickets.map((ticket) => (
                    <div
                      key={ticketId(ticket)}
                      className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors cursor-pointer"
                      onClick={() => navigate(`/tickets/${ticketId(ticket)}`)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                            <h4 className="text-sm font-semibold text-slate-800 truncate">
                              {ticket.title || `Ticket #${ticketId(ticket)}`}
                            </h4>
                            {getStatusBadge(ticket.status)}
                          </div>
                          <p className="text-sm text-slate-500 line-clamp-2">
                            {ticket.description || "No description provided"}
                          </p>
                          <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                            {ticket.priority && (
                              <span className={`font-medium ${getPriorityColor(ticket.priority)}`}>
                                {ticket.priority}
                              </span>
                            )}
                            {ticket.created_at && (
                              <span>Created {new Date(ticket.created_at).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 bg-slate-50 p-3.5 text-center">
                  <button
                    onClick={() => navigate("/tickets")}
                    className="text-sm font-medium text-[#2f5c42] hover:text-[#1f4a35] inline-flex items-center gap-1.5"
                  >
                    View all tickets
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              /* EMPTY STATE */
              <div className="bg-white border border-dashed border-slate-300 rounded-xl p-12 text-center shadow-sm">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-50 border border-slate-100 mb-3">
                  <Plus className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No tickets yet</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Create your first support request to get started
                </p>
                <Button
                  variant="primary"
                  icon={Plus}
                  onClick={() => navigate("/create")}
                  className="mt-5"
                >
                  Create First Ticket
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}