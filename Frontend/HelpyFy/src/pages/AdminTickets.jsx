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

  // =========================
  // LOAD TICKETS
  // =========================
  useEffect(() => {
    load(page);
    loadStats();
  }, [page]);

  const load = async (pageNumber = 1) => {
    try {
      setLoading(true);

      const res = await api.get(
        `/tickets?page=${pageNumber}&limit=10`
      );

      setTickets(res.data.data || []);
      setTotalPages(res.data.pages || 1);

    } catch (err) {
      console.error(err);
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOAD STATS
  // =========================
  const loadStats = async () => {
    try {
      const res = await api.get("/tickets/stats");
      setStats(res.data || stats);
    } catch {
      toast.error("Failed to load stats");
    }
  };

  // =========================
  // UPDATE STATUS
  // =========================
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

  // =========================
  // SEARCH FILTER
  // =========================
  const filtered = tickets.filter((t) => {
    const s = search.toLowerCase();

    return (
      t.title?.toLowerCase().includes(s) ||
      t.userId?.email?.toLowerCase().includes(s) ||
      t.priority?.toLowerCase().includes(s) ||
      t.status?.toLowerCase().includes(s)
    );
  });

  // =========================
  // PRIORITY COLORS
  // =========================
  const priorityColor = (p) => {
    if (p === "High") return "bg-red-100 text-red-700";
    if (p === "Medium") return "bg-yellow-100 text-yellow-700";
    if (p === "Low") return "bg-blue-100 text-blue-700";
    return "bg-gray-100 text-gray-600";
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9]">

      {/* HEADER */}
      <div className="bg-white border-b px-6 py-5">
        <h1 className="text-xl font-bold text-gray-800">
          Ticket Management
        </h1>
      </div>

      {/* STATS */}
      <div className="p-6 grid grid-cols-5 gap-4">
        {Object.entries(stats).map(([k, v]) => (
          <div key={k} className="bg-white border rounded-lg p-4">
            <p className="text-xs text-gray-500 capitalize">{k}</p>
            <h2 className="text-2xl font-bold mt-1">{v}</h2>
          </div>
        ))}
      </div>

      {/* TABLE */}
      <div className="px-6 pb-6">
        <div className="bg-white border rounded-xl overflow-hidden">

          {/* SEARCH */}
          <div className="flex justify-between items-center px-5 py-4 border-b bg-gray-50">
            <h2 className="font-semibold">Tickets</h2>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="border px-3 py-2 text-sm rounded-lg w-64"
            />
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">

            {loading ? (
              <div className="p-10 text-center">Loading...</div>
            ) : (
              <table className="w-full text-sm table-fixed">

                <thead className="bg-gray-100 text-gray-600">
                  <tr>
                    <th className="p-3 text-left">Title</th>
                    <th className="p-3 text-left">User</th>
                    <th className="p-3 text-center">Priority</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">SLA</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((t) => (
                    <tr key={t._id} className="border-t hover:bg-gray-50">

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
                        <span className={`px-2 py-1 text-xs rounded ${priorityColor(t.priority)}`}>
                          {t.priority}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <select
                          value={t.status}
                          onChange={(e) => updateStatus(t._id, e.target.value)}
                          className="border px-2 py-1 text-xs rounded"
                        >
                          <option>Open</option>
                          <option>In Progress</option>
                          <option>Resolved</option>
                          <option>Closed</option>
                        </select>
                      </td>

                      <td className="p-3 text-center text-xs text-gray-500">
                        {t.slaDue
                          ? new Date(t.slaDue).toLocaleString()
                          : "-"}
                      </td>

                      <td className="p-3 text-center">
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

          {/* PAGINATION */}
          <div className="flex justify-between px-5 py-4 border-t bg-gray-50">
            <p>Page {page} of {totalPages}</p>

            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 border"
              >
                Prev
              </button>

              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 border"
              >
                Next
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* =========================
          📌 MODAL (WITH IMAGES)
      ========================= */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">

          <div className="bg-white w-full max-w-3xl rounded-xl shadow-xl">

            {/* HEADER */}
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="font-bold text-lg">
                {selected.title}
              </h2>

              <button
                onClick={() => setSelected(null)}
                className="text-gray-500 hover:text-black"
              >
                ✕
              </button>
            </div>

            {/* BODY */}
            <div className="p-5 space-y-4 text-sm">

              <p>{selected.description}</p>

              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg">
                <p><b>User:</b> {selected.userId?.email}</p>
                <p><b>Priority:</b> {selected.priority}</p>
                <p><b>Status:</b> {selected.status}</p>
                <p><b>Department:</b> {selected.department}</p>
              </div>

              {/* 📎 ATTACHMENTS */}
              <div>
                <h3 className="font-semibold mb-2">Attachments</h3>

                {selected.attachments?.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">

                    {selected.attachments.map((file, i) => (
                      <a
                        key={i}
                        href={file}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <img
                          src={file}
                          className="h-28 w-full object-cover rounded border hover:scale-105 transition"
                        />
                      </a>
                    ))}

                  </div>
                ) : (
                  <p className="text-xs text-gray-400">
                    No attachments
                  </p>
                )}
              </div>

            </div>

            {/* FOOTER */}
            <div className="p-4 border-t">
              <button
                onClick={() => setSelected(null)}
                className="w-full bg-black text-white py-2 rounded-lg"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}