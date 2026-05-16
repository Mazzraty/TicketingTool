import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";

// Loading Fallback Component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50">
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 mb-4">
        <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

// PUBLIC - Lazy loaded
const Login = lazy(() => import("../pages/Login.jsx"));
const Register = lazy(() => import("../pages/Register.jsx"));

// USER - Lazy loaded
const Dashboard = lazy(() => import("../pages/Dashboard.jsx"));
const CreateTicket = lazy(() => import("../pages/CreateTicket.jsx"));
const MyTickets = lazy(() => import("../pages/MyTickets.jsx"));

// ADMIN - Lazy loaded
const AdminTickets = lazy(() => import("../pages/AdminTickets.jsx"));
const AdminEmployeeMaster = lazy(() => import("../pages/AdminEmployeeMaster.jsx"));
const AdminAssets = lazy(() => import("../pages/AdminAsset.jsx"));
const AssetHistoryPage = lazy(() => import("../pages/AssetHistory.jsx"));
const AssetExcelUpload = lazy(() => import("../pages/AssetUpload.jsx"));
const AdminSoftwareDashboard = lazy(() => import("../pages/AdminSoftwareDashboard.jsx"));

// SAP FIORI ASSET MODULE - Lazy loaded
const AssetStoreFiori = lazy(() => import("../pages/AssetStoreFiori.jsx"));

// LAYOUTS - Not lazy loaded (used immediately)
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import Layout from "../layouts/MainLayout.jsx";
import AdminLayout from "../layouts/AdminLayout.jsx";

export default function AppRoutes() {

  return (
    <Routes>

      {/* ================= PUBLIC ================= */}
      <Route path="/login" element={<Suspense fallback={<LoadingFallback />}><Login /></Suspense>} />
      <Route path="/register" element={<Suspense fallback={<LoadingFallback />}><Register /></Suspense>} />

      {/* ================= USER ROUTES ================= */}
      <Route element={<ProtectedRoute role="user" />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Suspense fallback={<LoadingFallback />}><Dashboard /></Suspense>} />
          <Route path="/dashboard" element={<Suspense fallback={<LoadingFallback />}><Dashboard /></Suspense>} />
          <Route path="/create" element={<Suspense fallback={<LoadingFallback />}><CreateTicket /></Suspense>} />
          <Route path="/tickets" element={<Suspense fallback={<LoadingFallback />}><MyTickets /></Suspense>} />
        </Route>
      </Route>

      {/* ================= ADMIN ROUTES ================= */}
      <Route element={<ProtectedRoute role="admin" />}>
        <Route element={<AdminLayout />}>

          <Route path="/admin" element={<Suspense fallback={<LoadingFallback />}><AdminTickets /></Suspense>} />

          <Route path="/admin/employees" element={<Suspense fallback={<LoadingFallback />}><AdminEmployeeMaster /></Suspense>} />

          <Route path="/admin/assets" element={<Suspense fallback={<LoadingFallback />}><AdminAssets /></Suspense>} />

          <Route path="/admin/assets/history" element={<Suspense fallback={<LoadingFallback />}><AssetHistoryPage /></Suspense>} />

          <Route path="/admin/assets/upload-excel" element={<Suspense fallback={<LoadingFallback />}><AssetExcelUpload /></Suspense>} />

          <Route path="/admin/software-dashboard" element={<Suspense fallback={<LoadingFallback />}><AdminSoftwareDashboard /></Suspense>} />

          {/* ================= 🆕 SAP ASSET MODULE ================= */}

          {/* FIORI DASHBOARD */}
          <Route
            path="/admin/assets/fiori"
            element={<Suspense fallback={<LoadingFallback />}><AssetStoreFiori /></Suspense>}
          />

        </Route>
      </Route>

      {/* ================= FALLBACK ================= */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
}