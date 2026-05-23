import { useEffect, useState, useRef } from "react";
import api from "../api/axios.js";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function MyTickets() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [reviewModal, setReviewModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [reopenModal, setReopenModal] = useState(false);

  const [selectedTicket, setSelectedTicket] = useState(null);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    department: "",
    priority: "Low",
  });

  const [editFiles, setEditFiles] = useState([]);

  useEffect(() => {
    load(page);
  }, [page]);

  const load = async (pageNumber = 1) => {
    try {
      setLoading(true);
      const res = await api.get(`/tickets/my?page=${pageNumber}`);
      setTickets(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const getOpenTime = (createdAt) => {
    const diff = new Date() - new Date(createdAt);
    return `${Math.floor(diff / 3600000)}h ${Math.floor(
      (diff % 3600000) / 60000
    )}m`;
  };

  const getSolvedTime = (createdAt, resolvedAt) => {
    if (!resolvedAt) return "-";
    const diff = new Date(resolvedAt) - new Date(createdAt);
    return `${Math.floor(diff / 3600000)}h ${Math.floor(
      (diff % 3600000) / 60000
    )}m`;
  };

  /* ================= REOPEN CONFIRM ================= */
  const askReopen = (ticket) => {
    setSelectedTicket(ticket);
    setReopenModal(true);
  };

  const confirmReopen = async () => {
    try {
      await api.put(`/tickets/${selectedTicket._id}/reopen`);
      toast.success("Ticket reopened");
      setReopenModal(false);
      load(page);
    } catch {
      toast.error("Failed to reopen");
    }
  };

  /* ================= STAR REVIEW ================= */
  const openReview = (ticket) => {
    setSelectedTicket(ticket);

    // if editing existing review
    setRating(ticket.rating || 0);
    setComment(ticket.review || "");

    setReviewModal(true);
  };

  const submitReview = async () => {
    try {
      await api.put(`/tickets/${selectedTicket._id}/review`, {
        review: comment,
        rating,
      });

      toast.success("Review saved");

      setReviewModal(false);
      setRating(0);
      setComment("");

      load(page);
    } catch {
      toast.error("Failed to submit review");
    }
  };

  /* ================= EDIT ================= */
  const openEdit = (ticket) => {
    setSelectedTicket(ticket);

    setEditForm({
      title: ticket.title,
      description: ticket.description,
      department: ticket.department,
      priority: ticket.priority,
    });

    setEditFiles([]);
    setEditModal(true);
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const submitEdit = async () => {
    try {
      const formData = new FormData();

      Object.keys(editForm).forEach((k) =>
        formData.append(k, editForm[k])
      );

      editFiles.forEach((f) => formData.append("files", f));

      await api.put(`/tickets/${selectedTicket._id}/edit`, formData);

      toast.success("Ticket updated");
      setEditModal(false);
      load(page);
    } catch {
      toast.error("Update failed");
    }
  };

  /* ================= STAR UI ================= */
  const StarRating = () => {
    return (
      <div className="flex gap-1 text-2xl cursor-pointer">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(star)}
            className={`${
              (hoverRating || rating) >= star
                ? "text-yellow-400"
                : "text-gray-300"
            }`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg border">
        <h1 className="text-xl font-semibold">My Tickets</h1>

        <button
          onClick={() => navigate("/create")}
          className="bg-black text-white px-4 py-2 rounded"
        >
          + New Ticket
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-10 text-center">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Ticket</th>
                <th>Status</th>
                <th>Open</th>
                <th>Solved</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {tickets.map((t) => (
                <tr key={t._id} className="border-t">

                  <td className="p-3">
                    <div className="font-semibold">{t.title}</div>
                    <div className="text-xs text-gray-500">
                      {t.description}
                    </div>
                  </td>

                  <td className="text-center">{t.status}</td>

                  <td className="text-center">
                    {getOpenTime(t.createdAt)}
                  </td>

                  <td className="text-center">
                    {getSolvedTime(t.createdAt, t.resolvedAt)}
                  </td>

                  <td className="text-right space-x-2 p-2">

                    <button
                      onClick={() => navigate(`/ticket/${t._id}`)}
                      className="text-blue-600"
                    >
                      View
                    </button>

                    {(t.status === "Open" || t.status === "Reopened") && (
                      <button
                        onClick={() => openEdit(t)}
                        className="text-indigo-600"
                      >
                        Edit
                      </button>
                    )}

                    {t.status === "Resolved" && (
                      <button
                        onClick={() => askReopen(t)}
                        className="text-orange-600"
                      >
                        Reopen
                      </button>
                    )}

                    {t.status === "Resolved" && (
                      <button
                        onClick={() => openReview(t)}
                        className="text-green-600"
                      >
                        {t.review ? "Edit Review" : "Review"}
                      </button>
                    )}

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ================= REOPEN MODAL ================= */}
      {reopenModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-[350px]">

            <h2 className="font-semibold mb-3">
              Confirm Reopen Ticket?
            </h2>

            <p className="text-sm text-gray-500 mb-4">
              This will move ticket back to active state.
            </p>

            <div className="flex gap-2">
              <button
                onClick={confirmReopen}
                className="bg-orange-600 text-white px-4 py-2 w-full"
              >
                Yes Reopen
              </button>

              <button
                onClick={() => setReopenModal(false)}
                className="border px-4 py-2 w-full"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= REVIEW MODAL ================= */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

          <div className="bg-white p-6 rounded-xl w-[400px]">

            <h2 className="font-semibold mb-3">
              Rate & Review Ticket
            </h2>

            <div className="mb-3">
              <StarRating />
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border p-2 mb-2"
              placeholder="Write feedback..."
            />

            <button
              onClick={submitReview}
              className="bg-green-600 text-white w-full py-2"
            >
              Save Review
            </button>

          </div>
        </div>
      )}

    </div>
  );
}