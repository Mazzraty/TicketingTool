import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const role = user?.role || "guest";

  const isActive = (path) =>
    location.pathname === path
      ? "bg-blue-50 text-blue-700 font-semibold border-r-4 border-blue-600"
      : "text-gray-600 hover:bg-gray-100 hover:text-blue-700";

  const NavItem = ({ to, icon, label }) => (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-2 rounded-md transition ${isActive(
        to
      )}`}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm">{label}</span>
    </Link>
  );

  return (
    <aside className="h-screen w-[260px] bg-white border-r flex flex-col">

      {/* LOGO */}
      <div className="h-16 flex items-center px-5 border-b bg-white">
        <img
          src="https://www.mazzraty.com/_next/image?url=%2Fimages%2FMazzraty_Logo.png&w=3840&q=75"
          className="h-9 object-contain"
          alt="logo"
        />
      </div>

      {/* MENU */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">

        {/* USER SECTION ONLY */}
        {role === "user" && (
          <div>
            <p className="text-[11px] text-gray-400 uppercase px-3 mb-2">
              User Menu
            </p>

            <div className="space-y-1">
              <NavItem to="/" icon="📊" label="Dashboard" />
              <NavItem to="/tickets" icon="🎫" label="My Tickets" />
              <NavItem to="/create" icon="➕" label="Create Ticket" />
            </div>
          </div>
        )}

        {/* ADMIN SECTION (UNCHANGED - DO NOT TOUCH) */}
        {role === "admin" && (
          <div className="pt-2 border-t">
            <p className="text-[11px] text-gray-400 uppercase px-3 mb-2">
              Admin Panel
            </p>

            <div className="space-y-1">
              <NavItem to="/admin" icon="🛠" label="Admin Dashboard" />
              <NavItem to="/admin/employees" icon="👨‍💼" label="Employees" />
              <NavItem to="/admin/assets/upload-excel" icon="📤" label="Upload Excel" />
              <NavItem to="/admin/assets" icon="📦" label="Assets" />
              <NavItem to="/admin/assets/history" icon="📊" label="Asset History" />
            </div>
          </div>
        )}

      </div>

      {/* USER INFO */}
      <div className="border-t px-4 py-3 bg-gray-50">
        <p className="text-xs text-gray-500">Signed in as</p>
        <p className="text-sm font-semibold text-gray-800">
          {user?.name || "Guest"}
        </p>
        <p className="text-xs text-blue-600 capitalize">{role}</p>
      </div>

    </aside>
  );
}