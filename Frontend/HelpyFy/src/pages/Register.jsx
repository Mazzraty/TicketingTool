import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../auth/AuthContext.jsx";

import milkImage from "../assets/milk.png";

const ADMIN_ROLES = ["company_admin", "super_admin", "it_support"];

/* =========================
   🏢 COMPANY LIST (STATIC)
========================= */
const COMPANY_LIST = [
  { name: "Arab Qatari Co for Dairy Production WLL", code: "AQC" },
  { name: "National Group of Agriculture and Animal Products", code: "NGA" },
  { name: "Alasysl", code: "ASL" },
  { name: "Almana Agriculture", code: "AAG" },
  { name: "Khairat Mazzraty", code: "KMZ" },
];

export default function Register() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    employeeId: "",
    position: "Employee",
    department: "General",
    companyId: "",
    role: "user",
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeField, setActiveField] = useState("");

  const isAdmin = ADMIN_ROLES.includes(user?.role);

  /* =========================
     🔐 BASIC PROTECTION
  ========================= */
  useEffect(() => {
    if (!user) return;

    if (!isAdmin) {
      navigate("/login");
    }
  }, [user, isAdmin, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /* =========================
     🚀 SUBMIT
  ========================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!form.companyId) {
      toast.error("Please select a company");
      return;
    }

    try {
      await api.post("/auth/register", form);
      toast.success("Account created successfully");
      navigate(isAdmin ? "/admin" : "/login");
    } catch (err) {
      toast.error(
        err.response?.data?.msg ||
        err.response?.data?.message ||
        "Registration failed"
      );
    }
  };

  const fieldWrapper = (fieldName, children) => (
    <div className="relative">
      <div
        className={`absolute left-0 top-0 h-full w-[3px] rounded transition-all duration-200 ${
          activeField === fieldName ? "bg-blue-600" : "bg-transparent"
        }`}
      />
      {children}
    </div>
  );

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">

      {/* BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <img src={milkImage} className="w-full h-full object-cover" alt="bg" />
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* FORM */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-md border border-white/30 rounded-2xl shadow-2xl p-8">

          <h1 className="text-2xl font-semibold text-center mb-6">
            Create Account
          </h1>

          <div className="space-y-4">

            {/* NAME */}
            {fieldWrapper(
              "name",
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Full Name"
                className="sap-input"
              />
            )}

            {/* EMPLOYEE ID */}
            {fieldWrapper(
              "employeeId",
              <input
                name="employeeId"
                value={form.employeeId}
                onChange={handleChange}
                placeholder="Employee ID"
                className="sap-input"
              />
            )}

            {/* COMPANY DROPDOWN (ALWAYS SHOW) */}
            {fieldWrapper(
              "companyId",
              <select
                name="companyId"
                value={form.companyId}
                onChange={handleChange}
                className="sap-input"
              >
                <option value="">Select Company</option>

                {COMPANY_LIST.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            )}

            {/* EMAIL */}
            {fieldWrapper(
              "email",
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email Address"
                className="sap-input"
              />
            )}

            {/* PASSWORD */}
            {fieldWrapper(
              "password",
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="sap-input pr-20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-600"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            )}

            {/* CONFIRM PASSWORD */}
            {fieldWrapper(
              "confirmPassword",
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                className="sap-input"
              />
            )}

          </div>

          {/* BUTTON */}
          <button
            onClick={handleSubmit}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md font-medium"
          >
            Create Account
          </button>

          <button
            onClick={() => navigate("/admin")}
            className="w-full mt-3 border py-3 rounded-md hover:bg-gray-50"
          >
            Back to Dashboard
          </button>

        </div>
      </div>

      {/* STYLE */}
      <style>{`
        .sap-input {
          width: 100%;
          padding: 12px 14px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: #fff;
          outline: none;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .sap-input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 1px #2563eb;
        }
      `}</style>
    </div>
  );
}
