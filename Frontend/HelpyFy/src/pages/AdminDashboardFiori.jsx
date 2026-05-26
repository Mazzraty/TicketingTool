import { useEffect, useState } from "react";
import api from "../api/axios";

export default function AdminDashboardFiori() {
  const [stats, setStats] = useState({
    totalAssets: 0,
    laptops: 0,
    printers: 0,
    hht: 0,
    assigned: 0,
    available: 0,
    employees: 0,
    openTickets: 0,
    inProgress: 0,
    closed: 0,
  });

  const [recentAssets, setRecentAssets] = useState([]);
  const [recentTickets, setRecentTickets] = useState([]);

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(0);

  const loadDashboard = async () => {
    try {
      const [statsRes, assetsRes, ticketsRes] = await Promise.all([
        api.get("/dashboard/stats"),
        api.get("/dashboard/recent-assets"),
        api.get("/dashboard/recent-tickets"),
      ]);

      setStats({
        totalAssets: 0,
        laptops: 0,
        printers: 0,
        hht: 0,
        assigned: 0,
        available: 0,
        employees: 0,
        openTickets: 0,
        inProgress: 0,
        closed: 0,
        ...statsRes.data,
      });

      setRecentAssets(assetsRes.data || []);
      setRecentTickets(ticketsRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f7fa] p-6">

      {/* HEADER */}
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Tile title="Assets" value={stats.totalAssets} />
        <Tile title="Assigned" value={stats.assigned} />
        <Tile title="Available" value={stats.available} />
        <Tile title="Employees" value={stats.employees} />

        <Tile title="Open" value={stats.openTickets} />
        <Tile title="Progress" value={stats.inProgress} />
        <Tile title="Closed" value={stats.closed} />
        <Tile title="Laptops" value={stats.laptops} />
      </div>

      {/* RECENT TICKETS */}
      <div className="bg-white p-5 rounded-xl shadow mb-6">
        <h2 className="font-semibold mb-3">Recent Tickets</h2>

        {recentTickets.map((t) => (
          <div
            key={t._id}
            onClick={() => setSelectedTicket(t)}
            className="p-3 border rounded mb-2 cursor-pointer hover:bg-gray-100"
          >
            <p className="font-medium">{t.title}</p>
            <p className="text-sm text-gray-500">{t.status}</p>
          </div>
        ))}
      </div>

      {/* OBJECT PAGE MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white w-[95%] h-[90%] rounded-2xl flex flex-col">

            {/* HEADER */}
            <div className="flex justify-between p-4 border-b">
              <h2 className="text-xl font-bold">Ticket Object Page</h2>
              <button onClick={() => setSelectedTicket(null)}>✕</button>
            </div>

            {/* BODY */}
            <div className="flex flex-1 overflow-hidden">

              {/* LEFT */}
              <div className="w-1/3 p-4 border-r overflow-y-auto">
                <h3 className="text-lg font-semibold">{selectedTicket.title}</h3>

                <p className="text-gray-600 mt-2">
                  {selectedTicket.description}
                </p>

                <div className="mt-4 text-sm space-y-2">
                  <p><b>Dept:</b> {selectedTicket.department}</p>
                  <p><b>Priority:</b> {selectedTicket.priority}</p>
                  <p><b>Status:</b> {selectedTicket.status}</p>
                </div>

                <div className="mt-6 space-y-2">
                  <button className="w-full bg-green-500 text-white p-2 rounded">
                    Approve
                  </button>
                  <button className="w-full bg-red-500 text-white p-2 rounded">
                    Reject
                  </button>
                </div>
              </div>

              {/* RIGHT TIMELINE */}
              <div className="w-1/3 p-4 border-r overflow-y-auto">
                <h3 className="font-semibold mb-4">Timeline</h3>

                <Timeline label="Created" time={selectedTicket.createdAt} color="bg-blue-500" />
                <Timeline label="In Progress" time={selectedTicket.inProgressAt} color="bg-yellow-500" />
                <Timeline label="Closed" time={selectedTicket.closedAt} color="bg-green-500" />
                <Timeline label="Reopened" time={selectedTicket.reopenedAt} color="bg-red-500" />
              </div>

              {/* BOTTOM RIGHT PANEL */}
              <div className="w-1/3 p-4 flex flex-col">

                {/* COMMENTS */}
                <h3 className="font-semibold mb-2">Comments</h3>

                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="border p-2 rounded h-24 mb-2"
                />

                <button className="bg-blue-500 text-white p-2 rounded mb-4">
                  Add Comment
                </button>

                {/* RATING */}
                <h3 className="font-semibold mb-2">Rating</h3>

                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map((n) => (
                    <span
                      key={n}
                      onClick={() => setRating(n)}
                      className={`text-2xl cursor-pointer ${
                        rating >= n ? "text-yellow-400" : "text-gray-300"
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>

                <button className="bg-purple-600 text-white p-2 rounded">
                  Submit Rating
                </button>

              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= TILE ================= */
function Tile({ title, value }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <p className="text-gray-500 text-sm">{title}</p>
      <h2 className="text-2xl font-bold">{value}</h2>
    </div>
  );
}

/* ================= TIMELINE ================= */
function Timeline({ label, time, color }) {
  return (
    <div className="flex gap-3 mb-3">
      <div className={`w-3 h-3 rounded-full ${color}`}></div>
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-xs text-gray-500">
          {time ? new Date(time).toLocaleString() : "Pending"}
        </p>
      </div>
    </div>
  );
}