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

  // ==========================
  // MODALS
  // ==========================
  const [reviewModal, setReviewModal] = useState(false);
  const [editModal, setEditModal] = useState(false);

  const [selectedTicket, setSelectedTicket] = useState(null);

  // REVIEW
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  // EDIT FORM
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
  // LOAD TICKETS
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
  // 🔥 FIXED REOPEN (NO LOGOUT ISSUE)
  // ==========================
  const reopenTicket = async (id) => {
    try {
      await api.put(`/tickets/${id}/reopen`);
      toast.success("Ticket reopened");
      load(page);
    } catch (err) {
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
  // EDIT OPEN
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

  // ==========================
  // FILE HANDLING
  // ==========================
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

  // ==========================
  // SUBMIT EDIT
  // ==========================
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
  // UI
  // ==========================
  return (
    <div className="min-h-screen bg-slate-50 p-6">

      {/* HEADER */}
      <div className="flex justify-between mb-6">
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
            <thead className="bg-gray-50 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Title</th>
                <th>Status</th>
                <th>Open</th>
                <th>Solved</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>

            <tbody>
              {tickets.map((t) => (
                <tr key={t._id} className="border-t">

                  <td className="px-6 py-3">
                    <p className="font-medium">{t.title}</p>
                    <p className="text-xs text-gray-500">{t.description}</p>
                  </td>

                  <td>{t.status}</td>
                  <td>{getOpenTime(t.createdAt)}</td>
                  <td>{getSolvedTime(t.createdAt, t.resolvedAt)}</td>

                  <td className="text-right space-x-2 px-3">

                    <button onClick={() => navigate(`/ticket/${t._id}`)} className="text-blue-600">
                      View
                    </button>

                    {(t.status === "Open" || t.status === "Reopened") && (
                      <button onClick={() => openEdit(t)} className="text-indigo-600">
                        Edit
                      </button>
                    )}

                    {t.status === "Resolved" && (
                      <button onClick={() => reopenTicket(t._id)} className="text-orange-600">
                        Reopen
                      </button>
                    )}

                    {t.status === "Resolved" && (
                      <button onClick={() => openReview(t)} className="text-green-600">
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
          <div className="bg-white p-6 rounded-xl w-[500px]">

            <h2 className="text-lg font-semibold mb-3">Edit Ticket</h2>

            <input
              name="title"
              value={editForm.title}
              onChange={handleEditChange}
              className="w-full border p-2 mb-2"
              placeholder="Title"
            />

            <textarea
              name="description"
              value={editForm.description}
              onChange={handleEditChange}
              className="w-full border p-2 mb-2"
              placeholder="Description"
            />

            {/* DROP ZONE */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
              className={`border-2 border-dashed p-4 text-center mb-3 cursor-pointer ${
                dragActive ? "border-blue-500 bg-blue-50" : ""
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
                  <img src={file.preview} className="h-20 w-full object-cover rounded" />
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
              <button onClick={() => setEditModal(false)} className="border px-3 py-1">
                Cancel
              </button>

              <button onClick={submitEdit} className="bg-indigo-600 text-white px-3 py-1">
                Save
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= REVIEW MODAL ================= */}
      {reviewModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-[400px]">

            <h2 className="font-semibold mb-3">Rate Ticket</h2>

            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="w-full border p-2 mb-2"
            >
              {[5,4,3,2,1].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border p-2 mb-2"
            />

            <button onClick={submitReview} className="bg-green-600 text-white px-3 py-1">
              Submit
            </button>

          </div>
        </div>
      )}

    </div>
  );
}