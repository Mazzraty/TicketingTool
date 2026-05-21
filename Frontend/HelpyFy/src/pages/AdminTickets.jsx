import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
  });

  // ================= LOAD =================
  useEffect(() => {
    load(page);
    loadStats();
  }, [page]);

  const load = async (pageNumber = 1) => {
    try {
      setLoading(true);
      const res = await api.get(`/tickets?page=${pageNumber}&limit=10`);
      setTickets(res.data.data || []);
      setTotalPages(res.data.pages || 1);
    } catch {
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await api.get("/tickets/stats");
      setStats(res.data || stats);
    } catch {
      toast.error("Failed to load stats");
    }
  };

  // ================= STATUS UPDATE =================
  const updateStatus = async (id, status) => {
    try {
      await api.put(`/tickets/${id}`, { status });
      toast.success("Status updated");
      load(page);
      loadStats();
    } catch {
      toast.error("Update failed");
    }
  };

  // ================= FILTER =================
  const filtered = tickets.filter((t) => {
    const s = search.toLowerCase();
    return (
      t.title?.toLowerCase().includes(s) ||
      t.userId?.email?.toLowerCase().includes(s) ||
      t.priority?.toLowerCase().includes(s) ||
      t.status?.toLowerCase().includes(s)
    );
  });

  // ================= PRIORITY COLORS =================
  const priorityColor = (p) => {
    if (p === "High") return "bg-red-100 text-red-700";
    if (p === "Medium") return "bg-yellow-100 text-yellow-700";
    if (p === "Low") return "bg-blue-100 text-blue-700";
    return "bg-gray-100 text-gray-600";
  };

  // ================= TIME =================
  const getOpenTime = (createdAt) => {
    const diff = new Date() - new Date(createdAt);
    return `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`;
  };

  const getSolvedTime = (createdAt, resolvedAt) => {
    if (!resolvedAt) return "-";
    const diff = new Date(resolvedAt) - new Date(createdAt);
    return `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`;
  };

  // ================= STAR =================
  const renderStars = (rating) => (
    <span className="text-yellow-500 text-sm">
      {"★".repeat(rating || 0)}
      {"☆".repeat(5 - (rating || 0))}
    </span>
  );

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex">

      {/* ================= SIDE DRAWER (SAP STYLE) ================= */}
      {selected && (
        <div className="w-[420px] bg-white border-l shadow-xl p-5">

          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="font-bold text-lg">Ticket Preview</h2>
            <button onClick={() => setSelected(null)}>✕</button>
          </div>

          <p className="font-semibold mt-3 text-gray-800">
            {selected.title}
          </p>

          <p className="text-xs text-gray-500">
            {selected.userId?.email}
          </p>

          {/* COMPLAINT */}
          <div className="mt-3 bg-gray-50 p-3 rounded border text-sm">
            {selected.description}
          </div>

          {/* ATTACHMENTS */}
          <div className="mt-4">
            <p className="text-xs font-semibold mb-2">Attachments</p>

            {selected.attachments?.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {selected.attachments.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    className="h-24 w-full object-cover rounded border"
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No attachments</p>
            )}
          </div>

          {/* REVIEW */}
          <div className="mt-4">
            <p className="text-xs font-semibold mb-1">Review</p>

            {selected.rating ? (
              <>
                {renderStars(selected.rating)}
                <p className="text-xs text-gray-600 mt-1">
                  {selected.review}
                </p>
              </>
            ) : (
              <p className="text-xs text-gray-400">No review</p>
            )}
          </div>
        </div>
      )}

      {/* ================= MAIN ================= */}
      <div className="flex-1 p-6">

        {/* HEADER */}
        <div className="flex justify-between bg-white p-4 rounded border">
          <h1 className="font-bold text-lg">Ticket Management</h1>

          <input
            className="border px-3 py-1 rounded text-sm w-64"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* STATS */}
        <div className="grid grid-cols-5 gap-3 mt-4">
          {Object.entries(stats).map(([k, v]) => (
            <div key={k} className="bg-white border rounded p-3">
              <p className="text-xs text-gray-500 capitalize">{k}</p>
              <p className="font-bold text-lg">{v}</p>
            </div>
          ))}
        </div>

        {/* TABLE */}
        <div className="bg-white mt-4 border rounded-xl overflow-hidden">

          {loading ? (
            <div className="p-10 text-center">Loading...</div>
          ) : (
            <table className="w-full text-sm">

              <thead className="bg-gray-100 text-xs">
                <tr>
                  <th className="p-3 text-left">Title</th>
                  <th className="p-3 text-left">User</th>
                  <th className="p-3 text-center">Priority</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Open</th>
                  <th className="p-3 text-center">Closed</th>
                  <th className="p-3 text-center">Review</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((t) => (
                  <tr
                    key={t._id}
                    className="border-t hover:bg-gray-50 align-top"
                  >

                    <td className="p-3">
                      <p className="font-semibold">{t.title}</p>
                      <p className="text-xs text-gray-500">
                        {t.description}
                      </p>
                    </td>

                    <td className="p-3">
                      {t.userId?.email || "N/A"}
                    </td>

                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${priorityColor(t.priority)}`}>
                        {t.priority}
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      <select
                        value={t.status}
                        onChange={(e) =>
                          updateStatus(t._id, e.target.value)
                        }
                        className="border text-xs p-1 rounded"
                      >
                        <option>Open</option>
                        <option>In Progress</option>
                        <option>Resolved</option>
                        <option>Closed</option>
                      </select>
                    </td>

                    <td className="p-3 text-center text-xs">
                      {getOpenTime(t.createdAt)}
                    </td>

                    <td className="p-3 text-center text-xs">
                      {getSolvedTime(t.createdAt, t.resolvedAt)}
                    </td>

                    <td className="p-3 text-center">
                      {t.rating ? renderStars(t.rating) : "No review"}
                    </td>

                    <td className="p-3 text-center">
                      <button
                        onClick={() => setSelected(t)}
                        className="text-blue-600 text-sm"
                      >
                        View
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          )}
        </div>

        {/* PAGINATION */}
        <div className="flex justify-between mt-4">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-3 py-1 border rounded"
          >
            Prev
          </button>

          <p className="text-sm">
            {page} / {totalPages}
          </p>

          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1 border rounded"
          >
            Next
          </button>
        </div>

      </div>
    </div>
  );
}