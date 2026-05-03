import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { useNavigate } from "react-router-dom";

export default function MyTickets() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    load(page);
  }, [page]);

  const load = async (pageNumber = 1) => {
    try {
      setLoading(true);

      const res = await api.get(`/tickets/my?page=${pageNumber}`);

      setTickets(res.data.data || []);
      setTotalPages(res.data.totalPages || 1); // IMPORTANT
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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

            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-6 py-3">Title</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-left px-6 py-3">Created</th>
                <th className="text-right px-6 py-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {tickets.map((t) => (
                <tr key={t._id} className="border-t hover:bg-gray-50">

                  <td className="px-6 py-4">
                    <p className="font-medium">{t.title}</p>
                    <p className="text-xs text-gray-500">
                      {t.description}
                    </p>
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                      {t.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-gray-500">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => navigate(`/ticket/${t._id}`)}
                      className="text-blue-600 hover:underline"
                    >
                      View
                    </button>
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
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40"
            >
              Prev
            </button>

            <button
              onClick={() =>
                setPage((p) => Math.min(p + 1, totalPages))
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