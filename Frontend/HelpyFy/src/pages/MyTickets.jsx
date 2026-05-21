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

  // ==========================
  // LOAD
  // ==========================
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

  // ==========================
  // TIME HELPERS
  // ==========================
  const getOpenTime = (createdAt) => {
    const diff = new Date() - new Date(createdAt);
    return `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`;
  };

  const getSolvedTime = (createdAt, resolvedAt) => {
    if (!resolvedAt) return "-";
    const diff = new Date(resolvedAt) - new Date(createdAt);
    return `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`;
  };

  // ==========================
  // REOPEN
  // ==========================
  const reopenTicket = async (id) => {
    try {
      await api.put(`/tickets/${id}/reopen`);
      toast.success("Ticket reopened");
      load(page);
    } catch {
      toast.error("Failed to reopen");
    }
  };

  // ==========================
  // REVIEW
  // ==========================
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

      toast.success("Review submitted");

      setReviewModal(false);
      setComment("");
      setRating(5);
      load(page);
    } catch {
      toast.error("Failed to submit review");
    }
  };

  // ==========================
  // EDIT
  // ==========================
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

  const handleFiles = (files) => {
    const newFiles = Array.from(files).map((file) =>
      Object.assign(file, {
        preview: URL.createObjectURL(file),
      })
    );

    setEditFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    const updated = [...editFiles];
    updated.splice(index, 1);
    setEditFiles(updated);
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
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Ticket updated");

      setEditModal(false);
      load(page);
    } catch {
      toast.error("Update failed");
    }
  };

  // ==========================
  // UI STYLE HELPERS (SAP STYLE)
  // ==========================
  const statusColor = (status) => {
    switch (status) {
      case "Open":
        return "bg-blue-100 text-blue-700";
      case "In Progress":
        return "bg-yellow-100 text-yellow-700";
      case "Resolved":
        return "bg-green-100 text-green-700";
      case "Closed":
        return "bg-gray-200 text-gray-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // ==========================
  // STAR UI
  // ==========================
  const Star = ({ value }) => {
    return (
      <span className="text-yellow-400 text-2xl">
        {"★".repeat(value)}
        {"☆".repeat(5 - value)}
      </span>
    );
  };

  // ==========================
  // MAIN UI
  // ==========================
  return (
    <div className="min-h-screen bg-[#f4f6f9] p-6">

      {/* HEADER */}
      <div className="bg-white shadow-sm border rounded-lg px-6 py-4 flex justify-between items-center mb-6">
        <h1 className="text-lg font-semibold text-gray-800">My Tickets</h1>

        <button
          onClick={() => navigate("/create")}
          className="bg-[#0a6ed1] hover:bg-[#0854a0] text-white px-5 py-2 rounded-md text-sm"
        >
          + New Ticket
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">

        {loading ? (
          <div className="p-10 text-center text-gray-500">Loading...</div>
        ) : (
          <table className="w-full text-sm">

            <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-6 py-4 text-left">Ticket</th>
                <th>Status</th>
                <th>Open</th>
                <th>Solved</th>
                <th className="text-right px-6">Actions</th>
              </tr>
            </thead>

            <tbody>
              {tickets.map((t) => (
                <tr key={t._id} className="border-t hover:bg-gray-50">

                  {/* TITLE */}
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-800">{t.title}</p>
                    <p className="text-xs text-gray-500">{t.description}</p>
                  </td>

                  {/* STATUS */}
                  <td>
                    <span className={`px-3 py-1 text-xs rounded-full ${statusColor(t.status)}`}>
                      {t.status}
                    </span>
                  </td>

                  {/* OPEN */}
                  <td className="text-xs text-gray-600">
                    {getOpenTime(t.createdAt)}
                  </td>

                  {/* SOLVED */}
                  <td className="text-xs text-gray-600">
                    {getSolvedTime(t.createdAt, t.resolvedAt)}
                  </td>

                  {/* ACTIONS */}
                  <td className="text-right px-6 space-x-3">

                    <button
                      onClick={() => navigate(`/ticket/${t._id}`)}
                      className="text-[#0a6ed1] hover:underline"
                    >
                      View
                    </button>

                    {(t.status === "Open" || t.status === "Reopened") && (
                      <button
                        onClick={() => openEdit(t)}
                        className="text-indigo-600 hover:underline"
                      >
                        Edit
                      </button>
                    )}

                    {t.status === "Resolved" && (
                      <button
                        onClick={() => reopenTicket(t._id)}
                        className="text-orange-600 hover:underline"
                      >
                        Reopen
                      </button>
                    )}

                    {t.status === "Resolved" && (
                      <button
                        onClick={() => openReview(t)}
                        className="text-green-600 hover:underline"
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

      {/* ================= EDIT MODAL ================= */}
      {editModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

          <div className="bg-white w-[520px] rounded-xl shadow-lg p-6">

            <h2 className="text-lg font-semibold mb-4">Edit Ticket</h2>

            <input
              name="title"
              value={editForm.title}
              onChange={handleEditChange}
              className="w-full border rounded-md p-2 mb-3"
              placeholder="Title"
            />

            <textarea
              name="description"
              value={editForm.description}
              onChange={handleEditChange}
              className="w-full border rounded-md p-2 mb-3"
              placeholder="Description"
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
              className={`border-2 border-dashed p-4 text-center mb-3 rounded-md cursor-pointer ${
                dragActive ? "border-[#0a6ed1] bg-blue-50" : ""
              }`}
            >
              Drag & Drop files or click
            </div>

            <input
              type="file"
              multiple
              hidden
              ref={fileInputRef}
              onChange={(e) => handleFiles(e.target.files)}
            />

            {/* PREVIEW */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {editFiles.map((file, i) => (
                <div key={i} className="relative">
                  <img
                    src={file.preview}
                    className="h-20 w-full object-cover rounded"
                  />
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute top-0 right-0 bg-red-500 text-white px-1"
                  >
                    X
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditModal(false)}
                className="border px-4 py-2 rounded-md"
              >
                Cancel
              </button>

              <button
                onClick={submitEdit}
                className="bg-[#0a6ed1] text-white px-4 py-2 rounded-md"
              >
                Save
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= REVIEW MODAL ================= */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

          <div className="bg-white w-[420px] rounded-xl shadow-lg p-6">

            <h2 className="font-semibold mb-4">Rate Ticket</h2>

            {/* STAR UI */}
            <div className="flex gap-1 text-3xl mb-4 cursor-pointer">
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  onClick={() => setRating(n)}
                  className={`${
                    rating >= n ? "text-yellow-400" : "text-gray-300"
                  }`}
                >
                  ★
                </span>
              ))}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border rounded-md p-2 mb-3"
              placeholder="Write review..."
            />

            <button
              onClick={submitReview}
              className="w-full bg-[#0a6ed1] text-white py-2 rounded-md"
            >
              Submit
            </button>

          </div>
        </div>
      )}

    </div>
  );
}