import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const role = user?.role || "guest";

  const isActive = (path) =>
    location.pathname === path
      ? "bg-green-50 text-green-700 font-semibold border-r-4 border-green-600 shadow-sm"
      : "text-gray-600 hover:bg-green-50 hover:text-green-700";

  const NavItem = ({ to, icon, label }) => (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive(
        to
      )}`}
    >
      <span className="text-lg">{icon}</span>

      <span className="text-sm font-medium">
        {label}
      </span>
    </Link>
  );

  return (
    <aside className="sticky top-16 h-[calc(100vh-64px)] w-[280px] bg-white border-r shadow-sm flex flex-col">
      LOGO SECTION
      {/* <div className="h-16 flex items-center gap-3 px-5 border-b bg-green-700">

        <div className="bg-white p-2 rounded-xl shadow-sm border">
          <img
            src="https://www.mazzraty.com/_next/image?url=%2Fimages%2FMazzraty_Logo.png&w=3840&q=75"
            className="h-8 object-contain"
            alt="logo"
          />
        </div>



        <div>
          <p className="text-lg font-bold text-white">
            HelpyFy
          </p>

          <p className="text-[11px] text-green-100">
            IT Helpdesk
          </p>
        </div>
      </div> */}

      {/* MENU */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">

        {/* USER SECTION */}
        {role === "user" && (
          <div>

            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-3">
              User Menu
            </p>

            <div className="space-y-2">
              <NavItem to="/" icon="📊" label="Dashboard" />
              <NavItem to="/tickets" icon="🎫" label="My Tickets" />
              <NavItem to="/create" icon="➕" label="Create Ticket" />
            </div>
          </div>
        )}

        {/* ADMIN SECTION */}
        {role === "admin" && (
          <div>

            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-3">
              Admin Panel
            </p>

            <div className="space-y-2">
              <NavItem to="/admin" icon="🛠" label="Admin Dashboard" />

              <NavItem
                to="/admin/employees"
                icon="👨‍💼"
                label="Employees"
              />

              <NavItem
                to="/admin/assets/upload-excel"
                icon="📤"
                label="Upload Excel"
              />

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
            </div>
          </div>
        )}
      </div>

      {/* USER INFO */}
      <div className="border-t bg-gradient-to-r from-green-50 to-white px-4 py-4">

        <div className="flex items-center gap-3">

          <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold shadow-sm">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500">
              Signed in as
            </p>

            <p className="text-sm font-semibold text-gray-800 truncate">
              {user?.name || "Guest"}
            </p>

            <p className="text-xs text-green-600 capitalize font-medium">
              {role}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}