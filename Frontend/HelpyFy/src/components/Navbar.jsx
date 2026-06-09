import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import api from "../api/axios";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  const [mobileMenu, setMobileMenu] = useState(false);
  const { user, logout } = useAuth();
  const role = (user?.role || "guest").toLowerCase();
  const [notifications, setNotifications] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  /* ===================================
     SEARCH
  =================================== */
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // debounce search
// debounce search
useEffect(() => {
  if (!searchQuery.trim()) {
    setSearchResults(null);
    return;
  }

  const timer = setTimeout(async () => {
    try {
      setSearchLoading(true);

      // ← admin sees all, user sees only their data
      const endpoint =
        role === "admin"
          ? `/search?q=${encodeURIComponent(searchQuery)}`
          : `/search?q=${encodeURIComponent(searchQuery)}&userId=${user?._id}`;

      const res = await api.get(endpoint);
      setSearchResults(res.data);
    } catch (err) {
      console.error(err);
      setSearchResults(null);
    } finally {
      setSearchLoading(false);
    }
  }, 400);

  return () => clearTimeout(timer);
}, [searchQuery, role]);
  // close search on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
        setSearchQuery("");
        setSearchResults(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // close search on route change
  useEffect(() => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults(null);
  }, [location.pathname]);

  const handleResultClick = (path) => {
    navigate(path);
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults(null);
  };

  const totalResults =
    (searchResults?.tickets?.length || 0) +
    (searchResults?.assets?.length || 0) +
    (searchResults?.employees?.length || 0);

  /* ===================================
     NOTIFICATIONS
  =================================== */
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setNotificationOpen(false);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
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
              <h1 className="text-[17px] font-bold text-gray-800">Mazzraty</h1>
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
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(item.path)}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3 relative" ref={dropdownRef}>

          {/* SEARCH */}
          <div className="relative hidden md:block" ref={searchRef}>

            {/* SEARCH TRIGGER */}
            {!searchOpen ? (
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 text-gray-600 transition"
              >
                🔍
              </button>
            ) : (
              <div className="flex items-center gap-2 w-72 px-3 py-2 rounded-lg border border-[#0a6ed1] bg-white shadow-sm">
                <span className="text-gray-400 text-sm">🔍</span>
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tickets, assets, employees..."
                  className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            {/* SEARCH DROPDOWN */}
            {searchOpen && searchQuery && (
              <div className="absolute right-0 top-12 w-96 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden">

                {searchLoading ? (
                  <div className="p-6 text-center text-sm text-gray-400">
                    Searching...
                  </div>
                ) : totalResults === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-400">
                    No results found for "{searchQuery}"
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">

                    {/* TICKETS */}
                    {searchResults?.tickets?.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-gray-50 border-b">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            🎫 Tickets
                          </p>
                        </div>
                        {searchResults.tickets.map((t) => (
                          <div
                            key={t._id}
                            onClick={() =>
                              handleResultClick(
                                role === "admin"
                                  ? `/admin/tickets/${t._id}`
                                  : `/tickets/${t._id}`
                              )
                            }
                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b"
                          >
                            <p className="text-sm font-medium text-gray-800">
                              {t.title}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              #{t.ticketId || t._id?.slice(-6)} · {t.status}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ASSETS */}
                    {searchResults?.assets?.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-gray-50 border-b">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            💻 Assets
                          </p>
                        </div>
                        {searchResults.assets.map((a) => (
                          <div
                            key={a._id}
                            onClick={() =>
                              handleResultClick("/admin/assets/fiori")
                            }
                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b"
                          >
                            <p className="text-sm font-medium text-gray-800">
                              {a.assetCode}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {a.type} · {a.model || "-"}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* EMPLOYEES */}
                    {searchResults?.employees?.length > 0 && (
                      <div>
                        <div className="px-4 py-2 bg-gray-50 border-b">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            👤 Employees
                          </p>
                        </div>
                        {searchResults.employees.map((e) => (
                          <div
                            key={e._id}
                            onClick={() =>
                              handleResultClick("/admin/employees")
                            }
                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b"
                          >
                            <p className="text-sm font-medium text-gray-800">
                              {e.name}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {e.staffCode} · {e.department || "-"}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                )}

              </div>
            )}
          </div>

          {/* NOTIFICATIONS */}
          <div className="relative">
            <button
              onClick={() => setNotificationOpen(!notificationOpen)}
              className="relative text-xl"
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs px-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg border rounded-lg z-50">
                <div className="p-2 font-semibold border-b">Notifications</div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`p-3 border-b hover:bg-gray-50 ${!n.isRead ? "bg-blue-50" : ""}`}
                      onClick={async () => {
                        await api.put(`/notifications/${n._id}/read`);
                        loadNotifications();
                      }}
                    >
                      <div className="font-medium text-sm">{n.title}</div>
                      <div className="text-xs text-gray-500">{n.message}</div>
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
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-10 h-10 rounded-full bg-[#0a6ed1] text-white flex items-center justify-center font-semibold shadow-sm hover:opacity-90 transition"
          >
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </button>

          {/* USER DROPDOWN */}
          {userMenuOpen && (
            <div className="absolute right-0 top-14 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-5 border-b bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#0a6ed1] text-white flex items-center justify-center font-bold">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500">Signed in as</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {user?.email || "Guest"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 border-b">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Access Role</span>
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-[#0a6ed1] text-xs font-semibold capitalize">
                    {role}
                  </span>
                </div>
              </div>

              <div className="p-2">
                <button
                  onClick={handleLogout}
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
                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  location.pathname === item.path
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