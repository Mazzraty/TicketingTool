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
    return /^\d{4}$/.test(id);
  };

  const isEmployeeValid =
    validateEmployeeId(form.employeeId) &&
    employeeStatus === "available";

  // ================= LIVE CHECK =================
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

        setEmployeeStatus(
          res.data.exists ? "exists" : "available"
        );

      } catch (err) {
        setEmployeeStatus(null);
      }

    }, 600);

    return () => clearTimeout(timer);

  }, [form.employeeId]);

  // ================= HANDLER =================
  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!validateEmployeeId(form.employeeId)) {
      toast.error("Employee ID must be exactly 4 digits");
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
      toast.error(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#eef5e8] flex items-center justify-center p-4">

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-6">

        {/* LEFT */}
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

        </div>

        {/* RIGHT */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-green-100">

          <h1 className="text-3xl font-bold mb-6">
            Create Account
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">

            <input
              name="name"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              placeholder="Full Name"
              className="input"
              required
            />

            {/* ================= EMPLOYEE ID ================= */}
            <div className="relative">

              <input
                value={form.employeeId}
                onChange={(e) => {
                  const val = e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 4);

                  setForm({
                    ...form,
                    employeeId: val,
                  });
                }}
                onFocus={() => setShowTooltip(true)}
                onBlur={() =>
                  setTimeout(() => setShowTooltip(false), 150)
                }
                placeholder="Employee ID (4 digits)"
                className={`input pr-10 transition ${
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
                  <span className="text-gray-400 animate-pulse">
                    ⏳
                  </span>
                )}

                {employeeStatus === "available" && (
                  <span className="text-green-600">✔</span>
                )}

                {employeeStatus === "exists" && (
                  <span className="text-red-600">✖</span>
                )}

              </div>

              {/* ================= TOOLTIP (FIXED SAP STYLE) ================= */}
              {showTooltip && (
                <div className="absolute z-50 left-0 mt-2 w-full">

                  <div className="bg-white border shadow-xl rounded-lg p-3 text-xs">

                    <p className="font-semibold text-gray-700 mb-1">
                      Employee ID Rules
                    </p>

                    <ul className="text-gray-500 space-y-1">
                      <li>✔ Must be exactly 4 digits</li>
                      <li>✔ Only numbers allowed</li>
                      <li>✔ Must be unique</li>
                    </ul>

                    <div className="mt-2 border-t pt-2">

                      {employeeStatus === "checking" && (
                        <p className="text-gray-500">
                          Checking availability...
                        </p>
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
                          Enter 4-digit Employee ID
                        </p>
                      )}

                    </div>

                  </div>

                </div>
              )}

            </div>

            <input
              name="email"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              placeholder="Email Address"
              className="input"
              required
            />

            <input
              type="password"
              name="password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              placeholder="Password"
              className="input"
              required
            />

            {/* BUTTON (SAP STYLE LOCK) */}
            <button
              type="submit"
              disabled={!isEmployeeValid}
              className={`w-full py-3 rounded-2xl font-semibold transition ${
                isEmployeeValid
                  ? "bg-gradient-to-r from-green-600 to-green-500 text-white"
                  : "bg-gray-300 text-gray-600 cursor-not-allowed"
              }`}
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