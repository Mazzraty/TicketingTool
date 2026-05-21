import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function MyTickets() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    load(page);
  }, [page]);

  const load = async (pageNumber = 1) => {
    try {
      setLoading(true);

      const res = await api.get(
        `/tickets/my?page=${pageNumber}`
      );

      setTickets(res.data.data || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // OPEN TIME (LIVE)
  // ==========================
  const getOpenTime = (createdAt) => {
    const start = new Date(createdAt);
    const now = new Date();

    const diff = now - start;

    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);

    return `${hours}h ${mins}m`;
  };

  // ==========================
  // SOLVED TIME
  // ==========================
  const getSolvedTime = (createdAt, resolvedAt) => {
    if (!resolvedAt) return "-";

    const start = new Date(createdAt);
    const end = new Date(resolvedAt);

    const diff = end - start;

    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);

    return `${hours}h ${mins}m`;
  };

  // ==========================
  // REOPEN TICKET
  // ==========================
  const reopenTicket = async (id) => {
    try {
      await api.put(`/tickets/${id}`, {
        status: "Open",
      });

      toast.success("Ticket reopened");

      load(page);
    } catch (err) {
      toast.error("Failed to reopen");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            My Tickets
          </h1>
          <p className="text-sm text-gray-500">
            All your support requests
          </p>
        </div>

        <button
          onClick={() => navigate("/create")}
          className="bg-black text-white px-4 py-2 rounded-lg text-sm"
        >
          + New Ticket
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-xl overflow-hidden">

        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading...
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            No tickets found
          </div>
        ) : (
          <table className="w-full text-sm">

            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-6 py-3 text-left">Title</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Open Time</th>
                <th className="px-6 py-3 text-left">Solved Time</th>
                <th className="px-6 py-3 text-left">Created</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {tickets.map((t) => (
                <tr key={t._id} className="border-t hover:bg-gray-50">

                  {/* TITLE */}
                  <td className="px-6 py-4">
                    <p className="font-medium">{t.title}</p>
                    <p className="text-xs text-gray-500">
                      {t.description}
                    </p>
                  </td>

                  {/* STATUS */}
                  <td className="px-6 py-4">
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                      {t.status}
                    </span>
                  </td>

                  {/* OPEN TIME */}
                  <td className="px-6 py-4 text-gray-600">
                    {t.status === "Resolved" || t.status === "Closed"
                      ? "-"
                      : getOpenTime(t.createdAt)}
                  </td>

                  {/* SOLVED TIME */}
                  <td className="px-6 py-4 text-gray-600">
                    {getSolvedTime(t.createdAt, t.resolvedAt)}
                  </td>

                  {/* CREATED */}
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>

                  {/* ACTIONS */}
                  <td className="px-6 py-4 text-right space-x-2">

                    <button
                      onClick={() => navigate(`/ticket/${t._id}`)}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </button>

                    {/* REOPEN */}
                    {t.status === "Resolved" && (
                      <button
                        onClick={() => reopenTicket(t._id)}
                        className="text-orange-600 hover:underline"
                      >
                        Reopen
                      </button>
                    )}

                    {/* REVIEW */}
                    {t.status === "Resolved" && !t.review && (
                      <button
                        onClick={() =>
                          navigate(`/ticket/${t._id}`)
                        }
                        className="text-green-600 hover:underline"
                      >
                        Add Review
                      </button>
                    )}

                  </td>

                </tr>
              ))}
            </tbody>

          </table>
        )}

        {/* PAGINATION */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">

          <p className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </p>

          <div className="flex gap-2">

            <button
              onClick={() =>
                setPage((p) => Math.max(p - 1, 1))
              }
              disabled={page === 1}
              className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40"
            >
              Prev
            </button>

            <button
              onClick={() =>
                setPage((p) =>
                  Math.min(p + 1, totalPages)
                )
              }
              disabled={page === totalPages}
              className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40"
            >
              Next
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}