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
      toast.error(err.response?.data?.msg || err.response?.data?.message || "Registration failed");
    }
  };

  const fieldWrapper = (fieldName, children) => (
    <div className="relative">
      <div
        className={`absolute left-0 top-0 h-full w-[3px] rounded transition-all duration-200
        ${activeField === fieldName ? "bg-blue-600" : "bg-transparent"}
      `}
      />

      {children}
    </div>
  );

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 overflow-hidden">

      {/* BACKGROUND IMAGE */}
      <div className="absolute inset-0 z-0">
        <img
          src={milkImage}
          className="w-full h-full object-cover"
          alt="background"
        />

        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* FORM CONTAINER */}
      <div className="relative z-10 w-full max-w-md">

        <div className="bg-white/95 backdrop-blur-md border border-white/30 rounded-2xl shadow-2xl p-8">

          {/* HEADER */}
          <div className="mb-6 text-center">

            {/* MAZZRATY LOGO */}
            <div className="flex justify-center mb-4">
              <img
                src="https://www.mazzraty.com/_next/image?url=%2Fimages%2FMazzraty_Logo.png&w=3840&q=75"
                className="h-12"
                alt="Mazzraty Logo"
              />
            </div>

            <h1 className="text-2xl font-semibold text-gray-800">
              Create Account
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Enterprise Registration Portal
            </p>

          </div>

          {/* FORM */}
          <div className="space-y-5">

            {/* NAME + EMPLOYEE ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

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

            {/* EMAIL */}
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

            {/* PASSWORD */}
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md text-sm font-medium transition"
            >
              Create Account
            </button>

            <button
              onClick={() => navigate("/login")}
              className="w-full border border-gray-300 py-3 rounded-md text-sm hover:bg-gray-50 transition"
            >
              Already have account? Login
            </button>

            <p className="text-xs text-center text-gray-300 mt-4">
              © 2026 Mazzraty Enterprise System
            </p>

          </div>

        </div>
      </div>

      {/* SAP INPUT STYLE */}
      <style>
        {`
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

          .sap-input::placeholder {
            color: #9ca3af;
          }
        `}
      </style>

    </div>
  );
}