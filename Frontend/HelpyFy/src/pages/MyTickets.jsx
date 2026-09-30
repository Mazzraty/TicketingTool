import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Plus,
  Edit,
  RotateCw,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsUp,
  ChevronUp,
  ChevronDown,
  Minus,
  Star,
  Clock,
  Ticket as TicketIcon,
  Wrench,
  Bell,
  Search,
  Paperclip,
} from "lucide-react";

/* =========================
   DESIGN TOKENS
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
    color: "#626F86",
    Icon: Minus,
  };

/* =========================
   REMINDER
   Keep in sync with REMINDER_COOLDOWN_HOURS in ticketController.js
========================= */
const REMINDER_COOLDOWN_HOURS = 4;

const getReminderState = (ticket) => {
  if (!ticket.lastReminderAt) return { locked: false };
  const nextAt =
    new Date(ticket.lastReminderAt).getTime() +
    REMINDER_COOLDOWN_HOURS * 60 * 60 * 1000;
  return { locked: Date.now() < nextAt, nextAt };
};

/* =========================
   LIST SETTINGS
   PAGE_SIZE must match `limit` in getUserTickets
========================= */
const PAGE_SIZE = 5;

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "Open", label: "Open" },
  { key: "In Progress", label: "In Progress" },
  { key: "Resolved", label: "Resolved" },
  { key: "Closed", label: "Closed" },
  { key: "Rejected", label: "Rejected" },
];

// one grid definition shared by the header row and every ticket row
const ROW_GRID =
  "grid grid-cols-[130px_minmax(0,1fr)_110px_130px_110px_200px] items-center gap-4 px-5";

/* =========================
   FORMAT HELPERS
========================= */
const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* =========================
   SMALL UI PIECES
========================= */
const Button = ({
  variant = "primary",
  size = "sm",
  icon: Icon,
  children,
  onClick,
  disabled,
  className = "",
}) => {
  const baseStyles =
    "inline-flex items-center justify-center gap-1.5 rounded-[4px] font-medium transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap";

  const sizes = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-3.5 py-2 text-sm",
  };

  const variants = {
    primary: "bg-[#0B6E76] text-white hover:bg-[#095A61] disabled:opacity-50",
    secondary:
      "bg-white text-[#172B4D] border border-[#C7CDD6] hover:bg-[#F1F3F5] disabled:opacity-50",
    success: "bg-[#1F7A4D] text-white hover:bg-[#186A41] disabled:opacity-50",
    ghost: "text-[#44546F] hover:bg-[#EEF0F3] disabled:opacity-50",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </button>
  );
};

