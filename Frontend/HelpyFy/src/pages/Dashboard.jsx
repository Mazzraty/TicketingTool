import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

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
    <div className="min-h-screen bg-slate-50 p-6">

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Overview
        </h1>
        <p className="text-sm text-gray-500">
          Your ticket activity at a glance
        </p>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="mb-4 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* LOADING STATE */}
      {loading ? (
        <div className="bg-white border rounded-xl p-10 text-center text-gray-500">
          Loading dashboard...
        </div>
      ) : (
        <>
          {/* KPI GRID (SAAS STYLE CARDS) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div className="bg-white border rounded-xl p-5 hover:shadow-sm transition">
              <p className="text-sm text-gray-500">Open Tickets</p>
              <h2 className="text-3xl font-bold text-amber-600 mt-1">
                {open}
              </h2>
            </div>

            <div className="bg-white border rounded-xl p-5 hover:shadow-sm transition">
              <p className="text-sm text-gray-500">In Progress</p>
              <h2 className="text-3xl font-bold text-blue-600 mt-1">
                {progress}
              </h2>
            </div>

            <div className="bg-white border rounded-xl p-5 hover:shadow-sm transition">
              <p className="text-sm text-gray-500">Resolved</p>
              <h2 className="text-3xl font-bold text-emerald-600 mt-1">
                {resolved}
              </h2>
            </div>

          </div>

          {/* EMPTY STATE */}
          {tickets.length === 0 && (
            <div className="mt-8 bg-white border rounded-xl p-10 text-center">
              <h3 className="text-gray-700 font-medium">
                No tickets yet
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Create your first support ticket to get started
              </p>

              <button
                onClick={() => navigate("/create")}
                className="mt-4 bg-black text-white px-4 py-2 rounded-lg text-sm"
              >
                + Create Ticket
              </button>
            </div>
          )}

          {/* QUICK ACTIONS */}
          {tickets.length > 0 && (
            <div className="mt-6 flex gap-3">

              <button
                onClick={() => navigate("/create")}
                className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800"
              >
                + Create Ticket
              </button>

              <button
                onClick={() => navigate("/tickets")}
                className="border px-4 py-2 rounded-lg text-sm hover:bg-white"
              >
                View My Tickets
              </button>

            </div>
          )}
        </>
      )}

    </div>
  );
}