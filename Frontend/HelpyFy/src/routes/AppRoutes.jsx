import { Routes, Route, Navigate } from "react-router-dom";

// PUBLIC
import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";

// USER
import Dashboard from "../pages/Dashboard.jsx";
import CreateTicket from "../pages/CreateTicket.jsx";
import MyTickets from "../pages/MyTickets.jsx";
import UserAssetPage from "../pages/UserAssetPage.jsx";
import UserProfile from "../pages/UserProfile.jsx";
// ADMIN
import AdminTickets from "../pages/AdminTickets.jsx";
import AdminEmployeeMaster from "../pages/AdminEmployeeMaster.jsx";
import AdminAssets from "../pages/AdminAsset.jsx";
import AssetHistoryPage from "../pages/AssetHistory.jsx";
import AssetExcelUpload from "../pages/AssetUpload.jsx";
import AdminSoftwareDashboard from "../pages/AdminSoftwareDashboard.jsx";
import AssetStoreFiori from "../pages/AssetStoreFiori.jsx";
import PrinterUpload from "../pages/PrinterUpload.jsx";
import HhtUpload from "../pages/HhtUpload.jsx";
import LaptopUpload from "../pages/LaptopUpload.jsx";
import AdminDashboardFiori from "../pages/AdminDashboardFiori.jsx";
import AdminCompanyAccess from "../pages/AdminCompanyAccess.jsx"
import ITSupportUsers from "../pages/itSupport/ItSupportUsers.jsx"
import ITSupportEmployeeView from "../pages/itSupport/ItSupportEmployeeView.jsx"
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
      <Route element={<ProtectedRoute allowedRoles={["user"]} />}>

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
          <Route
            path="/profile"
            element={<UserProfile />}
          />

        </Route>

      </Route>

      {/* ================= ADMIN ROUTES ================= */}
      <Route
        element={
          <ProtectedRoute
            allowedRoles={["super_admin", "company_admin", "it_support"]}
          />
        }
      >
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
          <Route
            path="/admin/assets/upload-hht"
            element={<HhtUpload />}
          />
          <Route
            path="/admin/company-access"
            element={<AdminCompanyAccess />}
          />
          <Route
            path="/admin/it-support-users"
            element={<ITSupportUsers />}
          />
          <Route
            path="/admin/it-support/employees"
            element={<ITSupportEmployeeView />}
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