import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import api from "../api/axios";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notifications] = useState(2);

  const { user, logout } = useAuth();
  const role = (user?.role || "guest").toLowerCase();

  /* ================= SAP SEARCH STATES ================= */
  const [openSearch, setOpenSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const [history, setHistory] = useState(
    JSON.parse(localStorage.getItem("searchHistory") || "[]")
  );

  /* ================= LOGOUT ================= */
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  /* ================= OUTSIDE CLICK ================= */
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* ================= CTRL + K + KEYBOARD ================= */
  useEffect(() => {
    const handleKey = (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpenSearch(true);
      }

      if (e.key === "Escape") {
        setOpenSearch(false);
        setQuery("");
        setResults([]);
      }

      if (!openSearch) return;

      if (e.key === "ArrowDown") {
        setSelectedIndex((p) =>
          p < results.length - 1 ? p + 1 : 0
        );
      }

      if (e.key === "ArrowUp") {
        setSelectedIndex((p) =>
          p > 0 ? p - 1 : results.length - 1
        );
      }

      if (e.key === "Enter") {
        const item = results[selectedIndex];
        if (item) handleOpen(item);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [openSearch, results, selectedIndex]);

  /* ================= SEARCH API ================= */
  const handleSearch = (value) => {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
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
        setSelectedIndex(0);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 250);
  };

  /* ================= HISTORY ================= */
  const saveHistory = (q) => {
    const updated = [q, ...history.filter((h) => h !== q)].slice(0, 5);
    setHistory(updated);
    localStorage.setItem("searchHistory", JSON.stringify(updated));
  };

  /* ================= OPEN ITEM ================= */
  const handleOpen = (item) => {
    if (!item) return;

    saveHistory(query);

    setOpenSearch(false);
    setQuery("");

    if (item.type === "ticket") {
      navigate(`/admin/tickets/${item._id}`);
    } else if (item.type === "asset") {
      navigate(`/admin/assets`);
    } else if (item.type === "employee") {
      navigate(`/admin/employees`);
    }
  };

  /* ================= NAV ITEMS ================= */
  const navItems = useMemo(() => {
    if (role === "admin") {
      return [
        { label: "Dashboard", path: "/admin/dashboard" },
        { label: "Tickets", path: "/admin/tickets" },
        { label: "Asset Dashboard", path: "/admin/assets/fiori" },
        { label: "Employees", path: "/admin/employees" },
        { label: "Vendor List", path: "/admin/software-dashboard" },
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

          <Link to="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white border shadow-sm flex items-center justify-center p-2">
              <img
                src="https://www.mazzraty.com/_next/image?url=%2Fimages%2FMazzraty_Logo.png&w=3840&q=75"
                className="object-contain"
              />
            </div>

            <div>
              <h1 className="text-[17px] font-bold">Mazzraty</h1>
              <p className="text-[11px] text-gray-500">
                IT Service Management
              </p>
            </div>
          </Link>

          <nav className="hidden lg:flex gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg text-sm ${isActive(item.path)}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3" ref={dropdownRef}>

          {/* SEARCH BUTTON */}
          <button
            onClick={() => setOpenSearch(true)}
            className="w-10 h-10 border rounded-lg"
          >
            🔍
          </button>

          {/* NOTIFICATION */}
          <button className="w-10 h-10 border rounded-lg">
            🔔
          </button>

          {/* ROLE */}
          <div className="hidden md:flex px-3 py-2 bg-gray-100 rounded-lg text-xs">
            {role}
          </div>

          {/* USER */}
          <button
            onClick={() => setOpen(!open)}
            className="w-10 h-10 bg-[#0a6ed1] text-white rounded-full"
          >
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </button>

          {/* USER DROPDOWN */}
          {open && (
            <div className="absolute right-0 top-14 w-72 bg-white border rounded-2xl shadow-xl">

              <div className="p-4 border-b">
                <p className="text-sm">{user?.email}</p>
              </div>

              <button
                onClick={handleLogout}
                className="w-full text-left p-3 text-red-600"
              >
                Logout
              </button>

            </div>
          )}
        </div>
      </div>

      {/* ================= SAP SEARCH MODAL ================= */}
      {openSearch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-24">

          <div className="bg-white w-[900px] h-[520px] rounded-2xl shadow-2xl flex overflow-hidden">

            {/* LEFT */}
            <div className="w-1/2 border-r">

              <input
                autoFocus
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search tickets, assets, employees..."
                className="w-full p-4 border-b outline-none"
              />

              {!query && (
                <div className="p-3 text-xs text-gray-500">
                  Recent Searches
                  {history.map((h, i) => (
                    <div
                      key={i}
                      onClick={() => handleSearch(h)}
                      className="p-2 hover:bg-gray-100 cursor-pointer rounded"
                    >
                      🕘 {h}
                    </div>
                  ))}
                </div>
              )}

              <div className="overflow-y-auto max-h-[420px]">
                {results.map((item, i) => (
                  <div
                    key={item._id}
                    onClick={() => handleOpen(item)}
                    className={`p-3 border-b cursor-pointer ${
                      i === selectedIndex ? "bg-blue-50" : ""
                    }`}
                  >
                    {item.type === "ticket" && (
                      <p>🎫 {item.title}</p>
                    )}
                    {item.type === "asset" && (
                      <p>📦 {item.assetCode}</p>
                    )}
                    {item.type === "employee" && (
                      <p>👤 {item.name}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT PREVIEW */}
            <div className="w-1/2 p-5 bg-gray-50">
              {results[selectedIndex] ? (
                <>
                  <h2 className="font-bold mb-4">Preview</h2>

                  {results[selectedIndex].type === "ticket" && (
                    <div>
                      <p><b>Title:</b> {results[selectedIndex].title}</p>
                      <p><b>Status:</b> {results[selectedIndex].status}</p>
                    </div>
                  )}

                  {results[selectedIndex].type === "asset" && (
                    <p>{results[selectedIndex].assetCode}</p>
                  )}

                  {results[selectedIndex].type === "employee" && (
                    <p>{results[selectedIndex].name}</p>
                  )}
                </>
              ) : (
                <p className="text-gray-400">No preview</p>
              )}
            </div>

          </div>
        </div>
      )}
    </header>
  );
}