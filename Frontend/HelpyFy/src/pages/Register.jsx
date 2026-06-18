import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../auth/AuthContext.jsx";

import milkImage from "../assets/milk.png";

const ADMIN_ROLES = [
  "company_admin",
  "super_admin",
  "it_support",
];

export default function Register() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);

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

  const isAdmin = ADMIN_ROLES.includes(user?.role);

  useEffect(() => {
    if (user && !isAdmin) {
      navigate("/login");
      return;
    }

    loadCompanies();
  }, [user, isAdmin, navigate]);

  const loadCompanies = async () => {
    try {
      const res = await api.get("/companies");
 console.log("Companies Response:", res.data.data);

      if (res.data.success) {
        setCompanies(res.data.companies);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load companies");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.name ||
      !form.email ||
      !form.password ||
      !form.companyId
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    if (form.password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      console.log("Submitting:", form);

      await api.post("/auth/register", form);

      toast.success("Account created successfully");

      navigate("/admin");
    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          "Registration failed"
      );
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img
          src={milkImage}
          alt="background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* Form Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8">
          <h1 className="text-2xl font-semibold text-center mb-6">
            Create Account
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              className="sap-input"
            />

            <input
              type="text"
              name="employeeId"
              placeholder="Employee ID"
              value={form.employeeId}
              onChange={handleChange}
              className="sap-input"
            />

            <select
              name="companyId"
              value={form.companyId}
              onChange={handleChange}
              className="sap-input"
            >
              <option value="">Select Company</option>

              {companies.map((company) => (
                <option
                  key={company._id}
                  value={company._id}
                >
                  {company.name}
                </option>
              ))}
            </select>

            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              className="sap-input"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="sap-input pr-20"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 text-sm"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              className="sap-input"
            />

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md font-medium"
            >
              Create Account
            </button>

            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="w-full border py-3 rounded-md hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
          </form>
        </div>
      </div>

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