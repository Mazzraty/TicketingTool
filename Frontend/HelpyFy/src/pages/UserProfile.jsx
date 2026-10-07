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
  ShieldCheck,
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
      <div className="min-h-screen bg-[#f4f6f5] px-4 py-6 md:px-8">
        <div className="max-w-5xl mx-auto animate-pulse">
          <div className="h-3 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="bg-white rounded-md border border-gray-200 overflow-hidden mb-5">
            <div className="h-20 bg-gray-200"></div>
            <div className="p-6">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 bg-white rounded-md border border-gray-200 p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-5 bg-gray-200 rounded w-full"></div>
              ))}
            </div>
            <div className="bg-white rounded-md border border-gray-200 p-6">
              <div className="h-5 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f5] px-4 py-6 md:px-8">
      <div className="max-w-5xl mx-auto">

        {/* BREADCRUMB */}
        <p className="text-xs text-gray-500 mb-3">
          My workspace <span className="mx-1 text-gray-300">/</span> Profile
        </p>

        {/* PROFILE BANNER */}
        <div className="bg-white rounded-md border border-gray-200 overflow-hidden mb-5">
          <div className="h-20 bg-gradient-to-r from-[#14251c] to-[#1f4a35]" />
          <div className="px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div className="flex items-end gap-4 -mt-9">
                <div className="w-[72px] h-[72px] rounded-full bg-[#d4a94c] text-[#14251c] ring-4 ring-white flex items-center justify-center text-2xl font-bold flex-shrink-0">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="pb-0.5 min-w-0">
                  <h1 className="text-xl font-semibold text-gray-900 truncate">
                    {user?.name}
                  </h1>
                  <p className="text-sm text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setPassOpen(true)}
                className="flex items-center justify-center gap-2 h-9 px-4 bg-[#1f4a35] hover:bg-[#173a29] text-white text-sm font-medium rounded-md transition-colors whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f4a35]"
              >
                <Lock size={15} />
                Change password
              </button>
            </div>
          </div>
        </div>

        {/* DETAILS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* PERSONAL INFORMATION */}
          <div className="lg:col-span-2 bg-white rounded-md border border-gray-200">
            <div className="px-5 py-3.5 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">
                Personal information
              </h2>
            </div>
            <dl className="divide-y divide-gray-100">
              <ProfileRow
                icon={<User size={16} />}
                label="Full name"
                value={user?.name}
              />
              <ProfileRow
                icon={<Mail size={16} />}
                label="Email address"
                value={user?.email}
                hint="Primary contact email"
                isEmail
              />
              <ProfileRow
                icon={<Code size={16} />}
                label="Staff code"
                value={user?.staffCode}
                mono
              />
            </dl>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-5">

            {/* ACCESS ROLE */}
            <div className="bg-white rounded-md border border-gray-200">
              <div className="px-5 py-3.5 border-b border-gray-200">
                <h2 className="text-sm font-semibold text-gray-900">
                  Access role
                </h2>
              </div>
              <div className="p-5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#eef3ee] text-[#1f4a35] rounded text-sm font-semibold border border-[#cfe0d3] capitalize">
                  <Check size={14} />
                  {user?.role}
                </span>
                <p className="text-sm text-gray-500 mt-3">
                  {getRoleDescription(user?.role)}
                </p>
              </div>
            </div>

            {/* ACCOUNT SECURITY */}
            <div className="bg-white rounded-md border border-gray-200 border-l-4 border-l-[#d4a94c] p-5 flex items-start gap-3">
              <ShieldCheck size={18} className="text-[#8a6a1f] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Account security
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Keep your password secure. Change it regularly and never share it with anyone.
                </p>
              </div>
            </div>
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

/* ================= PROFILE ROW COMPONENT ================= */
function ProfileRow({ icon, label, value, hint, mono = false, isEmail = false }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-5 py-4">
      <dt className="flex items-center gap-2 text-sm text-gray-500 sm:w-44 flex-shrink-0">
        <span className="text-gray-400">{icon}</span>
        {label}
      </dt>
      <dd className="min-w-0">
        <p
          className={`text-sm font-medium text-gray-900 ${
            isEmail ? "break-all" : ""
          } ${mono ? "font-mono" : ""}`}
        >
          {value || "-"}
        </p>
        {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
      </dd>
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
  const inputBase =
    "w-full pl-10 pr-10 h-10 border rounded-md text-sm focus:outline-none focus:ring-1 transition-colors disabled:bg-gray-50 disabled:cursor-not-allowed";

  return (
    <div className="fixed inset-0 bg-[#14251c]/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-md rounded-lg shadow-2xl overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#eef3ee] flex items-center justify-center">
              <Lock size={16} className="text-[#1f4a35]" />
            </div>
            <h2 className="text-base font-semibold text-gray-900">Change password</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
            className="text-gray-500 hover:text-gray-700 p-1.5 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-4">

          {/* OLD PASSWORD */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Current password
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={16} />
              </div>
              <input
                type={showPasswords.old ? "text" : "password"}
                value={password.oldPassword}
                onChange={(e) =>
                  setPassword({ ...password, oldPassword: e.target.value })
                }
                disabled={loading}
                placeholder="Enter your current password"
                className={`${inputBase} ${
                  passErrors.oldPassword
                    ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-[#1f4a35] focus:ring-[#1f4a35]"
                }`}
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords({ ...showPasswords, old: !showPasswords.old })
                }
                disabled={loading}
                aria-label="Toggle password visibility"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                {showPasswords.old ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passErrors.oldPassword && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                <AlertCircle size={13} />
                {passErrors.oldPassword}
              </p>
            )}
          </div>

          {/* NEW PASSWORD */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              New password
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={16} />
              </div>
              <input
                type={showPasswords.new ? "text" : "password"}
                value={password.newPassword}
                onChange={(e) =>
                  setPassword({ ...password, newPassword: e.target.value })
                }
                disabled={loading}
                placeholder="Enter your new password"
                className={`${inputBase} ${
                  passErrors.newPassword
                    ? "border-red-400 focus:border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:border-[#1f4a35] focus:ring-[#1f4a35]"
                }`}
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords({ ...showPasswords, new: !showPasswords.new })
                }
                disabled={loading}
                aria-label="Toggle password visibility"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passErrors.newPassword && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                <AlertCircle size={13} />
                {passErrors.newPassword}
              </p>
            )}
            {!passErrors.newPassword && password.newPassword && (
              <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                <Check size={13} />
                Password strength: Good
              </p>
            )}
          </div>

          {/* SECURITY NOTE */}
          <div className="bg-[#fbf6e9] border border-[#efe0b6] rounded-md p-3">
            <p className="text-xs text-[#6b5314]">
              <span className="font-semibold">Security tip:</span> Use a combination of uppercase, lowercase, numbers, and symbols for better security.
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={loading}
            className="h-9 px-4 text-sm text-gray-700 bg-white border border-gray-300 rounded-md font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="flex items-center justify-center gap-2 h-9 px-4 text-sm bg-[#1f4a35] hover:bg-[#173a29] text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Check size={16} />
                Update password
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