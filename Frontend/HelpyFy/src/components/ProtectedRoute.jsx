import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ role }) {
  const token = localStorage.getItem("token");
  const userRole =
    localStorage.getItem("role") ||
    JSON.parse(localStorage.getItem("user") || "null")?.role;

  if (!token) return <Navigate to="/login" />;

  if (role && userRole !== role) {
    return <Navigate to={userRole === "admin" ? "/admin" : "/dashboard"} />;
  }

  if (!role && userRole === "admin") {
    return <Navigate to="/admin" />;
  }

  return <Outlet />;
}