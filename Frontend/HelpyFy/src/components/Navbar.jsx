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
  AlertCircle,
  CheckCheck,
  Trash2,
  Plus,
  Ticket,
  Package,
  Users,
  HelpCircle,
} from "lucide-react";

/* ---------- small UI helpers (new, presentation only) ---------- */

const statusStyle = (status = "") => {
  const s = status.toLowerCase();
  if (s.includes("open") || s.includes("new")) return "bg-blue-50 text-blue-700 ring-blue-200";
  if (s.includes("progress") || s.includes("assigned")) return "bg-amber-50 text-amber-700 ring-amber-200";
  if (s.includes("resolved") || s.includes("closed") || s.includes("done"))
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  return "bg-gray-100 text-gray-600 ring-gray-200";
};

const timeAgo = (date) => {
  if (!date) return "";
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (Number.isNaN(diff)) return "";
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const iconBtn =
  "relative flex items-center justify-center w-9 h-9 rounded-md text-white/75 hover:text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d4a94c] transition-colors";

function SectionHeader({ icon: Icon, label, count }) {
  return (
    <div className="px-4 py-2 bg-gray-50 border-y border-gray-100 flex items-center gap-2 sticky top-0">
      <Icon size={13} className="text-gray-400" />
      <p className="text-xs font-semibold text-gray-600">{label}</p>
      <span className="ml-auto text-[11px] text-gray-400">{count}</span>
    </div>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

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

  // NEW: press "/" anywhere to focus search (like Jira / ServiceNow)
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (e.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(tag)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

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

  // NEW: "Create" button target (Jira-style primary action)
  const createPath = isAdminRole ? "/admin/tickets" : "/create";
  // hidden for super_admin and it_support
  const showCreate = !["super_admin", "it_support"].includes(role);

  const isActive = (path) =>
    location.pathname === path
      ? "text-white font-semibold border-[#d4a94c] bg-white/10"
      : "text-white/70 hover:text-white hover:bg-white/5 border-transparent";

  return (
    <header className="sticky top-0 z-50 w-full bg-[#14251c] shadow-md">
      <div className="h-14 px-4 lg:px-6 flex items-center gap-4 lg:grid lg:grid-cols-[1fr_auto_1fr]">

        {/* LOGO */}
        <Link to={navItems[0].path} className="flex items-center gap-2.5 flex-shrink-0 mr-2 justify-self-start">
          <div className="w-9 h-9 rounded-md bg-white flex items-center justify-center p-1">
            <img
              src="https://www.mazzraty.com/_next/image?url=%2Fimages%2FMazzraty_Logo.png&w=3840&q=75"
              alt="Mazzraty"
              className="object-contain w-full h-full"
            />
          </div>

          <div className="hidden sm:block leading-tight">
            <h1 className="text-[15px] font-bold text-white">Mazzraty</h1>
            <p className="text-[11px] text-[#d4a94c] font-medium">IT Service</p>
          </div>
        </Link>

        {/* DESKTOP NAV (tabs sit on the bottom edge of the bar) */}
        <nav className="hidden lg:flex items-stretch justify-center self-stretch gap-0.5">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 text-sm border-b-[3px] transition-colors whitespace-nowrap ${isActive(
                item.path
              )}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-1.5 relative ml-auto lg:ml-0 justify-self-end" ref={dropdownRef}>

          {/* CREATE BUTTON */}
          {showCreate && (
            <Link
              to={createPath}
              className="hidden md:inline-flex items-center gap-1.5 h-9 px-3.5 mr-1 rounded-md bg-[#d4a94c] hover:bg-[#e0b95f] text-[#14251c] text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
            >
              <Plus size={16} strokeWidth={2.5} />
              Create
            </Link>
          )}

          {/* SEARCH – always visible on desktop */}
          <div className="hidden md:block relative" ref={searchRef}>
            <div
              className={`flex items-center gap-2 h-9 rounded-md px-3 transition-all duration-200 ${
                searchOpen
                  ? "w-96 bg-white ring-2 ring-[#d4a94c]"
                  : "w-64 bg-white/10 hover:bg-white/15"
              }`}
            >
              <Search
                size={16}
                className={`flex-shrink-0 ${searchOpen ? "text-gray-400" : "text-white/60"}`}
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setSearchOpen(false);
                    setSearchQuery("");
                    setSearchResults(null);
                    e.currentTarget.blur();
                  }
                }}
                placeholder="Search tickets, assets, employees"
                className={`flex-1 min-w-0 outline-none text-sm bg-transparent ${
                  searchOpen
                    ? "text-gray-800 placeholder-gray-400"
                    : "text-white placeholder-white/60"
                }`}
              />
              {searchQuery ? (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults(null);
                    searchInputRef.current?.focus();
                  }}
                  className="text-gray-400 hover:text-gray-600 transition p-0.5"
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              ) : (
                !searchOpen && (
                  <kbd className="text-[11px] text-white/60 border border-white/25 rounded px-1.5 leading-5">
                    /
                  </kbd>
                )
              )}
            </div>

            {/* SEARCH DROPDOWN */}
            {searchOpen && searchQuery && (
              <div className="absolute right-0 top-11 w-[26rem] bg-white border border-gray-200 rounded-lg shadow-2xl z-50 overflow-hidden">

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
                      No results for "{searchQuery}"
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Try a ticket number, asset code or staff name.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[26rem] overflow-y-auto">

                    {/* TICKETS */}
                    {searchResults?.tickets?.length > 0 && (
                      <div>
                        <SectionHeader icon={Ticket} label="Tickets" count={searchResults.tickets.length} />
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
                            className="px-4 py-2.5 hover:bg-[#eef3ee] cursor-pointer border-b border-gray-100 transition-colors last:border-b-0 flex items-center gap-3"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {t.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5 font-mono">
                                #{t.ticketId || t._id?.slice(-6)}
                              </p>
                            </div>
                            {t.status && (
                              <span
                                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ring-1 ring-inset whitespace-nowrap ${statusStyle(
                                  t.status
                                )}`}
                              >
                                {t.status}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ASSETS */}
                    {searchResults?.assets?.length > 0 && (
                      <div>
                        <SectionHeader icon={Package} label="Assets" count={searchResults.assets.length} />
                        {(Array.isArray(searchResults.assets)
                          ? searchResults.assets
                          : []
                        ).map((a) => (
                          <div
                            key={a._id}
                            onClick={() =>
                              handleResultClick("/admin/assets/fiori")
                            }
                            className="px-4 py-2.5 hover:bg-[#eef3ee] cursor-pointer border-b border-gray-100 transition-colors last:border-b-0"
                          >
                            <p className="text-sm font-medium text-gray-900">
                              {a.assetCode}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {a.type} · {a.model || "-"}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* EMPLOYEES */}
                    {searchResults?.employees?.length > 0 && (
                      <div>
                        <SectionHeader icon={Users} label="Employees" count={searchResults.employees.length} />
                        {(Array.isArray(searchResults.employees)
                          ? searchResults.employees
                          : []
                        ).map((e) => (
                          <div
                            key={e._id}
                            onClick={() =>
                              handleResultClick("/admin/employees")
                            }
                            className="px-4 py-2.5 hover:bg-[#eef3ee] cursor-pointer border-b border-gray-100 transition-colors last:border-b-0 flex items-center gap-3"
                          >
                            <div className="w-8 h-8 rounded-full bg-[#1f4a35] text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
                              {e.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {e.name}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {e.staffCode} · {e.department || "-"}
                              </p>
                            </div>
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
              className={iconBtn}
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-[#d4a94c] text-[#14251c] text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-[#14251c]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="absolute right-0 mt-2 w-[26rem] max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-lg shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b bg-white flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-[#eef3ee] text-xs font-medium text-[#1f4a35]">
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

                <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
                  {notifications.length === 0 ? (
                    <div className="p-10 text-center">
                      <Bell size={24} className="text-gray-300 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-600">You're all caught up</p>
                      <p className="text-xs text-gray-400 mt-0.5">New ticket updates will show here.</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-l-[3px] ${
                          !n.isRead ? "bg-[#f4f8f4] border-[#1f4a35]" : "border-transparent"
                        }`}
                        onClick={async () => {
                          if (!n.isRead) {
                            await api.put(`/notifications/${n._id}/read`);
                            loadNotifications();
                          }
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm text-gray-900 ${!n.isRead ? "font-semibold" : "font-medium"}`}>
                              {n.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                          </div>
                          {n.createdAt && (
                            <span className="text-[11px] text-gray-400 whitespace-nowrap mt-0.5">
                              {timeAgo(n.createdAt)}
                            </span>
                          )}
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

          {/* HELP (new, optional: point it wherever you like) */}
          <button className={`${iconBtn} hidden md:flex`} title="Help" aria-label="Help">
            <HelpCircle size={18} />
          </button>

          {/* DIVIDER */}
          <div className="hidden md:block w-px h-6 bg-white/15 mx-1" />

          {/* USER PROFILE */}
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 pl-1 pr-2 h-9 rounded-md hover:bg-white/10 transition-colors group focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d4a94c]"
            title="User menu"
          >
            <div className="relative w-7 h-7 rounded-full bg-[#d4a94c] text-[#14251c] flex items-center justify-center font-bold text-xs">
              {user?.name?.charAt(0).toUpperCase() || "U"}
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#14251c]" />
            </div>
            <div className="hidden xl:block text-left leading-tight">
              <p className="text-xs font-medium text-white max-w-[110px] truncate">
                {user?.name || "User"}
              </p>
              <p className="text-[10px] text-white/60 capitalize">{role.replace("_", " ")}</p>
            </div>
            <ChevronDown
              size={14}
              className={`text-white/60 hidden lg:block group-hover:text-white transition-transform ${
                userMenuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* USER DROPDOWN */}
          {userMenuOpen && (
            <div className="absolute right-0 top-12 w-72 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden z-50">
              {/* USER INFO */}
              <div className="px-4 py-4 border-b bg-[#f4f8f4]">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#1f4a35] text-white flex items-center justify-center font-bold text-base">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    {user?.name && (
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {user.name}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email || "Guest"}
                    </p>
                  </div>
                </div>
              </div>

              {/* ROLE INFO */}
              <div className="px-4 py-3 border-b">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Access role
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#eef3ee] text-[#1f4a35] text-xs font-semibold capitalize border border-[#cfe0d3]">
                    {role}
                  </span>
                </div>
              </div>

              {/* LOGOUT */}
              <div className="p-1.5">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-red-600 hover:bg-red-50 transition-colors text-sm font-medium"
                >
                  <LogOut size={16} />
                  Log out
                </button>
              </div>
            </div>
          )}

          {/* MOBILE MENU TOGGLE */}
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className={`${iconBtn} lg:hidden`}
            title="Toggle menu"
            aria-label="Toggle menu"
          >
            {mobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* MOBILE NAV */}
      {mobileMenu && (
        <div className="lg:hidden border-t border-white/10 bg-[#0f1d16] px-4 py-3">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenu(false)}
                className={`block px-4 py-2.5 rounded-md text-sm font-medium transition-all ${location.pathname === item.path
                  ? "bg-[#d4a94c] text-[#14251c]"
                  : "text-white/80 hover:bg-white/10"
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