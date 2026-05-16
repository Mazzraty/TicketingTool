import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

export default function ProtectedRoute({ role }) {
  const { token, role: currentRole } = useAuth();
  const userRole = currentRole || "user";

  if (!token) return <Navigate to="/login" />;

  if (role && userRole !== role) {
    return <Navigate to={userRole === "admin" ? "/admin" : "/dashboard"} />;
  }

  if (!role && userRole === "admin") {
    return <Navigate to="/admin" />;
  }

  return <Outlet />;
}