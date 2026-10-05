import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

/* ================= ICONS ================= */
const Icon = ({ children, className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {children}
  </svg>
);
const IconSearch = (p) => <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Icon>;
const IconClip = (p) => <Icon {...p}><path d="M21.44 11.05 12.25 20.24a5 5 0 1 1-7.07-7.07l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95L9.64 18.36a2 2 0 1 1-2.83-2.83l8.49-8.48" /></Icon>;
const IconEye = (p) => <Icon {...p}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" /><circle cx="12" cy="12" r="3" /></Icon>;
const IconX = (p) => <Icon {...p}><path d="M18 6 6 18M6 6l12 12" /></Icon>;
const IconChevronLeft = (p) => <Icon {...p}><path d="m15 18-6-6 6-6" /></Icon>;
const IconChevronRight = (p) => <Icon {...p}><path d="m9 18 6-6-6-6" /></Icon>;
const IconChevronDown = (p) => <Icon {...p}><path d="m6 9 6 6 6-6" /></Icon>;
const IconCheck = (p) => <Icon {...p}><path d="M20 6 9 17l-5-5" /></Icon>;
const IconLock = (p) => <Icon {...p}><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></Icon>;
const IconNote = (p) => <Icon {...p}><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" /><path d="M9 13h6M9 17h6" /></Icon>;
const IconClock = (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></Icon>;
const IconAlertTriangle = (p) => <Icon {...p}><path d="m10.29 3.86-8.18 14.18A2 2 0 0 0 4 21h16a2 2 0 0 0 1.89-2.96L13.71 3.86a2 2 0 0 0-3.42 0Z" /><path d="M12 9v4M12 17h.01" /></Icon>;
const IconZap = (p) => <Icon {...p}><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" /></Icon>;
const IconWrench = (p) => <Icon {...p}><path d="M14.7 6.3a4 4 0 0 0-5.6 5.6L2 19l3 3 7.1-7.1a4 4 0 0 0 5.6-5.6l-2.8 2.8-2-2 2.8-2.8Z" /></Icon>;
const IconTrash = (p) => <Icon {...p}><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /></Icon>;
const IconCalendar = (p) => <Icon {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Icon>;
const IconBuilding = (p) => <Icon {...p}><rect x="4" y="2" width="16" height="20" rx="1" /><path d="M9 22v-4h6v4M8 6h.01M8 10h.01M8 14h.01M16 6h.01M16 10h.01M16 14h.01" /></Icon>;
const IconBell = (p) => <Icon {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></Icon>;

/* ================= DESIGN TOKENS (Atlassian-style) ================= */
const BTN = "inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-[3px] text-sm font-medium whitespace-nowrap transition focus:outline-none focus:ring-2 focus:ring-[#4C9AFF] disabled:opacity-60 disabled:cursor-not-allowed";
const BTN_PRIMARY = `${BTN} bg-[#0C66E4] hover:bg-[#0055CC] text-white`;
const BTN_DANGER = `${BTN} bg-[#C9372C] hover:bg-[#AE2E24] text-white`;
const BTN_SUBTLE = `${BTN} bg-[#091E420F] hover:bg-[#091E4224] text-[#172B4D]`;
const ICON_BTN = "inline-flex items-center justify-center w-8 h-8 rounded-[3px] text-[#44546F] hover:bg-[#091E4214] focus:outline-none focus:ring-2 focus:ring-[#4C9AFF] transition";
const FIELD = "w-full border border-[#8590A2] bg-white rounded-[3px] px-2.5 text-sm text-[#172B4D] outline-none hover:bg-[#F7F8F9] focus:bg-white focus:ring-2 focus:ring-[#4C9AFF] placeholder:text-[#626F86]";
const LABEL = "block text-xs font-semibold text-[#44546F] mb-1";
const SECTION_TITLE = "text-xs font-semibold text-[#44546F] mb-2 flex items-center gap-1.5";

// Lozenge palette: [background, text]
const STATUS_LOZ = {
  Open: ["#DEEBFF", "#0747A6"],
  "In Progress": ["#FFF0B3", "#7F5F01"],
  Resolved: ["#DCFFF1", "#216E4E"],
  Closed: ["#DFE1E6", "#42526E"],
  Rejected: ["#FFEDEB", "#AE2E24"],
};

const SLA_LOZ = {
  ok: { bg: "#DCFFF1", fg: "#216E4E", bar: "#22A06B", border: "#BAF3DB" },
  warning: { bg: "#FFF7D6", fg: "#7F5F01", bar: "#F5CD47", border: "#F8E6A0" },
  breached: { bg: "#FFEDEB", fg: "#AE2E24", bar: "#E2483D", border: "#FFD5D2" },
  done: { bg: "#F1F2F4", fg: "#626F86", bar: "#8590A2", border: "#DCDFE4" },
};

const PRIORITY_COLOR = { Low: "#2684FF", Medium: "#E56910", High: "#E2483D", Critical: "#C9372C" };
const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Critical"];

const PriorityIcon = ({ p, className = "w-4 h-4" }) => {
  const color = PRIORITY_COLOR[p] || "#8590A2";
  const paths = {
    Critical: <path d="m6 11 6-6 6 6M6 18l6-6 6 6" />,
    High: <path d="m6 15 6-6 6 6" />,
    Medium: <path d="M5 9h14M5 15h14" />,
    Low: <path d="m6 9 6 6 6-6" />,
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"
      strokeLinejoin="round" className={className} aria-hidden="true">
      {paths[p] || <path d="M5 12h14" />}
    </svg>
  );
};

/* ================= DATE HELPERS ================= */
const formatDateTime = (date) =>
  date ? new Date(date).toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  }) : "—";

const formatDateOnly = (date) =>
  date ? new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—";

const formatTimeOnly = (date) =>
  date ? new Date(date).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }) : "";

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
  if (!due) return { level: "done", label: "No SLA", detail: "—" };
  const dueDate = new Date(due);

  if (achievedAt) {
    const achievedDate = new Date(achievedAt);
    if (breached || achievedDate > dueDate) {
      return { level: "breached", label: "Breached", detail: `${formatDuration(achievedDate - dueDate)} late` };
    }
    return { level: "ok", label: "Met", detail: `${formatDuration(dueDate - achievedDate)} to spare` };
  }

  const diff = dueDate - now;
  if (diff <= 0) {
    return { level: "breached", label: "Overdue", detail: `${formatDuration(diff)} over` };
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
  if (sla.status === "Breached") return { level: "breached", label: "SLA Breached" };
  if (sla.status === "Completed") return { level: "ok", label: "SLA Met" };

  const resolutionState = getSlaLegState({
    due: sla.resolutionDue, achievedAt: sla.resolvedAt, breached: sla.resolutionBreached, now,
  });
  if (resolutionState.level === "breached") return { level: "breached", label: "SLA Breached" };

  if (!sla.firstRespondedAt) {
    const responseState = getSlaLegState({
      due: sla.firstResponseDue, achievedAt: sla.firstRespondedAt, breached: sla.firstResponseBreached, now,
    });
    if (responseState.level === "breached") return { level: "breached", label: "Response overdue" };
    if (responseState.level === "warning") return { level: "warning", label: "Response due soon" };
  }

  if (resolutionState.level === "warning") return { level: "warning", label: "Resolution due soon" };
  return { level: "ok", label: "On track" };
};

// Active reminder = user nudged support at least once AND ticket is still In Progress.
const hasActiveReminder = (ticket) =>
  ticket.status === "In Progress" && (ticket.reminderCount || 0) > 0;

const getBreachLegInfo = (ticket, now) => {
  const sla = ticket.sla;
  if (!sla) return null;

  const resolutionState = getSlaLegState({
    due: sla.resolutionDue, achievedAt: sla.resolvedAt, breached: sla.resolutionBreached, now,
  });
  if (resolutionState.level === "breached") {
    return { leg: "resolution", reason: sla.breachReason || "" };
  }

  if (!sla.firstRespondedAt) {
    const responseState = getSlaLegState({
      due: sla.firstResponseDue, achievedAt: sla.firstRespondedAt, breached: sla.firstResponseBreached, now,
    });
    if (responseState.level === "breached") {
      return { leg: "response", reason: sla.firstResponseBreachReason || "" };
    }
  }
  return null;
};

