import { Routes, Route, Navigate } from "react-router-dom";

// PUBLIC
import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";

// USER
import Dashboard from "../pages/Dashboard.jsx";
import CreateTicket from "../pages/CreateTicket.jsx";
import MyTickets from "../pages/MyTickets.jsx";
import UserAssetPage from "../pages/UserAssetPage.jsx";
// ADMIN
import AdminTickets from "../pages/AdminTickets.jsx";
import AdminEmployeeMaster from "../pages/AdminEmployeeMaster.jsx";
import AdminAssets from "../pages/AdminAsset.jsx";
import AssetHistoryPage from "../pages/AssetHistory.jsx";
import AssetExcelUpload from "../pages/AssetUpload.jsx";
import AdminSoftwareDashboard from "../pages/AdminSoftwareDashboard.jsx";
import AssetStoreFiori from "../pages/AssetStoreFiori.jsx";
import PrinterUpload from "../pages/PrinterUpload.jsx";
import LaptopUpload from "../pages/LaptopUpload.jsx";
import AdminDashboardFiori from "../pages/AdminDashboardFiori.jsx";
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

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/create"
            element={<CreateTicket />}
          />

          <Route
            path="/tickets"
            element={<MyTickets />}
          />
          <Route
            path="/my-assets"
            element={<UserAssetPage />}
          />

        </Route>

      </Route>

      {/* ================= ADMIN ROUTES ================= */}
      <Route element={<ProtectedRoute role="admin" />}>
        <Route element={<AdminLayout />}>

          {/* DEFAULT ADMIN ENTRY */}
          <Route
            path="/admin"
            element={<Navigate to="/admin/dashboard" replace />}
          />

          {/* DASHBOARD */}
          <Route
            path="/admin/dashboard"
            element={<AdminDashboardFiori />}
          />

          {/* TICKETS (ADD THIS) */}
          <Route
            path="/admin/tickets"
            element={<AdminTickets />}
          />

          <Route
            path="/admin/employees"
            element={<AdminEmployeeMaster />}
          />

          <Route
            path="/admin/assets"
            element={<AdminAssets />}
          />

          <Route
            path="/admin/assets/history"
            element={<AssetHistoryPage />}
          />

          <Route
            path="/admin/assets/upload-excel"
            element={<AssetExcelUpload />}
          />

          <Route
            path="/admin/software-dashboard"
            element={<AdminSoftwareDashboard />}
          />

          <Route
            path="/admin/assets/fiori"
            element={<AssetStoreFiori />}
          />

          <Route
            path="/admin/assets/upload-laptop"
            element={<LaptopUpload />}
          />
          <Route
            path="/admin/assets/upload-printer"
            element={<PrinterUpload />}
          />

        </Route>
      </Route>

      {/* ================= FALLBACK ================= */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
}