import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function MyTickets() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page] = useState(1);

  /* ================= MODALS ================= */
  const [reviewModal, setReviewModal] = useState(false);
  const [editModal, setEditModal] = useState(false);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [editData, setEditData] = useState(null);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  const [image, setImage] = useState(null);

  /* ================= LOAD ================= */
  useEffect(() => {
    load();
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

  /* ================= AUTO REVIEW ON RESOLVE ================= */
  const submitReview = async () => {
    try {
      if (!rating) {
        return toast.error("Please select rating");
      }

      await api.put(
        `/tickets/${selectedTicket._id}/review`,
        {
          rating,
          review: comment,
        }
      );

      await api.put(
        `/tickets/${selectedTicket._id}/confirm`
      );

      toast.success(
        "Ticket confirmed and closed successfully"
      );

      setReviewModal(false);
      setSelectedTicket(null);
      setRating(0);
      setComment("");

      load();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        "Failed to submit feedback"
      );
    }
  };

  /* ================= REOPEN ================= */
  {
    t.status === "Resolved" && (
      <div className="flex gap-2 justify-end">

        <button
          onClick={() => {
            setSelectedTicket(t);
            setRating(0);
            setComment("");
            setReviewModal(true);
          }}
          className="px-3 py-1 text-xs bg-green-600 text-white rounded"
        >
          Confirm
        </button>

        <button
          onClick={() => reopenTicket(t._id)}
          className="px-3 py-1 text-xs bg-orange-50 text-orange-700 rounded"
        >
          Reopen
        </button>

      </div>
    )
  }

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
        formData.append("files", image); // <-- change image to files
      }

      await api.put(
        `/tickets/${editData._id}/edit`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("Ticket updated");
      setEditModal(false);
      load();
    } catch (err) {
      console.log(err.response?.status);
      console.log(err.response?.data);

      toast.error(
        err.response?.data?.message || "Update failed"
      );
    }
  };



  /* ================= FORMAT ================= */
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
    <div className="flex justify-center gap-1 text-2xl">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          onMouseEnter={() => setHoverRating(s)}
          onMouseLeave={() => setHoverRating(0)}
          onClick={() => setRating(s)}
          className={`cursor-pointer ${(hoverRating || rating) >= s
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
        <h1 className="text-lg font-semibold">My Tickets</h1>

        <button
          onClick={() => navigate("/create")}
          className="bg-black text-white px-4 py-2 rounded-lg text-sm"
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

            <thead className="bg-gray-50 text-xs text-gray-600 uppercase">
              <tr>
                <th className="p-4 text-left">Title</th>
                <th className="text-center">Status</th>
                <th className="text-center">Priority</th>
                <th className="text-center">Created</th>
                <th className="text-center">Closed</th>
                <th className="text-right p-4">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {tickets.map((t) => (
                <tr key={t._id} className="hover:bg-gray-50">

                  <td className="p-4">
                    <div className="font-medium">{t.title}</div>
                    <div className="text-xs text-gray-500 truncate max-w-[300px]">
                      {t.description}
                    </div>
                  </td>

                  <td className="text-center">
                    <span className={statusBadge(t.status)}>
                      {t.status}
                    </span>
                  </td>

                  <td className="text-center">
                    <span className={priorityBadge(t.priority)}>
                      {t.priority}
                    </span>
                  </td>

                  <td className="text-center text-xs">
                    {formatDate(t.createdAt)}
                  </td>

                  <td className="text-center text-xs">
                    {t.status === "Resolved"
                      ? formatDate(t.resolvedAt)
                      : "-"}
                  </td>

                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">

                      {(t.status === "Open" || t.status === "Reopened") && (
                        <button
                          onClick={() => openEdit(t)}
                          className="px-3 py-1 text-xs border rounded"
                        >
                          Edit
                        </button>
                      )}

                      {t.status === "Resolved" && (
                        <button
                          onClick={() => reopenTicket(t._id)}
                          className="px-3 py-1 text-xs bg-orange-50 text-orange-700 rounded"
                        >
                          Reopen
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

            <h2 className="text-center font-semibold mb-3">
              Edit Ticket
            </h2>

            <input
              className="w-full border p-2 mb-2"
              value={editData.title}
              onChange={(e) =>
                setEditData({ ...editData, title: e.target.value })
              }
            />

            <textarea
              className="w-full border p-2 mb-2"
              value={editData.description}
              onChange={(e) =>
                setEditData({ ...editData, description: e.target.value })
              }
            />

            <input
              type="file"
              className="w-full border p-2 mb-2"
              onChange={(e) => setImage(e.target.files[0])}
            />

            <div className="flex gap-2">
              <button
                onClick={() => setEditModal(false)}
                className="w-1/2 bg-gray-200 py-2 rounded"
              >
                Cancel
              </button>

              <button
                onClick={updateTicket}
                className="w-1/2 bg-blue-600 text-white py-2 rounded"
              >
                Update
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= AUTO REVIEW MODAL ================= */}
      {reviewModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

          <div className="bg-white rounded-xl w-[450px] p-6">

            <h2 className="text-xl font-semibold text-center">
              Confirm Resolution
            </h2>

            <p className="text-sm text-gray-500 text-center mt-2">
              Are you satisfied with the solution?
            </p>

            <div className="mt-5">
              <Stars />
            </div>

            <textarea
              className="w-full border rounded-lg p-3 mt-4"
              rows={4}
              placeholder="Write your feedback..."
              value={comment}
              onChange={(e) =>
                setComment(e.target.value)
              }
            />

            <div className="flex gap-3 mt-5">

              <button
                onClick={() => {
                  setReviewModal(false);
                  setSelectedTicket(null);
                }}
                className="flex-1 py-2 bg-gray-200 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={submitReview}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg"
              >
                Confirm & Close
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}