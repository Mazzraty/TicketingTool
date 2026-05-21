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
    return `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`;
  };

  const getSolvedTime = (createdAt, resolvedAt) => {
    if (!resolvedAt) return "-";
    const diff = new Date(resolvedAt) - new Date(createdAt);
    return `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`;
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

      toast.success("Review submitted");
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
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
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
        headers: { "Content-Type": "multipart/form-data" },
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
        <h1 className="text-xl font-semibold">My Tickets</h1>

        <button
          onClick={() => navigate("/create")}
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          + New Ticket
        </button>
      </div>

      {/* TABLE CARD */}
      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">

        {loading ? (
          <div className="p-10 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">

              <thead className="bg-gray-100 text-xs uppercase">
                <tr>
                  <th className="p-4 text-left w-[40%]">Ticket</th>
                  <th className="p-4 text-center w-[10%]">Status</th>
                  <th className="p-4 text-center w-[15%]">Open</th>
                  <th className="p-4 text-center w-[15%]">Solved</th>
                  <th className="p-4 text-right w-[20%]">Actions</th>
                </tr>
              </thead>

              <tbody>
                {tickets.map((t) => (
                  <tr key={t._id} className="border-t hover:bg-gray-50">

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

                      <button
                        onClick={() => navigate(`/ticket/${t._id}`)}
                        className="text-blue-600 text-sm hover:underline"
                      >
                        View
                      </button>

                      {(t.status === "Open" || t.status === "Reopened") && (
                        <button
                          onClick={() => openEdit(t)}
                          className="text-indigo-600 text-sm hover:underline"
                        >
                          Edit
                        </button>
                      )}

                      {t.status === "Resolved" && (
                        <button
                          onClick={() => reopenTicket(t._id)}
                          className="text-orange-600 text-sm hover:underline"
                        >
                          Reopen
                        </button>
                      )}

                      {t.status === "Resolved" && (
                        <button
                          onClick={() => openReview(t)}
                          className="text-green-600 text-sm hover:underline"
                        >
                          Review
                        </button>
                      )}

                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}

      </div>

      {/* REVIEW MODAL */}
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
              placeholder="Write feedback..."
            />

            <button
              onClick={submitReview}
              className="bg-green-600 text-white px-4 py-2 rounded w-full"
            >
              Submit
            </button>
          </div>
        </div>
      )}

    </div>
  );
}