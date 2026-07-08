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
 * FONTS — same as Login.jsx / Register.jsx, add once to index.html <head>:
 * <link rel="preconnect" href="https://fonts.googleapis.com">
 * <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
 * <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
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

  // ticket id can come back as _id (Mongo) or id — normalize once here
  const ticketId = (t) => t._id || t.id;

  // KPI counts — real, from actual loaded tickets
  const open = tickets.filter((t) => t.status?.toLowerCase() === "open").length;
  const progress = tickets.filter((t) => t.status?.toLowerCase() === "in progress").length;
  const resolved = tickets.filter((t) => t.status?.toLowerCase() === "resolved").length;
  const total = tickets.length;

  // Resolution rate — only meaningful once there's at least one ticket
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : null;

  // Average resolution time — only computed from tickets that actually have both timestamps.
  // Falls back to null (hidden) rather than a fabricated number.
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

  // Recent tickets (last 5) — assumes API returns newest first; if not, sort by created_at here.
  const recentTickets = tickets.slice(0, 5);

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "critical":
      case "high":
        return "text-red-600";
      case "medium":
        return "text-amber-600";
      case "low":
        return "text-emerald-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <div className="w-1.5 h-1.5 bg-amber-600 rounded-full" />
            Open
          </span>
        );
      case "in progress":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
            In Progress
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
            Resolved
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
            {status || "Unknown"}
          </span>
        );
    }
  };

  const KPICard = ({ icon: Icon, label, value, subtitle, tint }) => {
    const tints = {
      amber: { text: "text-amber-600", bg: "bg-amber-50" },
      blue: { text: "text-blue-600", bg: "bg-blue-50" },
      emerald: { text: "text-emerald-600", bg: "bg-emerald-50" },
    };
    const c = tints[tint];

    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {label}
            </p>
            <h3 className={`mt-3 text-4xl font-bold ${c.text}`}>{value}</h3>
            {subtitle && <p className="mt-2 text-sm text-gray-500">{subtitle}</p>}
          </div>
          <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
            <Icon className={`w-5 h-5 ${c.text}`} />
          </div>
        </div>
      </div>
    );
  };

  const Button = ({ variant = "primary", icon: Icon, children, onClick, className = "" }) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer";

    const variants = {
      primary: "bg-[#1f4a35] text-white hover:bg-[#173a29] active:scale-95",
      secondary:
        "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:scale-95",
      tertiary: "bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95",
    };

    return (
      <button onClick={onClick} className={`${baseStyles} ${variants[variant]} ${className}`}>
        {Icon && <Icon className="w-4 h-4" />}
        {children}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#faf8f4] p-6 font-['Inter',sans-serif]">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="font-['Fraunces',serif] text-3xl font-medium text-[#14251c]">
          IT Service Dashboard
        </h1>
        {user?.name && (
          <p className="mt-1 text-base text-gray-600">
            Welcome back, <span className="font-semibold text-[#14251c]">{user.name}</span>
          </p>
        )}
        <p className="mt-2 text-sm text-gray-500">
          Real-time overview of your service tickets and system health
        </p>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900">Error loading data</h3>
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
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
            <RotateCw className="w-6 h-6 text-gray-600 animate-spin" />
          </div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      ) : (
        <>
          {/* KPI GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <KPICard
              icon={AlertCircle}
              label="Open Tickets"
              value={open}
              tint="amber"
              subtitle="Waiting for action"
            />
            <KPICard
              icon={Clock}
              label="In Progress"
              value={progress}
              tint="blue"
              subtitle="Being actively worked on"
            />
            <KPICard
              icon={CheckCircle}
              label="Resolved"
              value={resolved}
              tint="emerald"
              subtitle={
                resolutionRate !== null
                  ? `${resolutionRate}% of your tickets`
                  : "Completed successfully"
              }
            />
          </div>

          {/* HEALTH METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Average Resolution Time
                </h3>
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              {avgResolutionTime !== null ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-gray-900">{avgResolutionTime}</p>
                    <p className="text-gray-600">hours</p>
                  </div>
                  <p className="mt-3 text-xs text-gray-500">
                    Based on {resolvedWithTimes.length} resolved ticket
                    {resolvedWithTimes.length === 1 ? "" : "s"} with recorded resolution time
                  </p>
                </>
              ) : (
                <>
                  <p className="text-2xl font-semibold text-gray-400">No data yet</p>
                  <p className="mt-3 text-xs text-gray-500">
                    Shows once a ticket has been resolved
                  </p>
                </>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">System Health</h3>
                <CheckCircle
                  className={`w-5 h-5 ${total > 0 ? "text-emerald-600" : "text-gray-300"}`}
                />
              </div>
              <p className={`text-3xl font-bold ${total > 0 ? "text-emerald-600" : "text-gray-400"}`}>
                {total > 0 ? "Healthy" : "No activity"}
              </p>
              <p className="mt-3 text-xs text-gray-500">
                {total} total ticket{total === 1 ? "" : "s"} on this page
              </p>
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-8">
            <h3 className="font-['Fraunces',serif] text-lg font-medium text-[#14251c] mb-4">
              Quick Actions
            </h3>
            <div className="flex flex-wrap gap-3">
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
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="border-b border-gray-200 p-6">
                <h3 className="font-['Fraunces',serif] text-lg font-medium text-[#14251c]">
                  Recent Tickets
                </h3>
                <p className="mt-1 text-xs text-gray-600">
                  Your latest {recentTickets.length} ticket{recentTickets.length === 1 ? "" : "s"}
                </p>
              </div>

              <div className="divide-y divide-gray-200">
                {recentTickets.map((ticket) => (
                  <div
                    key={ticketId(ticket)}
                    className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/tickets/${ticketId(ticket)}`)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                            {ticket.title || `Ticket #${ticketId(ticket)}`}
                          </h4>
                          {getStatusBadge(ticket.status)}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {ticket.description || "No description provided"}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
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
                      <ArrowRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 bg-gray-50 p-4 text-center">
                <button
                  onClick={() => navigate("/tickets")}
                  className="text-sm font-medium text-[#2f5c42] hover:text-[#1f4a35] inline-flex items-center gap-2"
                >
                  View all tickets
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* EMPTY STATE */
            <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#eef3ee] mb-4">
                <Plus className="w-8 h-8 text-[#2f5c42]" />
              </div>
              <h3 className="font-['Fraunces',serif] text-lg font-medium text-[#14251c]">
                No tickets yet
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Create your first support request to get started
              </p>
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => navigate("/create")}
                className="mt-6"
              >
                Create First Ticket
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
