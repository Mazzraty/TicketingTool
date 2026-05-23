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

  const [selectedTicket, setSelectedTicket] = useState(null);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    department: "",
    priority: "Low",
  });

  const [editFiles, setEditFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    load(page);
  }, [page]);

  const load = async (pageNumber = 1) => {
    try {
      setLoading(true);

      const res = await api.get(`/tickets/my?page=${pageNumber}`);

      setTickets(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);

    } catch (err) {
      console.error(err);
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

  const reopenTicket = async (id) => {
    try {
      await api.put(`/tickets/${id}/reopen`);

      toast.success("Ticket reopened successfully");

      load(page);

    } catch {
      toast.error("Failed to reopen");
    }
  };

  const openReview = (ticket) => {
    setSelectedTicket(ticket);
    setReviewModal(true);
  };

  const submitReview = async () => {
    try {
      await api.put(`/tickets/${selectedTicket._id}/review`, {
        review: comment,
        rating: Number(rating),
      });

      toast.success("Review submitted successfully");

      setReviewModal(false);

      setComment("");
      setRating(5);

      load(page);

    } catch {
      toast.error("Failed to submit review");
    }
  };

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
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleFiles = (files) => {
    const newFiles = Array.from(files);

    const previewFiles = newFiles.map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
      })
    );

    setEditFiles((prev) => [...prev, ...previewFiles]);
  };

  const handleDrop = (e) => {
    e.preventDefault();

    setDragActive(false);

    handleFiles(e.dataTransfer.files);
  };

  const submitEdit = async () => {
    try {
      const formData = new FormData();

      formData.append("title", editForm.title);
      formData.append("description", editForm.description);
      formData.append("department", editForm.department);
      formData.append("priority", editForm.priority);

      editFiles.forEach((file) => {
        formData.append("files", file);
      });

      await api.put(`/tickets/${selectedTicket._id}/edit`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Ticket updated");

      setEditModal(false);

      load(page);

    } catch {
      toast.error("Update failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg border">
        <h1 className="text-xl font-semibold">
          My Tickets
        </h1>

        <button
          onClick={() => navigate("/create")}
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          + New Ticket
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">

        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading...
          </div>
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              {/* HEADER */}
              <thead className="bg-gray-100 text-xs uppercase">
                <tr>
                  <th className="p-4 text-left w-[40%]">
                    Ticket
                  </th>

                  <th className="p-4 text-center w-[10%]">
                    Status
                  </th>

                  <th className="p-4 text-center w-[15%]">
                    Open
                  </th>

                  <th className="p-4 text-center w-[15%]">
                    Solved
                  </th>

                  <th className="p-4 text-right w-[20%]">
                    Actions
                  </th>
                </tr>
              </thead>

              {/* BODY */}
              <tbody>

                {tickets.map((t) => (
                  <tr
                    key={t._id}
                    className="border-t hover:bg-gray-50"
                  >

                    {/* TITLE */}
                    <td className="p-4 align-top">

                      <p className="font-semibold text-gray-800">
                        {t.title}
                      </p>

                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                        {t.description}
                      </p>

                    </td>

                    {/* STATUS */}
                    <td className="p-4 text-center align-middle">

                      <span className="px-2 py-1 text-xs rounded bg-gray-100">
                        {t.status}
                      </span>

                    </td>

                    {/* OPEN */}
                    <td className="p-4 text-center text-xs text-gray-600 align-middle">
                      {getOpenTime(t.createdAt)}
                    </td>

                    {/* SOLVED */}
                    <td className="p-4 text-center text-xs text-gray-600 align-middle">
                      {getSolvedTime(t.createdAt, t.resolvedAt)}
                    </td>

                    {/* ACTIONS */}
                    <td className="p-4 text-right space-x-2 whitespace-nowrap align-middle">

                      {/* VIEW */}
                      <button
                        onClick={() => navigate(`/ticket/${t._id}`)}
                        className="text-blue-600 text-sm hover:underline"
                      >
                        View
                      </button>

                      {/* EDIT */}
                      {(t.status === "Open" ||
                        t.status === "Reopened") && (
                        <button
                          onClick={() => openEdit(t)}
                          className="text-indigo-600 text-sm hover:underline"
                        >
                          Edit
                        </button>
                      )}

                      {/* REOPEN */}
                      {t.status === "Resolved" && (
                        <button
                          onClick={() => reopenTicket(t._id)}
                          className="text-orange-600 text-sm hover:underline"
                        >
                          Reopen
                        </button>
                      )}

                      {/* CONFIRM + REVIEW */}
                      {t.status === "Resolved" && !t.review && (
                        <button
                          onClick={() => openReview(t)}
                          className="text-green-600 text-sm hover:underline"
                        >
                          Confirm & Review
                        </button>
                      )}

                      {/* REVIEWED */}
                      {t.review && (
                        <span className="text-xs font-medium text-green-700">
                          Reviewed
                        </span>
                      )}

                    </td>
                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}
      </div>

      {/* PAGINATION */}
      <div className="flex justify-center items-center gap-2 mt-6">

        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Previous
        </button>

        <span className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Next
        </button>

      </div>

      {/* REVIEW MODAL */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">

          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">

            {/* HEADER */}
            <div className="border-b px-6 py-4">

              <h2 className="text-lg font-semibold text-gray-800">
                Confirm Resolution
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Was your issue resolved successfully?
              </p>

            </div>

            {/* BODY */}
            <div className="p-6">

              {/* STARS */}
              <div className="flex items-center justify-center gap-2 mb-6">

                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-3xl transition ${
                      rating >= star
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                  >
                    ★
                  </button>
                ))}

              </div>

              {/* LABEL */}
              <div className="text-center mb-5">

                <p className="font-medium text-gray-700">
                  {rating === 5 && "Excellent Support"}
                  {rating === 4 && "Very Good"}
                  {rating === 3 && "Good"}
                  {rating === 2 && "Needs Improvement"}
                  {rating === 1 && "Poor Experience"}
                </p>

              </div>

              {/* COMMENT */}
              <textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write your feedback..."
                className="w-full border rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />

            </div>

            {/* FOOTER */}
            <div className="border-t px-6 py-4 flex justify-end gap-3">

              <button
                onClick={() => {
                  setReviewModal(false);
                  setComment("");
                  setRating(5);
                }}
                className="px-4 py-2 rounded-lg border hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                onClick={submitReview}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg"
              >
                Confirm & Submit
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}