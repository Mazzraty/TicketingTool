import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const { user, logout } = useAuth();
  const role = (user?.role || "guest").toLowerCase();
  const [notifications, setNotifications] = useState([]);
const [open, setOpen] = useState(false);

const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const handleClick = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);

    return () =>
      document.removeEventListener("mousedown", handleClick);
  }, []);
  const loadNotifications = async () => {
    const res = await api.get("/notifications");
    setNotifications(res.data.data || []);
  };

  useEffect(() => {
    loadNotifications();
  }, []);
  const navItems = useMemo(() => {
    if (role === "admin") {
      return [
        { label: "Dashboard", path: "/admin/dashboard" },
        { label: "Tickets", path: "/admin/tickets" },
        // { label: "Assets Assign", path: "/admin/assets" },
        // { label: "Upload Excel", path: "/admin/assets/upload-excel" },
        // { label: "Asset History", path: "/admin/assets/history" },
        { label: "Asset Dashboard", path: "/admin/assets/fiori" },
        { label: "Employees", path: "/admin/employees" },
        {
          label: "Vendor List",
          path: "/admin/software-dashboard",
        },
      ];
    }

    return [
      { label: "Dashboard", path: "/" },
      { label: "Create Ticket", path: "/create" },
      { label: "My Tickets", path: "/tickets" },
    ];
  }, [role]);

  const isActive = (path) =>
    location.pathname === path
      ? "bg-[#0a6ed1] text-white shadow-sm"
      : "text-gray-600 hover:bg-gray-100 hover:text-[#0a6ed1]";

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">

      <div className="h-16 px-4 lg:px-8 flex items-center justify-between">

        {/* LEFT */}
        <div className="flex items-center gap-8">

          {/* LOGO */}
          <Link to="/" className="flex items-center gap-3">

            <div className="w-11 h-11 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center justify-center p-2">

              <img
                src="https://www.mazzraty.com/_next/image?url=%2Fimages%2FMazzraty_Logo.png&w=3840&q=75"
                alt="logo"
                className="object-contain"
              />

            </div>

            <div className="leading-tight">

              <h1 className="text-[17px] font-bold text-gray-800">
                Mazzraty
              </h1>

              <p className="text-[11px] text-gray-500 uppercase tracking-wide">
                IT Service Management
              </p>

            </div>
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden lg:flex items-center gap-1">

            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(
                  item.path
                )}`}
              >
                {item.label}
              </Link>
            ))}

          </nav>
        </div>

        {/* RIGHT */}
        <div
          className="flex items-center gap-3 relative"
          ref={dropdownRef}
        >

          {/* SEARCH */}
          <button className="hidden md:flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-600 transition">
            🔍
          </button>

          {/* NOTIFICATIONS */}
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="relative text-xl"
            >
              🔔

              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1 rounded-full">
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg border rounded-lg z-50">

                <div className="p-2 font-semibold border-b">
                  Notifications
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`p-3 border-b hover:bg-gray-50 ${!n.isRead ? "bg-blue-50" : ""
                        }`}
                      onClick={async () => {
                        await api.put(`/notifications/${n._id}/read`);
                        loadNotifications();
                      }}
                    >
                      <div className="font-medium text-sm">
                        {n.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {n.message}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}
          </div>

          {/* ROLE */}
          <div className="hidden md:flex items-center px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold capitalize border border-gray-200">
            {role}
          </div>

          {/* USER */}
          <button
            onClick={() => setOpen(!open)}
            className="w-10 h-10 rounded-full bg-[#0a6ed1] text-white flex items-center justify-center font-semibold shadow-sm hover:opacity-90 transition"
          >
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </button>

          {/* DROPDOWN */}
          {open && (
            <div className="absolute right-0 top-14 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">

              {/* HEADER */}
              <div className="px-5 py-5 border-b bg-gray-50">

                <div className="flex items-center gap-3">

                  <div className="w-12 h-12 rounded-full bg-[#0a6ed1] text-white flex items-center justify-center font-bold">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>

                  <div className="min-w-0">

                    <p className="text-xs text-gray-500">
                      Signed in as
                    </p>

                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {user?.email || "Guest"}
                    </p>

                  </div>
                </div>
              </div>

              {/* ROLE */}
              <div className="px-5 py-4 border-b">

                <div className="flex items-center justify-between">

                  <span className="text-sm text-gray-500">
                    Access Role
                  </span>

                  <span className="px-3 py-1 rounded-full bg-blue-100 text-[#0a6ed1] text-xs font-semibold capitalize">
                    {role}
                  </span>

                </div>
              </div>

              {/* MENU */}
              <div className="p-2">

                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition text-sm font-medium"
                >
                  🚪 Logout
                </button>

              </div>
            </div>
          )}

          {/* MOBILE MENU */}
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="lg:hidden w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 text-xl transition"
          >
            ☰
          </button>

        </div>
      </div>

      {/* MOBILE NAV */}
      {mobileMenu && (
        <div className="lg:hidden border-t border-gray-200 bg-white px-4 py-4">

          <div className="space-y-2">

            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenu(false)}
                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all ${location.pathname === item.path
                  ? "bg-[#0a6ed1] text-white"
                  : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                {item.label}
              </Link>
            ))}

          </div>
        </div>
      )}
    </header>
  );
}