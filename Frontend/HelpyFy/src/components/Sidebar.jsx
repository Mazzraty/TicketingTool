import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import {
  LayoutDashboard,
  Plus,
  Ticket,
  Package,
  User,
  Users,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  BarChart3,
  List,
  UserCog,
  History,
  Printer,
  Laptop,
  Tablet,
} from "lucide-react";

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const { user } = useAuth();
  const role = (user?.role || "guest").toLowerCase();

  // ================= SUPER ADMIN GROUPS =================
  const employeeChildren = [
    { to: "/admin/employees", icon: Users, label: "Employees" },
    { to: "/admin/company-access", icon: UserCog, label: "Users" },
  ];

  const assetChildren = [
    { to: "/admin/assets", icon: Package, label: "Asset Management" },
    { to: "/admin/assets/history", icon: History, label: "Asset History" },
    { to: "/admin/assets/upload-printer", icon: Printer, label: "Upload Printer" },
    { to: "/admin/assets/upload-laptop", icon: Laptop, label: "Upload Laptop" },
    { to: "/admin/assets/upload-hht", icon: Tablet, label: "Upload HHT" },
  ];

  const ticketChildren = [
    { to: "/admin/tickets", icon: List, label: "All Tickets" },
    { to: "/admin/ticket-dashboard", icon: BarChart3, label: "Ticket Dashboard" },
    { to: "/admin/it-support/create-ticket", icon: Plus, label: "Create Ticket" },
  ];

  // IT SUPPORT: only the ticket features this role is allowed to use
  const itSupportTicketChildren = [
    { to: "/admin/tickets", icon: List, label: "Company Tickets" },
    { to: "/admin/it-support/create-ticket", icon: Plus, label: "Create Ticket" },
  ];

  const ticketItems =
    role === "it_support" ? itSupportTicketChildren : ticketChildren;

  const groupHasActive = (children) =>
    children.some((c) => location.pathname === c.to);

  const [openGroups, setOpenGroups] = useState({
    employees: groupHasActive(employeeChildren),
    assets: groupHasActive(assetChildren),
    tickets: groupHasActive(ticketItems),
  });

  // Auto-open the group that contains the current page
  useEffect(() => {
    setOpenGroups((prev) => ({
      employees: prev.employees || groupHasActive(employeeChildren),
      assets: prev.assets || groupHasActive(assetChildren),
      tickets: prev.tickets || groupHasActive(ticketItems),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const toggleGroup = (key) => {
    // In collapsed mode, clicking a group expands the sidebar and opens it
    if (collapsed) {
      setCollapsed(false);
      setOpenGroups((prev) => ({ ...prev, [key]: true }));
      return;
    }
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ================= STYLES =================
  const isActive = (path) =>
    location.pathname === path
      ? "bg-[#1f4a35] text-white shadow-sm"
      : "text-gray-600 hover:bg-[#eef3ee] hover:text-[#1f4a35]";

  const NavItem = ({ to, icon: Icon, label }) => (
    <Link
      to={to}
      title={collapsed ? label : undefined}
      className={`flex items-center ${
        collapsed ? "justify-center" : "gap-3"
      } px-4 py-3 rounded-xl transition-all duration-200 ${isActive(to)}`}
    >
      <Icon size={18} className="shrink-0" />

      {!collapsed && (
        <span className="text-sm font-medium whitespace-nowrap">{label}</span>
      )}
    </Link>
  );

  const NavGroup = ({ id, icon: Icon, label, children }) => {
    const open = openGroups[id];
    const hasActive = groupHasActive(children);

    return (
      <div>
        <button
          type="button"
          onClick={() => toggleGroup(id)}
          title={collapsed ? label : undefined}
          aria-expanded={open}
          className={`w-full flex items-center ${
            collapsed ? "justify-center" : "gap-3"
          } px-4 py-3 rounded-xl transition-all duration-200 ${
            hasActive && !open
              ? "bg-[#1f4a35] text-white shadow-sm"
              : hasActive
              ? "bg-[#eef3ee] text-[#1f4a35]"
              : "text-gray-600 hover:bg-[#eef3ee] hover:text-[#1f4a35]"
          }`}
        >
          <Icon size={18} className="shrink-0" />

          {!collapsed && (
            <>
              <span className="text-sm font-medium whitespace-nowrap flex-1 text-left">
                {label}
              </span>
              <ChevronDown
                size={16}
                className={`shrink-0 transition-transform duration-200 ${
                  open ? "rotate-180" : ""
                }`}
              />
            </>
          )}
        </button>

        {/* SUB MENU */}
        {!collapsed && open && (
          <div className="mt-1 ml-6 pl-3 border-l border-gray-200 space-y-1">
            {children.map(({ to, icon: ChildIcon, label: childLabel }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(
                  to
                )}`}
              >
                <ChildIcon size={16} className="shrink-0" />
                <span className="whitespace-nowrap">{childLabel}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={`h-[calc(100vh-64px)] bg-white border-r border-gray-200 shadow-sm flex flex-col transition-all duration-300 ${
        collapsed ? "w-[90px]" : "w-[280px]"
      }`}
    >
      {/* TOP */}
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
        {!collapsed && (
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {role.replace("_", " ")}
          </p>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-10 h-10 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-600 hover:text-[#1f4a35] flex items-center justify-center transition ml-auto"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* MENU */}
      <div className="flex-1 overflow-y-auto px-3 py-5 space-y-6">
        {/* USER MENU */}
        {role === "user" && (
          <div>
            {!collapsed && (
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-3">
                User Menu
              </p>
            )}

            <div className="space-y-2">
              <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
              <NavItem to="/create" icon={Plus} label="Create Ticket" />
              <NavItem to="/tickets" icon={Ticket} label="My Tickets" />
              <NavItem to="/my-assets" icon={Package} label="My Assets" />
              <NavItem to="/profile" icon={User} label="Profile" />
            </div>
          </div>
        )}

        {/* SUPER ADMIN MENU */}
        {role === "super_admin" && (
          <div>
            {!collapsed && (
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-3">
                Super Admin
              </p>
            )}

            <div className="space-y-2">
              <NavItem to="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" />

              <NavGroup id="employees" icon={Users} label="Employees">
                {employeeChildren}
              </NavGroup>

              <NavGroup id="assets" icon={Package} label="Asset Management">
                {assetChildren}
              </NavGroup>

              <NavGroup id="tickets" icon={Ticket} label="Tickets">
                {ticketItems}
              </NavGroup>
            </div>
          </div>
        )}

        {role === "it_support" && (
          <div>
            {!collapsed && (
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-3">
                IT Support
              </p>
            )}

            <div className="space-y-2">
              <NavItem to="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavItem to="/admin/it-support-users" icon={Users} label="Company Users" />
              <NavGroup id="tickets" icon={Ticket} label="Tickets">
                {itSupportTicketChildren}
              </NavGroup>
              {/* <NavItem
                to="/admin/it-support/employees"
                icon={Users}
                label="Company Employees"
              /> */}
            </div>
          </div>
        )}

        {role === "company_admin" && (
          <div>
            {!collapsed && (
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-3">
                Company Admin
              </p>
            )}

            <div className="space-y-2">
              <NavItem to="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavItem to="/admin/assets" icon={Package} label="Assets" />
              <NavItem to="/admin/tickets" icon={Ticket} label="Tickets" />
            </div>
          </div>
        )}
      </div>

      {/* USER INFO */}
      <div className="border-t border-gray-200 bg-gray-50 px-3 py-4">
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
          <div className="w-10 h-10 rounded-full bg-[#1f4a35] text-white flex items-center justify-center font-bold shadow-sm shrink-0">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">Signed in as</p>
              <p className="text-sm font-semibold text-gray-800 truncate">
                {user?.name || "Guest"}
              </p>
              <p className="text-xs text-[#1f4a35] capitalize font-medium">{role}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}