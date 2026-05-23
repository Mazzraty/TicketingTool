import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function MyTickets() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  /* ================= MODALS ================= */
  const [reviewModal, setReviewModal] = useState(false);
  const [editModal, setEditModal] = useState(false);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [editData, setEditData] = useState(null);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    load(page);
  }, [page]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/tickets/my?page=${page}`);
      setTickets(res.data.data || []);
    } catch {
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  /* ================= REOPEN ================= */
  const reopenTicket = async (id) => {
    try {
      await api.put(`/tickets/${id}/reopen`);
      toast.success("Ticket reopened");
      load();
    } catch {
      toast.error("Reopen failed");
    }
  };

  /* ================= EDIT ================= */
  const openEdit = (ticket) => {
    setEditData({ ...ticket });
    setEditModal(true);
  };

  const updateTicket = async () => {
    try {
      await api.put(`/tickets/${editData._id}`, {
        title: editData.title,
        description: editData.description,
        priority: editData.priority,
        department: editData.department,
      });

      toast.success("Ticket updated");
      setEditModal(false);
      load();
    } catch {
      toast.error("Update failed");
    }
  };

  /* ================= REVIEW ================= */
  const openReview = (ticket) => {
    setSelectedTicket(ticket);
    setRating(ticket.rating || 0);
    setComment(ticket.review || "");
    setReviewModal(true);
  };

  const submitReview = async () => {
    try {
      await api.put(`/tickets/${selectedTicket._id}/review`, {
        rating,
        review: comment,
      });

      toast.success("Review saved");
      setReviewModal(false);
      load();
    } catch {
      toast.error("Review failed");
    }
  };

  /* ================= DATE FORMAT ================= */
  const formatDate = (date) => {
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
  const statusBadge = (status) => {
    const base = "px-2 py-1 text-[11px] rounded font-medium";
    switch (status) {
      case "Open":
        return `${base} bg-blue-50 text-blue-700`;
      case "In Progress":
        return `${base} bg-yellow-50 text-yellow-700`;
      case "Resolved":
        return `${base} bg-green-50 text-green-700`;
      case "Reopened":
        return `${base} bg-purple-50 text-purple-700`;
      default:
        return `${base} bg-gray-100 text-gray-600`;
    }
  };

  const priorityBadge = (p) => {
    const base = "px-2 py-1 text-[11px] rounded font-medium";
    if (p === "High") return `${base} bg-red-50 text-red-600`;
    if (p === "Medium") return `${base} bg-yellow-50 text-yellow-700`;
    return `${base} bg-blue-50 text-blue-700`;
  };

  const Stars = () => (
    <div className="flex gap-1 text-2xl justify-center">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          onMouseEnter={() => setHoverRating(s)}
          onMouseLeave={() => setHoverRating(0)}
          onClick={() => setRating(s)}
          className={`cursor-pointer ${
            (hoverRating || rating) >= s
              ? "text-yellow-400"
              : "text-gray-300"
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 bg-white p-5 rounded-xl border shadow-sm">
        <h1 className="text-lg font-semibold text-gray-800">
          My Tickets
        </h1>

        <button
          onClick={() => navigate("/create")}
          className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800"
        >
          + New Ticket
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">

        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading tickets...
          </div>
        ) : (
          <table className="w-full text-sm">

            {/* HEADER */}
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="p-4 text-left">Title</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Priority</th>
                <th className="p-4 text-center">Department</th>
                <th className="p-4 text-center">Created</th>
                <th className="p-4 text-center">Closed</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>

            {/* BODY */}
            <tbody className="divide-y divide-gray-100">
              {tickets.map((t) => (
                <tr key={t._id} className="hover:bg-gray-50">

                  {/* TITLE */}
                  <td className="p-4">
                    <div className="font-medium">{t.title}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[300px]">
                      {t.description}
                    </div>
                  </td>

                  {/* STATUS */}
                  <td className="p-4 text-center">
                    <span className={statusBadge(t.status)}>
                      {t.status}
                    </span>
                  </td>

                  {/* PRIORITY */}
                  <td className="p-4 text-center">
                    <span className={priorityBadge(t.priority)}>
                      {t.priority}
                    </span>
                  </td>

                  {/* DEPARTMENT */}
                  <td className="p-4 text-center text-xs text-gray-600">
                    {t.department || "-"}
                  </td>

                  {/* CREATED */}
                  <td className="p-4 text-center text-xs text-gray-600">
                    {formatDate(t.createdAt)}
                  </td>

                  {/* CLOSED */}
                  <td className="p-4 text-center text-xs text-gray-600">
                    {t.status === "Resolved"
                      ? formatDate(t.resolvedAt || t.closedAt)
                      : "-"}
                  </td>

                  {/* ACTIONS */}
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">

                      {(t.status === "Open" || t.status === "Reopened") && (
                        <button
                          onClick={() => openEdit(t)}
                          className="px-3 py-1 text-xs border rounded hover:bg-gray-100"
                        >
                          Edit
                        </button>
                      )}

                      {t.status === "Resolved" && (
                        <button
                          onClick={() => reopenTicket(t._id)}
                          className="px-3 py-1 text-xs bg-orange-50 text-orange-700 rounded hover:bg-orange-100"
                        >
                          Reopen
                        </button>
                      )}

                      {t.status === "Resolved" && (
                        <button
                          onClick={() => openReview(t)}
                          className="px-3 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100"
                        >
                          {t.review ? "Edit Review" : "Review"}
                        </button>
                      )}

                    </div>
                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        )}
      </div>

      {/* ================= EDIT MODAL ================= */}
      {editModal && editData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-[450px]">

            <h2 className="font-semibold mb-3 text-center">
              Edit Ticket
            </h2>

            <input
              className="w-full border p-2 rounded mb-2"
              value={editData.title}
              onChange={(e) =>
                setEditData({ ...editData, title: e.target.value })
              }
            />

            <textarea
              className="w-full border p-2 rounded mb-2"
              value={editData.description}
              onChange={(e) =>
                setEditData({ ...editData, description: e.target.value })
              }
            />

            <select
              className="w-full border p-2 rounded mb-2"
              value={editData.priority}
              onChange={(e) =>
                setEditData({ ...editData, priority: e.target.value })
              }
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>

            <button
              onClick={updateTicket}
              className="bg-blue-600 text-white w-full py-2 rounded"
            >
              Update Ticket
            </button>

          </div>
        </div>
      )}

      {/* ================= REVIEW MODAL ================= */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-[400px]">

            <h2 className="font-semibold mb-3 text-center">
              Rate Ticket
            </h2>

            <Stars />

            <textarea
              className="w-full border p-2 mt-3 rounded"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write feedback..."
            />

            <button
              onClick={submitReview}
              className="bg-green-600 text-white w-full py-2 mt-3 rounded"
            >
              Submit
            </button>

          </div>
        </div>
      )}

    </div>
  );
}