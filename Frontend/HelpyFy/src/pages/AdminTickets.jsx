import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

/* ================= ICONS (inline, no extra dependency) ================= */
const Icon = ({ children, className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {children}
  </svg>
);
const IconSearch = (p) => <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Icon>;
const IconClip = (p) => <Icon {...p}><path d="M21.44 11.05 12.25 20.24a5 5 0 1 1-7.07-7.07l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95L9.64 18.36a2 2 0 1 1-2.83-2.83l8.49-8.48" /></Icon>;
const IconEye = (p) => <Icon {...p}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" /><circle cx="12" cy="12" r="3" /></Icon>;
const IconX = (p) => <Icon {...p}><path d="M18 6 6 18M6 6l12 12" /></Icon>;
const IconChevronLeft = (p) => <Icon {...p}><path d="m15 18-6-6 6-6" /></Icon>;
const IconChevronRight = (p) => <Icon {...p}><path d="m9 18 6-6-6-6" /></Icon>;
const IconCheck = (p) => <Icon {...p}><path d="M20 6 9 17l-5-5" /></Icon>;
const IconLock = (p) => <Icon {...p}><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></Icon>;
const IconNote = (p) => <Icon {...p}><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" /><path d="M9 13h6M9 17h6" /></Icon>;
const IconLayers = (p) => <Icon {...p}><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5" /><path d="m3 17 9 5 9-5" /></Icon>;
const IconCircleDot = (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" fill="currentColor" /></Icon>;
const IconClock = (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></Icon>;
const IconAlertTriangle = (p) => <Icon {...p}><path d="m10.29 3.86-8.18 14.18A2 2 0 0 0 4 21h16a2 2 0 0 0 1.89-2.96L13.71 3.86a2 2 0 0 0-3.42 0Z" /><path d="M12 9v4M12 17h.01" /></Icon>;
const IconZap = (p) => <Icon {...p}><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" /></Icon>;
const IconUser = (p) => <Icon {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></Icon>;
const IconMenu = (p) => <Icon {...p}><path d="M4 6h16M4 12h16M4 18h16" /></Icon>;

/* ================= STATUS THEME (single source of truth) ================= */
const STATUS_THEME = {
  Open: { text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", solid: "bg-blue-600", accent: "bg-blue-500" },
  "In Progress": { text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", solid: "bg-amber-500", accent: "bg-amber-400" },
  Resolved: { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", solid: "bg-emerald-600", accent: "bg-emerald-500" },
  Closed: { text: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200", solid: "bg-slate-500", accent: "bg-slate-400" },
};

/* ================= SLA THEME ================= */
const SLA_THEME = {
  ok: { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500" },
  warning: { text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500" },
  breached: { text: "text-red-700", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500" },
  done: { text: "text-slate-500", bg: "bg-slate-100", border: "border-slate-200", dot: "bg-slate-400" },
};

/* ================= SLA HELPERS ================= */
const formatDuration = (ms) => {
  const abs = Math.abs(ms);
  const minutes = Math.floor(abs / (1000 * 60));
  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes % (60 * 24)) / 60);
  const mins = minutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

const getSlaLegState = ({ due, achievedAt, breached, now }) => {
  if (!due) {
    return { level: "done", label: "No SLA", detail: "—" };
  }

  const dueDate = new Date(due);

  if (achievedAt) {
    const achievedDate = new Date(achievedAt);
    if (breached || achievedDate > dueDate) {
      return {
        level: "breached",
        label: "Breached",
        detail: `${formatDuration(achievedDate - dueDate)} late`,
      };
    }
    return {
      level: "ok",
      label: "Met",
      detail: `${formatDuration(dueDate - achievedDate)} to spare`,
    };
  }

  const diff = dueDate - now;
  if (diff <= 0) {
    return {
      level: "breached",
      label: "Overdue",
      detail: `${formatDuration(diff)} over`,
    };
  }

  const isSoon = diff < 60 * 60 * 1000;
  return {
    level: isSoon ? "warning" : "ok",
    label: isSoon ? "Due soon" : "On track",
    detail: `due in ${formatDuration(diff)}`,
  };
};

const getOverallSlaState = (ticket, now) => {
  const sla = ticket.sla;
  if (!sla) return { level: "done", label: "No SLA" };

  if (sla.status === "Breached") {
    return { level: "breached", label: "SLA Breached" };
  }
  if (sla.status === "Completed") {
    return { level: "ok", label: "SLA Met" };
  }

  const resolutionState = getSlaLegState({
    due: sla.resolutionDue,
    achievedAt: sla.resolvedAt,
    breached: sla.resolutionBreached,
    now,
  });

  if (resolutionState.level === "breached") {
    return { level: "breached", label: "SLA Breached" };
  }

  if (!sla.firstRespondedAt) {
    const responseState = getSlaLegState({
      due: sla.firstResponseDue,
      achievedAt: sla.firstRespondedAt,
      breached: sla.firstResponseBreached,
      now,
    });
    if (responseState.level === "breached") {
      return { level: "breached", label: "Response overdue" };
    }
    if (responseState.level === "warning") {
      return { level: "warning", label: "Response due soon" };
    }
  }

  if (resolutionState.level === "warning") {
    return { level: "warning", label: "Resolution due soon" };
  }

  return { level: "ok", label: "On track" };
};

const priorityDot = {
  Low: "bg-blue-500",
  Medium: "bg-amber-500",
  High: "bg-orange-500",
  Critical: "bg-red-500",
};

/* ================= SLA UI COMPONENTS ================= */

const SlaBadge = ({ ticket, now }) => {
  const state = getOverallSlaState(ticket, now);
  const theme = SLA_THEME[state.level];

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${theme.bg} ${theme.text} ${theme.border}`}
    >
      {state.level === "breached" ? (
        <IconAlertTriangle className="w-3 h-3" />
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
      )}
      {state.label}
    </span>
  );
};

const SlaLegRow = ({ icon, label, due, achievedAt, breached, achievedLabel, now }) => {
  const state = getSlaLegState({ due, achievedAt, breached, now });
  const theme = SLA_THEME[state.level];

  let progressPct = 100;
  if (!achievedAt && due) {
    const dueDate = new Date(due);
    const remaining = dueDate - now;
    const totalGuess = 1000 * 60 * 60 * 24;
    progressPct = Math.min(100, Math.max(0, 100 - (remaining / totalGuess) * 100));
  }

  return (
    <div className={`rounded-lg border p-3 ${theme.bg} ${theme.border}`}>
      <div className="flex items-center justify-between mb-1.5">
        <p className={`text-xs font-semibold flex items-center gap-1.5 ${theme.text}`}>
          {icon} {label}
        </p>
        <span className={`text-[11px] font-semibold ${theme.text}`}>{state.label}</span>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
        <span>Due {due ? new Date(due).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—"}</span>
        <span className={theme.text}>{state.detail}</span>
      </div>

      {!achievedAt && due && (
        <div className="h-1.5 w-full rounded-full bg-white/70 overflow-hidden">
          <div
            className={`h-full rounded-full ${theme.dot}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {achievedAt && (
        <p className="text-[11px] text-slate-500 mt-1">
          {achievedLabel} {new Date(achievedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
        </p>
      )}
    </div>
  );
};

const SlaDetailPanel = ({ ticket, now }) => {
  const sla = ticket.sla;
  if (!sla) {
    return <p className="text-xs text-slate-400">No SLA policy on this ticket</p>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${priorityDot[sla.priority] || "bg-slate-400"} text-white`}>
          {sla.priority || "—"} priority
        </span>
        <SlaBadge ticket={ticket} now={now} />
      </div>

      <SlaLegRow
        icon={<IconZap className="w-3.5 h-3.5" />}
        label="First Response"
        due={sla.firstResponseDue}
        achievedAt={sla.firstRespondedAt}
        breached={sla.firstResponseBreached}
        achievedLabel="Responded at"
        now={now}
      />

      <SlaLegRow
        icon={<IconCheck className="w-3.5 h-3.5" />}
        label="Resolution"
        due={sla.resolutionDue}
        achievedAt={sla.resolvedAt}
        breached={sla.resolutionBreached}
        achievedLabel="Resolved at"
        now={now}
      />

      {sla.escalated && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-2.5 flex items-center gap-2">
          <IconAlertTriangle className="w-3.5 h-3.5 text-orange-600 shrink-0" />
          <p className="text-[11px] text-orange-700 font-medium">
            Escalated (level {sla.escalationLevel || 1})
            {sla.escalatedAt && ` on ${new Date(sla.escalatedAt).toLocaleDateString()}`}
          </p>
        </div>
      )}
    </div>
  );
};

/* ================= REPORTER HELPERS ================= */
const getReporterName = (ticket) =>
  ticket.userId?.name ||
  ticket.employeeId?.name ||
  ticket.userId?.email ||
  "Unknown";

const getReporterSubtext = (ticket) => {
  if (ticket.userId?.email) return ticket.userId.email;
  if (ticket.employeeId?.staffCode) return `Staff Code: ${ticket.employeeId.staffCode}`;
  return "—";
};

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [statusModal, setStatusModal] = useState(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));
  const [now, setNow] = useState(() => new Date());

  const initialStats = {
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
  };

  const [stats, setStats] = useState(initialStats);

  useEffect(() => {
    load(page);
    loadStats();
  }, [page]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Lock background scroll while the mobile detail sheet is open
  useEffect(() => {
    if (selected) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [selected]);

  const load = async (pageNumber = 1) => {
    try {
      setLoading(true);
      const res = await api.get(`/tickets?page=${pageNumber}&limit=10`);
      setTickets(res?.data?.data || []);
      setTotalPages(res?.data?.pages || 1);
    } catch {
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await api.get("/tickets/stats");
      const data = res?.data?.data;
      setStats({
        total: data?.total ?? 0,
        open: data?.open ?? 0,
        inProgress: data?.inProgress ?? 0,
        resolved: data?.resolved ?? 0,
        closed: data?.closed ?? 0,
      });
    } catch {
      toast.error("Failed to load stats");
      setStats(initialStats);
    }
  };

  const handleStatusChange = (ticket, targetStatus) => {
    if (targetStatus === "Resolved" || targetStatus === "Closed") {
      setResolutionNote(ticket.resolutionNote || "");
      setStatusModal({ ticket, targetStatus });
      return;
    }
    updateStatus(ticket._id, targetStatus);
  };

  const handleEscalate = async (id) => {
    try {
      await api.put(`/tickets/${id}/escalate`, {
        reason: "Escalated by IT Support",
      });

      toast.success("Ticket escalated successfully");

      load(page);
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to escalate");
    }
  };

  const updateStatus = async (id, status, extra = {}) => {
    try {
      const payload = { status, ...extra };
      if (status === "Resolved") payload.resolvedAt = new Date().toISOString();
      if (status === "Closed") payload.closedAt = new Date().toISOString();

      await api.put(`/tickets/${id}`, payload);
      toast.success(`Ticket marked as ${status}`);
      load(page);
      loadStats();
    } catch {
      toast.error("Update failed");
    }
  };

  const confirmStatusModal = async () => {
    if (!resolutionNote.trim()) {
      return toast.error("Please add a resolution note before continuing");
    }
    setSubmitting(true);
    await updateStatus(statusModal.ticket._id, statusModal.targetStatus, {
      resolutionNote: resolutionNote.trim(),
    });
    setSubmitting(false);
    setStatusModal(null);
    setResolutionNote("");
  };

  const cancelStatusModal = () => {
    setStatusModal(null);
    setResolutionNote("");
  };

  const filtered = tickets.filter((t) => {
    const s = search.toLowerCase();
    const slaState = getOverallSlaState(t, now).label.toLowerCase();
    return (
      t.title?.toLowerCase().includes(s) ||
      t.ticketNumber?.toLowerCase().includes(s) ||
      getReporterName(t).toLowerCase().includes(s) ||
      t.userId?.email?.toLowerCase().includes(s) ||
      t.priority?.toLowerCase().includes(s) ||
      t.status?.toLowerCase().includes(s) ||
      slaState.includes(s)
    );
  });

  const breachedCount = tickets.filter(
    (t) => getOverallSlaState(t, now).level === "breached"
  ).length;

  const priorityColor = (p) => {
    if (p === "High") return "bg-red-50 text-red-700 border border-red-200";
    if (p === "Medium") return "bg-amber-50 text-amber-700 border border-amber-200";
    if (p === "Low") return "bg-blue-50 text-blue-700 border border-blue-200";
    return "bg-slate-100 text-slate-600 border border-slate-200";
  };

  const formatDateTime = (date) =>
    date ? new Date(date).toLocaleString(undefined, {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit",
    }) : "—";

  const renderStars = (rating) => (
    <span className="text-amber-400 text-sm tracking-tight">
      {"★".repeat(rating || 0)}
      <span className="text-slate-200">{"★".repeat(5 - (rating || 0))}</span>
    </span>
  );

  const initials = (nameOrEmail) => (nameOrEmail ? nameOrEmail.charAt(0).toUpperCase() : "?");

  const renderAttachments = (files = []) => {
    if (!files || files.length === 0) return <span className="text-slate-300 text-xs">—</span>;
    return (
      <div className="flex flex-col gap-1 items-start sm:items-center">
        {files.map((file, i) => (
          <a
            key={i}
            href={file.url || file}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium"
          >
            <IconClip className="w-3 h-3" /> File {i + 1}
          </a>
        ))}
      </div>
    );
  };

  const statCards = [
    { key: "total", label: "Total", value: stats.total, theme: "slate", icon: <IconLayers className="w-4 h-4" /> },
    { key: "open", label: "Open", value: stats.open, theme: "blue", icon: <IconCircleDot className="w-4 h-4" /> },
    { key: "inProgress", label: "In Progress", value: stats.inProgress, theme: "amber", icon: <IconClock className="w-4 h-4" /> },
    { key: "resolved", label: "Resolved", value: stats.resolved, theme: "emerald", icon: <IconCheck className="w-4 h-4" /> },
    { key: "closed", label: "Closed", value: stats.closed, theme: "slate", icon: <IconLock className="w-4 h-4" /> },
    { key: "breached", label: "SLA Breached", value: breachedCount, theme: "red", icon: <IconAlertTriangle className="w-4 h-4" /> },
  ];

  const statBarClass = {
    slate: "bg-slate-400",
    blue: "bg-blue-500",
    amber: "bg-amber-400",
    emerald: "bg-emerald-500",
    red: "bg-red-500",
  };
  const statIconClass = {
    slate: "bg-slate-100 text-slate-500",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
  };

  // Shared status <select> used in both the table row and the mobile card
  const StatusSelect = ({ t, theme }) => (
    <div className="relative inline-block">
      <select
        className={`appearance-none pl-3 pr-7 py-1.5 rounded-full text-xs font-medium border cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/20 ${theme.bg} ${theme.text} ${theme.border}`}
        value={t.status}
        onChange={(e) => handleStatusChange(t, e.target.value)}
      >
        <option>Open</option>
        <option>In Progress</option>
        <option>Resolved</option>
        <option>Closed</option>
      </select>
      <span className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${theme.accent}`} />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">

      {/* ================= TICKET DETAIL PANEL =================
          Mobile (< md): full-screen sheet that overlays everything.
          Desktop (>= md): fixed-width side panel next to the content. */}
      {selected && (
        <>
          {/* backdrop, mobile only */}
          <div
            className="md:hidden fixed inset-0 bg-slate-900/40 z-40"
            onClick={() => setSelected(null)}
          />
          <div className="fixed inset-0 z-50 md:static md:z-auto w-full md:w-[400px] bg-white md:border-l md:border-slate-200 flex flex-col shrink-0">
            <div className="flex justify-between items-center px-4 sm:px-5 py-4 border-b border-slate-100 shrink-0">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-400 tracking-wide uppercase">Ticket Preview</p>
                <h2 className="font-bold text-slate-900 leading-snug mt-0.5 truncate">{selected.title}</h2>
                <p className="text-xs font-mono text-slate-400 mt-0.5">{selected.ticketNumber}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition shrink-0 ml-2"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 flex flex-col gap-5 overflow-y-auto flex-1">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm shrink-0">
                  {initials(getReporterName(selected))}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate flex items-center gap-1.5">
                    <IconUser className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {getReporterName(selected)}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{getReporterSubtext(selected)}</p>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full mt-1 ${STATUS_THEME[selected.status]?.bg} ${STATUS_THEME[selected.status]?.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_THEME[selected.status]?.accent}`} />
                    {selected.status}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <IconClock className="w-3.5 h-3.5" /> SLA Tracking
                </p>
                <SlaDetailPanel ticket={selected} now={now} />
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Description</p>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-sm text-slate-700 leading-relaxed">
                  {selected.description || "No description provided."}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Opened</p>
                  <p className="text-xs font-medium text-slate-700">{formatDateTime(selected.createdAt)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Resolved</p>
                  <p className="text-xs font-medium text-slate-700">{formatDateTime(selected.resolvedAt)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Closed</p>
                  <p className="text-xs font-medium text-slate-700">{formatDateTime(selected.closedAt)}</p>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <IconNote className="w-3.5 h-3.5" /> Resolution Note
                </p>
                {selected.resolutionNote ? (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm p-3 rounded-lg leading-relaxed">
                    {selected.resolutionNote}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Not resolved yet</p>
                )}
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Attachments</p>
                {selected.files?.length > 0 ? (
                  <div className="space-y-1.5">
                    {selected.files.map((file, i) => (
                      <a
                        key={i}
                        href={file.url || file}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        <IconClip className="w-3.5 h-3.5" /> Download File {i + 1}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No attachments</p>
                )}
              </div>

              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Review</p>
                {selected.rating ? (
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                    {renderStars(selected.rating)}
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{selected.review}</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No review submitted</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ================= MAIN ================= */}
      <div className="flex-1 p-4 sm:p-6 md:p-8 max-w-[1400px] mx-auto w-full min-w-0">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Ticket Management</h1>
            <p className="text-sm text-slate-400 mt-0.5">Track, resolve, and review support requests</p>
          </div>

          <div className="relative w-full sm:w-72">
            <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full border border-slate-200 bg-white pl-9 pr-3 py-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition placeholder:text-slate-400"
              placeholder="Search tickets, users, status, SLA..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* STATS — 2 columns on phones so labels/numbers stay readable, not squeezed to 6-across */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {statCards.map((s) => (
            <div key={s.key} className="relative bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 overflow-hidden shadow-sm">
              <span className={`absolute left-0 top-0 bottom-0 w-1 ${statBarClass[s.theme]}`} />
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-slate-400">{s.label}</p>
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${statIconClass[s.theme]}`}>
                  {s.icon}
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-16 text-center text-sm text-slate-400 shadow-sm">
            Loading tickets…
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-16 text-center shadow-sm">
            <p className="text-sm font-medium text-slate-600">No tickets match your search</p>
            <p className="text-xs text-slate-400 mt-1">Try a different keyword or clear the search box</p>
          </div>
        ) : (
          <>
            {/* ================= MOBILE CARD LIST (< md) ================= */}
            <div className="md:hidden flex flex-col gap-3">
              {filtered.map((t) => {
                const theme = STATUS_THEME[t.status] || STATUS_THEME.Open;
                const reporterName = getReporterName(t);
                const reporterSubtext = getReporterSubtext(t);
                return (
                  <div key={t._id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 text-sm leading-snug break-words">{t.title}</p>
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">{t.ticketNumber}</p>
                      </div>
                      <span className={`shrink-0 px-2 py-1 text-[11px] font-medium rounded-full ${priorityColor(t.priority)}`}>
                        {t.priority}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs shrink-0">
                        {initials(reporterName)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 text-sm truncate">{reporterName}</p>
                        <p className="text-xs text-slate-400 truncate">{reporterSubtext}</p>
                      </div>
                    </div>

                    {t.companyId?.name && (
                      <p className="text-xs text-slate-500 mb-3">{t.companyId.name}</p>
                    )}

                    <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
                      <StatusSelect t={t} theme={theme} />
                      <SlaBadge ticket={t} now={now} />
                    </div>

                    {t.resolutionNote && (
                      <p className="text-xs text-slate-400 mb-3 flex items-start gap-1">
                        <IconNote className="w-3 h-3 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{t.resolutionNote}</span>
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-3">
                      <p>Opened: {formatDateTime(t.createdAt)}</p>
                      <p>Closed: {formatDateTime(t.closedAt || t.resolvedAt)}</p>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        {renderAttachments(t.files || t.attachments)}
                        {t.rating ? renderStars(t.rating) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelected(t)}
                          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition"
                        >
                          <IconEye className="w-3.5 h-3.5" />
                          View
                        </button>

                        {user?.role === "it_support" &&
                          !t.sla?.escalated &&
                          t.status !== "Closed" && (
                            <button
                              onClick={() => handleEscalate(t._id)}
                              className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap"
                            >
                              Escalate
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ================= DESKTOP TABLE (>= md) ================= */}
            <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-200">
                      <th className="p-3.5 text-left font-semibold">Ticket #</th>
                      <th className="p-3.5 text-left font-semibold">Ticket</th>
                      <th className="p-3.5 text-left font-semibold">Reported By</th>
                      <th className="p-3.5 text-left font-semibold">Company</th>
                      <th className="p-3.5 text-center font-semibold">Priority</th>
                      <th className="p-3.5 text-center font-semibold">Status</th>
                      <th className="p-3.5 text-center font-semibold">SLA</th>
                      <th className="p-3.5 text-center font-semibold">Opened</th>
                      <th className="p-3.5 text-center font-semibold">Closed</th>
                      <th className="p-3.5 text-center font-semibold">Files</th>
                      <th className="p-3.5 text-center font-semibold">Review</th>
                      <th className="p-3.5 text-center font-semibold sticky right-0 bg-slate-50 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((t) => {
                      const theme = STATUS_THEME[t.status] || STATUS_THEME.Open;
                      const reporterName = getReporterName(t);
                      const reporterSubtext = getReporterSubtext(t);
                      return (
                        <tr key={t._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3.5">
                            <p className="font-mono text-xs text-slate-500 whitespace-nowrap">{t.ticketNumber || "—"}</p>
                          </td>

                          <td className="p-3.5">
                            <p className="font-semibold text-slate-800 truncate max-w-[220px]">{t.title}</p>
                          </td>

                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs shrink-0">
                                {initials(reporterName)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-slate-800 truncate max-w-[180px]">{reporterName}</p>
                                <p className="text-xs text-slate-400 truncate max-w-[180px]">{reporterSubtext}</p>
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5 text-slate-600">{t.companyId?.name || "—"}</td>

                          <td className="p-3.5 text-center">
                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${priorityColor(t.priority)}`}>
                              {t.priority}
                            </span>
                          </td>

                          <td className="p-3.5 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <StatusSelect t={t} theme={theme} />
                              {t.resolutionNote && (
                                <p
                                  className="text-[10px] text-slate-400 max-w-[140px] truncate flex items-center gap-1"
                                  title={t.resolutionNote}
                                >
                                  <IconNote className="w-2.5 h-2.5 shrink-0" /> {t.resolutionNote}
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="p-3.5 text-center">
                            <SlaBadge ticket={t} now={now} />
                          </td>

                          <td className="p-3.5 text-center text-xs text-slate-500">{formatDateTime(t.createdAt)}</td>
                          <td className="p-3.5 text-center text-xs text-slate-500">{formatDateTime(t.closedAt || t.resolvedAt)}</td>
                          <td className="p-3.5 text-center">{renderAttachments(t.files || t.attachments)}</td>
                          <td className="p-3.5 text-center">
                            {t.rating ? renderStars(t.rating) : <span className="text-slate-300 text-xs">—</span>}
                          </td>

                          <td className="p-3.5 text-center sticky right-0 bg-white shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.05)]">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setSelected(t)}
                                className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition"
                              >
                                <IconEye className="w-3.5 h-3.5" />
                                View
                              </button>

                              {user?.role === "it_support" &&
                                !t.sla?.escalated &&
                                t.status !== "Closed" && (
                                  <button
                                    onClick={() => handleEscalate(t._id)}
                                    className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap"
                                  >
                                    Escalate
                                  </button>
                                )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* PAGINATION */}
        <div className="flex justify-center items-center gap-3 mt-5">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="w-8 h-8 flex items-center justify-center border border-slate-200 bg-white rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition"
          >
            <IconChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-medium text-slate-500 tabular-nums">Page {page} of {totalPages}</span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="w-8 h-8 flex items-center justify-center border border-slate-200 bg-white rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition"
          >
            <IconChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ================= RESOLVE / CLOSE MODAL ================= */}
      {statusModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-1">
              <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${statusModal.targetStatus === "Resolved" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
                }`}>
                {statusModal.targetStatus === "Resolved" ? <IconCheck className="w-4 h-4" /> : <IconLock className="w-4 h-4" />}
              </span>
              <h3 className="font-bold text-base text-slate-900">
                Mark as {statusModal.targetStatus}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4 ml-12 -mt-1 truncate">
              "{statusModal.ticket.title}"
            </p>

            <div className="ml-12 -mt-1 mb-4">
              <SlaBadge ticket={statusModal.ticket} now={now} />
            </div>

            <label className="text-xs font-medium text-slate-500 mb-1.5 block">
              Resolution note <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition resize-none placeholder:text-slate-400"
              rows={4}
              placeholder="e.g. Replaced faulty router, tested connection with user, confirmed working."
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              autoFocus
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              This note is saved with the ticket so anyone can see how it was handled.
            </p>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={cancelStatusModal}
                disabled={submitting}
                className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusModal}
                disabled={submitting}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:opacity-60"
              >
                {submitting ? "Saving…" : `Confirm ${statusModal.targetStatus}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
}