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
  Star,
  Calendar,
  Clock,
  Ticket as TicketIcon,
  Wrench,
} from "lucide-react";

/* =========================
   DESIGN TOKENS
   (single source of truth for status / priority colors)
========================= */
const STATUS_META = {
  open: { label: "Open", bg: "#EAF1FB", text: "#1E4A85", dot: "#2B5FA8" },
  "in progress": { label: "In Progress", bg: "#FBF1E1", text: "#8A5709", dot: "#B7791F" },
  resolved: { label: "Resolved", bg: "#E7F5EC", text: "#1B6B43", dot: "#1F7A4D" },
  reopened: { label: "Reopened", bg: "#F1ECFB", text: "#5B37AF", dot: "#6B46C1" },
  closed: { label: "Closed", bg: "#EEF0F2", text: "#4A5260", dot: "#5B6472" },
  // NEW: super_admin-only rejection status, surfaced read-only here
  rejected: { label: "Rejected", bg: "#FCEAEF", text: "#9F1239", dot: "#E11D48" },
};

const PRIORITY_META = {
  critical: { bg: "#FCEAE9", text: "#A01F15" },
  high: { bg: "#FBEFE3", text: "#9C5416" },
  medium: { bg: "#FBF1E1", text: "#8A5709" },
  low: { bg: "#E7F5EC", text: "#1B6B43" },
};

const getStatusMeta = (status) =>
  STATUS_META[status?.toLowerCase()] || STATUS_META.closed;

const getPriorityMeta = (priority) =>
  PRIORITY_META[priority?.toLowerCase()] || {
    bg: "#EEF0F2",
    text: "#4A5260",
  };