/* ================= SLA UI ================= */
const SlaBadge = ({ ticket, now, onOpenReason }) => {
  const state = getOverallSlaState(ticket, now);
  const c = SLA_LOZ[state.level];
  const breachInfo = state.level === "breached" ? getBreachLegInfo(ticket, now) : null;
  const clickable = state.level === "breached" && onOpenReason && breachInfo;

  const pill = (
    <span
      className="inline-flex items-center gap-1 h-5 px-1.5 rounded-[3px] text-[11px] font-bold uppercase tracking-wide whitespace-nowrap"
      style={{ backgroundColor: c.bg, color: c.fg }}
    >
      {state.level === "breached" ? (
        <IconAlertTriangle className="w-3 h-3" />
      ) : (
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.bar }} />
      )}
      {state.label}
    </span>
  );

  if (!clickable) return pill;

  return (
    <button
      type="button"
      onClick={() => onOpenReason(ticket, breachInfo)}
      title={breachInfo.reason ? "Edit breach reason" : "Add breach reason"}
      className="inline-flex flex-col items-start gap-0.5 text-left focus:outline-none focus:ring-2 focus:ring-[#4C9AFF] rounded-[3px]"
    >
      {pill}
      <span className="text-[11px] text-[#0C66E4] hover:underline">
        {breachInfo.reason ? "Edit reason" : "Add reason"}
      </span>
    </button>
  );
};

