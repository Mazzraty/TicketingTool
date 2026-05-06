import { Routes, Route, Navigate } from "react-router-dom";

// PUBLIC
import Login from "../pages/Login";
import Register from "../pages/Register";

// USER
import Dashboard from "../pages/Dashboard";
import CreateTicket from "../pages/CreateTicket";
import MyTickets from "../pages/MyTickets";

// ADMIN
import AdminTickets from "../pages/AdminTickets";
import AdminEmployeeMaster from "../pages/AdminEmployeeMaster";
import AdminAssets from "../pages/AdminAsset";
import AssetHistoryPage from "../pages/AssetHistory";

// LAYOUTS
import ProtectedRoute from "../components/ProtectedRoute";
import Layout from "../layouts/Mainlayout";
import AdminLayout from "../layouts/AdminLayout";

export default function AppRoutes() {
  return (
    <Routes>

      {/* ================= PUBLIC ================= */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ================= USER ================= */}
      <Route element={<ProtectedRoute role="user" />}>
        <Route element={<Layout />}>

          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create" element={<CreateTicket />} />
          <Route path="/tickets" element={<MyTickets />} />

        </Route>
      </Route>

      {/* ================= ADMIN ================= */}
      <Route element={<ProtectedRoute role="admin" />}>
        <Route element={<AdminLayout />}>

          <Route path="/admin" element={<AdminTickets />} />
          <Route path="/admin/employees" element={<AdminEmployeeMaster />} />

          {/* ✅ ASSETS */}
          <Route path="/admin/assets" element={<AdminAssets />} />
          <Route path="/admin/assets/history" element={<AssetHistoryPage />} />

        </Route>
      </Route>

      {/* ================= SAFETY REDIRECT ================= */}
      {/* 🔥 FIX FOR YOUR ERROR */}
      <Route path="/assets" element={<Navigate to="/admin/assets" replace />} />

    </Routes>
  );
}