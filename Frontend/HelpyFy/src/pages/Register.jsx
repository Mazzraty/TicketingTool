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
      {/* SAP UI5 ACTIVE BAR */}
      <div
        className={`absolute left-0 top-0 h-full w-1 rounded-full transition-all duration-300
        ${activeField === fieldName ? "bg-green-500" : "bg-transparent"}
      `}
      />

      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#eef5e8] flex items-center justify-center p-4">

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-6 items-stretch">

        {/* LEFT SECTION */}
        <div className="space-y-6 h-full flex flex-col">

          <div className="relative rounded-3xl overflow-hidden shadow-xl">
            <img
              src={milkImage}
              className="h-72 w-full object-cover"
              alt="milk"
            />
            <div className="absolute inset-0 bg-black/50"></div>

            <div className="absolute bottom-6 left-6 text-white">
              <h2 className="text-3xl font-bold">Join Mazzraty</h2>
              <p className="text-white/80">
                Enterprise IT & Asset Platform
              </p>
            </div>
          </div>

        </div>

        {/* RIGHT FORM CARD */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-green-100 h-full flex flex-col transition-all duration-300 hover:shadow-green-200/40 hover:-translate-y-1 focus-within:shadow-green-300/60 focus-within:-translate-y-1">

          {/* HEADER */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Create Account
            </h1>
            <p className="text-gray-500">
              Register your enterprise profile
            </p>
          </div>

          {/* FORM */}
          <div className="flex-1 space-y-4">

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
                  className="input pl-4"
                  required
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
                  className="input pl-4"
                  required
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
                className="input pl-4"
                required
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
                  className="input pl-4 pr-20"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-green-600 font-semibold"
                >
                  {showPassword ? "Hide" : "View"}
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
                className="input pl-4"
                required
              />
            )}

          </div>

          {/* BUTTONS */}
          <div className="mt-6">
            <button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-3 rounded-2xl font-semibold hover:scale-[1.01] transition"
            >
              Create Account
            </button>

            <button
              onClick={() => navigate("/login")}
              className="w-full mt-4 border py-3 rounded-2xl hover:bg-gray-50"
            >
              Already have account? Login
            </button>

            <p className="text-xs text-center mt-6 text-gray-400">
              © 2026 Mazzraty Enterprise System
            </p>
          </div>
        </div>
      </div>

      {/* INPUT STYLE */}
      <style>
        {`
          .input {
            width: 100%;
            padding: 12px 16px;
            border-radius: 14px;
            border: 1px solid #e5e7eb;
            background: #f9fafb;
            outline: none;
          }

          .input:focus {
            border-color: #22c55e;
            box-shadow: 0 0 0 2px rgba(34,197,94,0.2);
          }
        `}
      </style>

    </div>
  );
}