const StatusLozenge = ({ status }) => {
  const meta = getStatusMeta(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[4px] px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap"
      style={{ background: meta.bg, color: meta.text }}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${status === "In Progress" ? "animate-pulse" : ""}`}
        style={{ background: meta.dot }}
      />
      {meta.label}
    </span>
  );
};

const PriorityTag = ({ priority }) => {
  const meta = getPriorityMeta(priority);
  const Icon = meta.Icon;
  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-medium"
      style={{ color: meta.color }}
    >
      <Icon className="w-4 h-4" strokeWidth={2.5} />
      <span className="text-[#172B4D]">{meta.label}</span>
    </span>
  );
};

const StarRating = ({ rating, hoverRating, setHoverRating, onRate }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onMouseEnter={() => setHoverRating(star)}
        onMouseLeave={() => setHoverRating(0)}
        onClick={() => onRate(star)}
        className="transition cursor-pointer"
      >
        <Star
          className={`w-6 h-6 ${(hoverRating || rating) >= star
              ? "fill-amber-400 text-amber-400"
              : "text-[#C7CDD6]"
            }`}
        />
      </button>
    ))}
  </div>
);

const DetailField = ({ label, children }) => (
  <div className="min-w-0">
    <dt className="text-[11px] font-semibold text-[#626F86] mb-0.5">{label}</dt>
    <dd className="text-sm text-[#172B4D] break-words">{children || "-"}</dd>
  </div>
);

/* =========================
   PAGE
========================= */
export default function MyTickets() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ================= MODALS / DRAWER ================= */
  const [reviewModal, setReviewModal] = useState(false);
  const [editModal, setEditModal] = useState(false);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [editData, setEditData] = useState(null);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const [image, setImage] = useState(null);

  // id of the ticket open in the side drawer
  const [detailId, setDetailId] = useState(null);

  /* ================= PAGINATION / FILTERS ================= */
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState(null); // per-status counts from the API

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [remindingId, setRemindingId] = useState(null);

  /* ================= LOAD ================= */
  // Debounce the search box so we don't hit the API on every keystroke
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    load();
  }, [page, statusFilter, search]);

  // Esc closes the drawer
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setDetailId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const load = async () => {
    try {
      setLoading(true);

      const res = await api.get("/tickets/my", {
        params: {
          page,
          status: statusFilter === "all" ? undefined : statusFilter,
          search: search || undefined,
        },
      });

      setTickets(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
      setCounts(res.data.counts || null);
    } catch (err) {
      console.log("LOAD ERROR:", err.response?.status, err.response?.data);
      toast.error(err.response?.data?.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const hasFilters = statusFilter !== "all" || !!search;

  const clearFilters = () => {
    setStatusFilter("all");
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  /* ================= ACTIONS ================= */
  const submitReview = async () => {
    try {
      if (!rating) {
        return toast.error("Please select a rating");
      }

      await api.put(`/tickets/${selectedTicket._id}/review`, {
        rating,
        review: comment,
      });

      if (selectedTicket.status === "Resolved") {
        await api.put(`/tickets/${selectedTicket._id}/confirm`);
        toast.success("Ticket confirmed and closed successfully");
      } else {
        toast.success("Review saved successfully");
      }

      setReviewModal(false);
      setSelectedTicket(null);
      setRating(0);
      setComment("");

      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit feedback");
    }
  };

  const reopenTicket = async (id) => {
    try {
      await api.put(`/tickets/${id}/reopen`);
      toast.success("Ticket reopened");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reopen ticket");
    }
  };

  const sendReminder = async (id) => {
    try {
      setRemindingId(id);
      await api.put(`/tickets/${id}/remind`);
      toast.success("Reminder sent to the support team");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reminder");
    } finally {
      setRemindingId(null);
    }
  };

  const openReview = (ticket) => {
    setSelectedTicket(ticket);
    setRating(0);
    setComment("");
    setReviewModal(true);
  };

  const openEdit = (ticket) => {
    setEditData({ ...ticket });
    setImage(null);
    setEditModal(true);
  };

  const updateTicket = async () => {
    try {
      const formData = new FormData();

      formData.append("title", editData.title);
      formData.append("description", editData.description);
      formData.append("priority", editData.priority);
      formData.append("department", editData.department);

      if (image) {
        formData.append("files", image);
      }

      await api.put(`/tickets/${editData._id}/edit`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Ticket updated successfully");
      setEditModal(false);
      setEditData(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  /* ================= CONTEXTUAL ACTION BUTTONS =================
     Used both in the table row and in the drawer. */
  const renderActions = (ticket) => {
    const { locked } = getReminderState(ticket);

    return (
      <>
        {(ticket.status === "Open" || ticket.status === "Reopened") && (
          <Button variant="secondary" icon={Edit} onClick={() => openEdit(ticket)}>
            Edit
          </Button>
        )}

        {ticket.status === "In Progress" && (
          <Button
            variant="secondary"
            icon={Bell}
            onClick={() => sendReminder(ticket._id)}
            disabled={locked || remindingId === ticket._id}
          >
            {remindingId === ticket._id
              ? "Sending..."
              : locked
                ? "Reminder sent"
                : "Send reminder"}
          </Button>
        )}

        {(ticket.status === "Resolved" || ticket.status === "Closed") && (
          <Button variant="success" icon={Check} onClick={() => openReview(ticket)}>
            {ticket.status === "Closed" ? "Review" : "Confirm"}
          </Button>
        )}

        {ticket.status === "Resolved" && (
          <Button variant="secondary" icon={RotateCw} onClick={() => reopenTicket(ticket._id)}>
            Reopen
          </Button>
        )}
      </>
    );
  };

  /* ================= PAGINATION WINDOW ================= */
  const getPageNumbers = () => {
    const maxButtons = 5;
    const pages = [];

    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + maxButtons - 1);

    if (end - start < maxButtons - 1) {
      start = Math.max(1, end - maxButtons + 1);
    }

    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const pageNumbers = getPageNumbers();
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  // The drawer reads from the loaded list so it refreshes after every action
  const detail = detailId ? tickets.find((t) => t._id === detailId) : null;

  const pageBtn =
    "w-8 h-8 rounded-[4px] text-sm font-medium transition-colors cursor-pointer";

  return (
    <div
      className="min-h-screen bg-[#F4F5F7]"
      style={{ fontFamily: "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* Font import — remove if you already load these via index.html */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
      `}</style>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* PAGE HEADER */}
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl font-semibold text-[#172B4D] tracking-tight">
              My tickets
            </h1>
            <p className="mt-0.5 text-sm text-[#626F86]">
              Requests you have raised with IT support
            </p>
          </div>
          <Button variant="primary" size="md" icon={Plus} onClick={() => navigate("/create")}>
            New ticket
          </Button>
        </div>

        {/* LIST CARD */}
        <div className="bg-white border border-[#DFE1E6] rounded-lg overflow-hidden">
          {/* TOOLBAR: status tabs + search */}
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between px-5 pt-2 border-b border-[#DFE1E6]">
            <div className="flex flex-wrap items-center gap-x-1">
              {STATUS_TABS.map((tab) => {
                const active = statusFilter === tab.key;
                const count = counts ? counts[tab.key] : undefined;
                return (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setStatusFilter(tab.key);
                      setPage(1);
                    }}
                    className={`relative flex items-center gap-1.5 px-3 py-3 text-sm font-medium transition-colors cursor-pointer ${active
                        ? "text-[#0B6E76]"
                        : "text-[#626F86] hover:text-[#172B4D]"
                      }`}
                  >
                    {tab.label}
                    {count !== undefined && (
                      <span
                        className={`min-w-[20px] rounded-full px-1.5 py-px text-[11px] font-semibold text-center ${active
                            ? "bg-[#0B6E76] text-white"
                            : "bg-[#EEF0F3] text-[#44546F]"
                          }`}
                      >
                        {count}
                      </span>
                    )}
                    {active && (
                      <span className="absolute left-2 right-2 -bottom-px h-0.5 bg-[#0B6E76] rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full md:w-72 pb-2 md:pb-2.5">
              <Search className="absolute left-3 top-[18px] md:top-[19px] -translate-y-1/2 w-4 h-4 text-[#8590A2]" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by number or title"
                className="w-full pl-9 pr-8 py-1.5 text-sm bg-white border border-[#C7CDD6] rounded-[4px] hover:bg-[#F7F8F9] focus:bg-white focus:ring-2 focus:ring-[#0B6E76]/30 focus:border-[#0B6E76] outline-none transition"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-2.5 top-[18px] md:top-[19px] -translate-y-1/2 text-[#8590A2] hover:text-[#172B4D] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <div className="min-w-[980px]">
              {/* column headers */}
              <div
                className={`${ROW_GRID} py-2.5 bg-[#F7F8F9] border-b border-[#DFE1E6] text-xs font-semibold text-[#626F86]`}
              >
                <span>Number</span>
                <span>Summary</span>
                <span>Priority</span>
                <span>Status</span>
                <span>Created</span>
                <span className="text-right">Actions</span>
              </div>

              {/* loading */}
              {loading && (
                <div>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`${ROW_GRID} py-5 border-b border-[#EBECF0]`}>
                      <div className="h-3 w-24 rounded bg-[#EEF0F3] animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-3 w-2/3 rounded bg-[#EEF0F3] animate-pulse" />
                        <div className="h-2.5 w-1/3 rounded bg-[#F4F5F7] animate-pulse" />
                      </div>
                      <div className="h-3 w-16 rounded bg-[#EEF0F3] animate-pulse" />
                      <div className="h-5 w-20 rounded bg-[#EEF0F3] animate-pulse" />
                      <div className="h-3 w-20 rounded bg-[#EEF0F3] animate-pulse" />
                      <div />
                    </div>
                  ))}
                </div>
              )}

              {/* empty */}
              {!loading && tickets.length === 0 && (
                <div className="py-16 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#EEF0F3] mb-3">
                    <TicketIcon className="w-5 h-5 text-[#8590A2]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#172B4D]">
                    {hasFilters ? "No tickets match these filters" : "You have no tickets yet"}
                  </h3>
                  <p className="mt-1 text-sm text-[#626F86]">
                    {hasFilters
                      ? "Change the status tab or search term"
                      : "Raise a request and it will show up here"}
                  </p>
                  <div className="mt-5">
                    {hasFilters ? (
                      <Button variant="secondary" size="md" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="md"
                        icon={Plus}
                        onClick={() => navigate("/create")}
                      >
                        New ticket
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* rows */}
              {!loading &&
                tickets.map((ticket) => {
                  const isSelected = detailId === ticket._id;
                  return (
                    <div
                      key={ticket._id}
                      onClick={() => setDetailId(ticket._id)}
                      className={`${ROW_GRID} py-3.5 border-b border-[#EBECF0] cursor-pointer transition-colors ${isSelected ? "bg-[#E6F3F4]" : "hover:bg-[#F7F8F9]"
                        }`}
                    >
                      <span
                        className="text-[13px] font-medium text-[#0B6E76] break-all"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        {ticket.ticketNumber || "-"}
                      </span>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#172B4D] truncate">
                          {ticket.title}
                        </p>
                        <p className="mt-0.5 text-xs text-[#626F86] truncate">
                          {ticket.department ? `${ticket.department} · ` : ""}
                          {ticket.description}
                        </p>
                      </div>

                      <PriorityTag priority={ticket.priority} />

                      <div>
                        <StatusLozenge status={ticket.status} />
                      </div>

                      <span className="text-xs text-[#44546F]">
                        {formatDate(ticket.createdAt)}
                      </span>

                      <div
                        className="flex items-center justify-end gap-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {renderActions(ticket)}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* FOOTER / PAGINATION */}
          {!loading && tickets.length > 0 && (
            <div className="px-5 py-3 bg-white flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-[#626F86]">
                Showing{" "}
                <span className="font-semibold text-[#172B4D]">
                  {rangeStart}–{rangeEnd}
                </span>{" "}
                of <span className="font-semibold text-[#172B4D]">{total}</span> tickets
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  icon={ChevronLeft}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>

                {pageNumbers[0] > 1 && (
                  <>
                    <button
                      onClick={() => setPage(1)}
                      className={`${pageBtn} text-[#44546F] hover:bg-[#EEF0F3]`}
                    >
                      1
                    </button>
                    {pageNumbers[0] > 2 && <span className="px-1 text-[#8590A2] text-sm">…</span>}
                  </>
                )}

                {pageNumbers.map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`${pageBtn} ${page === n
                        ? "bg-[#0B6E76] text-white"
                        : "text-[#44546F] hover:bg-[#EEF0F3]"
                      }`}
                  >
                    {n}
                  </button>
                ))}

                {pageNumbers[pageNumbers.length - 1] < totalPages && (
                  <>
                    {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                      <span className="px-1 text-[#8590A2] text-sm">…</span>
                    )}
                    <button
                      onClick={() => setPage(totalPages)}
                      className={`${pageBtn} text-[#44546F] hover:bg-[#EEF0F3]`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <Button
                  variant="secondary"
                  icon={ChevronRight}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= DETAIL DRAWER ================= */}
      {detail && (
        <div className="fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-[#091E42]/30"
            onClick={() => setDetailId(null)}
          />

          <aside className="absolute right-0 top-0 bottom-0 w-full max-w-[500px] bg-white shadow-2xl border-l border-[#DFE1E6] flex flex-col">
            {/* header */}
            <div className="px-6 pt-5 pb-4 border-b border-[#DFE1E6]">
              <div className="flex items-start justify-between gap-4">
                <span
                  className="text-[13px] font-medium text-[#0B6E76]"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {detail.ticketNumber || "-"}
                </span>
                <button
                  onClick={() => setDetailId(null)}
                  className="text-[#626F86] hover:text-[#172B4D] hover:bg-[#EEF0F3] rounded-[4px] p-1 -m-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <h2 className="mt-2 text-lg font-semibold text-[#172B4D] leading-snug break-words">
                {detail.title}
              </h2>

              <div className="mt-3 flex flex-wrap items-center gap-4">
                <StatusLozenge status={detail.status} />
                <PriorityTag priority={detail.priority} />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {renderActions(detail)}
              </div>
            </div>

            {/* body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* outcome banners */}
              {detail.status === "Rejected" && detail.rejectionReason && (
                <div className="flex items-start gap-2.5 bg-[#FFECEB] border border-[#FFD5D2] rounded-[4px] px-3.5 py-3">
                  <X className="w-4 h-4 text-[#AE2A19] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#AE2A19]">Rejected</p>
                    <p className="text-sm text-[#AE2A19] leading-relaxed">
                      {detail.rejectionReason}
                    </p>
                  </div>
                </div>
              )}

              {detail.resolutionNote && (
                <div className="flex items-start gap-2.5 bg-[#DFF7E8] border border-[#BCEBD0] rounded-[4px] px-3.5 py-3">
                  <Check className="w-4 h-4 text-[#146C3E] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#146C3E]">Resolution note</p>
                    <p className="text-sm text-[#146C3E] leading-relaxed">
                      {detail.resolutionNote}
                    </p>
                  </div>
                </div>
              )}

              {detail.resolutionType === "External Vendor" && detail.vendorDetails && (
                <div className="flex items-start gap-2.5 bg-[#F3EEFF] border border-[#E1D5F7] rounded-[4px] px-3.5 py-3">
                  <Wrench className="w-4 h-4 text-[#6B46C1] shrink-0 mt-0.5" />
                  <div className="min-w-0 text-sm">
                    <p className="text-xs font-semibold text-[#5B37AF]">Sent to vendor</p>
                    <p className="text-[#5B37AF]">
                      {detail.vendorDetails.vendorName || "-"}
                      {detail.vendorDetails.repairDate &&
                        ` · ${formatDate(detail.vendorDetails.repairDate)}`}
                    </p>
                    {detail.vendorDetails.complaintDescription && (
                      <p className="text-[#7C5FCC] text-xs mt-0.5">
                        {detail.vendorDetails.complaintDescription}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* description */}
              <section>
                <h3 className="text-xs font-semibold text-[#626F86] mb-1.5">Description</h3>
                <p className="text-sm text-[#172B4D] leading-relaxed whitespace-pre-wrap break-words">
                  {detail.description || "-"}
                </p>
              </section>

              {/* details grid */}
              <section>
                <h3 className="text-xs font-semibold text-[#626F86] mb-2.5">Details</h3>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-[4px] border border-[#DFE1E6] p-4">
                  <DetailField label="Department">{detail.department}</DetailField>
                  <DetailField label="Related to">{detail.relatedTo}</DetailField>
                  <DetailField label="Created">{formatDateTime(detail.createdAt)}</DetailField>
                  <DetailField label="Resolution due">
                    {["Open", "In Progress", "Reopened"].includes(detail.status) &&
                      detail.sla?.resolutionDue ? (
                      <span
                        className={
                          new Date(detail.sla.resolutionDue).getTime() < Date.now()
                            ? "text-[#AE2A19] font-medium"
                            : ""
                        }
                      >
                        {formatDateTime(detail.sla.resolutionDue)}
                      </span>
                    ) : null}
                  </DetailField>
                  {detail.resolvedAt && (
                    <DetailField label="Resolved">{formatDateTime(detail.resolvedAt)}</DetailField>
                  )}
                  {detail.closedAt && (
                    <DetailField label="Closed">{formatDateTime(detail.closedAt)}</DetailField>
                  )}
                  {detail.status === "In Progress" && detail.lastReminderAt && (
                    <DetailField label="Last reminder">
                      {formatDateTime(detail.lastReminderAt)}
                    </DetailField>
                  )}
                  {detail.rating > 0 && (
                    <DetailField label="Your rating">{`${detail.rating}/5`}</DetailField>
                  )}
                </dl>
              </section>

              {/* attachments */}
              {detail.attachments?.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-[#626F86] mb-2">
                    Attachments ({detail.attachments.length})
                  </h3>
                  <ul className="space-y-1.5">
                    {detail.attachments.map((url, i) => (
                      <li key={url + i}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm text-[#0B6E76] hover:underline"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          Attachment {i + 1}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* activity timeline */}
              {detail.statusHistory?.length > 0 && (
                <section>
                  <h3 className="text-xs font-semibold text-[#626F86] mb-3">Activity</h3>
                  <ol className="relative ml-1.5 border-l border-[#DFE1E6] space-y-4">
                    {[...detail.statusHistory].reverse().map((h, i) => {
                      const meta = getStatusMeta(h.status);
                      return (
                        <li key={i} className="pl-5 relative">
                          <span
                            className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white"
                            style={{ background: meta.dot }}
                          />
                          <p className="text-sm text-[#172B4D] break-words">
                            {h.note || `Status changed to ${h.status}`}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-[#8590A2]">
                            <Clock className="w-3 h-3" />
                            {formatDateTime(h.changedAt)}
                          </p>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* ================= EDIT MODAL ================= */}
      {editModal && editData && (
        <div className="fixed inset-0 bg-[#091E42]/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg border border-[#DFE1E6]">
            <div className="border-b border-[#DFE1E6] px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#172B4D]">Edit ticket</h2>
                {editData.ticketNumber && (
                  <p
                    className="mt-0.5 text-xs text-[#626F86]"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    {editData.ticketNumber}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setEditModal(false);
                  setEditData(null);
                }}
                className="text-[#626F86] hover:text-[#172B4D] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#172B4D] mb-1.5">Title</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-[#C7CDD6] rounded-[4px] focus:ring-2 focus:ring-[#0B6E76]/30 focus:border-[#0B6E76] outline-none transition"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#172B4D] mb-1.5">
                  Description
                </label>
                <textarea
                  className="w-full px-3 py-2 text-sm border border-[#C7CDD6] rounded-[4px] focus:ring-2 focus:ring-[#0B6E76]/30 focus:border-[#0B6E76] outline-none transition resize-none"
                  rows={4}
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#172B4D] mb-1.5">
                  Attachment
                </label>
                <input
                  type="file"
                  className="w-full px-3 py-2 text-sm border border-[#C7CDD6] rounded-[4px] focus:ring-2 focus:ring-[#0B6E76]/30 focus:border-[#0B6E76] outline-none transition"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                />
                {image && (
                  <p className="mt-2 text-sm text-[#1F7A4D] flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    {image.name}
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-[#DFE1E6] px-6 py-4 flex gap-2 justify-end bg-[#F7F8F9] rounded-b-lg">
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setEditModal(false);
                  setEditData(null);
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" size="md" icon={Check} onClick={updateTicket}>
                Save changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================= REVIEW MODAL ================= */}
      {reviewModal && selectedTicket && (
        <div className="fixed inset-0 bg-[#091E42]/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg border border-[#DFE1E6]">
            <div className="border-b border-[#DFE1E6] px-6 py-4">
              <h2 className="text-lg font-semibold text-[#172B4D]">
                {selectedTicket.status === "Resolved" ? "Confirm resolution" : "Review ticket"}
              </h2>
              <p className="mt-1 text-sm text-[#44546F]">{selectedTicket.title}</p>
              {selectedTicket.ticketNumber && (
                <p
                  className="mt-0.5 text-xs text-[#626F86]"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {selectedTicket.ticketNumber}
                </p>
              )}
            </div>

            <div className="px-6 py-5 space-y-5">
              {selectedTicket.resolutionNote && (
                <div className="flex items-start gap-2.5 bg-[#DFF7E8] border border-[#BCEBD0] rounded-[4px] px-3.5 py-3">
                  <Check className="w-4 h-4 text-[#146C3E] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-[#146C3E]">Resolution note</p>
                    <p className="text-sm text-[#146C3E] leading-relaxed mt-0.5">
                      {selectedTicket.resolutionNote}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold text-[#172B4D] mb-3">
                  How satisfied are you with this resolution?
                </p>
                <StarRating
                  rating={rating}
                  hoverRating={hoverRating}
                  setHoverRating={setHoverRating}
                  onRate={setRating}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#172B4D] mb-1.5">
                  Feedback (optional)
                </label>
                <textarea
                  className="w-full px-3 py-2 text-sm border border-[#C7CDD6] rounded-[4px] focus:ring-2 focus:ring-[#0B6E76]/30 focus:border-[#0B6E76] outline-none transition resize-none"
                  rows={4}
                  placeholder="Share your experience..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
            </div>

            <div className="border-t border-[#DFE1E6] px-6 py-4 flex gap-2 justify-end bg-[#F7F8F9] rounded-b-lg">
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setReviewModal(false);
                  setSelectedTicket(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="success"
                size="md"
                icon={Check}
                onClick={submitReview}
                disabled={!rating}
              >
                {selectedTicket.status === "Resolved" ? "Confirm and close" : "Save review"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}