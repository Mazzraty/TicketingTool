import { useState } from "react";
import api from "../api/axios.js";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import milkImage from "../assets/milk.png";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    employeeId: "",
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeField, setActiveField] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      await api.post("/auth/register", form);
      toast.success("Account created successfully");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    }
  };

  const fieldWrapper = (fieldName, children) => (
    <div className="relative">
      <div
        className={`absolute left-0 top-0 h-full w-1 rounded-full transition-all duration-300
        ${activeField === fieldName ? "bg-blue-500" : "bg-transparent"}
      `}
      />
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center p-6">

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-stretch">

        {/* ================= LEFT HERO ================= */}
        <div className="h-full flex flex-col">

          <div className="relative rounded-2xl overflow-hidden h-full shadow-sm border border-gray-200">

            {/* PARALLAX IMAGE */}
            <div className="absolute inset-0 parallax-layer">
              <img
                src={milkImage}
                className="w-[110%] h-[110%] object-cover"
                alt="hero"
              />
            </div>

            {/* OVERLAY */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>

            {/* TITLE */}
            <div className="absolute bottom-10 left-10 text-white z-10">
              <h2 className="text-4xl font-semibold tracking-tight">
                Mazzraty Platform
              </h2>
              <p className="text-white/80 mt-2 text-sm">
                Enterprise IT & Asset Management System
              </p>
            </div>

            {/* KPI CARDS */}
            <div className="absolute top-8 left-8 right-8 grid grid-cols-2 gap-3 z-10">

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-white">
                <p className="text-xs opacity-80">Users</p>
                <p className="text-lg font-semibold">1,240+</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-white">
                <p className="text-xs opacity-80">Tickets</p>
                <p className="text-lg font-semibold">320+</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-white">
                <p className="text-xs opacity-80">Assets</p>
                <p className="text-lg font-semibold">860+</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-3 text-white">
                <p className="text-xs opacity-80">Uptime</p>
                <p className="text-lg font-semibold">99.9%</p>
              </div>

            </div>

          </div>
        </div>

        {/* ================= RIGHT FORM ================= */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-10 h-full flex flex-col transition-all duration-300 hover:shadow-lg focus-within:shadow-md">

          {/* HEADER */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-800">
              Create Account
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Enter your enterprise credentials
            </p>
          </div>

          {/* FORM */}
          <div className="flex-1 space-y-5">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

              {fieldWrapper(
                "name",
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  onFocus={() => setActiveField("name")}
                  onBlur={() => setActiveField("")}
                  placeholder="Full Name"
                  className="sap-input"
                />
              )}

              {fieldWrapper(
                "employeeId",
                <input
                  name="employeeId"
                  value={form.employeeId}
                  onChange={handleChange}
                  onFocus={() => setActiveField("employeeId")}
                  onBlur={() => setActiveField("")}
                  placeholder="Employee ID"
                  className="sap-input"
                />
              )}

            </div>

            {fieldWrapper(
              "email",
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                onFocus={() => setActiveField("email")}
                onBlur={() => setActiveField("")}
                placeholder="Email Address"
                className="sap-input"
              />
            )}

            {fieldWrapper(
              "password",
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  onFocus={() => setActiveField("password")}
                  onBlur={() => setActiveField("")}
                  placeholder="Password"
                  className="sap-input pr-20"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-600 font-medium"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            )}

            {fieldWrapper(
              "confirmPassword",
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={() => setActiveField("confirmPassword")}
                onBlur={() => setActiveField("")}
                placeholder="Confirm Password"
                className="sap-input"
              />
            )}

          </div>

          {/* BUTTONS */}
          <div className="mt-8 space-y-3">

            <button
              onClick={handleSubmit}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg text-sm font-medium transition"
            >
              Create Account
            </button>

            <button
              onClick={() => navigate("/login")}
              className="w-full border border-gray-300 py-3 rounded-lg text-sm hover:bg-gray-50 transition"
            >
              Already have account? Login
            </button>

            <p className="text-xs text-center text-gray-400 mt-4">
              © 2026 Mazzraty Enterprise System
            </p>

          </div>
        </div>
      </div>

      {/* SAP INPUT + PARALLAX STYLE */}
      <style>
        {`
          .sap-input {
            width: 100%;
            padding: 12px 14px;
            border: none;
            border-bottom: 1px solid #d1d5db;
            background: transparent;
            outline: none;
            font-size: 14px;
            transition: all 0.2s ease;
          }

          .sap-input:focus {
            border-bottom: 2px solid #2563eb;
          }

          .sap-input::placeholder {
            color: #9ca3af;
          }

          .parallax-layer {
            animation: slowParallax 18s ease-in-out infinite alternate;
            transform: scale(1.08);
          }

          @keyframes slowParallax {
            0% {
              transform: translate3d(0px, 0px, 0) scale(1.08);
            }
            50% {
              transform: translate3d(-10px, -8px, 0) scale(1.08);
            }
            100% {
              transform: translate3d(10px, 8px, 0) scale(1.08);
            }
          }
        `}
      </style>

    </div>
  );
}