import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function MyTickets() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ==========================
  // MODALS
  // ==========================
  const [reviewModal, setReviewModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  useEffect(() => {
    load(page);
  }, [page]);

  const load = async (pageNumber = 1) => {
    try {
      setLoading(true);

      const res = await api.get(
        `/tickets/my?page=${pageNumber}`
      );

      setTickets(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // OPEN TIME
  // ==========================
  const getOpenTime = (createdAt) => {
    const diff = new Date() - new Date(createdAt);

    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);

    return `${hours}h ${mins}m`;
  };

  // ==========================
  // SOLVED TIME
  // ==========================
  const getSolvedTime = (createdAt, resolvedAt) => {
    if (!resolvedAt) return "-";

    const diff =
      new Date(resolvedAt) - new Date(createdAt);

    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);

    return `${hours}h ${mins}m`;
  };

  // ==========================
  // REOPEN
  // ==========================
  const reopenTicket = async (id) => {
    try {
      await api.put(`/tickets/${id}`, {
        status: "Open",
      });

      toast.success("Ticket reopened");
      load(page);
    } catch {
      toast.error("Failed to reopen");
    }
  };

  // ==========================
  // OPEN REVIEW MODAL
  // ==========================
  const openReview = (ticket) => {
    setSelectedTicket(ticket);
    setReviewModal(true);
  };

  // ==========================
  // SUBMIT REVIEW
  // ==========================
  const submitReview = async () => {
    try {
      await api.put(`/tickets/${selectedTicket._id}/review`, {
        rating,
        review: comment,
      });

      toast.success("Review submitted");

      setReviewModal(false);
      setRating(5);
      setComment("");

      load(page);
    } catch {
      toast.error("Failed to submit review");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">

      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">
            My Tickets
          </h1>
          <p className="text-sm text-gray-500">
            Track & manage your requests
          </p>
        </div>

        <button
          onClick={() => navigate("/create")}
          className="bg-black text-white px-4 py-2 rounded-lg"
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

            <thead className="bg-gray-50 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Title</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Open Time</th>
                <th className="px-6 py-3 text-left">Solved Time</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {tickets.map((t) => (
                <tr key={t._id} className="border-t">

                  <td className="px-6 py-4">
                    <p className="font-medium">{t.title}</p>
                    <p className="text-xs text-gray-500">
                      {t.description}
                    </p>
                  </td>

                  <td className="px-6 py-4">
                    {t.status}
                  </td>

                  <td className="px-6 py-4">
                    {getOpenTime(t.createdAt)}
                  </td>

                  <td className="px-6 py-4">
                    {getSolvedTime(t.createdAt, t.resolvedAt)}
                  </td>

                  <td className="px-6 py-4 text-right space-x-2">

                    {/* VIEW */}
                    <button
                      onClick={() => navigate(`/ticket/${t._id}`)}
                      className="text-blue-600"
                    >
                      View
                    </button>

                    {/* EDIT */}
                    {(t.status === "Open" || t.status === "Reopened") && (
                      <button
                        onClick={() =>
                          navigate(`/ticket/edit/${t._id}`)
                        }
                        className="text-indigo-600"
                      >
                        Edit
                      </button>
                    )}

                    {/* REOPEN */}
                    {t.status === "Resolved" && (
                      <button
                        onClick={() => reopenTicket(t._id)}
                        className="text-orange-600"
                      >
                        Reopen
                      </button>
                    )}

                    {/* REVIEW */}
                    {t.status === "Resolved" && (
                      <button
                        onClick={() => openReview(t)}
                        className="text-green-600"
                      >
                        Review
                      </button>
                    )}

                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        )}

      </div>

      {/* ==========================
          ⭐ REVIEW MODAL
      ========================== */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

          <div className="bg-white p-6 rounded-xl w-[400px]">

            <h2 className="text-lg font-semibold mb-3">
              Rate Ticket
            </h2>

            {/* STAR RATING */}
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="w-full border p-2 rounded mb-3"
            >
              {[5,4,3,2,1].map((n) => (
                <option key={n} value={n}>
                  {n} Star
                </option>
              ))}
            </select>

            {/* COMMENT */}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write feedback..."
              className="w-full border p-2 rounded mb-3"
            />

            {/* BUTTONS */}
            <div className="flex justify-end gap-2">

              <button
                onClick={() => setReviewModal(false)}
                className="px-3 py-1 border"
              >
                Cancel
              </button>

              <button
                onClick={submitReview}
                className="px-3 py-1 bg-green-600 text-white rounded"
              >
                Submit
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}