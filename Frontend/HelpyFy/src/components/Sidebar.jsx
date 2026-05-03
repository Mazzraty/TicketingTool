import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const role = user?.role || "guest";

  const isActive = (path) =>
    location.pathname === path
      ? "bg-indigo-50 text-indigo-600 border-r-2 border-indigo-600"
      : "text-gray-600 hover:bg-gray-50 hover:text-indigo-600";

  return (
    <aside className="w-64 h-screen bg-white border-r fixed left-0 top-0 flex flex-col">

      {/* TOP BRAND (SAAS STYLE) */}
      <div className="h-16 flex items-center px-6 border-b">
        <div className="flex items-center gap-3">

          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
            H
          </div>

          <div className="leading-tight">
            <p className="text-sm font-semibold text-gray-900">
              HelpyFy
            </p>
            <p className="text-[11px] text-gray-500">
              IT Service Desk
            </p>
          </div>

        </div>
      </div>

      {/* NAV CONTENT */}
      <nav className="flex-1 px-3 py-4 space-y-6 text-sm">

        {/* WORKSPACE */}
        <div>
          <p className="px-3 text-[11px] text-gray-400 uppercase tracking-wider">
            Workspace
          </p>

          <div className="mt-2 space-y-1">

            <Link
              to="/"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${isActive("/")}`}
            >
              📊 Dashboard
            </Link>

            <Link
              to="/tickets"
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition ${isActive("/tickets")}`}
            >
              <span>🎫 My Tickets</span>

              {/* REAL-TIME BADGE READY */}
              <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full">
                3
              </span>
            </Link>

          </div>
        </div>

        {/* ACTIONS (USER ONLY) */}
        {role === "user" && (
          <div>
            <p className="px-3 text-[11px] text-gray-400 uppercase tracking-wider">
              Actions
            </p>

            <div className="mt-2 space-y-1">

              <Link
                to="/create"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${isActive("/create")}`}
              >
                ➕ Create Ticket
              </Link>

            </div>
          </div>
        )}

        {/* ADMIN PANEL */}
        {role === "admin" && (
          <div>
            <p className="px-3 text-[11px] text-gray-400 uppercase tracking-wider">
              Admin
            </p>

            <div className="mt-2 space-y-1">

              <Link
                to="/admin"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${isActive("/admin")}`}
              >
                🛠 Admin Dashboard
              </Link>

            </div>
          </div>
        )}

        {/* SYSTEM */}
        <div>
          <p className="px-3 text-[11px] text-gray-400 uppercase tracking-wider">
            System
          </p>

          <div className="mt-2 space-y-1">

            <Link
              to="/about"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${isActive("/about")}`}
            >
              ℹ️ About
            </Link>

            <Link
              to="/contact"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition ${isActive("/contact")}`}
            >
              📩 Support
            </Link>

          </div>
        </div>

      </nav>

      {/* FOOTER (REAL SAAS STYLE) */}
      <div className="p-4 border-t bg-gray-50">

        <div className="flex items-center justify-between">

          <div>
            <p className="text-xs text-gray-500">
              Signed in as
            </p>
            <p className="text-sm font-medium text-gray-800 truncate">
              {user?.name || "Guest"}
            </p>
          </div>

          <span className="text-[10px] px-2 py-1 rounded-full bg-gray-200 text-gray-600 capitalize">
            {role}
          </span>

        </div>

      </div>

    </aside>
  );
}