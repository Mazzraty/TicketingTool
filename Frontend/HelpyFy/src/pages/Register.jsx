import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../auth/AuthContext.jsx";

import milkImage from "../assets/milk.png";

const ADMIN_ROLES = ["company_admin", "super_admin", "it_support"];

export default function Register() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ✅ FIX: do NOT depend on user here
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
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  const isAdmin = ADMIN_ROLES.includes(user?.role);
  const isSuperAdmin = user?.role === "super_admin";

  // 🔐 protect route
  useEffect(() => {
    if (!user) return;

    if (!isAdmin) {
      navigate("/login");
      return;
    }
  }, [user, isAdmin, navigate]);

  // 🏢 set company ONLY after user loads
  useEffect(() => {
    if (!user) return;

    if (!isSuperAdmin) {
      setForm((prev) => ({
        ...prev,
        companyId: user.companyId || "",
      }));
    }
  }, [user, isSuperAdmin]);

  // 📦 load companies (super admin only)
  useEffect(() => {
    const fetchCompanies = async () => {
      setLoadingCompanies(true);
      try {
        const res = await api.get("/companies");
        console.log("Companies:", res.data);

        setCompanies(res.data.companies || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load companies");
      } finally {
        setLoadingCompanies(false);
      }
    };

    if (isSuperAdmin) {
      fetchCompanies();
    }
  }, [isSuperAdmin]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!form.companyId?.trim()) {
      toast.error("Please select a company before creating an account.");
      return;
    }

    try {
      await api.post("/auth/register", form);
      toast.success("Account created successfully");
      navigate("/admin");
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
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src={milkImage} className="w-full h-full object-cover" alt="bg" />
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* Form */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8">

          <h1 className="text-2xl font-semibold text-center mb-6">
            Create Account
          </h1>

          <div className="space-y-4">

            {/* Name */}
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

            {/* Employee ID */}
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

            {/* Company */}
            {isSuperAdmin ? (
              <select
                name="companyId"
                value={form.companyId}
                onChange={handleChange}
                className="sap-input"
              >
                <option value="">Select Company</option>
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-gray-50 border rounded">
                Company: {user?.companyName || "Assigned company"}
              </div>
            )}

            {/* Email */}
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email"
              className="sap-input"
            />

            {/* Password */}
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              className="sap-input"
            />

            {/* Confirm Password */}
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              className="sap-input"
            />
          </div>

          {/* Buttons */}
          <button
            onClick={handleSubmit}
            className="w-full mt-6 bg-blue-600 text-white py-3 rounded"
          >
            Create Account
          </button>

          <button
            onClick={() => navigate("/admin")}
            className="w-full mt-3 border py-3 rounded"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        .sap-input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          outline: none;
        }
      `}</style>
    </div>
  );
}