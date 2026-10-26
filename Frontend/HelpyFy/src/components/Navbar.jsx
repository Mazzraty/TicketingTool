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
  Building2,
} from "lucide-react";

/* ---------- design tokens (Jira Service Management feel, Mazzraty green) ---------- */
// bar:        #43A047
// bar-dark:   #2E7D32  (text on white, mobile panel, avatars)
// tint:       #F1F8F2  (hover / unread backgrounds on white surfaces)

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
  "relative flex items-center justify-center w-9 h-9 rounded-md text-white hover:bg-white/15 active:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white transition-colors";

function SectionHeader({ icon: Icon, label, count }) {
  return (
    <div className="px-4 py-1.5 bg-gray-50 border-y border-gray-100 flex items-center gap-2 sticky top-0">
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
  const { user, logout, companyId, selectCompany } = useAuth();
  const role = (user?.role || "guest").toLowerCase();
  const isAdminRole = ["company_admin", "super_admin", "it_support"].includes(role);
  const [notifications, setNotifications] = useState([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loadedCompanyOptions, setLoadedCompanyOptions] = useState([]);
  const [companyOptionsError, setCompanyOptionsError] = useState("");

  useEffect(() => {
    if (role !== "super_admin") return undefined;

    let cancelled = false;

    api
      .get("/companies")
      .then((res) => {
        if (!cancelled) {
          setLoadedCompanyOptions(
            (res.data.companies || []).map((company) => ({
              companyId: String(company._id),
              companyName: company.name,
            }))
          );
          setCompanyOptionsError("");
        }
      })
      .catch((error) => {
        console.error("Failed to load company selector options", error);
        if (!cancelled) {
          setLoadedCompanyOptions([]);
          setCompanyOptionsError("Company list could not be loaded");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [role]);

  const supportCompanyOptions = useMemo(() => {
    const options = (user?.companyAccess || [])
      .filter((entry) => !entry.revokedAt)
      .map((entry) => {
        const company = entry.companyId;
        return {
          companyId: String(company?._id || company),
          companyName: entry.companyName || company?.name || "Company",
        };
      });

    if (options.length === 0 && user?.companyId) {
      const company = user.companyId;
      options.push({
        companyId: String(company?._id || company),
        companyName: user.companyName || company?.name || "Company",
      });
    }

    return options;
  }, [user]);
  const companyOptions =
    role === "super_admin"
      ? loadedCompanyOptions
      : role === "it_support"
        ? supportCompanyOptions
        : [];

  /* ===================================
     SEARCH
  =================================== */
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

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

  useEffect(() => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults(null);
  }, [location.pathname]);

  // press "/" anywhere to focus search
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

      const unread = data.filter((n) => !n.isRead).length;
      document.title = unread > 0 ? `(${unread}) HelpyFy` : "HelpyFy";
      changeFavicon(unread > 0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
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

    if (role === "hr") {
      return [
        { label: "Dashboard", path: "/" },
        { label: "Create Ticket", path: "/create" },
        { label: "My Tickets", path: "/tickets" },
        { label: "Employees", path: "/admin/employees" },
      ];
    }

    return [
      { label: "Dashboard", path: "/" },
      { label: "Create Ticket", path: "/create" },
      { label: "My Tickets", path: "/tickets" },
    ];
  }, [role]);

  const createPath = isAdminRole ? "/admin/tickets" : "/create";
  const showCreate = !["super_admin", "it_support", "user", "hr"].includes(role);

  // Jira-style tab: white underline on the active item
  const isActive = (path) =>
    location.pathname === path
      ? "text-white font-semibold border-white bg-white/10"
      : "text-white/90 hover:text-white hover:bg-white/10 border-transparent";

  const dropdownItem = "px-4 py-2.5 hover:bg-[#F1F8F2] cursor-pointer border-b border-gray-100 transition-colors last:border-b-0";

  return (
    <header className="sticky top-0 z-50 w-full bg-[#43A047] shadow-[0_1px_0_rgba(0,0,0,0.15),0_2px_6px_rgba(0,0,0,0.08)]">
      <div className="h-[65px] px-3 lg:px-5 flex items-center gap-2 lg:gap-3">

        {/* LOGO */}
        <Link
          to={navItems[0].path}
          className="flex items-center gap-2.5 flex-shrink-0 rounded-md pr-2 py-1 hover:bg-white/10 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
        >
          <div className="w-9 h-9 rounded-md bg-white flex items-center justify-center p-1 shadow-sm">
            <img
              src="https://www.mazzraty.com/_next/image?url=%2Fimages%2FMazzraty_Logo.png&w=3840&q=75"
              alt="Mazzraty"
              className="object-contain w-full h-full"
            />
          </div>
          <div className="hidden sm:block leading-tight">
            <h1 className="text-[15px] font-bold text-white">Mazzraty</h1>
            <p className="text-[11px] text-white/80 font-medium">IT Service</p>
          </div>
        </Link>

        {/* DESKTOP NAV: tabs sit on the bottom edge of the bar */}
        <nav className="hidden lg:flex items-stretch self-stretch ml-2 gap-0.5">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              aria-current={location.pathname === item.path ? "page" : undefined}
              className={`flex items-center px-3.5 text-sm border-b-[3px] transition-colors whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white ${isActive(
                item.path
              )}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* CREATE (primary action) */}
        {showCreate && (
          <Link
            to={createPath}
            className="hidden md:inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-white hover:bg-[#F1F8F2] text-[#2E7D32] text-sm font-semibold shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Plus size={16} strokeWidth={2.5} />
            Create
          </Link>
        )}

        {/* SEARCH: fills the free space, centered like Jira */}
        <div className="hidden md:block relative flex-1 min-w-[180px] max-w-xl mx-auto" ref={searchRef}>
          <div
            className={`flex items-center gap-2 h-9 rounded-md px-3 transition-colors duration-150 ${
              searchOpen
                ? "bg-white ring-2 ring-white/70 shadow-md"
                : "bg-white/20 hover:bg-white/30"
            }`}
          >
            <Search
              size={16}
              className={`flex-shrink-0 ${searchOpen ? "text-[#2E7D32]" : "text-white"}`}
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
              placeholder={isAdminRole ? "Search tickets, assets, staff" : "Search my tickets"}
              aria-label="Search"
              className={`flex-1 min-w-0 outline-none text-sm bg-transparent ${
                searchOpen
                  ? "text-gray-800 placeholder-gray-400"
                  : "text-white placeholder-white/80"
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
                <kbd className="text-[11px] text-white/90 border border-white/40 rounded px-1.5 leading-5">
                  /
                </kbd>
              )
            )}
          </div>

          {/* SEARCH DROPDOWN */}
          {searchOpen && searchQuery && (
            <div className="absolute left-0 top-11 w-[max(100%,26rem)] bg-white border border-gray-200 rounded-md shadow-2xl z-50 overflow-hidden">
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
                  <p className="text-sm text-gray-500">No results for "{searchQuery}"</p>
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
                      {(Array.isArray(searchResults.tickets) ? searchResults.tickets : []).map((t) => (
                        <div
                          key={t._id}
                          onClick={() =>
                            handleResultClick(
                              isAdminRole ? `/admin/tickets/${t._id}` : `/tickets/${t._id}`
                            )
                          }
                          className={`${dropdownItem} flex items-center gap-3`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{t.title}</p>
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
                      {(Array.isArray(searchResults.assets) ? searchResults.assets : []).map((a) => (
                        <div
                          key={a._id}
                          onClick={() => handleResultClick("/admin/assets/fiori")}
                          className={dropdownItem}
                        >
                          <p className="text-sm font-medium text-gray-900">{a.assetCode}</p>
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
                      {(Array.isArray(searchResults.employees) ? searchResults.employees : []).map((e) => (
                        <div
                          key={e._id}
                          onClick={() => handleResultClick("/admin/employees")}
                          className={`${dropdownItem} flex items-center gap-3`}
                        >
                          <div className="w-8 h-8 rounded-full bg-[#2E7D32] text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
                            {e.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{e.name}</p>
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

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-1 relative ml-auto md:ml-0" ref={dropdownRef}>

          {/* COMPANY SWITCHER */}
          {(role === "super_admin" || role === "it_support") && (
            <label className="relative hidden sm:flex items-center mr-1">
              <Building2 size={15} className="absolute left-2.5 text-white pointer-events-none" />
              <select
                aria-label="Select company"
                title={
                  role === "super_admin" && companyOptionsError
                    ? companyOptionsError
                    : "Switch company"
                }
                value={companyId || ""}
                onChange={(event) => {
                  const selected = companyOptions.find(
                    (company) => company.companyId === event.target.value
                  );
                  const nextCompany = selected || null;
                  const nextCompanyId = nextCompany?.companyId || null;

                  if (nextCompanyId === companyId) return;
                  selectCompany(nextCompany);
                  window.location.reload();
                }}
                className="appearance-none max-w-[150px] xl:max-w-[200px] h-9 rounded-md pl-8 pr-7 bg-white/20 hover:bg-white/30 text-white text-xs font-medium outline-none cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-white"
              >
                {role === "super_admin" && (
                  <option value="" className="text-gray-900">
                    All companies
                  </option>
                )}
                {role === "it_support" && companyOptions.length === 0 && (
                  <option value="" className="text-gray-900">
                    No company access
                  </option>
                )}
                {companyOptions.map((company) => (
                  <option key={company.companyId} value={company.companyId} className="text-gray-900">
                    {company.companyName}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 text-white pointer-events-none" />
            </label>
          )}

          {/* NOTIFICATIONS */}
          <div className="relative">
            <button
              onClick={() => {
                setNotificationOpen(!notificationOpen);
                setUserMenuOpen(false);
              }}
              className={iconBtn}
              title="Notifications"
              aria-label="Notifications"
            >
              <Bell size={19} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-[#43A047]">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="absolute right-0 mt-2 w-[26rem] max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-md shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b bg-white flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-[#F1F8F2] text-xs font-medium text-[#2E7D32]">
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
                      className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-[#2E7D32] transition-colors"
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
                          !n.isRead ? "bg-[#F1F8F2] border-[#43A047]" : "border-transparent"
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

          {/* HELP */}
          <button className={`${iconBtn} hidden md:flex`} title="Help" aria-label="Help">
            <HelpCircle size={19} />
          </button>

          {/* AVATAR (Jira shows only the avatar; details live in the menu) */}
          <button
            onClick={() => {
              setUserMenuOpen(!userMenuOpen);
              setNotificationOpen(false);
            }}
            className="ml-1 flex items-center justify-center w-8 h-8 rounded-full bg-white text-[#2E7D32] font-bold text-sm ring-2 ring-white/30 hover:ring-white/70 transition-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            title={user?.name || "Account"}
            aria-label="Account menu"
            aria-expanded={userMenuOpen}
          >
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </button>

          {/* USER DROPDOWN */}
          {userMenuOpen && (
            <div className="absolute right-0 top-12 w-72 bg-white rounded-md shadow-2xl border border-gray-200 overflow-hidden z-50">
              <div className="px-4 pt-3 pb-1">
                <p className="text-[11px] font-semibold text-gray-500">Account</p>
              </div>

              <div className="px-4 pb-4 pt-2 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#2E7D32] text-white flex items-center justify-center font-bold text-base">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    {user?.name && (
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                    )}
                    <p className="text-xs text-gray-500 truncate">{user?.email || "Guest"}</p>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 border-b">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Access role</span>
                  <span className="px-2.5 py-0.5 rounded bg-[#F1F8F2] text-[#2E7D32] text-xs font-semibold capitalize border border-[#cfe3d1]">
                    {role.replace("_", " ")}
                  </span>
                </div>
              </div>

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
        <div className="lg:hidden border-t border-white/20 bg-[#2E7D32] px-3 py-3">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenu(false)}
                className={`block px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? "bg-white text-[#2E7D32]"
                    : "text-white hover:bg-white/15"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {showCreate && (
              <Link
                to={createPath}
                onClick={() => setMobileMenu(false)}
                className="mt-2 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md bg-white/20 text-white text-sm font-semibold"
              >
                <Plus size={16} strokeWidth={2.5} />
                Create
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}