import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import {
  User,
  Mail,
  Code,
  Lock,
  X,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passOpen, setPassOpen] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
  });

  const [password, setPassword] = useState({
    oldPassword: "",
    newPassword: "",
  });

  const [passErrors, setPassErrors] = useState({});

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data);
    } catch (err) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  /* ================= PASSWORD VALIDATION ================= */
  const validatePassword = () => {
    const errors = {};
    if (!password.oldPassword.trim()) {
      errors.oldPassword = "Current password is required";
    }
    if (!password.newPassword.trim()) {
      errors.newPassword = "New password is required";
    } else if (password.newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters";
    }
    if (password.oldPassword === password.newPassword) {
      errors.newPassword = "New password must be different from current password";
    }
    setPassErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* ================= CHANGE PASSWORD ================= */
  const changePassword = async () => {
    if (!validatePassword()) return;

    try {
      setPasswordLoading(true);
      await api.put("/auth/change-password", password);
      toast.success("Password updated successfully!");
      setPassOpen(false);
      setPassword({ oldPassword: "", newPassword: "" });
      setPassErrors({});
      setShowPasswords({ old: false, new: false });
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to change password";
      toast.error(errorMsg);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header Skeleton */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/6"></div>
          </div>

          {/* Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                <div className="h-6 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0a6ed1] to-[#0856a8] flex items-center justify-center">
                  <User size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {user?.name}
                  </h1>
                </div>
              </div>
              <p className="text-sm text-gray-500 font-medium">
                Employee Profile
              </p>
            </div>

            <button
              onClick={() => setPassOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#0a6ed1] to-[#0856a8] text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-200 hover:opacity-95 whitespace-nowrap"
            >
              <Lock size={18} />
              Change Password
            </button>
          </div>
        </div>

        {/* PROFILE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name Card */}
          <ProfileCard
            icon={<User size={20} />}
            label="Full Name"
            value={user?.name}
            color="blue"
          />

          {/* Email Card */}
          <ProfileCard
            icon={<Mail size={20} />}
            label="Email Address"
            value={user?.email}
            color="emerald"
            isEmail
          />

          {/* Staff Code Card */}
          <ProfileCard
            icon={<Code size={20} />}
            label="Staff Code"
            value={user?.staffCode}
            color="purple"
          />

          {/* Role Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Lock size={18} className="text-amber-700" />
              </div>
              <p className="text-sm text-gray-600 font-medium">Access Role</p>
            </div>
            <div className="space-y-2">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-[#0a6ed1] rounded-lg text-sm font-semibold border border-blue-200 capitalize">
                <Check size={16} />
                {user?.role}
              </span>
              <p className="text-xs text-gray-500 mt-2">
                {getRoleDescription(user?.role)}
              </p>
            </div>
          </div>
        </div>

        {/* QUICK INFO */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-start gap-3">
          <AlertCircle size={20} className="text-[#0a6ed1] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              Account Security
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Keep your password secure. Change it regularly and never share it with anyone.
            </p>
          </div>
        </div>

      </div>

      {/* PASSWORD MODAL */}
      {passOpen && (
        <PasswordModal
          onClose={() => {
            setPassOpen(false);
            setPassword({ oldPassword: "", newPassword: "" });
            setPassErrors({});
            setShowPasswords({ old: false, new: false });
          }}
          password={password}
          setPassword={setPassword}
          showPasswords={showPasswords}
          setShowPasswords={setShowPasswords}
          passErrors={passErrors}
          onSubmit={changePassword}
          loading={passwordLoading}
        />
      )}
    </div>
  );
}

/* ================= PROFILE CARD COMPONENT ================= */
function ProfileCard({ icon, label, value, color = "blue", isEmail = false }) {
  const colorClasses = {
    blue: "bg-blue-100 text-[#0a6ed1]",
    emerald: "bg-emerald-100 text-emerald-700",
    purple: "bg-purple-100 text-purple-700",
    amber: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
        <p className="text-sm text-gray-600 font-medium">{label}</p>
      </div>
      <p className="text-lg font-semibold text-gray-900 break-all">
        {value || "-"}
      </p>
      {isEmail && (
        <p className="text-xs text-gray-500 mt-2">
          Primary contact email
        </p>
      )}
    </div>
  );
}

/* ================= PASSWORD MODAL ================= */
function PasswordModal({
  onClose,
  password,
  setPassword,
  showPasswords,
  setShowPasswords,
  passErrors,
  onSubmit,
  loading,
}) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-md rounded-xl shadow-xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0a6ed1] flex items-center justify-center">
              <Lock size={20} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Change Password</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-4">

          {/* OLD PASSWORD */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Current Password
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={18} />
              </div>
              <input
                type={showPasswords.old ? "text" : "password"}
                value={password.oldPassword}
                onChange={(e) =>
                  setPassword({ ...password, oldPassword: e.target.value })
                }
                disabled={loading}
                placeholder="Enter your current password"
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a6ed1] focus:border-transparent transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords({ ...showPasswords, old: !showPasswords.old })
                }
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                {showPasswords.old ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passErrors.oldPassword && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={14} />
                {passErrors.oldPassword}
              </p>
            )}
          </div>

          {/* NEW PASSWORD */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              New Password
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={18} />
              </div>
              <input
                type={showPasswords.new ? "text" : "password"}
                value={password.newPassword}
                onChange={(e) =>
                  setPassword({ ...password, newPassword: e.target.value })
                }
                disabled={loading}
                placeholder="Enter your new password"
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a6ed1] focus:border-transparent transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords({ ...showPasswords, new: !showPasswords.new })
                }
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passErrors.newPassword && (
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                <AlertCircle size={14} />
                {passErrors.newPassword}
              </p>
            )}
            {!passErrors.newPassword && password.newPassword && (
              <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                <Check size={14} />
                Password strength: Good
              </p>
            )}
          </div>

          {/* SECURITY NOTE */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              <span className="font-semibold">Security tip:</span> Use a combination of uppercase, lowercase, numbers, and symbols for better security.
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex gap-3 p-6 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#0a6ed1] to-[#0856a8] text-white rounded-lg font-medium hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Check size={18} />
                Update Password
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= HELPER FUNCTION ================= */
function getRoleDescription(role) {
  const descriptions = {
    user: "Standard user with basic access to tickets",
    company_admin: "Administrator with full system access",
    super_admin: "Super administrator with system management rights",
    it_support: "IT support staff with elevated privileges",
  };
  return descriptions[role?.toLowerCase()] || "User role";
}
