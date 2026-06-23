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
    staffCode: "",
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
      setCompanies(res.data.companies || []);
    } catch (err) {
      console.error("Companies error:", err);
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

    if (!form.name || !form.email || !form.password || !form.companyId) {
      return toast.error("Please fill all required fields");
    }

    if (form.password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    try {
      const res = await api.post("/auth/register", form);

      console.log("REGISTER SUCCESS:", res.data);

      toast.success("Account created successfully");

      setTimeout(() => {
        navigate("/login");
      }, 500);
    } catch (err) {
      console.log("REGISTER ERROR:", err);

      toast.error(
        err.response?.data?.msg ||
          err.response?.data?.message ||
          "Registration failed"
      );
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img
          src={milkImage}
          alt="Milk Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-[28px] shadow-2xl border border-white/30 p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img
                src="https://www.mazzraty.com/_next/image?url=%2Fimages%2FMazzraty_Logo.png&w=3840&q=75"
                alt="Mazzraty"
                className="h-12"
              />
            </div>

            <h2 className="text-3xl font-bold text-gray-900">
              Create Account
            </h2>

            <p className="text-gray-500 text-sm mt-2">
              Register a new enterprise user
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={form.name}
                onChange={handleChange}
                className="w-full bg-transparent outline-none text-sm"
              />
            </div>

            {/* Staff Code */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <input
                type="text"
                name="staffCode"
                placeholder="Staff Code"
                value={form.staffCode}
                onChange={handleChange}
                className="w-full bg-transparent outline-none text-sm"
              />
            </div>

            {/* Company */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <select
                name="companyId"
                value={form.companyId}
                onChange={handleChange}
                className="w-full bg-transparent outline-none text-sm"
              >
                <option value="">Select Company</option>

                {companies.map((company) => (
                  <option key={company._id} value={company._id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Email */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={form.email}
                onChange={handleChange}
                className="w-full bg-transparent outline-none text-sm"
              />
            </div>

            {/* Password */}
            <div className="relative bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="w-full bg-transparent outline-none text-sm pr-16"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-green-600 text-sm"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-transparent outline-none text-sm"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 transition-all duration-300 text-white py-3 rounded-2xl font-semibold shadow-lg"
            >
              Create Account
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-5 text-center">
            <span
              onClick={() => navigate("/login")}
              className="text-sm text-green-600 cursor-pointer hover:underline"
            >
              Already have an account? Sign In
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}