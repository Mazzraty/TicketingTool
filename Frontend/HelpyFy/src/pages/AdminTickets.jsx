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
const IconWrench = (p) => <Icon {...p}><path d="M14.7 6.3a4 4 0 0 0-5.6 5.6L2 19l3 3 7.1-7.1a4 4 0 0 0 5.6-5.6l-2.8 2.8-2-2 2.8-2.8Z" /></Icon>;
// NEW: trash icon for the delete action (super_admin only)
const IconTrash = (p) => <Icon {...p}><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /></Icon>;
// NEW: calendar icon for the date-range filter
const IconCalendar = (p) => <Icon {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Icon>;

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

// figures out which SLA leg is currently breached on a ticket
// (resolution takes priority over response) and returns its existing
// reason, if any, so the badge/modal know what to show.
const getBreachLegInfo = (ticket, now) => {
  const sla = ticket.sla;
  if (!sla) return null;

  const resolutionState = getSlaLegState({
    due: sla.resolutionDue,
    achievedAt: sla.resolvedAt,
    breached: sla.resolutionBreached,
    now,
  });

  if (resolutionState.level === "breached") {
    return { leg: "resolution", reason: sla.breachReason || "" };
  }

  if (!sla.firstRespondedAt) {
    const responseState = getSlaLegState({
      due: sla.firstResponseDue,
      achievedAt: sla.firstRespondedAt,
      breached: sla.firstResponseBreached,
      now,
    });
    if (responseState.level === "breached") {
      return { leg: "response", reason: sla.firstResponseBreachReason || "" };
    }
  }

  return null;
};

// onOpenReason — called when the badge is clicked on a breached
// ticket. Optional so SlaBadge still works anywhere it's used without it.
const SlaBadge = ({ ticket, now, onOpenReason }) => {
  const state = getOverallSlaState(ticket, now);
  const theme = SLA_THEME[state.level];
  const breachInfo = state.level === "breached" ? getBreachLegInfo(ticket, now) : null;
  const clickable = state.level === "breached" && onOpenReason && breachInfo;

  return (
    <span
      onClick={clickable ? () => onOpenReason(ticket, breachInfo) : undefined}
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${theme.bg} ${theme.text} ${theme.border} ${clickable ? "cursor-pointer hover:brightness-95" : ""
        }`}
      title={clickable ? (breachInfo.reason ? "Click to edit breach reason" : "Click to add breach reason") : undefined}
    >
      {state.level === "breached" ? (
        <IconAlertTriangle className="w-3 h-3" />
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full ${theme.dot}`} />
      )}
      {state.label}
      {clickable && !breachInfo.reason && (
        <span className="text-[10px] underline decoration-dotted ml-0.5">add reason</span>
      )}
    </span>
  );
};

// leg ("response" | "resolution"), ticket, onOpenReason — lets this
// row show/add a reason based on the LIVE computed breach state (overdue
// counts as breached even if the ticket was closed without ever formally
// triggering the persisted resolutionBreached/firstResponseBreached flag).
const SlaLegRow = ({ icon, label, due, achievedAt, breached, achievedLabel, now, breachReason, leg, ticket, onOpenReason }) => {
  const state = getSlaLegState({ due, achievedAt, breached, now });
  const theme = SLA_THEME[state.level];
  const isBreached = state.level === "breached"; // live state, not just the persisted flag

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

      {/* reason section — shows on ANY breach (live state), with an
          inline "add reason" action if nothing's been recorded yet */}
      {isBreached && (
        <div className="mt-2 pt-2 border-t border-red-200/70">
          <p className="text-[10px] font-semibold text-red-700 uppercase tracking-wide mb-0.5">
            Reason
          </p>
          {breachReason ? (
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] text-red-700 leading-relaxed">{breachReason}</p>
              {onOpenReason && ticket && (
                <button
                  onClick={() => onOpenReason(ticket, { leg, reason: breachReason })}
                  className="text-[10px] text-red-600 hover:text-red-800 underline shrink-0"
                >
                  Edit
                </button>
              )}
            </div>
          ) : onOpenReason && ticket ? (
            <button
              onClick={() => onOpenReason(ticket, { leg, reason: "" })}
              className="text-[11px] text-red-600 hover:text-red-800 underline"
            >
              Add reason
            </button>
          ) : (
            <p className="text-[11px] text-slate-400">No reason recorded</p>
          )}
        </div>
      )}
    </div>
  );
};