const SlaLegRow = ({ icon, label, due, achievedAt, breached, achievedLabel, now, breachReason, leg, ticket, onOpenReason }) => {
  const state = getSlaLegState({ due, achievedAt, breached, now });
  const c = SLA_LOZ[state.level];
  const isBreached = state.level === "breached";

  let progressPct = 100;
  if (!achievedAt && due) {
    const remaining = new Date(due) - now;
    const totalGuess = 1000 * 60 * 60 * 24;
    progressPct = Math.min(100, Math.max(0, 100 - (remaining / totalGuess) * 100));
  }

  return (
    <div className="rounded-[3px] border p-3" style={{ backgroundColor: c.bg, borderColor: c.border }}>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: c.fg }}>
          {icon} {label}
        </p>
        <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: c.fg }}>{state.label}</span>
      </div>

      <div className="flex items-center justify-between text-xs text-[#44546F] mb-1.5">
        <span>
          Due {due ? new Date(due).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—"}
        </span>
        <span style={{ color: c.fg }}>{state.detail}</span>
      </div>

      {!achievedAt && due && (
        <div className="h-1.5 w-full rounded-full bg-white/70 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${progressPct}%`, backgroundColor: c.bar }} />
        </div>
      )}

      {achievedAt && (
        <p className="text-xs text-[#44546F] mt-1">
          {achievedLabel} {new Date(achievedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
        </p>
      )}

      {isBreached && (
        <div className="mt-2 pt-2 border-t border-[#FFD5D2]">
          <p className="text-xs font-semibold text-[#AE2E24] mb-0.5">Reason</p>
          {breachReason ? (
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs text-[#AE2E24] leading-relaxed">{breachReason}</p>
              {onOpenReason && ticket && (
                <button
                  onClick={() => onOpenReason(ticket, { leg, reason: breachReason })}
                  className="text-xs text-[#0C66E4] hover:underline shrink-0"
                >
                  Edit
                </button>
              )}
            </div>
          ) : onOpenReason && ticket ? (
            <button
              onClick={() => onOpenReason(ticket, { leg, reason: "" })}
              className="text-xs text-[#0C66E4] hover:underline"
            >
              Add reason
            </button>
          ) : (
            <p className="text-xs text-[#626F86]">No reason recorded</p>
          )}
        </div>
      )}
    </div>
  );
};

const SlaDetailPanel = ({ ticket, now, onOpenReason }) => {
  const sla = ticket.sla;
  if (!sla) return <p className="text-sm text-[#626F86]">No SLA policy on this ticket</p>;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs text-[#44546F]">
          <PriorityIcon p={sla.priority} className="w-3.5 h-3.5" /> {sla.priority || "—"} priority policy
        </span>
        <SlaBadge ticket={ticket} now={now} onOpenReason={onOpenReason} />
      </div>

      <SlaLegRow
        icon={<IconZap className="w-3.5 h-3.5" />}
        label="First response"
        due={sla.firstResponseDue}
        achievedAt={sla.firstRespondedAt}
        breached={sla.firstResponseBreached}
        breachReason={sla.firstResponseBreachReason}
        achievedLabel="Responded at"
        now={now} leg="response" ticket={ticket} onOpenReason={onOpenReason}
      />
      <SlaLegRow
        icon={<IconCheck className="w-3.5 h-3.5" />}
        label="Resolution"
        due={sla.resolutionDue}
        achievedAt={sla.resolvedAt}
        breached={sla.resolutionBreached}
        breachReason={sla.breachReason}
        achievedLabel="Resolved at"
        now={now} leg="resolution" ticket={ticket} onOpenReason={onOpenReason}
      />

      {sla.escalated && (
        <div className="rounded-[3px] border border-[#FCE4A6] bg-[#FFF7D6] p-2.5 flex items-center gap-2">
          <IconAlertTriangle className="w-3.5 h-3.5 text-[#B65C02] shrink-0" />
          <p className="text-xs text-[#7F5F01] font-medium">
            Escalated (level {sla.escalationLevel || 1})
            {sla.escalatedAt && ` on ${new Date(sla.escalatedAt).toLocaleDateString()}`}
          </p>
        </div>
      )}
    </div>
  );
};

/* ================= REPORTER HELPERS ================= */
const getReporterName = (ticket) => {
  if (ticket.userId?.name) return ticket.userId.name;
  if (ticket.employeeId?.name) return ticket.employeeId.name;
  if (ticket.assignedTo?.name) return ticket.assignedTo.name;
  const creatorLabel =
    ticket.createdByType === "super_admin" ? "Super Admin"
      : ticket.createdByType === "it_support" ? "IT Support"
        : ticket.createdByType === "company_admin" ? "Company Admin" : null;
  return creatorLabel || "Unknown";
};

const getReporterSubtext = (ticket) => {
  if (ticket.userId?.email) return ticket.userId.email;
  if (ticket.employeeId?.staffCode) return `Staff Code: ${ticket.employeeId.staffCode}`;
  if (ticket.assignedTo?.email) return ticket.assignedTo.email;
  if (ticket.createdByType) {
    const label = ticket.createdByType.replace("_", " ");
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  return "—";
};

/* ================= SMALL SHARED PIECES ================= */
const Avatar = ({ name, size = "w-8 h-8 text-xs" }) => (
  <span className={`${size} rounded-full bg-[#E9F2FF] text-[#0055CC] flex items-center justify-center font-semibold shrink-0`}>
    {name ? name.charAt(0).toUpperCase() : "?"}
  </span>
);

const Lozenge = ({ status, children }) => {
  const [bg, fg] = STATUS_LOZ[status] || STATUS_LOZ.Closed;
  return (
    <span
      className="inline-flex items-center h-5 px-1.5 rounded-[3px] text-[11px] font-bold uppercase tracking-wide whitespace-nowrap"
      style={{ backgroundColor: bg, color: fg }}
    >
      {children || status}
    </span>
  );
};

const Modal = ({ icon, iconTone = "bg-[#F1F2F4] text-[#44546F]", title, subtitle, children, footer, maxWidth = "max-w-md" }) => (
  <div className="fixed inset-0 bg-[#091E42]/50 flex items-center justify-center z-[60] p-4">
    <div role="dialog" aria-modal="true" className={`bg-white rounded-[3px] shadow-[0_8px_12px_#091E4226,0_0_1px_#091E424F] w-full ${maxWidth} max-h-[90vh] flex flex-col`}>
      <div className="flex items-start gap-3 px-6 pt-5 pb-3">
        <span className={`w-8 h-8 rounded-[3px] flex items-center justify-center shrink-0 ${iconTone}`}>{icon}</span>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-[#172B4D]">{title}</h3>
          {subtitle && <p className="text-xs text-[#626F86] mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      <div className="px-6 py-2 overflow-y-auto">{children}</div>
      <div className="flex justify-end gap-2 px-6 py-4">{footer}</div>
    </div>
  </div>
);

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  // "Open" | "In Progress" | "Resolved" | "Closed" | "Rejected" | "breached" | "reminded" | null
  const [statusFilter, setStatusFilter] = useState(null);
  const [loading, setLoading] = useState(false);

  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [openedFrom, setOpenedFrom] = useState("");
  const [openedTo, setOpenedTo] = useState("");
  const [closedFrom, setClosedFrom] = useState("");
  const [closedTo, setClosedTo] = useState("");

  const [statusModal, setStatusModal] = useState(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [breachReason, setBreachReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [resolutionType, setResolutionType] = useState("Internal");
  const [vendorName, setVendorName] = useState("");
  const [vendorComplaint, setVendorComplaint] = useState("");
  const [vendorRepairDate, setVendorRepairDate] = useState("");
  const [vendorCost, setVendorCost] = useState("");
  const [vendorReceipt, setVendorReceipt] = useState(null);

  const [rejectionReason, setRejectionReason] = useState("");

  const [breachModal, setBreachModal] = useState(null);
  const [breachModalText, setBreachModalText] = useState("");
  const [breachSubmitting, setBreachSubmitting] = useState(false);

  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [priorityUpdatingId, setPriorityUpdatingId] = useState(null);

  const [companyFilter, setCompanyFilter] = useState("All");
  const [companies, setCompanies] = useState([]);

  const user = JSON.parse(localStorage.getItem("user"));
  const isSuperAdmin = user?.role === "super_admin";
  const canEditPriority = user?.role === "super_admin" || user?.role === "it_support";
  const [now, setNow] = useState(() => new Date());

  const initialStats = { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 };
  const [stats, setStats] = useState(initialStats);

  useEffect(() => {
    if (isSuperAdmin) loadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyFilter]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Lock background scroll only while the MOBILE full-screen detail sheet is open.
  useEffect(() => {
    if (!selected) return;
    const mql = window.matchMedia("(max-width: 767px)");
    const applyLock = (isMobile) => {
      document.body.style.overflow = isMobile ? "hidden" : "";
    };
    applyLock(mql.matches);
    const handleChange = (e) => applyLock(e.matches);
    mql.addEventListener("change", handleChange);
    return () => {
      document.body.style.overflow = "";
      mql.removeEventListener("change", handleChange);
    };
  }, [selected]);

  const loadCompanies = async () => {
    try {
      const res = await api.get("/companies");
      setCompanies(res.data.companies || []);
    } catch (err) {
      console.error(err);
    }
  };

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/tickets`, {
        params: {
          page: 1,
          limit: 1000,
          ...(isSuperAdmin && companyFilter && companyFilter !== "All" ? { companyId: companyFilter } : {}),
        },
      });
      setTickets(res?.data?.data || []);
    } catch {
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await api.get("/tickets/stats", {
        params: isSuperAdmin && companyFilter && companyFilter !== "All" ? { companyId: companyFilter } : {},
      });
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
    if (targetStatus === "Resolved" || targetStatus === "Closed" || targetStatus === "Rejected") {
      if (targetStatus === "Rejected" && !isSuperAdmin) {
        toast.error("Only Super Admin can reject a ticket");
        return;
      }

      setResolutionNote(ticket.resolutionNote || "");
      setBreachReason(ticket.sla?.breachReason || "");
      setRejectionReason(ticket.rejectionReason || "");

      setResolutionType(ticket.resolutionType || "Internal");
      setVendorName(ticket.vendorDetails?.vendorName || "");
      setVendorComplaint(ticket.vendorDetails?.complaintDescription || "");
      setVendorRepairDate(
        ticket.vendorDetails?.repairDate
          ? new Date(ticket.vendorDetails.repairDate).toISOString().slice(0, 10)
          : ""
      );
      setVendorCost(
        ticket.vendorDetails?.cost !== null && ticket.vendorDetails?.cost !== undefined
          ? String(ticket.vendorDetails.cost)
          : ""
      );
      setVendorReceipt(null);

      setStatusModal({ ticket, targetStatus });
      return;
    }
    updateStatus(ticket._id, targetStatus);
  };

  const handleEscalate = async (id) => {
    try {
      await api.put(`/tickets/${id}/escalate`, { reason: "Escalated by IT Support" });
      toast.success("Ticket escalated successfully");
      load();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to escalate");
    }
  };

  const handlePriorityChange = async (ticket, newPriority) => {
    if (newPriority === ticket.priority) return;

    setTickets((prev) => prev.map((t) => (t._id === ticket._id ? { ...t, priority: newPriority } : t)));
    setPriorityUpdatingId(ticket._id);

    try {
      const res = await api.put(`/tickets/${ticket._id}/priority`, { priority: newPriority });
      const updated = res?.data?.data;

      if (updated) {
        setTickets((prev) => prev.map((t) => (t._id === ticket._id ? { ...t, ...updated } : t)));
        setSelected((prevSelected) =>
          prevSelected && prevSelected._id === ticket._id ? { ...prevSelected, ...updated } : prevSelected
        );
      }
      toast.success(`Priority updated to ${newPriority}`);
    } catch (err) {
      setTickets((prev) => prev.map((t) => (t._id === ticket._id ? { ...t, priority: ticket.priority } : t)));
      toast.error(err.response?.data?.message || "Failed to update priority");
    } finally {
      setPriorityUpdatingId(null);
    }
  };

  const updateStatus = async (id, status, extra = {}) => {
    try {
      let payload;
      let config = {};

      if (extra instanceof FormData) {
        payload = extra;
        payload.append("status", status);
        if (status === "Resolved") payload.append("resolvedAt", new Date().toISOString());
        if (status === "Closed") payload.append("closedAt", new Date().toISOString());
        config.headers = { "Content-Type": "multipart/form-data" };
      } else {
        payload = { status, ...extra };
        if (status === "Resolved") payload.resolvedAt = new Date().toISOString();
        if (status === "Closed") payload.closedAt = new Date().toISOString();
      }

      await api.put(`/tickets/${id}`, payload, config);
      toast.success(`Ticket marked as ${status}`);
      load();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  const isModalTicketBreached =
    statusModal && getOverallSlaState(statusModal.ticket, now).level === "breached";
  const isRejectModal = statusModal?.targetStatus === "Rejected";

  const resetStatusModalFields = () => {
    setResolutionNote("");
    setBreachReason("");
    setRejectionReason("");
    setResolutionType("Internal");
    setVendorName("");
    setVendorComplaint("");
    setVendorRepairDate("");
    setVendorCost("");
    setVendorReceipt(null);
  };

  const confirmStatusModal = async () => {
    if (isRejectModal) {
      if (!rejectionReason.trim()) {
        return toast.error("Please provide a reason for rejecting this ticket");
      }
      setSubmitting(true);
      const formData = new FormData();
      formData.append("rejectionReason", rejectionReason.trim());
      await updateStatus(statusModal.ticket._id, statusModal.targetStatus, formData);
      setSubmitting(false);
      setStatusModal(null);
      resetStatusModalFields();
      return;
    }

    if (!resolutionNote.trim()) {
      return toast.error("Please add a resolution note before continuing");
    }
    if (isModalTicketBreached && !breachReason.trim()) {
      return toast.error("Please explain why the SLA was breached");
    }
    if (resolutionType === "External Vendor") {
      if (!vendorName.trim()) return toast.error("Vendor name is required");
      if (!vendorComplaint.trim()) return toast.error("Please describe the complaint / repair");
      if (!vendorRepairDate) return toast.error("Repair date is required");
      if (vendorCost === "" || isNaN(Number(vendorCost)) || Number(vendorCost) < 0) {
        return toast.error("Please enter a valid repair cost");
      }
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append("resolutionNote", resolutionNote.trim());
    formData.append("resolutionType", resolutionType);

    if (isModalTicketBreached) formData.append("slaBreachReason", breachReason.trim());

    if (resolutionType === "External Vendor") {
      formData.append("vendorName", vendorName.trim());
      formData.append("complaintDescription", vendorComplaint.trim());
      formData.append("repairDate", vendorRepairDate);
      formData.append("cost", vendorCost);
      if (vendorReceipt) formData.append("receipt", vendorReceipt);
    }

    await updateStatus(statusModal.ticket._id, statusModal.targetStatus, formData);

    setSubmitting(false);
    setStatusModal(null);
    resetStatusModalFields();
  };

  const cancelStatusModal = () => {
    setStatusModal(null);
    resetStatusModalFields();
  };

  const openBreachModal = (ticket, breachInfo) => {
    setBreachModal({ ticket, leg: breachInfo.leg });
    setBreachModalText(breachInfo.reason || "");
  };

  const cancelBreachModal = () => {
    setBreachModal(null);
    setBreachModalText("");
  };

  const saveBreachReason = async () => {
    if (!breachModalText.trim()) return toast.error("Please enter a reason");
    try {
      setBreachSubmitting(true);
      await api.put(`/tickets/${breachModal.ticket._id}/sla-breach-reason`, {
        reason: breachModalText.trim(),
        leg: breachModal.leg,
      });
      toast.success("Breach reason saved");
      cancelBreachModal();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save reason");
    } finally {
      setBreachSubmitting(false);
    }
  };

  const handleDeleteClick = (ticket) => setDeleteModal(ticket);

  const cancelDeleteModal = () => {
    if (deleting) return;
    setDeleteModal(null);
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    try {
      setDeleting(true);
      await api.delete(`/tickets/${deleteModal._id}`);
      toast.success("Ticket deleted");
      if (selected?._id === deleteModal._id) setSelected(null);
      setDeleteModal(null);
      load();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete ticket");
    } finally {
      setDeleting(false);
    }
  };

  /* ---------- date-range filter helpers ---------- */
  const startOfDay = (ymd) => new Date(`${ymd}T00:00:00`);
  const endOfDay = (ymd) => new Date(`${ymd}T23:59:59.999`);

  const isWithinDateRange = (value, fromStr, toStr) => {
    if (!fromStr && !toStr) return true;
    if (!value) return false;
    const d = new Date(value);
    if (fromStr && d < startOfDay(fromStr)) return false;
    if (toStr && d > endOfDay(toStr)) return false;
    return true;
  };

  const toISODate = (d) => d.toISOString().slice(0, 10);

  const applyDatePreset = (section, preset) => {
    const today = new Date();
    const from = new Date(today);
    if (preset === "week") from.setDate(today.getDate() - 6);
    else if (preset === "month") from.setDate(today.getDate() - 29);

    const fromStr = toISODate(from);
    const toStr = toISODate(today);

    if (section === "opened") {
      setOpenedFrom(fromStr);
      setOpenedTo(toStr);
    } else {
      setClosedFrom(fromStr);
      setClosedTo(toStr);
    }
  };

  const clearDateSection = (section) => {
    if (section === "opened") {
      setOpenedFrom("");
      setOpenedTo("");
    } else {
      setClosedFrom("");
      setClosedTo("");
    }
  };

  const clearAllDateFilters = () => {
    setOpenedFrom("");
    setOpenedTo("");
    setClosedFrom("");
    setClosedTo("");
  };

  const activeDateFilterCount = (openedFrom || openedTo ? 1 : 0) + (closedFrom || closedTo ? 1 : 0);

  const formatDateRangeLabel = (fromStr, toStr) => {
    if (!fromStr && !toStr) return "";
    if (fromStr && toStr && fromStr === toStr) return formatDateOnly(fromStr);
    if (fromStr && toStr) return `${formatDateOnly(fromStr)} – ${formatDateOnly(toStr)}`;
    if (fromStr) return `From ${formatDateOnly(fromStr)}`;
    return `Until ${formatDateOnly(toStr)}`;
  };

  /* ---------- filtering / sorting / paging ---------- */
  const filtered = tickets
    .filter((t) => {
      const s = search.toLowerCase();
      const slaState = getOverallSlaState(t, now).label.toLowerCase();

      const matchesSearch =
        t.title?.toLowerCase().includes(s) ||
        t.ticketNumber?.toLowerCase().includes(s) ||
        getReporterName(t).toLowerCase().includes(s) ||
        t.userId?.email?.toLowerCase().includes(s) ||
        t.priority?.toLowerCase().includes(s) ||
        t.status?.toLowerCase().includes(s) ||
        slaState.includes(s);

      const matchesFilter =
        !statusFilter ||
        (statusFilter === "breached"
          ? getOverallSlaState(t, now).level === "breached"
          : statusFilter === "reminded"
            ? hasActiveReminder(t)
            : t.status === statusFilter);

      const matchesOpenedDate = isWithinDateRange(t.createdAt, openedFrom, openedTo);
      const matchesClosedDate = isWithinDateRange(t.closedAt || t.resolvedAt, closedFrom, closedTo);

      return matchesSearch && matchesFilter && matchesOpenedDate && matchesClosedDate;
    })
    // Tickets with an active user reminder float to the top, most recent first.
    .sort((a, b) => {
      const ra = hasActiveReminder(a);
      const rb = hasActiveReminder(b);
      if (ra !== rb) return ra ? -1 : 1;
      if (ra && rb) return new Date(b.lastReminderAt || 0) - new Date(a.lastReminderAt || 0);
      return 0;
    });

  const breachedCount = tickets.filter((t) => getOverallSlaState(t, now).level === "breached").length;
  const remindedCount = tickets.filter(hasActiveReminder).length;

  const PAGE_SIZE = 10;
  const totalFilteredPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageTickets = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, filtered.length);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, openedFrom, openedTo, closedFrom, closedTo, companyFilter]);

  useEffect(() => {
    if (page > totalFilteredPages) setPage(totalFilteredPages);
  }, [totalFilteredPages]); // eslint-disable-line react-hooks/exhaustive-deps

  const renderStars = (rating) => (
    <span className="text-[#F5CD47] text-sm tracking-tight">
      {"★".repeat(rating || 0)}
      <span className="text-[#DCDFE4]">{"★".repeat(5 - (rating || 0))}</span>
    </span>
  );

  const renderAttachments = (files = []) => {
    if (!files || files.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-2">
        {files.map((file, i) => (
          <a
            key={i}
            href={file.url || file}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[#0C66E4] hover:underline text-xs font-medium"
          >
            <IconClip className="w-3 h-3" /> File {i + 1}
          </a>
        ))}
      </div>
    );
  };

  /* ---------- stat tiles (also act as filters) ---------- */
  const statCards = [
    { key: "total", label: "All tickets", value: stats.total, dot: "#8590A2", filterKey: null },
    { key: "open", label: "Open", value: stats.open, dot: "#4C9AFF", filterKey: "Open" },
    { key: "inProgress", label: "In progress", value: stats.inProgress, dot: "#F5CD47", filterKey: "In Progress" },
    { key: "reminded", label: "Reminders", value: remindedCount, dot: "#E56910", filterKey: "reminded" },
    { key: "resolved", label: "Resolved", value: stats.resolved, dot: "#4BCE97", filterKey: "Resolved" },
    { key: "closed", label: "Closed", value: stats.closed, dot: "#626F86", filterKey: "Closed" },
    { key: "breached", label: "SLA breached", value: breachedCount, dot: "#C9372C", filterKey: "breached" },
  ];

  /* ---------- shared render helpers (plain functions, so selects keep focus across re-renders) ---------- */
  const renderStatusSelect = (t) => {
    const [bg, fg] = STATUS_LOZ[t.status] || STATUS_LOZ.Open;
    return (
      <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
        <select
          aria-label="Change status"
          className="appearance-none h-6 pl-1.5 pr-5 rounded-[3px] text-[11px] font-bold uppercase tracking-wide cursor-pointer outline-none focus:ring-2 focus:ring-[#4C9AFF] hover:brightness-95"
          style={{ backgroundColor: bg, color: fg }}
          value={t.status}
          onChange={(e) => handleStatusChange(t, e.target.value)}
        >
          <option>Open</option>
          <option>In Progress</option>
          <option>Resolved</option>
          <option>Closed</option>
          {isSuperAdmin && <option>Rejected</option>}
        </select>
        <IconChevronDown className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3" style={{ color: fg }} />
      </div>
    );
  };

  const renderReminderBadge = (t) => {
    if (!hasActiveReminder(t)) return null;
    const count = t.reminderCount || 0;
    return (
      <span
        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#B65C02]"
        title={`Last reminder: ${formatDateTime(t.lastReminderAt)}`}
      >
        <IconBell className="w-3 h-3" />
        {count} reminder{count > 1 ? "s" : ""}
      </span>
    );
  };

  const renderPriority = (t) => {
    const isSaving = priorityUpdatingId === t._id;
    if (!canEditPriority) {
      return (
        <span className="inline-flex items-center gap-1.5 text-sm text-[#172B4D]">
          <PriorityIcon p={t.priority} /> {t.priority}
        </span>
      );
    }
    return (
      <div
        className="relative inline-flex items-center rounded-[3px] hover:bg-[#091E4214] focus-within:ring-2 focus-within:ring-[#4C9AFF]"
        onClick={(e) => e.stopPropagation()}
        title="Change priority"
      >
        <PriorityIcon p={t.priority} className="w-4 h-4 absolute left-1.5 pointer-events-none" />
        <select
          aria-label="Change priority"
          disabled={isSaving}
          className="appearance-none bg-transparent h-7 pl-7 pr-5 text-sm text-[#172B4D] cursor-pointer outline-none disabled:opacity-60 disabled:cursor-wait"
          value={t.priority}
          onChange={(e) => handlePriorityChange(t, e.target.value)}
        >
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <IconChevronDown className="pointer-events-none absolute right-1 w-3 h-3 text-[#626F86]" />
      </div>
    );
  };

  const renderActions = (t) => (
    <div className="flex items-center justify-end gap-1">
      {user?.role === "it_support" && !t.sla?.escalated && t.status !== "Closed" && (
        <button onClick={() => handleEscalate(t._id)} className="h-7 px-2 rounded-[3px] text-xs font-medium bg-[#C9372C] hover:bg-[#AE2E24] text-white">
          Escalate
        </button>
      )}
      <button onClick={() => setSelected(t)} title="View ticket" aria-label="View ticket" className={ICON_BTN}>
        <IconEye className="w-4 h-4" />
      </button>
      {isSuperAdmin && (
        <button onClick={() => handleDeleteClick(t)} title="Delete ticket" aria-label="Delete ticket" className={`${ICON_BTN} hover:!bg-[#FFEDEB] hover:!text-[#C9372C]`}>
          <IconTrash className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  const hasActiveFilters = statusFilter || activeDateFilterCount > 0 || (isSuperAdmin && companyFilter !== "All");

  const chip = "inline-flex items-center gap-1 h-6 pl-2 pr-1 rounded-[3px] bg-[#091E420F] text-xs font-medium text-[#172B4D]";
  const chipX = "w-4 h-4 inline-flex items-center justify-center rounded-[3px] text-[#44546F] hover:bg-[#091E4224]";

  const dateSection = (title, section, from, setFrom, to, setTo) => (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs font-semibold text-[#44546F]">{title}</p>
        {(from || to) && (
          <button onClick={() => clearDateSection(section)} className="text-xs text-[#0C66E4] hover:underline">Clear</button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <input type="date" aria-label={`${title} from`} value={from} onChange={(e) => setFrom(e.target.value)} className={`${FIELD} h-8 text-xs`} />
        <input type="date" aria-label={`${title} to`} value={to} onChange={(e) => setTo(e.target.value)} className={`${FIELD} h-8 text-xs`} />
      </div>
      <div className="flex gap-1.5">
        {[["today", "Today"], ["week", "7 days"], ["month", "30 days"]].map(([key, label]) => (
          <button key={key} onClick={() => applyDatePreset(section, key)} className="h-6 px-2 rounded-[3px] text-xs font-medium bg-[#091E420F] hover:bg-[#091E4224] text-[#172B4D]">
            {label}
          </button>
        ))}
      </div>
    </div>
  );

  const detailRow = (label, value) => (
    <div className="grid grid-cols-[110px_1fr] gap-2 items-center min-h-[32px] text-sm">
      <dt className="text-[#626F86] text-xs font-semibold">{label}</dt>
      <dd className="text-[#172B4D] min-w-0">{value}</dd>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F8F9] flex" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, 'Helvetica Neue', sans-serif" }}>

      {/* ================= TICKET DETAIL PANEL ================= */}
      {selected && (
        <>
          <div className="md:hidden fixed inset-0 bg-[#091E42]/50 z-40" onClick={() => setSelected(null)} />
          <aside className="fixed inset-0 z-50 md:static md:z-auto w-full md:w-[440px] bg-white md:border-l border-[#DCDFE4] flex flex-col shrink-0 order-2">
            <div className="flex justify-between items-start gap-3 px-5 pt-4 pb-3 border-b border-[#EBECF0] shrink-0">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#0C66E4]">{selected.ticketNumber}</p>
                <h2 className="text-lg font-medium text-[#172B4D] leading-snug mt-0.5 break-words">{selected.title}</h2>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                {isSuperAdmin && (
                  <button onClick={() => handleDeleteClick(selected)} title="Delete ticket" aria-label="Delete ticket" className={`${ICON_BTN} hover:!bg-[#FFEDEB] hover:!text-[#C9372C]`}>
                    <IconTrash className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => setSelected(null)} aria-label="Close" className={ICON_BTN}>
                  <IconX className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 flex flex-col gap-6 overflow-y-auto flex-1">
              {/* Description */}
              <div>
                <p className={SECTION_TITLE}>Description</p>
                <div className="text-sm text-[#172B4D] leading-relaxed whitespace-pre-wrap">
                  {selected.description || <span className="text-[#626F86]">No description provided.</span>}
                </div>
              </div>

              {/* Reminder banner */}
              {(selected.reminderCount || 0) > 0 && (
                <div className={`rounded-[3px] border p-3 flex items-start gap-2.5 ${hasActiveReminder(selected) ? "bg-[#FFF7D6] border-[#F8E6A0]" : "bg-[#F7F8F9] border-[#DCDFE4]"}`}>
                  <IconBell className={`w-4 h-4 shrink-0 mt-0.5 ${hasActiveReminder(selected) ? "text-[#B65C02]" : "text-[#626F86]"}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#172B4D]">
                      User sent {selected.reminderCount} reminder{selected.reminderCount > 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-[#44546F] mt-0.5">Last reminder: {formatDateTime(selected.lastReminderAt)}</p>
                  </div>
                </div>
              )}

              {/* Details */}
              <div>
                <p className={SECTION_TITLE}>Details</p>
                <dl className="border border-[#DCDFE4] rounded-[3px] px-3 py-1 divide-y divide-[#EBECF0]">
                  {detailRow("Status", renderStatusSelect(selected))}
                  {detailRow("Priority", renderPriority(selected))}
                  {detailRow("Reporter", (
                    <div className="flex items-center gap-2 py-1">
                      <Avatar name={getReporterName(selected)} size="w-6 h-6 text-[11px]" />
                      <div className="min-w-0">
                        <p className="text-sm truncate">{getReporterName(selected)}</p>
                        <p className="text-xs text-[#626F86] truncate">{getReporterSubtext(selected)}</p>
                      </div>
                    </div>
                  ))}
                  {detailRow("Company", selected.companyId?.name || "—")}
                  {detailRow("Created", formatDateTime(selected.createdAt))}
                  {detailRow("Resolved", formatDateTime(selected.resolvedAt))}
                  {detailRow("Closed", formatDateTime(selected.closedAt))}
                </dl>
              </div>

              {/* SLA */}
              <div>
                <p className={SECTION_TITLE}><IconClock className="w-3.5 h-3.5" /> SLA tracking</p>
                <SlaDetailPanel ticket={selected} now={now} onOpenReason={openBreachModal} />
              </div>

              {/* Resolution note */}
              <div>
                <p className={SECTION_TITLE}><IconNote className="w-3.5 h-3.5" /> Resolution note</p>
                {selected.resolutionNote ? (
                  <div className="bg-[#DCFFF1] border border-[#BAF3DB] text-[#216E4E] text-sm p-3 rounded-[3px] leading-relaxed">
                    {selected.resolutionNote}
                  </div>
                ) : (
                  <p className="text-sm text-[#626F86]">Not resolved yet</p>
                )}
              </div>

              {/* Rejection */}
              {selected.status === "Rejected" && selected.rejectionReason && (
                <div>
                  <p className={SECTION_TITLE}><IconX className="w-3.5 h-3.5" /> Rejection reason</p>
                  <div className="bg-[#FFEDEB] border border-[#FFD5D2] text-[#AE2E24] text-sm p-3 rounded-[3px] leading-relaxed">
                    {selected.rejectionReason}
                  </div>
                  {selected.rejectedAt && (
                    <p className="text-xs text-[#626F86] mt-1.5">Rejected on {formatDateTime(selected.rejectedAt)}</p>
                  )}
                </div>
              )}

              {/* Vendor */}
              {selected.resolutionType && (
                <div>
                  <p className={SECTION_TITLE}><IconWrench className="w-3.5 h-3.5" /> Resolution type</p>
                  <span
                    className="inline-flex items-center h-5 px-1.5 rounded-[3px] text-[11px] font-bold uppercase tracking-wide"
                    style={selected.resolutionType === "External Vendor"
                      ? { backgroundColor: "#F8EEFE", color: "#5E4DB2" }
                      : { backgroundColor: "#DFE1E6", color: "#42526E" }}
                  >
                    {selected.resolutionType}
                  </span>

                  {selected.resolutionType === "External Vendor" && selected.vendorDetails && (
                    <dl className="mt-2 border border-[#DCDFE4] rounded-[3px] px-3 py-1 divide-y divide-[#EBECF0]">
                      {detailRow("Vendor", selected.vendorDetails.vendorName || "—")}
                      {detailRow("Repair date", formatDateOnly(selected.vendorDetails.repairDate))}
                      {detailRow("Cost", selected.vendorDetails.cost !== null && selected.vendorDetails.cost !== undefined ? selected.vendorDetails.cost : "—")}
                      {detailRow("Details", <span className="py-1.5 block">{selected.vendorDetails.complaintDescription || "—"}</span>)}
                      {detailRow("Receipt", selected.vendorDetails.receiptUrl ? (
                        <a href={selected.vendorDetails.receiptUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[#0C66E4] hover:underline text-sm font-medium">
                          <IconClip className="w-3.5 h-3.5" /> View receipt
                        </a>
                      ) : <span className="text-[#626F86]">None uploaded</span>)}
                    </dl>
                  )}
                </div>
              )}

              {/* Attachments */}
              <div>
                <p className={SECTION_TITLE}><IconClip className="w-3.5 h-3.5" /> Attachments</p>
                {selected.files?.length > 0 ? (
                  <div className="space-y-1.5">
                    {selected.files.map((file, i) => (
                      <a key={i} href={file.url || file} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[#0C66E4] hover:underline text-sm font-medium">
                        <IconClip className="w-3.5 h-3.5" /> Download file {i + 1}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#626F86]">No attachments</p>
                )}
              </div>

              {/* Review */}
              <div>
                <p className={SECTION_TITLE}>Review</p>
                {selected.rating ? (
                  <div className="border border-[#DCDFE4] rounded-[3px] p-3">
                    {renderStars(selected.rating)}
                    <p className="text-sm text-[#44546F] mt-1.5 leading-relaxed">{selected.review}</p>
                  </div>
                ) : (
                  <p className="text-sm text-[#626F86]">No review submitted</p>
                )}
              </div>
            </div>
          </aside>
        </>
      )}

      {/* ================= MAIN ================= */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1500px] mx-auto w-full min-w-0 order-1">

        {/* TITLE */}
        <nav className="text-xs text-[#626F86] mb-2">Service desk <span className="mx-1">/</span> Queues</nav>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-4">
          <div>
            <h1 className="text-2xl font-medium text-[#172B4D]">Tickets</h1>
            <p className="text-sm text-[#626F86] mt-1">Track, resolve and review support requests</p>
          </div>
        </div>

        {/* SUMMARY / QUICK FILTERS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-px bg-[#DCDFE4] border border-[#DCDFE4] rounded-[3px] overflow-hidden mb-4">
          {statCards.map((s) => {
            const isActive = s.filterKey === null ? statusFilter === null : statusFilter === s.filterKey;
            return (
              <button
                key={s.key}
                type="button"
                aria-pressed={isActive}
                onClick={() => setStatusFilter(isActive && s.filterKey !== null ? null : s.filterKey)}
                className={`text-left px-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#4C9AFF] ${isActive ? "bg-[#E9F2FF] shadow-[inset_0_-2px_0_#0C66E4]" : "bg-white hover:bg-[#F7F8F9]"}`}
              >
                <span className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.dot }} />
                  <span className={`text-xs font-medium truncate ${isActive ? "text-[#0C66E4]" : "text-[#626F86]"}`}>{s.label}</span>
                </span>
                <span className="text-2xl font-semibold text-[#172B4D] tabular-nums">{s.value}</span>
              </button>
            );
          })}
        </div>

        {/* TOOLBAR */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="relative w-full sm:w-80">
            <IconSearch className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#626F86] pointer-events-none" />
            <input
              className={`${FIELD} h-8 pl-8`}
              placeholder="Search tickets, users, status, SLA"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {isSuperAdmin && (
            <div className="relative w-full sm:w-56">
              <IconBuilding className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#626F86] pointer-events-none" />
              <select
                aria-label="Company"
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className={`${FIELD} h-8 pl-8 truncate cursor-pointer`}
              >
                <option value="All">All companies</option>
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setDateFilterOpen((v) => !v)}
              aria-expanded={dateFilterOpen}
              className={`${BTN} ${activeDateFilterCount > 0 ? "bg-[#E9F2FF] text-[#0C66E4] hover:bg-[#CFE1FD]" : "bg-[#091E420F] hover:bg-[#091E4224] text-[#172B4D]"}`}
            >
              <IconCalendar className="w-4 h-4" />
              Date
              {activeDateFilterCount > 0 && (
                <span className="min-w-[16px] h-4 px-1 rounded-full bg-[#0C66E4] text-white text-[10px] font-bold flex items-center justify-center">
                  {activeDateFilterCount}
                </span>
              )}
              <IconChevronDown className="w-3.5 h-3.5" />
            </button>

            {dateFilterOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDateFilterOpen(false)} />
                <div className="absolute left-0 mt-1 w-[300px] bg-white rounded-[3px] shadow-[0_8px_12px_#091E4226,0_0_1px_#091E424F] z-50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-[#172B4D]">Filter by date</p>
                    {activeDateFilterCount > 0 && (
                      <button onClick={clearAllDateFilters} className="text-xs text-[#0C66E4] hover:underline">Clear all</button>
                    )}
                  </div>
                  {dateSection("Opened", "opened", openedFrom, setOpenedFrom, openedTo, setOpenedTo)}
                  {dateSection("Closed", "closed", closedFrom, setClosedFrom, closedTo, setClosedTo)}
                  <button onClick={() => setDateFilterOpen(false)} className={`${BTN_PRIMARY} w-full`}>Apply</button>
                </div>
              </>
            )}
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5">
              {isSuperAdmin && companyFilter !== "All" && (
                <span className={chip}>
                  {companies.find((c) => c._id === companyFilter)?.name || "Company"}
                  <button onClick={() => setCompanyFilter("All")} aria-label="Remove company filter" className={chipX}><IconX className="w-3 h-3" /></button>
                </span>
              )}
              {statusFilter && (
                <span className={chip}>
                  {statusFilter === "breached" ? "SLA breached" : statusFilter === "reminded" ? "User reminders" : statusFilter}
                  <button onClick={() => setStatusFilter(null)} aria-label="Remove status filter" className={chipX}><IconX className="w-3 h-3" /></button>
                </span>
              )}
              {(openedFrom || openedTo) && (
                <span className={chip}>
                  Opened: {formatDateRangeLabel(openedFrom, openedTo)}
                  <button onClick={() => clearDateSection("opened")} aria-label="Remove opened filter" className={chipX}><IconX className="w-3 h-3" /></button>
                </span>
              )}
              {(closedFrom || closedTo) && (
                <span className={chip}>
                  Closed: {formatDateRangeLabel(closedFrom, closedTo)}
                  <button onClick={() => clearDateSection("closed")} aria-label="Remove closed filter" className={chipX}><IconX className="w-3 h-3" /></button>
                </span>
              )}
              <button
                onClick={() => { setStatusFilter(null); clearAllDateFilters(); setCompanyFilter("All"); }}
                className="text-xs text-[#0C66E4] hover:underline px-1"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* LIST */}
        {loading ? (
          <div className="bg-white border border-[#DCDFE4] rounded-[3px] divide-y divide-[#EBECF0] animate-pulse">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-4">
                <div className="h-3 w-24 bg-[#EBECF0] rounded" />
                <div className="h-3 flex-1 bg-[#EBECF0] rounded" />
                <div className="h-3 w-28 bg-[#EBECF0] rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-[#DCDFE4] rounded-[3px] py-16 text-center">
            <p className="text-base font-semibold text-[#172B4D]">No tickets match your filters</p>
            <p className="text-sm text-[#626F86] mt-1">Try a different keyword or clear the active filters.</p>
          </div>
        ) : (
          <>
            {/* MOBILE CARDS (< md) */}
            <div className="md:hidden flex flex-col gap-2">
              {pageTickets.map((t) => {
                const reporterName = getReporterName(t);
                const reminded = hasActiveReminder(t);
                return (
                  <div key={t._id} className={`bg-white border border-[#DCDFE4] rounded-[3px] p-3 ${reminded ? "shadow-[inset_3px_0_0_#E56910]" : ""}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <button onClick={() => setSelected(t)} className="text-left text-sm font-medium text-[#0C66E4] hover:underline break-words">{t.title}</button>
                        <p className="text-xs text-[#626F86] mt-0.5">{t.ticketNumber}</p>
                      </div>
                      {renderPriority(t)}
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <Avatar name={reporterName} size="w-6 h-6 text-[11px]" />
                      <p className="text-sm text-[#172B4D] truncate">{reporterName}</p>
                      {t.companyId?.name && <p className="text-xs text-[#626F86] truncate">· {t.companyId.name}</p>}
                    </div>

                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      {renderStatusSelect(t)}
                      <SlaBadge ticket={t} now={now} onOpenReason={openBreachModal} />
                      {renderReminderBadge(t)}
                    </div>

                    {t.resolutionNote && (
                      <p className="text-xs text-[#626F86] mb-2 flex items-start gap-1">
                        <IconNote className="w-3 h-3 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{t.resolutionNote}</span>
                      </p>
                    )}
                    {t.status === "Rejected" && t.rejectionReason && (
                      <p className="text-xs text-[#AE2E24] mb-2 flex items-start gap-1">
                        <IconX className="w-3 h-3 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{t.rejectionReason}</span>
                      </p>
                    )}
                    {t.resolutionType === "External Vendor" && (
                      <p className="text-xs text-[#5E4DB2] mb-2 inline-flex items-center gap-1">
                        <IconWrench className="w-3 h-3" /> {t.vendorDetails?.vendorName || "External vendor"}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#EBECF0]">
                      <div className="text-xs text-[#626F86] min-w-0">
                        <p>Created {formatDateOnly(t.createdAt)}</p>
                        {(t.closedAt || t.resolvedAt) && <p>Closed {formatDateOnly(t.closedAt || t.resolvedAt)}</p>}
                      </div>
                      {renderActions(t)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP TABLE (>= md) */}
            <div className="hidden md:block bg-white border border-[#DCDFE4] rounded-[3px] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[1100px]">
                  <thead>
                    <tr className="border-b-2 border-[#DCDFE4] text-xs font-semibold text-[#626F86]">
                      <th className="py-2.5 pl-4 pr-3 text-left whitespace-nowrap">Key</th>
                      <th className="py-2.5 px-3 text-left">Summary</th>
                      <th className="py-2.5 px-3 text-left whitespace-nowrap">Reporter</th>
                      <th className="py-2.5 px-3 text-left whitespace-nowrap">Company</th>
                      <th className="py-2.5 px-3 text-left whitespace-nowrap">Priority</th>
                      <th className="py-2.5 px-3 text-left whitespace-nowrap">Status</th>
                      <th className="py-2.5 px-3 text-left whitespace-nowrap">SLA</th>
                      <th className="py-2.5 px-3 text-left whitespace-nowrap">Created</th>
                      <th className="py-2.5 px-3 text-left whitespace-nowrap">Closed</th>
                      <th className="py-2.5 pl-3 pr-4 text-right whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#EBECF0]">
                    {pageTickets.map((t) => {
                      const reporterName = getReporterName(t);
                      const reminded = hasActiveReminder(t);
                      const isSelected = selected?._id === t._id;
                      const closedDate = t.closedAt || t.resolvedAt;
                      const fileCount = (t.files || t.attachments || []).length;
                      return (
                        <tr
                          key={t._id}
                          className={`align-middle transition-colors ${isSelected ? "bg-[#E9F2FF]" : "hover:bg-[#F7F8F9]"} ${reminded ? "shadow-[inset_3px_0_0_#E56910]" : ""}`}
                        >
                          <td className="py-3 pl-4 pr-3 whitespace-nowrap">
                            <button onClick={() => setSelected(t)} className="text-xs font-medium text-[#44546F] hover:text-[#0C66E4] hover:underline">
                              {t.ticketNumber || "—"}
                            </button>
                          </td>

                          <td className="py-3 px-3">
                            <div className="max-w-[300px]">
                              <button onClick={() => setSelected(t)} className="block max-w-full truncate text-left font-medium text-[#172B4D] hover:text-[#0C66E4] hover:underline" title={t.title}>
                                {t.title}
                              </button>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-[#626F86]">
                                {renderReminderBadge(t)}
                                {fileCount > 0 && (
                                  <span className="inline-flex items-center gap-0.5"><IconClip className="w-3 h-3" />{fileCount}</span>
                                )}
                                {t.rating ? <span className="text-[#F5CD47]">★ {t.rating}</span> : null}
                                {t.resolutionType === "External Vendor" && (
                                  <span className="inline-flex items-center gap-0.5 text-[#5E4DB2]" title={t.vendorDetails?.vendorName}>
                                    <IconWrench className="w-3 h-3" /> Vendor
                                  </span>
                                )}
                                {t.resolutionNote && (
                                  <span className="truncate max-w-[160px]" title={t.resolutionNote}>{t.resolutionNote}</span>
                                )}
                                {t.status === "Rejected" && t.rejectionReason && (
                                  <span className="truncate max-w-[160px] text-[#AE2E24]" title={t.rejectionReason}>{t.rejectionReason}</span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <Avatar name={reporterName} size="w-6 h-6 text-[11px]" />
                              <span className="truncate max-w-[150px]" title={getReporterSubtext(t)}>{reporterName}</span>
                            </div>
                          </td>

                          <td className="py-3 px-3 text-[#44546F]">
                            <span className="block truncate max-w-[150px]" title={t.companyId?.name}>{t.companyId?.name || "—"}</span>
                          </td>

                          <td className="py-3 px-3">{renderPriority(t)}</td>
                          <td className="py-3 px-3">{renderStatusSelect(t)}</td>
                          <td className="py-3 px-3"><SlaBadge ticket={t} now={now} onOpenReason={openBreachModal} /></td>

                          <td className="py-3 px-3 whitespace-nowrap">
                            <p className="text-[#172B4D]">{formatDateOnly(t.createdAt)}</p>
                            <p className="text-xs text-[#626F86]">{formatTimeOnly(t.createdAt)}</p>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            {closedDate ? (
                              <>
                                <p className="text-[#172B4D]">{formatDateOnly(closedDate)}</p>
                                <p className="text-xs text-[#626F86]">{formatTimeOnly(closedDate)}</p>
                              </>
                            ) : (
                              <span className="text-[#626F86]">—</span>
                            )}
                          </td>

                          <td className="py-3 pl-3 pr-4">{renderActions(t)}</td>
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
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-[#626F86] tabular-nums">
              Showing {rangeStart}–{rangeEnd} of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Previous page" className={`${BTN_SUBTLE} !px-2`}>
                <IconChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-medium text-[#44546F] tabular-nums">Page {page} of {totalFilteredPages}</span>
              <button disabled={page === totalFilteredPages} onClick={() => setPage(page + 1)} aria-label="Next page" className={`${BTN_SUBTLE} !px-2`}>
                <IconChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= RESOLVE / CLOSE / REJECT MODAL ================= */}
      {statusModal && (
        <Modal
          icon={statusModal.targetStatus === "Resolved" ? <IconCheck className="w-4 h-4" /> : statusModal.targetStatus === "Rejected" ? <IconX className="w-4 h-4" /> : <IconLock className="w-4 h-4" />}
          iconTone={statusModal.targetStatus === "Resolved" ? "bg-[#DCFFF1] text-[#216E4E]" : statusModal.targetStatus === "Rejected" ? "bg-[#FFEDEB] text-[#AE2E24]" : "bg-[#F1F2F4] text-[#44546F]"}
          title={`Mark as ${statusModal.targetStatus}`}
          subtitle={`${statusModal.ticket.ticketNumber || ""} ${statusModal.ticket.title}`}
          footer={
            <>
              <button onClick={cancelStatusModal} disabled={submitting} className={BTN_SUBTLE}>Cancel</button>
              <button onClick={confirmStatusModal} disabled={submitting} className={isRejectModal ? BTN_DANGER : BTN_PRIMARY}>
                {submitting ? "Saving…" : `Confirm ${statusModal.targetStatus}`}
              </button>
            </>
          }
        >
          {!isRejectModal && (
            <div className="mb-3">
              <SlaBadge ticket={statusModal.ticket} now={now} />
            </div>
          )}

          {isRejectModal ? (
            <div>
              <label className={LABEL}>Reason for rejection <span className="text-[#C9372C]">*</span></label>
              <textarea
                className={`${FIELD} py-2 resize-none`}
                rows={4}
                placeholder="e.g. Duplicate of TCK-0123, or not a valid support request."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-[#626F86] mt-1.5">The ticket will be marked Rejected and this reason recorded in its history.</p>
            </div>
          ) : (
            <>
              <label className={LABEL}>Resolution note <span className="text-[#C9372C]">*</span></label>
              <textarea
                className={`${FIELD} py-2 resize-none`}
                rows={4}
                placeholder="e.g. Replaced faulty router, tested connection with user, confirmed working."
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-[#626F86] mt-1.5">Saved with the ticket so anyone can see how it was handled.</p>

              <div className="mt-4">
                <label className={LABEL}>Resolution type <span className="text-[#C9372C]">*</span></label>
                <div className="inline-flex w-full rounded-[3px] border border-[#8590A2] overflow-hidden" role="group">
                  {["Internal", "External Vendor"].map((type, i) => (
                    <button
                      key={type}
                      type="button"
                      aria-pressed={resolutionType === type}
                      onClick={() => setResolutionType(type)}
                      className={`flex-1 h-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#4C9AFF] ${i ? "border-l border-[#8590A2]" : ""} ${resolutionType === type ? "bg-[#E9F2FF] text-[#0C66E4]" : "bg-white text-[#44546F] hover:bg-[#F7F8F9]"}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {resolutionType === "External Vendor" && (
                <div className="mt-4 border border-[#DCDFE4] bg-[#F7F8F9] rounded-[3px] p-3 flex flex-col gap-3">
                  <p className="text-sm font-semibold text-[#172B4D] flex items-center gap-1.5">
                    <IconWrench className="w-3.5 h-3.5" /> Vendor / repair details
                  </p>

                  <div>
                    <label className={LABEL}>Vendor name <span className="text-[#C9372C]">*</span></label>
                    <input value={vendorName} onChange={(e) => setVendorName(e.target.value)} className={`${FIELD} h-8`} placeholder="e.g. ABC Computer Repairs" />
                  </div>

                  <div>
                    <label className={LABEL}>Complaint / repair description <span className="text-[#C9372C]">*</span></label>
                    <textarea value={vendorComplaint} onChange={(e) => setVendorComplaint(e.target.value)} rows={3} className={`${FIELD} py-2 resize-none`} placeholder="e.g. Motherboard replaced due to short circuit" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL}>Repair date <span className="text-[#C9372C]">*</span></label>
                      <input type="date" value={vendorRepairDate} onChange={(e) => setVendorRepairDate(e.target.value)} className={`${FIELD} h-8`} />
                    </div>
                    <div>
                      <label className={LABEL}>Cost <span className="text-[#C9372C]">*</span></label>
                      <input type="number" min="0" step="0.01" value={vendorCost} onChange={(e) => setVendorCost(e.target.value)} className={`${FIELD} h-8`} placeholder="0.00" />
                    </div>
                  </div>

                  <div>
                    <label className={LABEL}>Receipt / invoice (optional)</label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setVendorReceipt(e.target.files?.[0] || null)}
                      className="w-full text-xs text-[#44546F] file:mr-3 file:h-7 file:px-3 file:rounded-[3px] file:border-0 file:text-xs file:font-medium file:bg-[#091E420F] file:text-[#172B4D] hover:file:bg-[#091E4224]"
                    />
                    {vendorReceipt && <p className="text-xs text-[#626F86] mt-1">Selected: {vendorReceipt.name}</p>}
                  </div>
                </div>
              )}

              {isModalTicketBreached && (
                <div className="mt-4">
                  <label className={LABEL}>Reason for SLA breach <span className="text-[#C9372C]">*</span></label>
                  <textarea
                    className={`${FIELD} py-2 resize-none !border-[#E2483D]`}
                    rows={3}
                    placeholder="e.g. Part was on backorder, awaiting vendor delivery."
                    value={breachReason}
                    onChange={(e) => setBreachReason(e.target.value)}
                  />
                  <p className="text-xs text-[#626F86] mt-1.5">This ticket missed its SLA. Record why so it can be reviewed later.</p>
                </div>
              )}
            </>
          )}
        </Modal>
      )}

      {/* ================= QUICK SLA BREACH REASON MODAL ================= */}
      {breachModal && (
        <Modal
          icon={<IconAlertTriangle className="w-4 h-4" />}
          iconTone="bg-[#FFEDEB] text-[#AE2E24]"
          title="Why did the SLA breach?"
          subtitle={`${breachModal.ticket.title} — ${breachModal.leg === "response" ? "First response" : "Resolution"} SLA`}
          footer={
            <>
              <button onClick={cancelBreachModal} disabled={breachSubmitting} className={BTN_SUBTLE}>Cancel</button>
              <button onClick={saveBreachReason} disabled={breachSubmitting} className={BTN_PRIMARY}>
                {breachSubmitting ? "Saving…" : "Save reason"}
              </button>
            </>
          }
        >
          <label className={LABEL}>Reason <span className="text-[#C9372C]">*</span></label>
          <textarea
            className={`${FIELD} py-2 resize-none`}
            rows={4}
            placeholder="e.g. Waiting on vendor part, technician unavailable, escalated to super admin."
            value={breachModalText}
            onChange={(e) => setBreachModalText(e.target.value)}
            autoFocus
          />
        </Modal>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {deleteModal && (
        <Modal
          maxWidth="max-w-sm"
          icon={<IconTrash className="w-4 h-4" />}
          iconTone="bg-[#FFEDEB] text-[#AE2E24]"
          title="Delete this ticket?"
          subtitle={`${deleteModal.ticketNumber} — ${deleteModal.title}`}
          footer={
            <>
              <button onClick={cancelDeleteModal} disabled={deleting} className={BTN_SUBTLE}>Cancel</button>
              <button onClick={confirmDelete} disabled={deleting} className={BTN_DANGER}>
                {deleting ? "Deleting…" : "Delete ticket"}
              </button>
            </>
          }
        >
          <p className="text-sm text-[#44546F] leading-relaxed">
            This permanently removes the ticket, including its status history, resolution notes and any vendor or repair details. This can't be undone.
          </p>
        </Modal>
      )}
    </div>
  );
}