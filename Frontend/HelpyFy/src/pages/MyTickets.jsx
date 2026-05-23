import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function MyTickets() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);

  const [reviewModal, setReviewModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

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

  /* ================= REOPEN (FIXED) ================= */
  const reopenTicket = async (id) => {
    try {
      await api.put(`/tickets/${id}/reopen`);
      toast.success("Ticket reopened");
      load();
    } catch {
      toast.error("Reopen failed");
    }
  };

  /* ================= REVIEW (FIXED) ================= */
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

  /* ================= UI HELPERS ================= */
  const statusBadge = (status) => {
    const base = "px-3 py-1 text-xs rounded-full font-medium";
    switch (status) {
      case "Open":
        return `${base} bg-blue-100 text-blue-700`;
      case "In Progress":
        return `${base} bg-yellow-100 text-yellow-700`;
      case "Resolved":
        return `${base} bg-green-100 text-green-700`;
      case "Reopened":
        return `${base} bg-purple-100 text-purple-700`;
      default:
        return `${base} bg-gray-100 text-gray-600`;
    }
  };

  const priorityBadge = (p) => {
    const base = "text-xs px-2 py-1 rounded";
    if (p === "High") return `${base} bg-red-100 text-red-600`;
    if (p === "Medium") return `${base} bg-yellow-100 text-yellow-700`;
    return `${base} bg-blue-100 text-blue-700`;
  };

  const Stage = ({ status }) => {
    const steps = ["Open", "In Progress", "Resolved"];
    const index = steps.indexOf(status);

    return (
      <div className="flex items-center gap-2 mt-3">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${
                i <= index ? "bg-green-500" : "bg-gray-300"
              }`}
            />
            <span className="text-[10px] text-gray-500">{s}</span>
            {i !== steps.length - 1 && (
              <div className="w-6 h-[2px] bg-gray-200" />
            )}
          </div>
        ))}
      </div>
    );
  };

  const Stars = () => (
    <div className="flex gap-1 text-2xl">
      {[1,2,3,4,5].map((s) => (
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
      <div className="flex justify-between items-center mb-6 bg-white p-5 rounded-xl shadow-sm border">
        <h1 className="text-xl font-semibold">My Tickets</h1>

        <button
          onClick={() => navigate("/create")}
          className="bg-black text-white px-4 py-2 rounded-lg"
        >
          + New Ticket
        </button>
      </div>

      {/* GRID */}
      {loading ? (
        <div className="text-center p-10">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {tickets.map((t) => (
            <div
              key={t._id}
              className="bg-white rounded-xl border shadow-sm p-5 hover:shadow-md transition"
            >

              {/* TOP */}
              <div className="flex justify-between">
                <h2 className="font-semibold text-gray-800">
                  {t.title}
                </h2>

                <div className="flex gap-2">
                  <span className={priorityBadge(t.priority)}>
                    {t.priority}
                  </span>

                  <span className={statusBadge(t.status)}>
                    {t.status}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-1">
                {t.description}
              </p>

              {/* TIMELINE */}
              <Stage status={t.status} />

              {/* ATTACHMENTS */}
              {t.attachments?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {t.attachments.map((a, i) => (
                    <a
                      key={i}
                      href={a}
                      target="_blank"
                      className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded"
                    >
                      📎 Attachment {i + 1}
                    </a>
                  ))}
                </div>
              )}

              {/* ACTIONS */}
              <div className="flex gap-4 mt-4 text-xs">

                <button
                  onClick={() => navigate(`/ticket/${t._id}`)}
                  className="text-blue-600"
                >
                  View
                </button>

                {(t.status === "Open" || t.status === "Reopened") && (
                  <button className="text-indigo-600">
                    Edit
                  </button>
                )}

                {t.status === "Resolved" && (
                  <button
                    onClick={() => reopenTicket(t._id)}
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

              </div>

            </div>
          ))}
        </div>
      )}

      {/* REVIEW MODAL */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-[400px]">

            <h2 className="font-semibold mb-3">
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