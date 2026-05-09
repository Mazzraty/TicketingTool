import { Routes, Route, Navigate } from "react-router-dom";

// PUBLIC
import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";

// USER
import Dashboard from "../pages/Dashboard.jsx";
import CreateTicket from "../pages/CreateTicket.jsx";
import MyTickets from "../pages/MyTickets.jsx";

// ADMIN
import AdminTickets from "../pages/AdminTickets.jsx";
import AdminEmployeeMaster from "../pages/AdminEmployeeMaster.jsx";
import AdminAssets from "../pages/AdminAsset.jsx";
import AssetHistoryPage from "../pages/AssetHistory.jsx";
import AssetExcelUpload from "../pages/AssetUpload.jsx";

// LAYOUTS
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import Layout from "../layouts/MainLayout.jsx";
import AdminLayout from "../layouts/AdminLayout.jsx";

export default function AppRoutes() {
  return (
    <Routes>

      {/* ================= PUBLIC ================= */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ================= USER ROUTES ================= */}
      <Route element={<ProtectedRoute role="user" />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/create" element={<CreateTicket />} />
          <Route path="/tickets" element={<MyTickets />} />
        </Route>
      </Route>

      {/* ================= ADMIN ROUTES ================= */}
      <Route element={<ProtectedRoute role="admin" />}>
        <Route element={<AdminLayout />}>

          <Route path="/admin" element={<AdminTickets />} />
          <Route path="/admin/employees" element={<AdminEmployeeMaster />} />
          <Route path="/admin/assets" element={<AdminAssets />} />
          <Route path="/admin/assets/history" element={<AssetHistoryPage />} />
          <Route path="/admin/assets/upload-excel" element={<AssetExcelUpload />} />

        </Route>
      </Route>

      {/* ================= FALLBACK ================= */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
}