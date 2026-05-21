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

  // ================= STATUS UPDATE (UNCHANGED) =================
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

  // ================= SEARCH =================
  const filtered = tickets.filter((t) => {
    const s = search.toLowerCase();
    return (
      t.title?.toLowerCase().includes(s) ||
      t.userId?.email?.toLowerCase().includes(s) ||
      t.priority?.toLowerCase().includes(s) ||
      t.status?.toLowerCase().includes(s)
    );
  });

  // ================= PRIORITY =================
  const priorityColor = (p) => {
    if (p === "High") return "bg-red-100 text-red-700";
    if (p === "Medium") return "bg-yellow-100 text-yellow-700";
    if (p === "Low") return "bg-blue-100 text-blue-700";
    return "bg-gray-100 text-gray-600";
  };

  // ================= TIME HELPERS (RESTORED) =================
  const getOpenTime = (createdAt) => {
    const diff = new Date() - new Date(createdAt);
    return `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`;
  };

  const getSolvedTime = (createdAt, resolvedAt) => {
    if (!resolvedAt) return "-";
    const diff = new Date(resolvedAt) - new Date(createdAt);
    return `${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`;
  };

  // ================= STAR REVIEW (RESTORED) =================
  const renderStars = (rating) => (
    <span className="text-yellow-500">
      {"★".repeat(rating || 0)}
      {"☆".repeat(5 - (rating || 0))}
    </span>
  );

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex">

      {/* ================= SIDE DRAWER (RESTORED + ENHANCED) ================= */}
      {selected && (
        <div className="w-[380px] bg-white border-l shadow-xl p-4">

          <div className="flex justify-between">
            <h2 className="font-bold">Ticket Details</h2>
            <button onClick={() => setSelected(null)}>✕</button>
          </div>

          <p className="font-semibold mt-2">{selected.title}</p>
          <p className="text-xs text-gray-500">{selected.userId?.email}</p>

          {/* COMPLAINT (IMPORTANT RESTORED) */}
          <div className="bg-gray-50 p-3 rounded mt-3">
            <p className="text-sm">{selected.description}</p>
          </div>

          {/* ATTACHMENTS (RESTORED) */}
          <div className="mt-3">
            <p className="text-xs font-semibold">Attachments</p>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {selected.attachments?.map((img, i) => (
                <img key={i} src={img} className="h-20 rounded object-cover" />
              ))}
            </div>
          </div>

          {/* REVIEW (RESTORED FULL) */}
          <div className="mt-3">
            <p className="text-xs font-semibold">Review</p>

            {selected.rating ? (
              <>
                {renderStars(selected.rating)}
                <p className="text-xs text-gray-600">{selected.review}</p>
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
          <h1 className="font-bold">Ticket Management</h1>

          <input
            className="border px-3 py-1 rounded text-sm"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* STATS (UNCHANGED) */}
        <div className="grid grid-cols-5 gap-3 mt-4">
          {Object.entries(stats).map(([k, v]) => (
            <div key={k} className="bg-white border p-3 rounded">
              <p className="text-xs text-gray-500">{k}</p>
              <p className="font-bold">{v}</p>
            </div>
          ))}
        </div>

        {/* TABLE (RESTORED FEATURES) */}
        <div className="bg-white mt-4 border rounded">

          {loading ? (
            <div className="p-10 text-center">Loading...</div>
          ) : (
            <table className="w-full text-sm">

              <thead className="bg-gray-100">
                <tr>
                  <th>Title</th>
                  <th>User</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Open</th>
                  <th>Closed</th>
                  <th>Review</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((t) => (
                  <tr key={t._id} className="border-t hover:bg-gray-50">

                    <td className="p-2 font-semibold">
                      {t.title}
                      <p className="text-xs text-gray-500">{t.description}</p>
                    </td>

                    <td>{t.userId?.email}</td>

                    <td>
                      <span className={`px-2 py-1 rounded text-xs ${priorityColor(t.priority)}`}>
                        {t.priority}
                      </span>
                    </td>

                    <td>
                      <select
                        value={t.status}
                        onChange={(e) => updateStatus(t._id, e.target.value)}
                        className="border text-xs p-1 rounded"
                      >
                        <option>Open</option>
                        <option>In Progress</option>
                        <option>Resolved</option>
                        <option>Closed</option>
                      </select>
                    </td>

                    <td>{getOpenTime(t.createdAt)}</td>
                    <td>{getSolvedTime(t.createdAt, t.resolvedAt)}</td>

                    <td>
                      {t.rating ? renderStars(t.rating) : "No review"}
                    </td>

                    <td>
                      <button
                        onClick={() => setSelected(t)}
                        className="text-blue-600"
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

        {/* PAGINATION (UNCHANGED) */}
        <div className="flex justify-between mt-3">
          <button onClick={() => setPage(page - 1)} disabled={page === 1}>
            Prev
          </button>

          <p>{page} / {totalPages}</p>

          <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>
            Next
          </button>
        </div>

      </div>
    </div>
  );
}