const SlaDetailPanel = ({ ticket, now, onOpenReason }) => {
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
        <SlaBadge ticket={ticket} now={now} onOpenReason={onOpenReason} />
      </div>

      <SlaLegRow
        icon={<IconZap className="w-3.5 h-3.5" />}
        label="First Response"
        due={sla.firstResponseDue}
        achievedAt={sla.firstRespondedAt}
        breached={sla.firstResponseBreached}
        breachReason={sla.firstResponseBreachReason}
        achievedLabel="Responded at"
        now={now}
        leg="response"
        ticket={ticket}
        onOpenReason={onOpenReason}
      />

      <SlaLegRow
        icon={<IconCheck className="w-3.5 h-3.5" />}
        label="Resolution"
        due={sla.resolutionDue}
        achievedAt={sla.resolvedAt}
        breached={sla.resolutionBreached}
        breachReason={sla.breachReason}
        achievedLabel="Resolved at"
        now={now}
        leg="resolution"
        ticket={ticket}
        onOpenReason={onOpenReason}
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
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(null); // "Open" | "In Progress" | "Resolved" | "Closed" | "breached" | null
  const [loading, setLoading] = useState(false);

  // NEW: independent date-range filters for Opened (createdAt) and
  // Closed (closedAt, falling back to resolvedAt to match the "Closed"
  // column shown in the table/cards). Stored as "YYYY-MM-DD" strings
  // straight from <input type="date">.
  const [dateFilterOpen, setDateFilterOpen] = useState(false);
  const [openedFrom, setOpenedFrom] = useState("");
  const [openedTo, setOpenedTo] = useState("");
  const [closedFrom, setClosedFrom] = useState("");
  const [closedTo, setClosedTo] = useState("");

  const [statusModal, setStatusModal] = useState(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [breachReason, setBreachReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ADDED: resolution-type + external-vendor repair fields, used inside
  // the Resolve/Close modal.
  const [resolutionType, setResolutionType] = useState("Internal");
  const [vendorName, setVendorName] = useState("");
  const [vendorComplaint, setVendorComplaint] = useState("");
  const [vendorRepairDate, setVendorRepairDate] = useState("");
  const [vendorCost, setVendorCost] = useState("");
  const [vendorReceipt, setVendorReceipt] = useState(null); // File object

  // quick "add reason immediately" modal, independent of resolve/close flow
  const [breachModal, setBreachModal] = useState(null); // { ticket, leg }
  const [breachModalText, setBreachModalText] = useState("");
  const [breachSubmitting, setBreachSubmitting] = useState(false);

  // NEW: delete-ticket confirmation. Holds the ticket pending deletion
  // (or null when the modal is closed). Kept separate from statusModal
  // since deleting is a destructive, unrelated action.
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const isSuperAdmin = user?.role === "super_admin";
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
    load();
    loadStats();
  }, []); // load everything once; pagination is client-side

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Lock background scroll only while the MOBILE full-screen detail sheet
  // is open. On desktop (md:static panel, part of the normal flex layout)
  // we must NOT lock the body, or the ticket list behind it becomes
  // unscrollable and other tickets/rows become unreachable.
  useEffect(() => {
    if (!selected) return;

    const mql = window.matchMedia("(max-width: 767px)");

    const applyLock = (isMobile) => {
      if (isMobile) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    };

    applyLock(mql.matches);

    const handleChange = (e) => applyLock(e.matches);
    mql.addEventListener("change", handleChange);

    return () => {
      document.body.style.overflow = "";
      mql.removeEventListener("change", handleChange);
    };
  }, [selected]);

  const load = async () => {
    try {
      setLoading(true);
      // fetch everything in one go (high limit) instead of one page at a
      // time, so client-side filters (search + stat cards) can see every
      // ticket, not just the 10 on the current server page.
      const res = await api.get(`/tickets?page=1&limit=1000`);
      setTickets(res?.data?.data || []);
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
      setBreachReason(ticket.sla?.breachReason || "");

      // ADDED: pre-fill resolution type / vendor fields from whatever's
      // already on the ticket (lets IT support edit a previous entry).
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
      await api.put(`/tickets/${id}/escalate`, {
        reason: "Escalated by IT Support",
      });

      toast.success("Ticket escalated successfully");

      load();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to escalate");
    }
  };

  // CHANGED: `extra` can now be a plain object (JSON, used for the quick
  // Open/In Progress status changes) OR a FormData instance (used by the
  // Resolve/Close modal so the optional vendor receipt file can travel
  // alongside the other fields in one multipart request).
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

  // whether the ticket currently in the modal is in a breached SLA state
  const isModalTicketBreached =
    statusModal && getOverallSlaState(statusModal.ticket, now).level === "breached";

  const resetStatusModalFields = () => {
    setResolutionNote("");
    setBreachReason("");
    setResolutionType("Internal");
    setVendorName("");
    setVendorComplaint("");
    setVendorRepairDate("");
    setVendorCost("");
    setVendorReceipt(null);
  };

  const confirmStatusModal = async () => {
    if (!resolutionNote.trim()) {
      return toast.error("Please add a resolution note before continuing");
    }

    // require a breach reason when the SLA is currently breached
    if (isModalTicketBreached && !breachReason.trim()) {
      return toast.error("Please explain why the SLA was breached");
    }

    // ADDED: validate vendor/repair fields when External Vendor is selected
    if (resolutionType === "External Vendor") {
      if (!vendorName.trim()) {
        return toast.error("Vendor name is required");
      }
      if (!vendorComplaint.trim()) {
        return toast.error("Please describe the complaint / repair");
      }
      if (!vendorRepairDate) {
        return toast.error("Repair date is required");
      }
      if (vendorCost === "" || isNaN(Number(vendorCost)) || Number(vendorCost) < 0) {
        return toast.error("Please enter a valid repair cost");
      }
    }

    setSubmitting(true);

    // ADDED: always build a FormData payload for this flow so the optional
    // receipt file can ride along with the rest of the fields.
    const formData = new FormData();
    formData.append("resolutionNote", resolutionNote.trim());
    formData.append("resolutionType", resolutionType);

    if (isModalTicketBreached) {
      formData.append("slaBreachReason", breachReason.trim());
    }

    if (resolutionType === "External Vendor") {
      formData.append("vendorName", vendorName.trim());
      formData.append("complaintDescription", vendorComplaint.trim());
      formData.append("repairDate", vendorRepairDate);
      formData.append("cost", vendorCost);
      if (vendorReceipt) {
        formData.append("receipt", vendorReceipt);
      }
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

  // open the quick reason modal when the breached badge is clicked
  const openBreachModal = (ticket, breachInfo) => {
    setBreachModal({ ticket, leg: breachInfo.leg });
    setBreachModalText(breachInfo.reason || "");
  };

  const cancelBreachModal = () => {
    setBreachModal(null);
    setBreachModalText("");
  };

  const saveBreachReason = async () => {
    if (!breachModalText.trim()) {
      return toast.error("Please enter a reason");
    }
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

  // NEW: delete-ticket flow. Opens a confirmation modal instead of
  // deleting immediately — the backend route is a hard delete with no
  // undo, so we don't want a stray click to remove a ticket.
  const handleDeleteClick = (ticket) => {
    setDeleteModal(ticket);
  };

  const cancelDeleteModal = () => {
    if (deleting) return; // ignore stray closes mid-request
    setDeleteModal(null);
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;

    try {
      setDeleting(true);
      await api.delete(`/tickets/${deleteModal._id}`);
      toast.success("Ticket deleted");

      // if the ticket being deleted is currently open in the detail
      // panel, close the panel so it doesn't show stale data
      if (selected?._id === deleteModal._id) {
        setSelected(null);
      }

      setDeleteModal(null);
      load();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete ticket");
    } finally {
      setDeleting(false);
    }
  };

  // NEW: date-range filter helpers ------------------------------------

  // "YYYY-MM-DD" -> local midnight / end-of-day Date, so the picked day
  // is always inclusive regardless of the ticket's exact timestamp.
  const startOfDay = (ymd) => {
    const d = new Date(`${ymd}T00:00:00`);
    return d;
  };
  const endOfDay = (ymd) => {
    const d = new Date(`${ymd}T23:59:59.999`);
    return d;
  };

  const isWithinDateRange = (value, fromStr, toStr) => {
    if (!fromStr && !toStr) return true; // no filter set on this leg
    if (!value) return false; // filter set but ticket has no such date
    const d = new Date(value);
    if (fromStr && d < startOfDay(fromStr)) return false;
    if (toStr && d > endOfDay(toStr)) return false;
    return true;
  };

  const toISODate = (d) => d.toISOString().slice(0, 10);

  // quick presets (Jira/ServiceNow-style relative ranges), applied to
  // whichever section ("opened" | "closed") the user clicked from.
  const applyDatePreset = (section, preset) => {
    const today = new Date();
    const from = new Date(today);

    if (preset === "today") {
      // from === to === today
    } else if (preset === "week") {
      from.setDate(today.getDate() - 6);
    } else if (preset === "month") {
      from.setDate(today.getDate() - 29);
    }

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

  const activeDateFilterCount =
    (openedFrom || openedTo ? 1 : 0) + (closedFrom || closedTo ? 1 : 0);

  const formatDateRangeLabel = (fromStr, toStr) => {
    if (!fromStr && !toStr) return "";
    if (fromStr && toStr && fromStr === toStr) return formatDateOnly(fromStr);
    if (fromStr && toStr) return `${formatDateOnly(fromStr)} – ${formatDateOnly(toStr)}`;
    if (fromStr) return `From ${formatDateOnly(fromStr)}`;
    return `Until ${formatDateOnly(toStr)}`;
  };

  // ---------------------------------------------------------------------

  const filtered = tickets.filter((t) => {
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

    // stat-card filter (status, or SLA breached)
    const matchesFilter =
      !statusFilter ||
      (statusFilter === "breached"
        ? getOverallSlaState(t, now).level === "breached"
        : t.status === statusFilter);

    // NEW: date-range filters, independent for Opened and Closed
    const matchesOpenedDate = isWithinDateRange(t.createdAt, openedFrom, openedTo);
    const matchesClosedDate = isWithinDateRange(t.closedAt || t.resolvedAt, closedFrom, closedTo);

    return matchesSearch && matchesFilter && matchesOpenedDate && matchesClosedDate;
  });

  const breachedCount = tickets.filter(
    (t) => getOverallSlaState(t, now).level === "breached"
  ).length;

  // client-side pagination over the FILTERED set, so page counts and
  // page contents always reflect the active search/stat-card filter, not
  // just whichever 10 tickets the server happened to send for page N.
  const PAGE_SIZE = 10;
  const totalFilteredPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageTickets = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // whenever the filter/search narrows the result set, jump back to page
  // 1 so you don't land on a now-empty page.
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, openedFrom, openedTo, closedFrom, closedTo]);

  // if data reloads and the current page no longer exists (e.g. fewer
  // results after a filter), clamp back into range.
  useEffect(() => {
    if (page > totalFilteredPages) setPage(totalFilteredPages);
  }, [totalFilteredPages]);

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

  const formatDateOnly = (date) =>
    date ? new Date(date).toLocaleDateString(undefined, {
      month: "short", day: "numeric", year: "numeric",
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
    { key: "total", label: "Total", value: stats.total, theme: "slate", icon: <IconLayers className="w-4 h-4" />, filterKey: null },
    { key: "open", label: "Open", value: stats.open, theme: "blue", icon: <IconCircleDot className="w-4 h-4" />, filterKey: "Open" },
    { key: "inProgress", label: "In Progress", value: stats.inProgress, theme: "amber", icon: <IconClock className="w-4 h-4" />, filterKey: "In Progress" },
    { key: "resolved", label: "Resolved", value: stats.resolved, theme: "emerald", icon: <IconCheck className="w-4 h-4" />, filterKey: "Resolved" },
    { key: "closed", label: "Closed", value: stats.closed, theme: "slate", icon: <IconLock className="w-4 h-4" />, filterKey: "Closed" },
    { key: "breached", label: "SLA Breached", value: breachedCount, theme: "red", icon: <IconAlertTriangle className="w-4 h-4" />, filterKey: "breached" },
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

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {/* NEW: delete action inside the detail panel too, super_admin only */}
                {isSuperAdmin && (
                  <button
                    onClick={() => handleDeleteClick(selected)}
                    title="Delete ticket"
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 transition"
                  >
                    <IconTrash className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setSelected(null)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <IconX className="w-4 h-4" />
                </button>
              </div>
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
                <SlaDetailPanel ticket={selected} now={now} onOpenReason={openBreachModal} />
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

              {/* ADDED: Vendor / repair information — only rendered once a
                  resolution type has actually been recorded on the ticket. */}
              {selected.resolutionType && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <IconWrench className="w-3.5 h-3.5" /> Resolution Type
                  </p>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${selected.resolutionType === "External Vendor"
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}>
                    {selected.resolutionType}
                  </span>

                  {selected.resolutionType === "External Vendor" && selected.vendorDetails && (
                    <div className="mt-2 bg-purple-50/60 border border-purple-100 rounded-lg p-3 flex flex-col gap-1.5 text-sm">
                      <p className="text-slate-700">
                        <span className="font-medium text-slate-500">Vendor:</span>{" "}
                        {selected.vendorDetails.vendorName || "—"}
                      </p>
                      <p className="text-slate-700">
                        <span className="font-medium text-slate-500">Repair date:</span>{" "}
                        {formatDateOnly(selected.vendorDetails.repairDate)}
                      </p>
                      <p className="text-slate-700">
                        <span className="font-medium text-slate-500">Cost:</span>{" "}
                        {selected.vendorDetails.cost !== null && selected.vendorDetails.cost !== undefined
                          ? selected.vendorDetails.cost
                          : "—"}
                      </p>
                      <p className="text-slate-700">
                        <span className="font-medium text-slate-500">Details:</span>{" "}
                        {selected.vendorDetails.complaintDescription || "—"}
                      </p>
                      {selected.vendorDetails.receiptUrl ? (
                        <a
                          href={selected.vendorDetails.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-purple-700 hover:text-purple-800 text-xs font-semibold mt-1"
                        >
                          <IconClip className="w-3.5 h-3.5" /> View Receipt
                        </a>
                      ) : (
                        <p className="text-xs text-slate-400">No receipt uploaded</p>
                      )}
                    </div>
                  )}
                </div>
              )}

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

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full border border-slate-200 bg-white pl-9 pr-3 py-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition placeholder:text-slate-400"
                placeholder="Search tickets, users, status, SLA..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* NEW: Opened / Closed date-range filter (Jira/ServiceNow style) */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setDateFilterOpen((v) => !v)}
                className={`relative flex items-center gap-1.5 border rounded-lg px-3 py-2.5 text-sm font-medium transition ${activeDateFilterCount > 0
                    ? "border-blue-300 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <IconCalendar className="w-4 h-4" />
                <span className="hidden sm:inline">Filter Ticket</span>
                {activeDateFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {activeDateFilterCount}
                  </span>
                )}
              </button>

              {dateFilterOpen && (
                <>
                  {/* click-outside catcher */}
                  <div className="fixed inset-0 z-40" onClick={() => setDateFilterOpen(false)} />
                  <div className="absolute right-0 mt-2 w-[300px] bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-slate-700">Filter by date</p>
                      {activeDateFilterCount > 0 && (
                        <button
                          onClick={clearAllDateFilters}
                          className="text-[11px] text-blue-600 hover:text-blue-700 font-medium underline"
                        >
                          Clear all
                        </button>
                      )}
                    </div>

                    {/* Opened section */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Opened</p>
                        {(openedFrom || openedTo) && (
                          <button
                            onClick={() => clearDateSection("opened")}
                            className="text-[10px] text-slate-400 hover:text-slate-600 underline"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input
                          type="date"
                          value={openedFrom}
                          onChange={(e) => setOpenedFrom(e.target.value)}
                          className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                        />
                        <input
                          type="date"
                          value={openedTo}
                          onChange={(e) => setOpenedTo(e.target.value)}
                          className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                        />
                      </div>
                      <div className="flex gap-1.5">
                        {[["today", "Today"], ["week", "7 Days"], ["month", "30 Days"]].map(([key, label]) => (
                          <button
                            key={key}
                            onClick={() => applyDatePreset("opened", key)}
                            className="text-[11px] px-2 py-1 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Closed section */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Closed</p>
                        {(closedFrom || closedTo) && (
                          <button
                            onClick={() => clearDateSection("closed")}
                            className="text-[10px] text-slate-400 hover:text-slate-600 underline"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input
                          type="date"
                          value={closedFrom}
                          onChange={(e) => setClosedFrom(e.target.value)}
                          className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                        />
                        <input
                          type="date"
                          value={closedTo}
                          onChange={(e) => setClosedTo(e.target.value)}
                          className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                        />
                      </div>
                      <div className="flex gap-1.5">
                        {[["today", "Today"], ["week", "7 Days"], ["month", "30 Days"]].map(([key, label]) => (
                          <button
                            key={key}
                            onClick={() => applyDatePreset("closed", key)}
                            className="text-[11px] px-2 py-1 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => setDateFilterOpen(false)}
                      className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 rounded-lg transition"
                    >
                      Apply
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* STATS — 2 columns on phones so labels/numbers stay readable, not squeezed to 6-across */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {statCards.map((s) => {
            // a card is "active" if it's the currently applied filter, or
            // if it's the Total card and no filter is applied at all.
            const isActive = s.filterKey === null ? statusFilter === null : statusFilter === s.filterKey;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => setStatusFilter(isActive && s.filterKey !== null ? null : s.filterKey)}
                className={`relative bg-white border rounded-xl p-3.5 sm:p-4 overflow-hidden shadow-sm text-left transition ${isActive ? "border-slate-400 ring-2 ring-slate-200" : "border-slate-200 hover:border-slate-300"
                  }`}
              >
                <span className={`absolute left-0 top-0 bottom-0 w-1 ${statBarClass[s.theme]}`} />
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-slate-400">{s.label}</p>
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${statIconClass[s.theme]}`}>
                    {s.icon}
                  </span>
                </div>
                <p className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</p>
              </button>
            );
          })}
        </div>

        {/* active filter indicator + clear button */}
        {(statusFilter || activeDateFilterCount > 0) && (
          <div className="flex flex-wrap items-center gap-2 mb-4 -mt-2">
            {statusFilter && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-slate-100 border border-slate-200 text-slate-700 font-medium px-2.5 py-1 rounded-full">
                {statusFilter === "breached" ? "SLA Breached" : statusFilter}
                <button onClick={() => setStatusFilter(null)} className="text-slate-400 hover:text-slate-600">
                  <IconX className="w-3 h-3" />
                </button>
              </span>
            )}
            {(openedFrom || openedTo) && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-blue-50 border border-blue-200 text-blue-700 font-medium px-2.5 py-1 rounded-full">
                Opened: {formatDateRangeLabel(openedFrom, openedTo)}
                <button onClick={() => clearDateSection("opened")} className="text-blue-400 hover:text-blue-600">
                  <IconX className="w-3 h-3" />
                </button>
              </span>
            )}
            {(closedFrom || closedTo) && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-blue-50 border border-blue-200 text-blue-700 font-medium px-2.5 py-1 rounded-full">
                Closed: {formatDateRangeLabel(closedFrom, closedTo)}
                <button onClick={() => clearDateSection("closed")} className="text-blue-400 hover:text-blue-600">
                  <IconX className="w-3 h-3" />
                </button>
              </span>
            )}
            <button
              onClick={() => { setStatusFilter(null); clearAllDateFilters(); }}
              className="text-xs text-slate-400 hover:text-slate-600 underline"
            >
              Clear all
            </button>
          </div>
        )}

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-xl p-16 text-center text-sm text-slate-400 shadow-sm">
            Loading tickets…
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-16 text-center shadow-sm">
            <p className="text-sm font-medium text-slate-600">No tickets match your filters</p>
            <p className="text-xs text-slate-400 mt-1">Try a different keyword, or clear the active filter above</p>
          </div>
        ) : (
          <>
            {/* ================= MOBILE CARD LIST (< md) ================= */}
            <div className="md:hidden flex flex-col gap-3">
              {pageTickets.map((t) => {
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
                      <SlaBadge ticket={t} now={now} onOpenReason={openBreachModal} />
                    </div>

                    {t.resolutionNote && (
                      <p className="text-xs text-slate-400 mb-3 flex items-start gap-1">
                        <IconNote className="w-3 h-3 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{t.resolutionNote}</span>
                      </p>
                    )}

                    {/* ADDED: small vendor badge on the mobile card */}
                    {t.resolutionType === "External Vendor" && (
                      <p className="text-[11px] text-purple-700 bg-purple-50 border border-purple-100 rounded-md px-2 py-1 mb-3 inline-flex items-center gap-1">
                        <IconWrench className="w-3 h-3" /> {t.vendorDetails?.vendorName || "External Vendor"}
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

                        {/* NEW: delete, super_admin only */}
                        {isSuperAdmin && (
                          <button
                            onClick={() => handleDeleteClick(t)}
                            title="Delete ticket"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 transition shrink-0"
                          >
                            <IconTrash className="w-3.5 h-3.5" />
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
                      <th className="p-3.5 text-left font-semibold">Details</th>
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
                    {pageTickets.map((t) => {
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
                              {/* ADDED: quick vendor indicator under the status pill */}
                              {t.resolutionType === "External Vendor" && (
                                <span
                                  className="text-[10px] text-purple-700 bg-purple-50 border border-purple-100 rounded-full px-2 py-0.5 flex items-center gap-1"
                                  title={t.vendorDetails?.vendorName}
                                >
                                  <IconWrench className="w-2.5 h-2.5" /> Vendor
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="p-3.5 text-center">
                            <SlaBadge ticket={t} now={now} onOpenReason={openBreachModal} />
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

                              {/* NEW: delete, super_admin only */}
                              {isSuperAdmin && (
                                <button
                                  onClick={() => handleDeleteClick(t)}
                                  title="Delete ticket"
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 transition"
                                >
                                  <IconTrash className="w-3.5 h-3.5" />
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

          <span className="text-xs font-medium text-slate-500 tabular-nums">Page {page} of {totalFilteredPages}</span>

          <button
            disabled={page === totalFilteredPages}
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 sm:p-6 max-h-[90vh] overflow-y-auto">
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

            {/* ADDED: Resolution Type toggle */}
            <div className="mt-4">
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">
                Resolution Type <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setResolutionType("Internal")}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition ${resolutionType === "Internal"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                >
                  Internal
                </button>
                <button
                  type="button"
                  onClick={() => setResolutionType("External Vendor")}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition ${resolutionType === "External Vendor"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                >
                  External Vendor
                </button>
              </div>
            </div>

            {/* ADDED: External Vendor fields — only shown when relevant */}
            {resolutionType === "External Vendor" && (
              <div className="mt-4 border border-purple-200 bg-purple-50/40 rounded-lg p-3 flex flex-col gap-3">
                <p className="text-xs font-semibold text-purple-700 uppercase tracking-wide flex items-center gap-1.5">
                  <IconWrench className="w-3.5 h-3.5" /> Vendor / Repair Details
                </p>

                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">
                    Vendor Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 bg-white"
                    placeholder="e.g. ABC Computer Repairs"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">
                    Complaint / Repair Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={vendorComplaint}
                    onChange={(e) => setVendorComplaint(e.target.value)}
                    rows={3}
                    className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 resize-none bg-white"
                    placeholder="e.g. Motherboard replaced due to short circuit"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">
                      Repair Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={vendorRepairDate}
                      onChange={(e) => setVendorRepairDate(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">
                      Cost <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={vendorCost}
                      onChange={(e) => setVendorCost(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-2 text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 bg-white"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">
                    Receipt / Invoice (optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setVendorReceipt(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200"
                  />
                  {vendorReceipt && (
                    <p className="text-[11px] text-slate-500 mt-1">Selected: {vendorReceipt.name}</p>
                  )}
                </div>
              </div>
            )}

            {/* SLA breach reason field, only shown when this ticket is currently breached */}
            {isModalTicketBreached && (
              <div className="mt-4">
                <label className="text-xs font-medium text-slate-500 mb-1.5 block">
                  Reason for SLA breach <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full border border-red-200 bg-red-50/40 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition resize-none placeholder:text-slate-400"
                  rows={3}
                  placeholder="e.g. Part was on backorder, awaiting vendor delivery."
                  value={breachReason}
                  onChange={(e) => setBreachReason(e.target.value)}
                />
                <p className="text-[11px] text-slate-400 mt-1.5">
                  This ticket missed its SLA — record why so it can be reviewed later.
                </p>
              </div>
            )}

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

      {/* ================= QUICK SLA BREACH REASON MODAL =================
          Opens the instant an admin clicks a breached SLA badge, so the
          reason can be captured right when the breach happens — no need
          to wait until the ticket is Resolved/Closed. */}
      {breachModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-1">
              <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-red-50 text-red-600">
                <IconAlertTriangle className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-base text-slate-900">
                Why did the SLA breach?
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4 ml-12 -mt-1 truncate">
              "{breachModal.ticket.title}" — {breachModal.leg === "response" ? "First Response" : "Resolution"} SLA
            </p>

            <label className="text-xs font-medium text-slate-500 mb-1.5 block">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full border border-red-200 bg-red-50/40 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 transition resize-none placeholder:text-slate-400"
              rows={4}
              placeholder="e.g. Waiting on vendor part, technician unavailable, escalated to super admin."
              value={breachModalText}
              onChange={(e) => setBreachModalText(e.target.value)}
              autoFocus
            />

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={cancelBreachModal}
                disabled={breachSubmitting}
                className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={saveBreachReason}
                disabled={breachSubmitting}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition disabled:opacity-60"
              >
                {breachSubmitting ? "Saving…" : "Save Reason"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE TICKET CONFIRMATION MODAL =================
          NEW. super_admin only — the trigger buttons above are already
          gated on isSuperAdmin, this is the confirmation step before the
          irreversible DELETE /tickets/:id call fires. */}
      {deleteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-1">
              <span className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-red-50 text-red-600">
                <IconTrash className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-base text-slate-900">
                Delete this ticket?
              </h3>
            </div>
            <p className="text-xs text-slate-400 ml-12 -mt-1 mb-4 truncate">
              "{deleteModal.title}" — {deleteModal.ticketNumber}
            </p>

            <p className="text-sm text-slate-600 leading-relaxed">
              This permanently removes the ticket, including its status
              history, resolution notes, and any vendor/repair details.
              This cannot be undone.
            </p>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={cancelDeleteModal}
                disabled={deleting}
                className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition disabled:opacity-60"
              >
                {deleting ? "Deleting…" : "Delete Ticket"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}