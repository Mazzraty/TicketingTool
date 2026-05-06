import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notifications] = useState(2);

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const role = user?.role || "guest";

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // close dropdown when click outside
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const isActive = (path) =>
    location.pathname === path
      ? "text-indigo-600 font-semibold"
      : "text-gray-600 hover:text-indigo-600";

  // ✅ ROLE BASED MENU (FINAL FIXED)
  const navItems = useMemo(() => {
    if (role === "admin") {
      return [
        { label: "Dashboard", path: "/" },
        { label: "Tickets", path: "/admin" },
        { label: "Assets", path: "/admin/assets" },
        { label: "Asset History", path: "/admin/assets/history" },
        { label: "Employees", path: "/admin/employees" } // ✅ FIXED
      ];
    }

    return [
      { label: "Dashboard", path: "/" },
      { label: "Create Ticket", path: "/create" },
      { label: "My Tickets", path: "/tickets" },
      { label: "Employees", path: "/employees" }
    ];
  }, [role]);

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* BRAND */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
            H
          </div>

          <div className="leading-tight">
            <div className="text-sm font-semibold text-gray-900">
              HelpyFy
            </div>
            <div className="text-[11px] text-gray-500">
              IT Ticketing System
            </div>
          </div>
        </div>

        {/* NAV */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={isActive(item.path)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* RIGHT */}
        <div className="flex items-center gap-4 relative" ref={dropdownRef}>

          {/* NOTIFICATIONS */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100">
            🔔
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {notifications}
              </span>
            )}
          </button>

          {/* ROLE */}
          <span className="hidden sm:inline-flex text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 capitalize">
            {role}
          </span>

          {/* AVATAR */}
          <button
            onClick={() => setOpen(!open)}
            className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold"
          >
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </button>

          {/* DROPDOWN */}
          {open && (
            <div className="absolute right-0 top-12 w-56 bg-white border rounded-xl shadow-lg overflow-hidden">
              <div className="px-4 py-3 border-b">
                <p className="text-xs text-gray-500">Signed in as</p>
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {user?.email || "Guest"}
                </p>
              </div>

              <div className="px-4 py-2 text-xs text-gray-500">
                Role: {role}
              </div>

              <button
                onClick={logout}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Logout
              </button>
            </div>
          )}

          {/* MOBILE BTN */}
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="md:hidden p-2 rounded hover:bg-gray-100"
          >
            ☰
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileMenu && (
        <div className="md:hidden border-t bg-white px-6 py-4 space-y-3 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenu(false)}
              className="block text-gray-700 hover:text-indigo-600"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}