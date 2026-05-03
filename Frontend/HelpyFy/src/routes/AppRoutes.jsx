import { Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import CreateTicket from "../pages/CreateTicket";
import AdminTickets from "../pages/AdminTickets";
import ProtectedRoute from "../components/ProtectedRoute";
import Layout from "../layouts/Mainlayout";
import AdminLayout from "../layouts/AdminLayout";
import MyTickets from "../pages/MyTickets"; // ✅ ADD THIS

export default function AppRoutes() {
  return (
    <Routes>

      {/* public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* user routes */}
      <Route element={<ProtectedRoute role="user" />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create" element={<CreateTicket />} />

          {/* ✅ FIX: My Tickets page */}
          <Route path="/tickets" element={<MyTickets />} />
        </Route>
      </Route>

      {/* admin routes */}
      <Route element={<ProtectedRoute role="admin" />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminTickets />} />
        </Route>
      </Route>

    </Routes>
  );
}