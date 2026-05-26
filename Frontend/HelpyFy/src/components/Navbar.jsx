import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notifications] = useState(2);
  const { user, logout } = useAuth();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const role = (user?.role || "guest").toLowerCase();

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
  const handleSearch = async (value) => {
    setSearch(value);

    if (!value.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);

      const [tickets, assets, employees] = await Promise.all([
        api.get(`/tickets?search=${value}`),
        api.get(`/assets?search=${value}`),
        api.get(`/employees?search=${value}`),
      ]);

      const merged = [
        ...(tickets.data || []).map((t) => ({
          type: "ticket",
          _id: t._id,
          title: t.title,
          status: t.status,
        })),

        ...(assets.data || []).map((a) => ({
          type: "asset",
          _id: a._id,
          assetCode: a.assetCode,
          assetType: a.type,
        })),

        ...(employees.data || []).map((e) => ({
          type: "employee",
          _id: e._id,
          name: e.name,
          staffCode: e.staffCode,
        })),
      ];

      setResults(merged);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };
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
          <div className="hidden md:flex relative items-center">

            <input
              ref={searchRef}
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search tickets, assets, employees..."
              className="w-64 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0a6ed1]"
            />

            {/* DROPDOWN */}
            {search && (
              <div className="absolute top-12 left-0 w-96 bg-white border rounded-xl shadow-lg max-h-80 overflow-y-auto z-50">

                {loading ? (
                  <p className="p-3 text-sm text-gray-500">Searching...</p>
                ) : results.length === 0 ? (
                  <p className="p-3 text-sm text-gray-500">No results</p>
                ) : (
                  results.map((item) => (
                    <div
                      key={item._id}
                      className="p-3 border-b hover:bg-gray-100 cursor-pointer text-sm"
                    >

                      {item.type === "ticket" && (
                        <p>🎫 {item.title} <span className="text-gray-500">({item.status})</span></p>
                      )}

                      {item.type === "asset" && (
                        <p>📦 {item.assetCode} <span className="text-gray-500">({item.assetType})</span></p>
                      )}

                      {item.type === "employee" && (
                        <p>👤 {item.name} <span className="text-gray-500">({item.staffCode})</span></p>
                      )}

                    </div>
                  ))
                )}

              </div>
            )}
          </div>

          {/* NOTIFICATIONS */}
          <button className="relative flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-600 transition">

            🔔

            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                {notifications}
              </span>
            )}
          </button>

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