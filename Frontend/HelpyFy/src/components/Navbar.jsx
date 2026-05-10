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
      ? "bg-white text-green-700 font-semibold shadow-sm"
      : "text-white/90 hover:bg-white/10 hover:text-white";

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
    <header className="sticky top-0 z-50 bg-gradient-to-r from-green-700 via-green-600 to-green-700 shadow-lg border-b border-green-500">

      <div className="max-w-[1700px] mx-auto px-6 lg:px-10 h-18 flex items-center justify-between">

        {/* LOGO */}
        <div className="flex items-center gap-4">

          <div className="bg-white rounded-xl p-2 shadow-md">
            <img
              src="https://www.mazzraty.com/_next/image?url=%2Fimages%2FMazzraty_Logo.png&w=3840&q=75"
              alt="logo"
              className="h-9"
            />
          </div>

          <div className="leading-tight">
            <p className="text-lg font-bold text-white tracking-wide">
              HelpyFy
            </p>

            <p className="text-[11px] text-green-100">
              IT Helpdesk System
            </p>
          </div>
        </div>

        {/* DESKTOP MENU */}
        <nav className="hidden md:flex items-center gap-3 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-2 rounded-xl transition-all duration-200 ${isActive(
                item.path
              )}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* RIGHT SIDE */}
        <div
          className="flex items-center gap-4 relative"
          ref={dropdownRef}
        >

          {/* NOTIFICATION */}
          <button className="relative p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition">
            🔔

            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-white text-green-700 text-[10px] font-bold px-1.5 rounded-full">
                {notifications}
              </span>
            )}
          </button>

          {/* ROLE BADGE */}
          <span className="hidden sm:inline-flex text-xs px-3 py-1.5 bg-white/15 text-white rounded-full capitalize border border-white/20">
            {role}
          </span>

          {/* USER AVATAR */}
          <button
            onClick={() => setOpen(!open)}
            className="w-10 h-10 rounded-full bg-white text-green-700 flex items-center justify-center font-bold shadow-md border-2 border-white"
          >
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </button>

          {/* DROPDOWN */}
          {open && (
            <div className="absolute right-0 top-14 w-60 bg-white border rounded-2xl shadow-2xl overflow-hidden">

              <div className="px-4 py-4 border-b bg-green-50">
                <p className="text-xs text-gray-500">
                  Signed in as
                </p>

                <p className="text-sm font-semibold truncate text-gray-800">
                  {user?.email || "Guest"}
                </p>
              </div>

              <div className="px-4 py-3 text-sm text-gray-600">
                Role:
                <span className="ml-2 capitalize font-semibold text-green-700">
                  {role}
                </span>
              </div>

              <button
                onClick={logout}
                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition"
              >
                Logout
              </button>
            </div>
          )}

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="md:hidden text-2xl text-white px-2"
          >
            ☰
          </button>
        </div>
      </div>

      {/* MOBILE MENU */}
      {mobileMenu && (
        <div className="md:hidden bg-green-700 border-t border-green-500 px-4 py-4 space-y-2 text-sm">

          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenu(false)}
              className="block py-3 px-4 rounded-xl text-white hover:bg-white/10 transition"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}