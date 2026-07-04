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

  // ✅ RESOLUTION MODAL STATE
  const [statusModal, setStatusModal] = useState(null); // { ticket, targetStatus }
  const [resolutionNote, setResolutionNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const initialStats = {
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
  };

  const [stats, setStats] = useState(initialStats);

  useEffect(() => {
    load(page);
    loadStats();
  }, [page]);

  const load = async (pageNumber = 1) => {
    try {
      setLoading(true);

      const res = await api.get(`/tickets?page=${pageNumber}&limit=10`);

      setTickets(res?.data?.data || []);
      setTotalPages(res?.data?.pages || 1);
    } catch {
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await api.get("/tickets/stats");
      const data = res?.data?.data;

      setStats({
        total: data?.total ?? 0,
        open: data?.open ?? 0,
        inProgress: data?.inProgress ?? 0,
        resolved: data?.resolved ?? 0,
        closed: data?.closed ?? 0,
      });
    } catch {
      toast.error("Failed to load stats");
      setStats(initialStats);
    }
  };

  /* ================= STATUS CHANGE ENTRY POINT =================
     Open / In Progress -> instant update
     Resolved / Closed   -> requires a resolution note via modal
  ================================================================ */
  const handleStatusChange = (ticket, targetStatus) => {
    if (targetStatus === "Resolved" || targetStatus === "Closed") {
      setResolutionNote(ticket.resolutionNote || "");
      setStatusModal({ ticket, targetStatus });
      return;
    }
    updateStatus(ticket._id, targetStatus);
  };

  const updateStatus = async (id, status, extra = {}) => {
    try {
      const payload = { status, ...extra };

      if (status === "Resolved") {
        payload.resolvedAt = new Date().toISOString();
      }
      if (status === "Closed") {
        payload.closedAt = new Date().toISOString();
      }

      await api.put(`/tickets/${id}`, payload);
      toast.success(`Ticket marked as ${status}`);
      load(page);
      loadStats();
    } catch {
      toast.error("Update failed");
    }
  };

  const confirmStatusModal = async () => {
    if (!resolutionNote.trim()) {
      return toast.error("Please add a resolution note before continuing");
    }

    setSubmitting(true);
    await updateStatus(statusModal.ticket._id, statusModal.targetStatus, {
      resolutionNote: resolutionNote.trim(),
    });
    setSubmitting(false);
    setStatusModal(null);
    setResolutionNote("");
  };

  const cancelStatusModal = () => {
    setStatusModal(null);
    setResolutionNote("");
  };

  const filtered = tickets.filter((t) => {
    const s = search.toLowerCase();
    return (
      t.title?.toLowerCase().includes(s) ||
      t.userId?.email?.toLowerCase().includes(s) ||
      t.priority?.toLowerCase().includes(s) ||
      t.status?.toLowerCase().includes(s)
    );
  });

  const priorityColor = (p) => {
    if (p === "High") return "bg-red-100 text-red-700";
    if (p === "Medium") return "bg-yellow-100 text-yellow-700";
    if (p === "Low") return "bg-blue-100 text-blue-700";
    return "bg-gray-100 text-gray-600";
  };

  // ✅ STATUS SELECT COLORING (visual clarity for a "professional" feel)
  const statusSelectClass = (s) => {
    const base =
      "border text-xs p-1.5 rounded-md font-medium outline-none cursor-pointer";
    if (s === "Open") return `${base} bg-blue-50 text-blue-700 border-blue-200`;
    if (s === "In Progress")
      return `${base} bg-yellow-50 text-yellow-700 border-yellow-200`;
    if (s === "Resolved")
      return `${base} bg-emerald-50 text-emerald-700 border-emerald-200`;
    if (s === "Closed")
      return `${base} bg-gray-100 text-gray-600 border-gray-200`;
    return base;
  };

  const formatDateTime = (date) =>
    date ? new Date(date).toLocaleString() : "-";

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

  const renderStars = (rating) => (
    <span className="text-yellow-500 text-sm">
      {"★".repeat(rating || 0)}
      {"☆".repeat(5 - (rating || 0))}
    </span>
  );

  // ✅ FILE RENDER FUNCTION
  const renderAttachments = (files = []) => {
    if (!files || files.length === 0) return "No files";

    return (
      <div className="flex flex-col gap-1">
        {files.map((file, i) => (
          <a
            key={i}
            href={file.url || file}
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 text-xs underline"
          >
            📎 File {i + 1}
          </a>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex">

      {/* ================= SIDE PANEL ================= */}
      {selected && (
        <div className="w-[380px] bg-white border-l p-5 flex flex-col gap-4 overflow-y-auto">

          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="font-bold text-lg">Ticket Preview</h2>
            <button onClick={() => setSelected(null)}>✕</button>
          </div>

          <div>
            <p className="font-semibold">{selected.title}</p>
            <p className="text-xs text-gray-500">
              {selected.userId?.email}
            </p>
          </div>

          <div className="bg-gray-50 p-3 rounded text-sm border">
            {selected.description}
          </div>

          <div className="text-xs space-y-1">
            <p><b>Opened:</b> {formatDateTime(selected.createdAt)}</p>
            <p><b>Resolved:</b> {formatDateTime(selected.resolvedAt)}</p>
            <p><b>Closed:</b> {formatDateTime(selected.closedAt)}</p>
          </div>

          {/* ✅ RESOLUTION NOTE */}
          <div>
            <p className="font-semibold text-xs mb-1">Resolution Note</p>
            {selected.resolutionNote ? (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs p-2.5 rounded">
                {selected.resolutionNote}
              </div>
            ) : (
              <p className="text-xs text-gray-400">Not resolved yet</p>
            )}
          </div>

          {/* ✅ ATTACHMENTS SIDE PANEL */}
          <div>
            <p className="font-semibold text-xs mb-1">Attachments</p>

            {selected.files?.length > 0 ? (
              <div className="space-y-1">
                {selected.files.map((file, i) => (
                  <a
                    key={i}
                    href={file.url || file}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-blue-600 text-xs underline"
                  >
                    📎 Download File {i + 1}
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No attachments</p>
            )}
          </div>

          <div>
            <p className="font-semibold text-xs mb-1">Review</p>
            {selected.rating ? (
              <>
                {renderStars(selected.rating)}
                <p className="text-xs text-gray-600">
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
        <div className="flex justify-between items-center bg-white p-4 border rounded mb-4">
          <h1 className="font-bold text-lg">Ticket Management</h1>

          <input
            className="border px-3 py-1 rounded text-sm w-64"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* STATS */}
        <div className="grid grid-cols-5 gap-3 mb-4">
          {Object.entries(stats).map(([k, v]) => (
            <div key={k} className="bg-white border rounded p-3 text-center">
              <p className="text-xs text-gray-500 capitalize">{k}</p>
              <p className="font-bold text-lg">{v}</p>
            </div>
          ))}
        </div>

        {/* TABLE */}
        <div className="bg-white border rounded overflow-hidden">

          {loading ? (
            <div className="p-10 text-center">Loading...</div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead className="bg-gray-100 text-xs uppercase">
                  <tr>
                    <th className="p-3 text-left">Title</th>
                    <th className="p-3 text-left">User</th>
                    <th className="p-3 text-left">Company</th>
                    <th className="p-3 text-center">Priority</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Opened Date & Time</th>
                    <th className="p-3 text-center">Closed Date & Time</th>

                    {/* ✅ FILE COLUMN */}
                    <th className="p-3 text-center">Files</th>

                    <th className="p-3 text-center">Review</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((t) => (
                    <tr key={t._id} className="border-t hover:bg-gray-50">

                      <td className="p-3 font-semibold">{t.title}</td>

                      <td className="p-3">{t.userId?.email}</td>
                      <td className="p-3">
                        {t.companyId?.name || "-"}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 text-xs rounded ${priorityColor(t.priority)}`}>
                          {t.priority}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <select
                          className={statusSelectClass(t.status)}
                          value={t.status}
                          onChange={(e) => handleStatusChange(t, e.target.value)}
                        >
                          <option>Open</option>
                          <option>In Progress</option>
                          <option>Resolved</option>
                          <option>Closed</option>
                        </select>
                        {t.resolutionNote && (
                          <p
                            className="text-[10px] text-gray-400 mt-1 max-w-[140px] mx-auto truncate"
                            title={t.resolutionNote}
                          >
                            📝 {t.resolutionNote}
                          </p>
                        )}
                      </td>

                      <td className="p-3 text-center text-xs">
                        {formatDateTime(t.createdAt)}
                      </td>

                      <td className="p-3 text-center text-xs">
                        {formatDateTime(t.closedAt || t.resolvedAt)}
                      </td>

                      {/* ✅ FILES IN TABLE */}
                      <td className="p-3 text-center text-xs">
                        {renderAttachments(t.files || t.attachments)}
                      </td>

                      <td className="p-3 text-center">
                        {t.rating ? renderStars(t.rating) : "No review"}
                      </td>

                      <td className="p-3 text-center">
                        <button
                          onClick={() => setSelected(t)}
                          className="text-blue-600 text-sm hover:underline"
                        >
                          View
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>

            </div>
          )}
        </div>

        {/* PAGINATION */}
        <div className="flex justify-center items-center gap-4 mt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>

          <span className="text-sm">{page} / {totalPages}</span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>

      </div>

      {/* ================= RESOLVE / CLOSE MODAL ================= */}
      {statusModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-5">
            <h3 className="font-bold text-base mb-1">
              Mark as {statusModal.targetStatus}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              "{statusModal.ticket.title}" — add a resolution note before
              continuing. This helps keep a clear record of how the issue was
              handled.
            </p>

            <textarea
              className="w-full border border-gray-200 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition resize-none"
              rows={4}
              placeholder="e.g. Replaced faulty router, tested connection with user, confirmed working."
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              autoFocus
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={cancelStatusModal}
                disabled={submitting}
                className="px-4 py-2 text-sm rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusModal}
                disabled={submitting}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:opacity-60"
              >
                {submitting ? "Saving..." : `Confirm ${statusModal.targetStatus}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
