import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const { user } = useAuth();
  const role = (user?.role || "guest").toLowerCase();

  const isActive = (path) =>
    location.pathname === path
      ? "bg-[#0a6ed1] text-white shadow-sm"
      : "text-gray-600 hover:bg-gray-100 hover:text-[#0a6ed1]";

  const NavItem = ({ to, icon, label }) => (
    <Link
      to={to}
      className={`flex items-center ${collapsed ? "justify-center" : "gap-3"
        } px-4 py-3 rounded-xl transition-all duration-200 ${isActive(to)}`}
    >
      <span className="text-lg">{icon}</span>

      {!collapsed && (
        <span className="text-sm font-medium whitespace-nowrap">
          {label}
        </span>
      )}
    </Link>
  );

  return (
    <aside
      className={`h-[calc(100vh-64px)] bg-white border-r border-gray-200 shadow-sm flex flex-col transition-all duration-300 ${collapsed ? "w-[90px]" : "w-[280px]"
        }`}
    >
      {/* TOP */}
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">

        {!collapsed && (
          <div>
            <h1 className="text-lg font-bold text-gray-800">
              HelpyFy
            </h1>

            <p className="text-[11px] text-gray-500 uppercase tracking-wide">
              IT Helpdesk
            </p>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-10 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 transition"
        >
          {collapsed ? "➡️" : "⬅️"}
        </button>
      </div>

      {/* MENU */}
      <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">

        {/* USER MENU */}
        {role === "user" && (
          <div>

            {!collapsed && (
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-3">
                User Menu
              </p>
            )}

            <div className="space-y-2">
              <NavItem to="/" icon="📊" label="Dashboard" />
              <NavItem to="/tickets" icon="🎫" label="My Tickets" />
              <NavItem to="/create" icon="➕" label="Create Ticket" />
            </div>
          </div>
        )}

        {/* ADMIN MENU */}
        {role === "admin" && (
          <div>

            {!collapsed && (
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-3">
                Admin Panel
              </p>
            )}

            <div className="space-y-2">

              <NavItem
                to="/admin"
                icon="🛠"
                label="Admin Dashboard"
              />

              <NavItem
                to="/admin/employees"
                icon="👨‍💼"
                label="Employees"
              />

              {/* <NavItem
                to="/admin/assets/upload-excel"
                icon="📤"
                label="Upload Excel"
              /> */}

              <NavItem
                to="/admin/assets"
                icon="📦"
                label="Assets"
              />

              <NavItem
                to="/admin/assets/history"
                icon="📈"
                label="Asset History"
              />
              {/* <NavItem
                to="/admin/assets/upload-laptop"
                icon="💻"
                label="Laptop Upload"
              /> */}
            </div>
          </div>
        )}
      </div>

      {/* USER INFO */}
      <div className="border-t border-gray-200 bg-gray-50 px-3 py-4">

        <div
          className={`flex items-center ${collapsed ? "justify-center" : "gap-3"
            }`}
        >

          <div className="w-10 h-10 rounded-full bg-[#0a6ed1] text-white flex items-center justify-center font-bold shadow-sm">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">

              <p className="text-xs text-gray-500">
                Signed in as
              </p>

              <p className="text-sm font-semibold text-gray-800 truncate">
                {user?.name || "Guest"}
              </p>

              <p className="text-xs text-[#0a6ed1] capitalize font-medium">
                {role}
              </p>

            </div>
          )}
        </div>
      </div>
    </aside>
  );
}