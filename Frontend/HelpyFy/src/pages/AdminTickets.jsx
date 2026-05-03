import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState(null);

  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
  });

  useEffect(() => {
    load(page);
    loadStats();
  }, [page]);

  const load = async (pageNumber = 1) => {
    try {
      const res = await api.get(`/tickets?page=${pageNumber}`);
      setTickets(res.data.data || []);
      setTotalPages(res.data.pages || 1);
    } catch (err) {
      toast.error("Failed to load tickets");
    }
  };

  const loadStats = async () => {
    try {
      const res = await api.get("/tickets/stats");
      setStats(res.data || stats);
    } catch (err) {
      toast.error("Failed to load stats");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/tickets/${id}`, { status });
      toast.success("Status updated");
      load(page);
      loadStats();
    } catch (err) {
      toast.error("Update failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">

      {/* HEADER */}
      <div className="px-6 py-6 bg-white border-b">
        <h1 className="text-2xl font-bold text-gray-900">
          Admin Ticket Dashboard
        </h1>
        <p className="text-sm text-gray-500">
          Manage all system tickets in real time
        </p>
      </div>

      {/* STATS */}
      <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-5 gap-4">

        {Object.entries(stats).map(([key, value]) => (
          <div
            key={key}
            className="bg-white border rounded-xl p-4 shadow-sm"
          >
            <p className="text-xs text-gray-500 capitalize">{key}</p>
            <h2 className="text-2xl font-bold text-gray-900">
              {value}
            </h2>
          </div>
        ))}

      </div>

      {/* TABLE */}
      <div className="px-6 pb-6">

        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">

          {/* HEADER */}
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="font-semibold text-gray-800">
              All Tickets
            </h2>

            <input
              placeholder="Search tickets..."
              className="border rounded-lg px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-400 outline-none"
            />
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">

            <table className="w-full text-sm table-fixed">

              <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-5 py-3 w-[30%]">Title</th>
                  <th className="w-[22%]">User</th>
                  <th className="w-[10%]">Priority</th>
                  <th className="w-[12%]">Status</th>
                  <th className="w-[18%]">SLA</th>
                  <th className="text-center w-[8%]">Action</th>
                </tr>
              </thead>

              <tbody>

                {tickets.map((t) => (
                  <tr
                    key={t._id}
                    className="border-t hover:bg-gray-50 transition"
                  >

                    {/* TITLE */}
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900 truncate">
                        {t.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {t.description}
                      </p>
                    </td>

                    {/* USER (FIXED ALIGNMENT) */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">

                        {/* avatar */}
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
                          {t.userId?.email?.charAt(0).toUpperCase() || "U"}
                        </div>

                        {/* info */}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {t.userId?.email || "Unknown"}
                          </p>
                          <p className="text-xs text-gray-400">
                            User
                          </p>
                        </div>

                      </div>
                    </td>

                    {/* PRIORITY */}
                    <td className="text-center">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                        {t.priority}
                      </span>
                    </td>

                    {/* STATUS */}
                    <td className="text-center">
                      <select
                        value={t.status}
                        onChange={(e) =>
                          updateStatus(t._id, e.target.value)
                        }
                        className="border rounded-lg px-2 py-1 text-xs outline-none"
                      >
                        <option>Open</option>
                        <option>In Progress</option>
                        <option>Resolved</option>
                        <option>Closed</option>
                      </select>
                    </td>

                    {/* SLA */}
                    <td className="text-center text-xs text-gray-500">
                      {t.slaDue
                        ? new Date(t.slaDue).toLocaleString()
                        : "—"}
                    </td>

                    {/* ACTION */}
                    <td className="text-center">
                      <button
                        onClick={() => setSelected(t)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        View
                      </button>
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>

          {/* PAGINATION */}
          <div className="flex items-center justify-between px-6 py-4 border-t bg-white">

            <p className="text-sm text-gray-500">
              Page <b>{page}</b> of <b>{totalPages}</b>
            </p>

            <div className="flex gap-2">

              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100 disabled:opacity-40"
              >
                ← Prev
              </button>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100 disabled:opacity-40"
              >
                Next →
              </button>

            </div>

          </div>

        </div>
      </div>

      {/* MODAL */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">

          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl">

            <div className="flex justify-between items-center p-5 border-b">
              <h2 className="text-lg font-bold">
                {selected.title}
              </h2>

              <button
                onClick={() => setSelected(null)}
                className="text-gray-500 hover:text-black"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">

              <p className="text-gray-600 text-sm">
                {selected.description}
              </p>

              <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 p-4 rounded-xl">

                <p><b>User:</b> {selected.userId?.email}</p>
                <p><b>Department:</b> {selected.department}</p>
                <p><b>Priority:</b> {selected.priority}</p>
                <p><b>Status:</b> {selected.status}</p>

              </div>

              {selected.attachments?.length > 0 && (
                <div>
                  <p className="font-semibold text-sm mb-2">
                    Attachments
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    {selected.attachments.map((file, i) => (
                      <a key={i} href={file} target="_blank">
                        <img
                          src={file}
                          className="h-28 w-full object-cover rounded-lg border hover:scale-105 transition"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

            </div>

            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => setSelected(null)}
                className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-900"
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