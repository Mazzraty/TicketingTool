import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

export default function ProtectedRoute({ allowedRoles }) {
  const { token, role, user, isAuthReady } = useAuth();

  if (!isAuthReady) return null;

  const isAuthenticated = Boolean(token || user || localStorage.getItem("user"));

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // if roles are defined → check access
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}