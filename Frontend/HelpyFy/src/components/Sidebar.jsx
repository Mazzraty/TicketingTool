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
  BarChart3
} from "lucide-react";
export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();
  const { user } = useAuth();
  const role = (user?.role || "guest").toLowerCase();

  const isActive = (path) =>
    location.pathname === path
      ? "bg-[#1f4a35] text-white shadow-sm"
      : "text-gray-600 hover:bg-[#eef3ee] hover:text-[#1f4a35]";

  const NavItem = ({ to, icon: Icon, label }) => (
    <Link
      to={to}
      className={`flex items-center ${collapsed ? "justify-center" : "gap-3"
        } px-4 py-3 rounded-xl transition-all duration-200 ${isActive(to)}`}
    >
      <Icon size={18} className="shrink-0" />

      {!collapsed && (
        <span className="text-sm font-medium whitespace-nowrap">{label}</span>
      )}
    </Link>
  );

  return (
    <aside
      className={`h-[calc(100vh-64px)] bg-white border-r border-gray-200 shadow-sm flex flex-col transition-all duration-300 ${collapsed ? "w-[90px]" : "w-[280px]"
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
              <NavItem to="/admin/employees" icon={Users} label="Employees" />
              <NavItem to="/admin/assets" icon={Package} label="Asset Management" />
              <NavItem to="/admin/company-access" icon={Building2} label="Users" />
              <NavItem to="/admin/tickets" icon={Ticket} label="All Tickets" />
              <NavItem to="/admin/ticket-dashboard" icon={BarChart3} label="Ticket Dashboard" />
              <NavItem to="/admin/it-support/create-ticket" icon={Plus} label="Create Ticket" />
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
              <NavItem to="/admin/tickets" icon={Ticket} label="Company Tickets" />
              <NavItem to="/admin/it-support/create-ticket" icon={Plus} label="Create Ticket" />
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