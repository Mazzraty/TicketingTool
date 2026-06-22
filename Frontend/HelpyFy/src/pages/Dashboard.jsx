import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, [])

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/tickets/my?page=1");
      setTickets(res.data.data || []);
    } catch (err) {
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const open = tickets.filter(t => t.status === "Open").length;
  const progress = tickets.filter(t => t.status === "In Progress").length;
  const resolved = tickets.filter(t => t.status === "Resolved").length;

  return (
    <div className="min-h-screen bg-[#f4f6f9] p-6">

      {/* HEADER */}
      <div className="bg-white border rounded-xl p-5 shadow-sm mb-6">
        <h1 className="text-xl font-bold text-gray-800">
          IT Service Dashboard
          {user?.name && (
            <span className="text-gray-500 font-normal ml-2">
              - Welcome {user.name}
            </span>
          )}
        </h1>

        <p className="text-sm text-gray-500">
          ITSM overview panel
        </p>
      </div>

      {/* ERROR */}
      {error && (
        <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg border">
          {error}
        </div>
      )}

      {/* LOADING */}
      {loading ? (
        <div className="bg-white border rounded-xl p-10 text-center text-gray-500">
          Loading dashboard...
        </div>
      ) : (
        <>
          {/* KPI GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* OPEN */}
            <div className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition">
              <p className="text-xs text-gray-500 uppercase">Open Tickets</p>

              <div className="flex items-center justify-between mt-4">
                <h2 className="text-3xl font-bold text-yellow-600">
                  {open}
                </h2>
                <span className="text-3xl">🟡</span>
              </div>

              <div className="h-1 mt-4 bg-yellow-100 rounded">
                <div className="h-1 bg-yellow-500 w-2/3 rounded"></div>
              </div>

              <p className="text-xs text-gray-400 mt-2">
                Waiting for action
              </p>
            </div>

            {/* IN PROGRESS */}
            <div className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition">
              <p className="text-xs text-gray-500 uppercase">In Progress</p>

              <div className="flex items-center justify-between mt-4">
                <h2 className="text-3xl font-bold text-blue-600">
                  {progress}
                </h2>
                <span className="text-3xl">🔵</span>
              </div>

              <div className="h-1 mt-4 bg-blue-100 rounded">
                <div className="h-1 bg-blue-500 w-1/2 rounded"></div>
              </div>

              <p className="text-xs text-gray-400 mt-2">
                Being worked on
              </p>
            </div>

            {/* RESOLVED */}
            <div className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition">
              <p className="text-xs text-gray-500 uppercase">Resolved</p>

              <div className="flex items-center justify-between mt-4">
                <h2 className="text-3xl font-bold text-green-600">
                  {resolved}
                </h2>
                <span className="text-3xl">🟢</span>
              </div>

              <div className="h-1 mt-4 bg-green-100 rounded">
                <div className="h-1 bg-green-500 w-3/4 rounded"></div>
              </div>

              <p className="text-xs text-gray-400 mt-2">
                Completed successfully
              </p>
            </div>

          </div>

          {/* QUICK ACTION BAR */}
          <div className="mt-6 bg-white border rounded-xl p-5 shadow-sm">

            <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase">
              Quick Actions
            </h3>

            <div className="flex flex-wrap gap-3">

              <button
                onClick={() => navigate("/create")}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm shadow"
              >
                + Create Ticket
              </button>

              <button
                onClick={() => navigate("/tickets")}
                className="border px-5 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                View Tickets
              </button>

              <button
                onClick={load}
                className="border px-5 py-2 rounded-lg text-sm hover:bg-gray-50"
              >
                Refresh
              </button>

            </div>
          </div>

          {/* EMPTY STATE */}
          {tickets.length === 0 && (
            <div className="mt-6 bg-white border rounded-xl p-10 text-center shadow-sm">

              <div className="text-5xl">📭</div>

              <h3 className="mt-3 text-gray-700 font-semibold">
                No tickets available
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Create your first request to get started
              </p>

              <button
                onClick={() => navigate("/create")}
                className="mt-4 bg-black text-white px-5 py-2 rounded-lg text-sm"
              >
                Create Ticket
              </button>

            </div>
          )}

        </>
      )}

    </div>
  );
}