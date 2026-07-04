import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

/* ================= ICONS (inline, no extra dependency) ================= */
const Icon = ({ children, className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {children}
  </svg>
);
const IconSearch = (p) => <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Icon>;
const IconClip = (p) => <Icon {...p}><path d="M21.44 11.05 12.25 20.24a5 5 0 1 1-7.07-7.07l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95L9.64 18.36a2 2 0 1 1-2.83-2.83l8.49-8.48" /></Icon>;
const IconEye = (p) => <Icon {...p}><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" /><circle cx="12" cy="12" r="3" /></Icon>;
const IconX = (p) => <Icon {...p}><path d="M18 6 6 18M6 6l12 12" /></Icon>;
const IconChevronLeft = (p) => <Icon {...p}><path d="m15 18-6-6 6-6" /></Icon>;
const IconChevronRight = (p) => <Icon {...p}><path d="m9 18 6-6-6-6" /></Icon>;
const IconCheck = (p) => <Icon {...p}><path d="M20 6 9 17l-5-5" /></Icon>;
const IconLock = (p) => <Icon {...p}><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></Icon>;
const IconNote = (p) => <Icon {...p}><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" /><path d="M9 13h6M9 17h6" /></Icon>;
const IconLayers = (p) => <Icon {...p}><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5" /><path d="m3 17 9 5 9-5" /></Icon>;
const IconCircleDot = (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" fill="currentColor" /></Icon>;
const IconClock = (p) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></Icon>;

/* ================= STATUS THEME (single source of truth) ================= */
const STATUS_THEME = {
  Open: { text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", solid: "bg-blue-600", accent: "bg-blue-500" },
  "In Progress": { text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", solid: "bg-amber-500", accent: "bg-amber-400" },
  Resolved: { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", solid: "bg-emerald-600", accent: "bg-emerald-500" },
  Closed: { text: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200", solid: "bg-slate-500", accent: "bg-slate-400" },
};

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

  /* ================= STATUS CHANGE ENTRY POINT ================= */
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
      if (status === "Resolved") payload.resolvedAt = new Date().toISOString();
      if (status === "Closed") payload.closedAt = new Date().toISOString();

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
    if (p === "High") return "bg-red-50 text-red-700 border border-red-200";
    if (p === "Medium") return "bg-amber-50 text-amber-700 border border-amber-200";
    if (p === "Low") return "bg-blue-50 text-blue-700 border border-blue-200";
    return "bg-slate-100 text-slate-600 border border-slate-200";
  };

  const formatDateTime = (date) =>
    date ? new Date(date).toLocaleString(undefined, {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit",
    }) : "—";

  const renderStars = (rating) => (
    <span className="text-amber-400 text-sm tracking-tight">
      {"★".repeat(rating || 0)}
      <span className="text-slate-200">{"★".repeat(5 - (rating || 0))}</span>
    </span>
  );

  const initials = (email) => (email ? email.charAt(0).toUpperCase() : "?");

  const renderAttachments = (files = []) => {
    if (!files || files.length === 0) return <span className="text-slate-300 text-xs">—</span>;
    return (
      <div className="flex flex-col gap-1 items-center">
        {files.map((file, i) => (
          <a
            key={i}
            href={file.url || file}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium"
          >
            <IconClip className="w-3 h-3" /> File {i + 1}
          </a>
        ))}
      </div>
    );
  };

  const statCards = [
    { key: "total", label: "Total", value: stats.total, theme: "slate", icon: <IconLayers className="w-4 h-4" /> },
    { key: "open", label: "Open", value: stats.open, theme: "blue", icon: <IconCircleDot className="w-4 h-4" /> },
    { key: "inProgress", label: "In Progress", value: stats.inProgress, theme: "amber", icon: <IconClock className="w-4 h-4" /> },
    { key: "resolved", label: "Resolved", value: stats.resolved, theme: "emerald", icon: <IconCheck className="w-4 h-4" /> },
    { key: "closed", label: "Closed", value: stats.closed, theme: "slate", icon: <IconLock className="w-4 h-4" /> },
  ];

  const statBarClass = {
    slate: "bg-slate-400",
    blue: "bg-blue-500",
    amber: "bg-amber-400",
    emerald: "bg-emerald-500",
  };
  const statIconClass = {
    slate: "bg-slate-100 text-slate-500",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">

      {/* ================= SIDE PANEL ================= */}
      {selected && (
        <div className="w-[400px] bg-white border-l border-slate-200 flex flex-col shrink-0">
          <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100">
            <div>
              <p className="text-[11px] font-semibold text-slate-400 tracking-wide uppercase">Ticket Preview</p>
              <h2 className="font-bold text-slate-900 leading-snug mt-0.5">{selected.title}</h2>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition shrink-0"
            >
              <IconX className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 flex flex-col gap-5 overflow-y-auto">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm shrink-0">
                {initials(selected.userId?.email)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{selected.userId?.email || "Unknown user"}</p>
                <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full mt-0.5 ${STATUS_THEME[selected.status]?.bg} ${STATUS_THEME[selected.status]?.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_THEME[selected.status]?.accent}`} />
                  {selected.status}
                </span>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Description</p>
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-sm text-slate-700 leading-relaxed">
                {selected.description || "No description provided."}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Opened</p>
                <p className="text-xs font-medium text-slate-700">{formatDateTime(selected.createdAt)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Resolved</p>
                <p className="text-xs font-medium text-slate-700">{formatDateTime(selected.resolvedAt)}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Closed</p>
                <p className="text-xs font-medium text-slate-700">{formatDateTime(selected.closedAt)}</p>
              </div>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                <IconNote className="w-3.5 h-3.5" /> Resolution Note
              </p>
              {selected.resolutionNote ? (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm p-3 rounded-lg leading-relaxed">
                  {selected.resolutionNote}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Not resolved yet</p>
              )}
            </div>

            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Attachments</p>
              {selected.files?.length > 0 ? (
                <div className="space-y-1.5">
                  {selected.files.map((file, i) => (
                    <a
                      key={i}
                      href={file.url || file}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      <IconClip className="w-3.5 h-3.5" /> Download File {i + 1}
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No attachments</p>
              )}
            </div>

            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Review</p>
              {selected.rating ? (
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                  {renderStars(selected.rating)}
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{selected.review}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400">No review submitted</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MAIN ================= */}
      <div className="flex-1 p-6 md:p-8 max-w-[1400px]">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Ticket Management</h1>
            <p className="text-sm text-slate-400 mt-0.5">Track, resolve, and review support requests</p>
          </div>

          <div className="relative w-full sm:w-72">
            <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full border border-slate-200 bg-white pl-9 pr-3 py-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition placeholder:text-slate-400"
              placeholder="Search tickets, users, status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {statCards.map((s) => (
            <div key={s.key} className="relative bg-white border border-slate-200 rounded-xl p-4 overflow-hidden shadow-sm">
              <span className={`absolute left-0 top-0 bottom-0 w-1 ${statBarClass[s.theme]}`} />
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-slate-400">{s.label}</p>
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${statIconClass[s.theme]}`}>
                  {s.icon}
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</p>
            </div>
          ))}
        </div>

        {/* TABLE */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-16 text-center text-sm text-slate-400">Loading tickets…</div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-sm font-medium text-slate-600">No tickets match your search</p>
              <p className="text-xs text-slate-400 mt-1">Try a different keyword or clear the search box</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-200">
                    <th className="p-3.5 text-left font-semibold">Ticket</th>
                    <th className="p-3.5 text-left font-semibold">Company</th>
                    <th className="p-3.5 text-center font-semibold">Priority</th>
                    <th className="p-3.5 text-center font-semibold">Status</th>
                    <th className="p-3.5 text-center font-semibold">Opened</th>
                    <th className="p-3.5 text-center font-semibold">Closed</th>
                    <th className="p-3.5 text-center font-semibold">Files</th>
                    <th className="p-3.5 text-center font-semibold">Review</th>
                    <th className="p-3.5 text-center font-semibold"></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filtered.map((t) => {
                    const theme = STATUS_THEME[t.status] || STATUS_THEME.Open;
                    return (
                      <tr key={t._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs shrink-0">
                              {initials(t.userId?.email)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 truncate max-w-[220px]">{t.title}</p>
                              <p className="text-xs text-slate-400 truncate max-w-[220px]">{t.userId?.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 text-slate-600">{t.companyId?.name || "—"}</td>

                        <td className="p-3.5 text-center">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${priorityColor(t.priority)}`}>
                            {t.priority}
                          </span>
                        </td>

                        <td className="p-3.5 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <div className="relative inline-block">
                              <select
                                className={`appearance-none pl-3 pr-7 py-1.5 rounded-full text-xs font-medium border cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/20 ${theme.bg} ${theme.text} ${theme.border}`}
                                value={t.status}
                                onChange={(e) => handleStatusChange(t, e.target.value)}
                              >
                                <option>Open</option>
                                <option>In Progress</option>
                                <option>Resolved</option>
                                <option>Closed</option>
                              </select>
                              <span className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${theme.accent}`} />
                            </div>
                            {t.resolutionNote && (
                              <p
                                className="text-[10px] text-slate-400 max-w-[140px] truncate flex items-center gap-1"
                                title={t.resolutionNote}
                              >
                                <IconNote className="w-2.5 h-2.5 shrink-0" /> {t.resolutionNote}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="p-3.5 text-center text-xs text-slate-500">{formatDateTime(t.createdAt)}</td>
                        <td className="p-3.5 text-center text-xs text-slate-500">{formatDateTime(t.closedAt || t.resolvedAt)}</td>
                        <td className="p-3.5 text-center">{renderAttachments(t.files || t.attachments)}</td>
                        <td className="p-3.5 text-center">
                          {t.rating ? renderStars(t.rating) : <span className="text-slate-300 text-xs">—</span>}
                        </td>

                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => setSelected(t)}
                            className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition"
                          >
                            <IconEye className="w-3.5 h-3.5" /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* PAGINATION */}
        <div className="flex justify-center items-center gap-3 mt-5">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="w-8 h-8 flex items-center justify-center border border-slate-200 bg-white rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition"
          >
            <IconChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-medium text-slate-500 tabular-nums">Page {page} of {totalPages}</span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="w-8 h-8 flex items-center justify-center border border-slate-200 bg-white rounded-lg text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition"
          >
            <IconChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ================= RESOLVE / CLOSE MODAL ================= */}
      {statusModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-1">
              <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                statusModal.targetStatus === "Resolved" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
              }`}>
                {statusModal.targetStatus === "Resolved" ? <IconCheck className="w-4 h-4" /> : <IconLock className="w-4 h-4" />}
              </span>
              <h3 className="font-bold text-base text-slate-900">
                Mark as {statusModal.targetStatus}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-4 ml-12 -mt-1">
              "{statusModal.ticket.title}"
            </p>

            <label className="text-xs font-medium text-slate-500 mb-1.5 block">
              Resolution note <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full border border-slate-200 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition resize-none placeholder:text-slate-400"
              rows={4}
              placeholder="e.g. Replaced faulty router, tested connection with user, confirmed working."
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              autoFocus
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              This note is saved with the ticket so anyone can see how it was handled.
            </p>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={cancelStatusModal}
                disabled={submitting}
                className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusModal}
                disabled={submitting}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:opacity-60"
              >
                {submitting ? "Saving…" : `Confirm ${statusModal.targetStatus}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
