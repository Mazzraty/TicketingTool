import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notifications] = useState(2);

  // ✅ FIX: reactive user state (IMPORTANT)
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = () => {
      const stored = localStorage.getItem("user");
      setUser(stored ? JSON.parse(stored) : null);
    };

    loadUser();

    // sync across tabs / updates
    window.addEventListener("storage", loadUser);

    return () => window.removeEventListener("storage", loadUser);
  }, []);

  const role = (user?.role || "guest").toLowerCase();

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

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
      ? "text-green-700 font-semibold"
      : "text-gray-600 hover:text-green-700";

  // NAV ITEMS (ROLE BASED)
  const navItems = useMemo(() => {
    if (role === "admin") {
      return [
        { label: "Dashboard", path: "/" },
        { label: "Admin Tickets", path: "/admin" },
        { label: "Assets", path: "/admin/assets" },
        { label: "Upload Excel", path: "/admin/assets/upload-excel" },
        { label: "Asset History", path: "/admin/assets/history" },
        { label: "Employees", path: "/admin/employees" },
      ];
    }

    return [
      { label: "Dashboard", path: "/" },
      { label: "Create Ticket", path: "/create" },
      { label: "My Tickets", path: "/tickets" },
    ];
  }, [role]);

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-green-50 via-white to-green-50 border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* LOGO */}
        <div className="flex items-center gap-3">
          <img
            src="https://www.mazzraty.com/_next/image?url=%2Fimages%2FMazzraty_Logo.png&w=3840&q=75"
            alt="logo"
            className="h-9"
          />

          <div className="leading-tight">
            <p className="text-sm font-bold text-green-700">
              HelpyFy
            </p>
            <p className="text-[11px] text-gray-500">
              IT Helpdesk System
            </p>
          </div>
        </div>

        {/* DESKTOP MENU */}
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

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-3 relative" ref={dropdownRef}>

          {/* NOTIFICATION */}
          <button className="relative p-2 rounded-lg hover:bg-green-100">
            🔔
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-green-600 text-white text-[10px] px-1.5 rounded-full">
                {notifications}
              </span>
            )}
          </button>

          {/* ROLE BADGE */}
          <span className="hidden sm:inline-flex text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full capitalize">
            {role}
          </span>

          {/* USER AVATAR */}
          <button
            onClick={() => setOpen(!open)}
            className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center font-semibold"
          >
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </button>

          {/* DROPDOWN */}
          {open && (
            <div className="absolute right-0 top-12 w-56 bg-white border rounded-xl shadow-lg overflow-hidden">

              <div className="px-4 py-3 border-b">
                <p className="text-xs text-gray-500">Signed in as</p>
                <p className="text-sm font-medium truncate">
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

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="md:hidden text-xl px-2"
          >
            ☰
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileMenu && (
        <div className="md:hidden bg-white border-t px-4 py-3 space-y-2 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenu(false)}
              className="block py-2 text-gray-700 hover:text-green-700"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}