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
  AlertCircle,
  Calendar,
  Clock,
  MessageSquare,
} from "lucide-react";

export default function MyTickets() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedTicket, setExpandedTicket] = useState(null);

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

  /* ================= BADGES ================= */
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "in progress":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "reopened":
        return "bg-purple-100 text-purple-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
          className={`transition ${interactive ? "cursor-pointer" : "cursor-default"
            }`}
        >
          <Star
            className={`w-5 h-5 ${(interactive ? hoverRating : rating) >= star
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
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
      "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 cursor-pointer";

    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
    };

    const variants = {
      primary:
        "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 active:scale-95",
      secondary:
        "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 active:scale-95",
      danger:
        "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 active:scale-95",
      success:
        "bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 active:scale-95",
      ghost:
        "text-gray-700 hover:bg-gray-100 disabled:opacity-50 active:scale-95",
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

  /* ================= PAGINATION WINDOW =================
     Builds a sliding window of page numbers centered on the
     current page (works correctly for any totalPages, not just
     the first 5). Always includes first/last page with "…" gaps. */
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
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Tickets</h1>
              <p className="mt-1 text-sm text-gray-600">
                Track and manage your support requests
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              icon={Plus}
              onClick={() => navigate("/create")}
            >
              New Ticket
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* LOADING STATE */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium">Loading your tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          /* EMPTY STATE */
          <div className="rounded-lg border border-gray-200 bg-white p-16 text-center shadow-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <MessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              No tickets yet
            </h3>
            <p className="mt-2 text-sm text-gray-600">
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
          /* TABLE */
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Ticket #
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Closed
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* TICKET NUMBER */}
                      <td className="px-6 py-4 align-top">
                        <p className="font-mono text-xs text-gray-500 whitespace-nowrap">
                          {ticket.ticketNumber || "-"}
                        </p>
                      </td>

                      {/* TITLE & DESCRIPTION */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 truncate">
                              {ticket.title}
                            </p>
                            <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                              {ticket.description}
                            </p>
                            {ticket.department && (
                              <p className="mt-2 text-xs text-gray-500">
                                {ticket.department}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            ticket.status
                          )}`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${ticket.status === "Open"
                              ? "bg-blue-500"
                              : ticket.status === "In Progress"
                                ? "bg-yellow-500 animate-pulse"
                                : ticket.status === "Resolved"
                                  ? "bg-green-500"
                                  : "bg-gray-500"
                              }`}
                          ></div>
                          {ticket.status}
                        </span>
                      </td>

                      {/* PRIORITY */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(
                            ticket.priority
                          )}`}
                        >
                          {ticket.priority}
                        </span>
                      </td>

                      {/* CREATED DATE */}
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {formatDate(ticket.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {ticket.closedAt ? formatDateTime(ticket.closedAt) : "-"}
                        </div>
                      </td>
                      {/* ACTIONS */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {(ticket.status === "Open" ||
                            ticket.status === "Reopened") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                icon={Edit}
                                onClick={() => openEdit(ticket)}
                              >
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page <span className="font-medium">{page}</span> of{" "}
                <span className="font-medium">{totalPages}</span>
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
                        className="w-8 h-8 rounded-lg font-medium transition bg-white text-gray-700 border border-gray-300 hover:border-gray-400"
                      >
                        1
                      </button>
                      {pageNumbers[0] > 2 && (
                        <span className="px-1 text-gray-400 text-sm">…</span>
                      )}
                    </>
                  )}

                  {pageNumbers.map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 rounded-lg font-medium transition ${page === pageNum
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:border-gray-400"
                        }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  {pageNumbers[pageNumbers.length - 1] < totalPages && (
                    <>
                      {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                        <span className="px-1 text-gray-400 text-sm">…</span>
                      )}
                      <button
                        onClick={() => setPage(totalPages)}
                        className="w-8 h-8 rounded-lg font-medium transition bg-white text-gray-700 border border-gray-300 hover:border-gray-400"
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            {/* HEADER */}
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Edit Ticket
                </h2>
                {editData.ticketNumber && (
                  <p className="mt-0.5 text-xs font-mono text-gray-400">
                    {editData.ticketNumber}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setEditModal(false);
                  setEditData(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CONTENT */}
            <div className="px-6 py-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  value={editData.title}
                  onChange={(e) =>
                    setEditData({ ...editData, title: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Description
                </label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                  rows={4}
                  value={editData.description}
                  onChange={(e) =>
                    setEditData({ ...editData, description: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Attachment
                </label>
                <input
                  type="file"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                />
                {image && (
                  <p className="mt-2 text-sm text-green-600 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    {image.name}
                  </p>
                )}
              </div>
            </div>

            {/* FOOTER */}
            <div className="border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
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
              <Button
                variant="primary"
                size="md"
                icon={Check}
                onClick={updateTicket}
              >
                Update
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================= REVIEW MODAL ================= */}
      {reviewModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            {/* HEADER */}
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Confirm Resolution
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {selectedTicket.title}
              </p>
              {selectedTicket.ticketNumber && (
                <p className="mt-0.5 text-xs font-mono text-gray-400">
                  {selectedTicket.ticketNumber}
                </p>
              )}
            </div>

            {/* CONTENT */}
            <div className="px-6 py-6 space-y-6">
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-4">
                  How satisfied are you with this resolution?
                </p>
                <StarRating
                  rating={rating}
                  onRate={setRating}
                  interactive={true}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Feedback (optional)
                </label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                  rows={4}
                  placeholder="Share your experience..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              {rating > 0 && (
                <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg border border-green-200">
                  <Check className="w-5 h-5 text-green-600" />
                  <p className="text-sm text-green-800">
                    You rated this ticket{" "}
                    <span className="font-semibold">{rating}/5 stars</span>
                  </p>
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
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