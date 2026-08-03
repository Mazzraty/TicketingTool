import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import api from "../api/axios";
import { changeFavicon } from "../utils/favicon";
import {
  Search,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  CheckCheck,
  Trash2,
} from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  const [mobileMenu, setMobileMenu] = useState(false);
  const { user, logout } = useAuth();
  const role = (user?.role || "guest").toLowerCase();
  const isAdminRole = ["company_admin", "super_admin", "it_support"].includes(
    role
  );
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
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);

        const endpoint = isAdminRole
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
    try {
      const res = await api.get("/notifications");

      const data = res.data.data || [];

      setNotifications(data);

      // Update browser title
      const unread = data.filter((n) => !n.isRead).length;

      document.title = unread > 0 ? `(${unread}) HelpyFy` : "HelpyFy";

      changeFavicon(unread > 0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {

    loadNotifications();

    const interval = setInterval(() => {
      loadNotifications();
    }, 15000);

    return () => clearInterval(interval);

  }, []);
  const navItems = useMemo(() => {
    if (isAdminRole) {
      return [
        { label: "Dashboard", path: "/admin/dashboard" },
        { label: "Tickets", path: "/admin/tickets" },
        { label: "Assets", path: "/admin/assets/fiori" },
        { label: "Employees", path: "/admin/employees" },
        { label: "Vendors", path: "/admin/software-dashboard" },
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
      ? "text-[#1f4a35] font-semibold border-b-2 border-[#1f4a35]"
      : "text-gray-600 hover:text-[#1f4a35] border-b-2 border-transparent";

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="h-16 px-4 lg:px-8 grid grid-cols-[auto_1fr_auto] items-center gap-4">

        {/* LOGO */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#1f4a35] to-[#0f2419] flex items-center justify-center p-1.5 shadow-sm">
            <img
              src="https://www.mazzraty.com/_next/image?url=%2Fimages%2FMazzraty_Logo.png&w=3840&q=75"
              alt="Mazzraty"
              className="object-contain w-full h-full"
            />
          </div>

          <div className="hidden sm:block leading-tight">
            <h1 className="text-[15px] font-bold text-gray-900">Mazzraty</h1>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">
              IT Service
            </p>
          </div>
        </div>

        {/* CENTERED DESKTOP NAV */}
        <nav className="hidden lg:flex items-center justify-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${isActive(
                item.path
              )}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* RIGHT SECTION */}
        <div className="flex items-center justify-end gap-2 relative" ref={dropdownRef}>

          {/* SEARCH */}
          <div className="hidden md:block relative" ref={searchRef}>
            {!searchOpen ? (
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-all duration-200"
                title="Search"
              >
                <Search size={18} />
              </button>
            ) : (
              <div className="flex items-center gap-2 w-72 px-3.5 py-2.5 rounded-lg border border-[#1f4a35] bg-white shadow-lg">
                <Search size={16} className="text-gray-400 flex-shrink-0" />
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tickets, assets, employees..."
                  className="flex-1 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition p-1"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}

            {/* SEARCH DROPDOWN */}
            {searchOpen && searchQuery && (
              <div className="absolute right-0 top-12 w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">

                {searchLoading ? (
                  <div className="p-8 text-center">
                    <div className="inline-block animate-spin">
                      <Clock size={20} className="text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Searching...</p>
                  </div>
                ) : totalResults === 0 ? (
                  <div className="p-8 text-center">
                    <AlertCircle size={24} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      No results found for "{searchQuery}"
                    </p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">

                    {/* TICKETS */}
                    {searchResults?.tickets?.length > 0 && (
                      <div>
                        <div className="px-4 py-2.5 bg-gray-50 border-b">
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            Tickets
                          </p>
                        </div>
                        {(Array.isArray(searchResults.tickets)
                          ? searchResults.tickets
                          : []
                        ).map((t) => (
                          <div
                            key={t._id}
                            onClick={() =>
                              handleResultClick(
                                isAdminRole
                                  ? `/admin/tickets/${t._id}`
                                  : `/tickets/${t._id}`
                              )
                            }
                            className="px-4 py-3 hover:bg-[#eef3ee] cursor-pointer border-b transition-colors last:border-b-0"
                          >
                            <p className="text-sm font-medium text-gray-900">
                              {t.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              #{t.ticketId || t._id?.slice(-6)} · {t.status}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ASSETS */}
                    {searchResults?.assets?.length > 0 && (
                      <div>
                        <div className="px-4 py-2.5 bg-gray-50 border-b">
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            Assets
                          </p>
                        </div>
                        {(Array.isArray(searchResults.assets)
                          ? searchResults.assets
                          : []
                        ).map((a) => (
                          <div
                            key={a._id}
                            onClick={() =>
                              handleResultClick("/admin/assets/fiori")
                            }
                            className="px-4 py-3 hover:bg-[#eef3ee] cursor-pointer border-b transition-colors last:border-b-0"
                          >
                            <p className="text-sm font-medium text-gray-900">
                              {a.assetCode}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {a.type} · {a.model || "-"}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* EMPLOYEES */}
                    {searchResults?.employees?.length > 0 && (
                      <div>
                        <div className="px-4 py-2.5 bg-gray-50 border-b">
                          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                            Employees
                          </p>
                        </div>
                        {(Array.isArray(searchResults.employees)
                          ? searchResults.employees
                          : []
                        ).map((e) => (
                          <div
                            key={e._id}
                            onClick={() =>
                              handleResultClick("/admin/employees")
                            }
                            className="px-4 py-3 hover:bg-[#eef3ee] cursor-pointer border-b transition-colors last:border-b-0"
                          >
                            <p className="text-sm font-medium text-gray-900">
                              {e.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
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
              className="relative flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-all duration-200"
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-[#d4a94c] text-[#14251c] text-xs font-semibold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-2 text-xs font-medium text-[#1f4a35]">
                        {unreadCount} new
                      </span>
                    )}
                  </h3>
                  {notifications.length > 0 && unreadCount > 0 && (
                    <button
                      onClick={async () => {
                        const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n._id);
                        await Promise.all(unreadIds.map((id) => api.put(`/notifications/${id}/read`)));
                        loadNotifications();
                      }}
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-[#1f4a35] transition-colors"
                    >
                      <CheckCheck size={13} />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto divide-y">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell size={24} className="text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No notifications</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${!n.isRead ? "bg-[#eef3ee]" : ""}`}
                        onClick={async () => {
                          if (!n.isRead) {
                            await api.put(`/notifications/${n._id}/read`);
                            loadNotifications();
                          }
                        }}
                      >
                        <div className="flex items-start gap-2">
                          {!n.isRead && (
                            <div className="w-2 h-2 rounded-full bg-[#1f4a35] mt-1.5 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{n.title}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="px-4 py-2.5 border-t bg-gray-50 flex items-center justify-between">
                    {/* <Link
                      to="/notifications"
                      onClick={() => setNotificationOpen(false)}
                      className="text-xs font-medium text-[#1f4a35] hover:underline"
                    >
                      View all
                    </Link> */}
                    <button
                      onClick={async () => {
                        await api.delete("/notifications/clear-all");
                        loadNotifications();
                      }}
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={13} />
                      Clear all
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ROLE BADGE - HIDDEN ON MOBILE */}
          <div className="hidden md:flex items-center px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold capitalize border border-gray-200">
            {role}
          </div>

          {/* USER PROFILE */}
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200 group"
            title="User menu"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#1f4a35] to-[#0f2419] text-white flex items-center justify-center font-semibold text-sm shadow-sm group-hover:shadow-md transition-shadow">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <ChevronDown
              size={16}
              className="text-gray-600 hidden lg:block group-hover:text-gray-900 transition-colors"
            />
          </button>

          {/* USER DROPDOWN */}
          {userMenuOpen && (
            <div className="absolute right-0 top-14 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
              {/* USER INFO */}
              <div className="px-5 py-4 border-b bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#1f4a35] to-[#0f2419] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-500 font-medium">
                      Signed in as
                    </p>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user?.email || "Guest"}
                    </p>
                  </div>
                </div>
              </div>

              {/* ROLE INFO */}
              <div className="px-5 py-4 border-b">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 font-medium">
                    Access Role
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#eef3ee] text-[#1f4a35] text-xs font-semibold capitalize border border-[#cfe0d3]">
                    {role}
                  </span>
                </div>
              </div>

              {/* LOGOUT */}
              <div className="p-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          )}

          {/* MOBILE MENU TOGGLE */}
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-all duration-200"
            title="Toggle menu"
          >
            {mobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* MOBILE NAV */}
      {mobileMenu && (
        <div className="lg:hidden border-t border-gray-200 bg-white px-4 py-3">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenu(false)}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${location.pathname === item.path
                  ? "bg-[#1f4a35] text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
