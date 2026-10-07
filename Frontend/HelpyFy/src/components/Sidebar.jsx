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
  Upload,
} from "lucide-react";

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const { user } = useAuth();
  const role = (user?.role || "guest").toLowerCase();

  // ================= SUPER ADMIN GROUPS =================
  const employeeChildren = [
    { to: "/admin/employees", icon: Users, label: "Employees" },
    { to: "/admin/company-access", icon: UserCog, label: "Users" },
    { to: "/admin/assets/upload-excel", icon: Upload, label: "Employee Upload" },
  ];

  // IT SUPPORT: same Employee Upload, plus its own Company Users page
  const itSupportEmployeeChildren = [
    { to: "/admin/it-support-users", icon: Users, label: "Company Users" },
    { to: "/admin/assets/upload-excel", icon: Upload, label: "Employee Upload" },
  ];

  // shared by Super Admin and IT Support
  const assetChildren = [
    { to: "/admin/assets/fiori", icon: LayoutDashboard, label: "Asset Dashboard" },
    { to: "/admin/assets", icon: Package, label: "Asset Management" },
    { to: "/admin/assets/history", icon: History, label: "Asset History" },
    { to: "/admin/assets/upload-printer", icon: Printer, label: "Upload Printer" },
    { to: "/admin/assets/upload-laptop", icon: Laptop, label: "Upload System" },
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

  const employeeItems =
    role === "it_support" ? itSupportEmployeeChildren : employeeChildren;

  const groupHasActive = (children) =>
    children.some((c) => location.pathname === c.to);

  const [openGroups, setOpenGroups] = useState({
    employees: groupHasActive(employeeItems),
    assets: groupHasActive(assetChildren),
    tickets: groupHasActive(ticketItems),
  });

  // Auto-open the group that contains the current page
  useEffect(() => {
    setOpenGroups((prev) => ({
      employees: prev.employees || groupHasActive(employeeItems),
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
  // Active item: light green fill + 3px bar on the left edge (Jira / ServiceNow style)
  const activeBar =
    "relative before:content-[''] before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r before:bg-[#1f4a35]";

  const isActive = (path) =>
    location.pathname === path
      ? `${activeBar} bg-[#eef3ee] text-[#1f4a35] font-semibold`
      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900";

  const focusRing =
    "focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#1f4a35]";

  const NavItem = ({ to, icon: Icon, label }) => (
    <Link
      to={to}
      title={collapsed ? label : undefined}
      className={`flex items-center ${
        collapsed ? "justify-center" : "gap-3"
      } px-3 h-10 rounded-md transition-colors ${focusRing} ${isActive(to)}`}
    >
      <Icon size={18} className="shrink-0" />

      {!collapsed && (
        <span className="text-sm whitespace-nowrap">{label}</span>
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
          } px-3 h-10 rounded-md transition-colors ${focusRing} ${
            hasActive && !open
              ? `${activeBar} bg-[#eef3ee] text-[#1f4a35] font-semibold`
              : hasActive
              ? "text-[#1f4a35] font-semibold hover:bg-gray-100"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          <Icon size={18} className="shrink-0" />

          {!collapsed && (
            <>
              <span className="text-sm whitespace-nowrap flex-1 text-left">
                {label}
              </span>
              <ChevronDown
                size={15}
                className={`shrink-0 text-gray-400 transition-transform duration-200 ${
                  open ? "rotate-180" : ""
                }`}
              />
            </>
          )}
        </button>

        {/* SUB MENU */}
        {!collapsed && open && (
          <div className="mt-0.5 ml-[21px] pl-3 border-l border-gray-200 space-y-0.5">
            {children.map(({ to, icon: ChildIcon, label: childLabel }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2.5 px-3 h-9 rounded-md text-sm transition-colors ${focusRing} ${isActive(
                  to
                )}`}
              >
                <ChildIcon size={15} className="shrink-0" />
                <span className="whitespace-nowrap">{childLabel}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  const SectionLabel = ({ children }) =>
    !collapsed ? (
      <p className="text-xs font-semibold text-gray-400 px-3 mb-2">
        {children}
      </p>
    ) : null;

  return (
    <aside
      className={`h-[calc(100vh-56px)] bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
        collapsed ? "w-[72px]" : "w-[260px]"
      }`}
    >
      {/* TOP */}
      <div className="h-12 border-b border-gray-200 flex items-center justify-between px-3">
        {!collapsed && (
          <p className="text-sm font-semibold text-gray-700 px-1">
            Navigation
          </p>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`w-8 h-8 rounded-md text-gray-500 hover:bg-gray-100 hover:text-[#1f4a35] flex items-center justify-center transition-colors ml-auto ${focusRing}`}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* MENU */}
      <div className="flex-1 overflow-y-auto px-2.5 py-4 space-y-5">
        {/* USER MENU */}
        {role === "user" && (
          <div>
            <SectionLabel>User menu</SectionLabel>

            <div className="space-y-0.5">
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
            <SectionLabel>Super admin</SectionLabel>

            <div className="space-y-0.5">
              <NavItem to="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" />

              <NavGroup id="tickets" icon={Ticket} label="Tickets">
                {ticketItems}
              </NavGroup>

              <NavGroup id="assets" icon={Package} label="Asset Management">
                {assetChildren}
              </NavGroup>

              <NavGroup id="employees" icon={Users} label="Employees">
                {employeeItems}
              </NavGroup>
            </div>
          </div>
        )}

        {role === "it_support" && (
          <div>
            <SectionLabel>IT support</SectionLabel>

            <div className="space-y-0.5">
              <NavItem to="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" />

              <NavGroup id="tickets" icon={Ticket} label="Tickets">
                {itSupportTicketChildren}
              </NavGroup>

              <NavGroup id="assets" icon={Package} label="Asset Management">
                {assetChildren}
              </NavGroup>

              <NavGroup id="employees" icon={Users} label="Employees">
                {employeeItems}
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
            <SectionLabel>Company admin</SectionLabel>

            <div className="space-y-0.5">
              <NavItem to="/admin/dashboard" icon={LayoutDashboard} label="Dashboard" />
              <NavItem to="/admin/assets" icon={Package} label="Assets" />
              <NavItem to="/admin/tickets" icon={Ticket} label="Tickets" />
            </div>
          </div>
        )}
      </div>

      {/* USER INFO */}
      <div className="border-t border-gray-200 px-3 py-3">
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
          <div className="relative w-9 h-9 rounded-full bg-[#d4a94c] text-[#14251c] flex items-center justify-center font-bold text-sm shrink-0">
            {user?.name?.charAt(0).toUpperCase() || "U"}
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0 leading-tight">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {user?.name || "Guest"}
              </p>
              <p className="text-xs text-gray-500 capitalize mt-0.5">
                {role.replace("_", " ")}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}