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

  const [reviewModal, setReviewModal] = useState(false);
  const [reopenModal, setReopenModal] = useState(false);

  const [selectedTicket, setSelectedTicket] = useState(null);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

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

  /* ================= TIMELINE ================= */
  const getStage = (t) => {
    if (t.status === "Open") return 1;
    if (t.status === "In Progress") return 2;
    if (t.status === "Resolved") return 3;
    return 0;
  };

  const StageBar = ({ ticket }) => {
    const stage = getStage(ticket);

    const steps = [
      "Open",
      "In Progress",
      "Resolved",
    ];

    return (
      <div className="flex items-center gap-2 mt-3">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">

            <div
              className={`h-2 w-2 rounded-full ${
                stage >= i + 1 ? "bg-green-500" : "bg-gray-300"
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

  /* ================= ATTACHMENTS ================= */
  const renderFiles = (files = []) => {
    if (!files.length) return null;

    return (
      <div className="mt-2 flex flex-wrap gap-2">
        {files.map((f, i) => (
          <a
            key={i}
            href={f.url || f}
            target="_blank"
            className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded"
          >
            📎 File {i + 1}
          </a>
        ))}
      </div>
    );
  };

  /* ================= STATUS BADGE ================= */
  const badge = (status) => {
    const base = "text-xs px-2 py-1 rounded-full";

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

  /* ================= STAR UI ================= */
  const Stars = () => (
    <div className="flex gap-1 text-2xl">
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
    <div className="min-h-screen bg-slate-50 p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 bg-white p-5 rounded-xl border">
        <h1 className="text-xl font-semibold">My Tickets</h1>

        <button
          onClick={() => navigate("/create")}
          className="bg-black text-white px-4 py-2 rounded"
        >
          + New Ticket
        </button>
      </div>

      {/* GRID CARDS */}
      {loading ? (
        <div className="text-center p-10">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {tickets.map((t) => (
            <div
              key={t._id}
              className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition"
            >

              {/* TOP */}
              <div className="flex justify-between">
                <h2 className="font-semibold">{t.title}</h2>

                <span className={badge(t.status)}>
                  {t.status}
                </span>
              </div>

              <p className="text-xs text-gray-500 mt-1">
                {t.description}
              </p>

              {/* TIMELINE */}
              <StageBar ticket={t} />

              {/* ATTACHMENTS */}
              {renderFiles(t.files || t.attachments)}

              {/* ACTIONS */}
              <div className="flex flex-wrap gap-3 mt-4 text-xs">

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
                  <button className="text-orange-600">
                    Reopen
                  </button>
                )}

                {t.status === "Resolved" && (
                  <button className="text-green-600">
                    {t.review ? "Edit Review" : "Review"}
                  </button>
                )}

              </div>

            </div>
          ))}

        </div>
      )}

    </div>
  );
}