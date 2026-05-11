import { useEffect, useState } from "react";
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

  const [employeeStatus, setEmployeeStatus] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const navigate = useNavigate();

  // ================= VALIDATION =================
  const validateEmployeeId = (id) => {
    return /^\d{4}$/.test(id); // exactly 4 digits
  };

  // ================= LIVE DUPLICATE CHECK (DEBOUNCE) =================
  useEffect(() => {

    if (!form.employeeId || form.employeeId.length < 4) {
      setEmployeeStatus(null);
      return;
    }

    const timer = setTimeout(async () => {

      try {
        setEmployeeStatus("checking");

        const res = await api.get(
          `/auth/check-employee/${form.employeeId}`
        );

        if (res.data.exists) {
          setEmployeeStatus("exists");
        } else {
          setEmployeeStatus("available");
        }

      } catch (err) {
        setEmployeeStatus(null);
      }

    }, 600);

    return () => clearTimeout(timer);

  }, [form.employeeId]);

  // ================= INPUT HANDLER =================
  const handleChange = (e) => {

    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!validateEmployeeId(form.employeeId)) {
      toast.error("Employee ID must be exactly 4 digits (0001 - 9999)");
      return;
    }

    if (employeeStatus === "exists") {
      toast.error("Employee ID already exists");
      return;
    }

    try {

      await api.post("/auth/register", form);

      toast.success("Account created successfully");

      navigate("/login");

    } catch (err) {

      toast.error(
        err.response?.data?.message || "Registration failed"
      );

    }
  };

  return (
    <div className="min-h-screen bg-[#eef5e8] flex items-center justify-center p-4">

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-6">

        {/* ================= LEFT ================= */}
        <div className="space-y-6">

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

          <div className="bg-white rounded-3xl shadow p-6 border border-green-100">
            <h4 className="text-lg font-bold mb-2">
              Enterprise Access
            </h4>

            <p className="text-sm text-gray-500">
              Employee registration system with real-time validation and secure onboarding.
            </p>
          </div>

        </div>

        {/* ================= RIGHT FORM ================= */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-green-100">

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Create Account
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* NAME + EMPLOYEE ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Full Name"
                className="input"
                required
              />

              {/* ================= EMPLOYEE ID (SAP STYLE) ================= */}
              <div className="relative">

                <input
                  name="employeeId"
                  value={form.employeeId}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 4);

                    setForm({
                      ...form,
                      employeeId: val,
                    });
                  }}
                  onFocus={() => setShowTooltip(true)}
                  onBlur={() => setShowTooltip(false)}
                  placeholder="Employee ID (4 digits)"
                  className={`input pr-10 ${
                    employeeStatus === "exists"
                      ? "border-red-500"
                      : employeeStatus === "available"
                      ? "border-green-500"
                      : ""
                  }`}
                  required
                />

                {/* ICON */}
                <div className="absolute right-3 top-3 text-sm">
                  {employeeStatus === "checking" && (
                    <span className="text-gray-400 animate-pulse">⏳</span>
                  )}
                  {employeeStatus === "available" && (
                    <span className="text-green-600">✔</span>
                  )}
                  {employeeStatus === "exists" && (
                    <span className="text-red-600">✖</span>
                  )}
                </div>

                {/* ================= FIORI TOOLTIP ================= */}
                {showTooltip && (
                  <div className="absolute z-50 left-0 mt-2 w-full">

                    <div className="bg-white border shadow-xl rounded-lg p-3 text-xs">

                      <p className="font-semibold text-gray-700 mb-1">
                        Employee ID Rules
                      </p>

                      <ul className="text-gray-500 space-y-1">
                        <li>✔ Must be exactly 4 digits</li>
                        <li>✔ No letters allowed</li>
                        <li>✔ Must be unique</li>
                      </ul>

                      <div className="mt-2 border-t pt-2">

                        {employeeStatus === "checking" && (
                          <p className="text-gray-500">Checking...</p>
                        )}

                        {employeeStatus === "available" && (
                          <p className="text-green-600 font-semibold">
                            ✔ Available
                          </p>
                        )}

                        {employeeStatus === "exists" && (
                          <p className="text-red-600 font-semibold">
                            ✖ Already Exists
                          </p>
                        )}

                        {!employeeStatus && (
                          <p className="text-gray-400">
                            Enter 4 digit ID
                          </p>
                        )}

                      </div>

                    </div>

                  </div>
                )}

              </div>

            </div>

            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email Address"
              className="input"
              required
            />

            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              className="input"
              required
            />

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-3 rounded-2xl font-semibold"
            >
              Create Account
            </button>

          </form>

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