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
        className={`absolute left-0 top-0 h-full w-[3px] rounded transition-all duration-200
        ${activeField === fieldName ? "bg-blue-600" : "bg-transparent"}
      `}
      />
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex items-center justify-center p-6">

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-10">

        {/* LEFT IMAGE (SIMPLE SAP STYLE) */}
        <div className="hidden lg:block">
          <div className="h-full rounded-xl overflow-hidden border border-gray-200 bg-white">

            <img
              src={milkImage}
              className="h-full w-full object-cover"
              alt="hero"
            />

            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Mazzraty Enterprise
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                IT Asset & Support System
              </p>
            </div>

          </div>
        </div>

        {/* RIGHT FORM */}
        <div className="bg-white border border-gray-200 rounded-xl p-10 shadow-sm">

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
          <div className="space-y-5">

            {/* NAME + EMPLOYEE ID */}
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

            <p className="text-xs text-center text-gray-400 mt-4">
              © 2026 Mazzraty Enterprise System
            </p>

          </div>
        </div>
      </div>

      {/* SAP STYLE INPUT */}
      <style>
        {`
          .sap-input {
            width: 100%;
            padding: 12px 14px;
            border: 1px solid #d1d5db;
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