export default function MyTickets() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ================= MODALS ================= */
  const [reviewModal, setReviewModal] = useState(false);
  const [editModal, setEditModal] = useState(false);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [editData, setEditData] = useState(null);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const [image, setImage] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  /* ================= LOAD ================= */
  useEffect(() => {
    load();
  }, [page]);

  const load = async () => {
    try {
      setLoading(true);

      const res = await api.get("/tickets/my", {
        params: { page },
      });

      setTickets(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.log("LOAD ERROR:", err.response?.status, err.response?.data);
      toast.error(err.response?.data?.message || "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  /* ================= SUBMIT REVIEW ================= */
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

  /* ================= REOPEN ================= */
  const reopenTicket = async (id) => {
    try {
      await api.put(`/tickets/${id}/reopen`);
      toast.success("Ticket reopened");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reopen ticket");
    }
  };

  /* ================= EDIT ================= */
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
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Ticket updated successfully");
      setEditModal(false);
      setEditData(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    }
  };

  /* ================= FORMAT ================= */
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

  const StarRating = ({ rating, onRate, interactive = true }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onMouseEnter={() => interactive && setHoverRating(star)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          onClick={() => interactive && onRate(star)}
          className={`transition ${interactive ? "cursor-pointer" : "cursor-default"}`}
        >
          <Star
            className={`w-5 h-5 ${(interactive ? hoverRating : rating) >= star
                ? "fill-amber-400 text-amber-400"
                : "text-[#D7DBE1]"
              }`}
          />
        </button>
      ))}
    </div>
  );

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
      "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all duration-150 cursor-pointer";

    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
    };

    const variants = {
      primary:
        "bg-[#0B6E76] text-white hover:bg-[#095A61] disabled:opacity-50 active:scale-[0.98]",
      secondary:
        "bg-white text-[#12161C] border border-[#D7DBE1] hover:border-[#0B6E76] hover:text-[#0B6E76] disabled:opacity-50 active:scale-[0.98]",
      danger:
        "bg-[#B42318] text-white hover:bg-[#961D13] disabled:opacity-50 active:scale-[0.98]",
      success:
        "bg-[#1F7A4D] text-white hover:bg-[#186A41] disabled:opacity-50 active:scale-[0.98]",
      ghost:
        "text-[#5B6472] hover:bg-[#EEF0F2] disabled:opacity-50 active:scale-[0.98]",
    };

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
      >
        {Icon && <Icon className="w-4 h-4" />}
        {children}
      </button>
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

  return (
    <div
      className="min-h-screen bg-[#F5F6F8]"
      style={{ fontFamily: "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* Font import — remove if you already load these via index.html */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
      `}</style>

      {/* HEADER */}
      <div className="bg-white border-b border-[#E2E5EA]">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1
                className="text-[28px] font-semibold text-[#12161C] tracking-tight"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                My Tickets
              </h1>
              <p className="mt-1 text-sm text-[#5B6472]">
                Track and manage your support requests
              </p>
            </div>
            <Button variant="primary" size="md" icon={Plus} onClick={() => navigate("/create")}>
              New Ticket
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* LOADING STATE */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 rounded-xl bg-white border border-[#E2E5EA] animate-pulse"
              />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          /* EMPTY STATE */
          <div className="rounded-xl border border-dashed border-[#D7DBE1] bg-white p-16 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#EEF0F2] mb-4">
              <TicketIcon className="w-6 h-6 text-[#8A93A3]" />
            </div>
            <h3
              className="text-lg font-semibold text-[#12161C]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              No tickets yet
            </h3>
            <p className="mt-1.5 text-sm text-[#5B6472]">
              Create your first support request to get started
            </p>
            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => navigate("/create")}
              className="mt-6"
            >
              Create Ticket
            </Button>
          </div>
        ) : (
          /* TICKET STUBS */
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const statusMeta = getStatusMeta(ticket.status);
              const priorityMeta = getPriorityMeta(ticket.priority);
              const isRejected = ticket.status === "Rejected";

              return (
                <div
                  key={ticket._id}
                  className="relative flex rounded-xl border border-[#E2E5EA] bg-white overflow-hidden shadow-[0_1px_2px_rgba(18,22,28,0.04)]"
                >
                  {/* status rail */}
                  <span
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{ background: statusMeta.dot }}
                  />

                  {/* ticket stub */}
                  <div className="w-40 md:w-44 shrink-0 pl-6 pr-4 py-5 flex flex-col justify-between">
                    <div>
                      <p
                        className="text-[11px] text-[#5B6472] tracking-wide break-all"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        {ticket.ticketNumber || "—"}
                      </p>
                      <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#8A93A3]">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(ticket.createdAt)}
                      </div>
                    </div>

                    <span
                      className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                      style={{ background: statusMeta.bg, color: statusMeta.text }}
                    >
                      {isRejected ? (
                        <X className="w-3 h-3" />
                      ) : (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${ticket.status === "In Progress" ? "animate-pulse" : ""
                            }`}
                          style={{ background: statusMeta.dot }}
                        />
                      )}
                      {statusMeta.label}
                    </span>
                  </div>

                  {/* perforation */}
                  <div className="relative w-0 my-4 shrink-0">
                    <div className="absolute inset-y-0 left-0 border-l border-dashed border-[#D7DBE1]" />
                    <span className="absolute -left-[7px] -top-[7px] w-3.5 h-3.5 rounded-full bg-[#F5F6F8] border border-[#E2E5EA]" />
                    <span className="absolute -left-[7px] -bottom-[7px] w-3.5 h-3.5 rounded-full bg-[#F5F6F8] border border-[#E2E5EA]" />
                  </div>

                  {/* details */}
                  <div className="flex-1 min-w-0 px-6 py-5 flex flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-[15px] text-[#12161C] truncate">
                          {ticket.title}
                        </h3>
                        <p className="mt-1 text-sm text-[#5B6472] line-clamp-2">
                          {ticket.description}
                        </p>
                        {ticket.department && (
                          <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-[#8A93A3]">
                            {ticket.department}
                          </p>
                        )}
                      </div>

                      <span
                        className="shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{ background: priorityMeta.bg, color: priorityMeta.text }}
                      >
                        {ticket.priority}
                      </span>
                    </div>

                    {/* REJECTION REASON — only ever set when a super_admin
                        rejects the ticket; shown instead of a resolution
                        note since a rejected ticket was never resolved. */}
                    {isRejected && ticket.rejectionReason && (
                      <div className="mt-3 flex items-start gap-2 bg-[#FCEAEF] border border-[#F8D2DE] rounded-lg px-3 py-2.5">
                        <X className="w-3.5 h-3.5 text-[#9F1239] shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-[#9F1239] uppercase tracking-wide">
                            Rejection Reason
                          </p>
                          <p className="text-sm text-[#9F1239] leading-relaxed">
                            {ticket.rejectionReason}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* RESOLUTION NOTE */}
                    {ticket.resolutionNote && (
                      <div className="mt-3 flex items-start gap-2 bg-[#E7F5EC] border border-[#CDEAD9] rounded-lg px-3 py-2.5">
                        <Check className="w-3.5 h-3.5 text-[#1F7A4D] shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-[#1B6B43] uppercase tracking-wide">
                            Resolution Note
                          </p>
                          <p className="text-sm text-[#1B6B43] leading-relaxed">
                            {ticket.resolutionNote}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* VENDOR DETAILS */}
                    {ticket.resolutionType === "External Vendor" && ticket.vendorDetails && (
                      <div className="mt-2 flex items-start gap-2 bg-[#F1ECFB] border border-[#E1D5F7] rounded-lg px-3 py-2.5">
                        <Wrench className="w-3.5 h-3.5 text-[#6B46C1] shrink-0 mt-0.5" />
                        <div className="min-w-0 text-sm">
                          <p className="text-[11px] font-semibold text-[#5B37AF] uppercase tracking-wide">
                            Sent to Vendor
                          </p>
                          <p className="text-[#5B37AF]">
                            {ticket.vendorDetails.vendorName || "-"}
                            {ticket.vendorDetails.repairDate &&
                              ` · ${formatDate(ticket.vendorDetails.repairDate)}`}
                          </p>
                          {ticket.vendorDetails.complaintDescription && (
                            <p className="text-[#7C5FCC] text-xs mt-0.5">
                              {ticket.vendorDetails.complaintDescription}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* FOOTER: closed date + actions */}
                    <div className="mt-4 pt-3 border-t border-[#EEF0F2] flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-[#8A93A3]">
                        <Clock className="w-3.5 h-3.5" />
                        {isRejected
                          ? `Rejected ${formatDateTime(ticket.rejectedAt)}`
                          : ticket.closedAt
                            ? `Closed ${formatDateTime(ticket.closedAt)}`
                            : "Not closed"}
                      </div>

                      <div className="flex items-center gap-2">
                        {(ticket.status === "Open" || ticket.status === "Reopened") && (
                          <Button variant="ghost" size="sm" icon={Edit} onClick={() => openEdit(ticket)}>
                            Edit
                          </Button>
                        )}

                        {(ticket.status === "Resolved" || ticket.status === "Closed") && (
                          <>
                            <Button
                              variant="success"
                              size="sm"
                              icon={Check}
                              onClick={() => {
                                setSelectedTicket(ticket);
                                setRating(0);
                                setComment("");
                                setReviewModal(true);
                              }}
                            >
                              {ticket.status === "Closed" ? "Review" : "Confirm"}
                            </Button>

                            {ticket.status === "Resolved" && (
                              <Button
                                variant="secondary"
                                size="sm"
                                icon={RotateCw}
                                onClick={() => reopenTicket(ticket._id)}
                              >
                                Reopen
                              </Button>
                            )}
                          </>
                        )}

                        {/* Rejected tickets are a dead end for the user —
                            no edit/confirm/reopen actions apply, since the
                            ticket was never worked and can't be resolved.
                            The reason above explains why; nothing to do here. */}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* PAGINATION */}
            <div className="mt-4 bg-white border border-[#E2E5EA] rounded-xl px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-[#5B6472]">
                Page <span className="font-semibold text-[#12161C]">{page}</span> of{" "}
                <span className="font-semibold text-[#12161C]">{totalPages}</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={ChevronLeft}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {pageNumbers[0] > 1 && (
                    <>
                      <button
                        onClick={() => setPage(1)}
                        className="w-8 h-8 rounded-lg text-sm font-medium transition bg-white text-[#5B6472] border border-[#E2E5EA] hover:border-[#0B6E76]"
                      >
                        1
                      </button>
                      {pageNumbers[0] > 2 && (
                        <span className="px-1 text-[#8A93A3] text-sm">…</span>
                      )}
                    </>
                  )}

                  {pageNumbers.map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition ${page === pageNum
                          ? "bg-[#0B6E76] text-white"
                          : "bg-white text-[#5B6472] border border-[#E2E5EA] hover:border-[#0B6E76]"
                        }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  {pageNumbers[pageNumbers.length - 1] < totalPages && (
                    <>
                      {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                        <span className="px-1 text-[#8A93A3] text-sm">…</span>
                      )}
                      <button
                        onClick={() => setPage(totalPages)}
                        className="w-8 h-8 rounded-lg text-sm font-medium transition bg-white text-[#5B6472] border border-[#E2E5EA] hover:border-[#0B6E76]"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  icon={ChevronRight}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= EDIT MODAL ================= */}
      {editModal && editData && (
        <div className="fixed inset-0 bg-[#12161C]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-[#E2E5EA]">
            <div className="border-b border-[#E2E5EA] px-6 py-4 flex items-center justify-between">
              <div>
                <h2
                  className="text-lg font-semibold text-[#12161C]"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Edit Ticket
                </h2>
                {editData.ticketNumber && (
                  <p
                    className="mt-0.5 text-xs text-[#8A93A3]"
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
                className="text-[#8A93A3] hover:text-[#12161C] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#12161C] mb-2">Title</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-[#D7DBE1] rounded-lg focus:ring-2 focus:ring-[#0B6E76]/30 focus:border-[#0B6E76] outline-none transition"
                  value={editData.title}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#12161C] mb-2">
                  Description
                </label>
                <textarea
                  className="w-full px-4 py-2 border border-[#D7DBE1] rounded-lg focus:ring-2 focus:ring-[#0B6E76]/30 focus:border-[#0B6E76] outline-none transition resize-none"
                  rows={4}
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#12161C] mb-2">
                  Attachment
                </label>
                <input
                  type="file"
                  className="w-full px-4 py-2 border border-[#D7DBE1] rounded-lg focus:ring-2 focus:ring-[#0B6E76]/30 focus:border-[#0B6E76] outline-none transition"
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

            <div className="border-t border-[#E2E5EA] px-6 py-4 flex gap-3 justify-end">
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
                Update
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================= REVIEW MODAL ================= */}
      {reviewModal && selectedTicket && (
        <div className="fixed inset-0 bg-[#12161C]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-[#E2E5EA]">
            <div className="border-b border-[#E2E5EA] px-6 py-4">
              <h2
                className="text-lg font-semibold text-[#12161C]"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Confirm Resolution
              </h2>
              <p className="mt-1 text-sm text-[#5B6472]">{selectedTicket.title}</p>
              {selectedTicket.ticketNumber && (
                <p
                  className="mt-0.5 text-xs text-[#8A93A3]"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {selectedTicket.ticketNumber}
                </p>
              )}
            </div>

            <div className="px-6 py-6 space-y-6">
              {selectedTicket.resolutionNote && (
                <div className="flex items-start gap-2 bg-[#E7F5EC] border border-[#CDEAD9] rounded-lg px-4 py-3">
                  <Check className="w-4 h-4 text-[#1F7A4D] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-[#1B6B43] uppercase tracking-wide">
                      Resolution Note
                    </p>
                    <p className="text-sm text-[#1B6B43] leading-relaxed mt-0.5">
                      {selectedTicket.resolutionNote}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold text-[#12161C] mb-4">
                  How satisfied are you with this resolution?
                </p>
                <StarRating rating={rating} onRate={setRating} interactive={true} />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#12161C] mb-2">
                  Feedback (optional)
                </label>
                <textarea
                  className="w-full px-4 py-2 border border-[#D7DBE1] rounded-lg focus:ring-2 focus:ring-[#0B6E76]/30 focus:border-[#0B6E76] outline-none transition resize-none"
                  rows={4}
                  placeholder="Share your experience..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              {rating > 0 && (
                <div className="flex items-center gap-2 p-4 bg-[#E7F5EC] rounded-lg border border-[#CDEAD9]">
                  <Check className="w-5 h-5 text-[#1F7A4D]" />
                  <p className="text-sm text-[#1B6B43]">
                    You rated this ticket <span className="font-semibold">{rating}/5 stars</span>
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-[#E2E5EA] px-6 py-4 flex gap-3 justify-end">
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
                Confirm & Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}