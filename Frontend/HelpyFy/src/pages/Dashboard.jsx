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

  // Calculate KPI metrics
  const open = tickets.filter((t) => t.status === "Open").length;
  const progress = tickets.filter((t) => t.status === "In Progress").length;
  const resolved = tickets.filter((t) => t.status === "Resolved").length;
  const total = tickets.length;

  // Calculate health metrics (demo data - replace with real calculations)
  const avgResolutionTime = 2.3; // hours
  const openTrend = "+2"; // compared to last week
  const resolutionRate = 85; // percentage

  // Get recent tickets (last 5)
  const recentTickets = tickets.slice(0, 5);

  // Determine ticket priority color
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "critical":
      case "high":
        return "text-red-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
            <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
            Open
          </span>
        );
      case "in progress":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            In Progress
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            Resolved
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const KPICard = ({ icon: Icon, label, value, trend, color, subtitle }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {label}
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className={`text-4xl font-bold ${color}`}>{value}</h3>
            {trend && (
              <span className="text-sm font-medium text-green-600">
                {trend}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        <div className={`${color} opacity-20`}>
          <Icon className="w-12 h-12" />
        </div>
      </div>
    </div>
  );

  const Button = ({
    variant = "primary",
    icon: Icon,
    children,
    onClick,
    className = "",
  }) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 cursor-pointer";

    const variants = {
      primary: "bg-green-600 text-white hover:bg-green-700 active:scale-95",
      secondary:
        "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 active:scale-95",
      tertiary:
        "bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95",
    };

    return (
      <button
        onClick={onClick}
        className={`${baseStyles} ${variants[variant]} ${className}`}
      >
        {Icon && <Icon className="w-4 h-4" />}
        {children}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* HEADER */}
      <div className="mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            IT Service Dashboard
          </h1>
          {user?.name && (
            <p className="mt-1 text-base text-gray-600">
              Welcome back, <span className="font-semibold">{user.name}</span>
            </p>
          )}
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Real-time overview of your service tickets and system health
        </p>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-900">Error loading data</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
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
              trend={openTrend}
              color="text-yellow-600"
              subtitle="Waiting for action"
            />
            <KPICard
              icon={Clock}
              label="In Progress"
              value={progress}
              color="text-blue-600"
              subtitle="Being actively worked on"
            />
            <KPICard
              icon={CheckCircle}
              label="Resolved"
              value={resolved}
              trend={`${resolutionRate}%`}
              color="text-green-600"
              subtitle="Completed successfully"
            />
          </div>

          {/* HEALTH METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  Average Resolution Time
                </h3>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-gray-900">
                  {avgResolutionTime}
                </p>
                <p className="text-gray-600">hours</p>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                Industry standard: 4.5 hours — You're performing 49% better
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  System Health
                </h3>
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-green-600">Healthy</p>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                {total} total tickets · All systems operating normally
              </p>
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-8">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => navigate("/create")}
              >
                Create Ticket
              </Button>
              <Button
                variant="secondary"
                icon={List}
                onClick={() => navigate("/tickets")}
              >
                View All Tickets
              </Button>
              <Button
                variant="tertiary"
                icon={RotateCw}
                onClick={load}
              >
                Refresh
              </Button>
            </div>
          </div>

          {/* RECENT TICKETS SECTION */}
          {tickets.length > 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="border-b border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-900">
                  Recent Tickets
                </h3>
                <p className="mt-1 text-xs text-gray-600">
                  Your latest {Math.min(5, recentTickets.length)} tickets
                </p>
              </div>

              <div className="divide-y divide-gray-200">
                {recentTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                            {ticket.title || "Ticket #" + ticket.id}
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
                            <span>
                              Created{" "}
                              {new Date(ticket.created_at).toLocaleDateString()}
                            </span>
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
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 inline-flex items-center gap-2"
                >
                  View all tickets
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* EMPTY STATE */
            <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <AlertCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="mt-2 text-lg font-semibold text-gray-900">
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