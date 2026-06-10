import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

const ADMIN_ROLES = ["company_admin", "super_admin", "it_support"];

export default function ProtectedRoute({ role }) {
  const { token, role: currentRole } = useAuth();
  const userRole = currentRole || "user";
  const isAdminRole = ADMIN_ROLES.includes(userRole);

  if (!token) return <Navigate to="/login" />;

  if (role === "admin" && !isAdminRole) {
    return <Navigate to="/" />;
  }

  if (!role && isAdminRole) {
    return <Navigate to="/admin" />;
  }

  return <Outlet />;
}