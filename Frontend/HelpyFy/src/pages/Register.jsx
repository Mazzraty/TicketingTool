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

  return (
    <div className="min-h-screen bg-[#eef5e8] flex items-center justify-center p-4">

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-6">

        {/* LEFT */}
        <div className="space-y-6">

          <div className="relative rounded-3xl overflow-hidden shadow-xl">
            <img src={milkImage} className="h-72 w-full object-cover" />
            <div className="absolute inset-0 bg-black/50"></div>

            <div className="absolute bottom-6 left-6 text-white">
              <h2 className="text-3xl font-bold">Join Mazzraty</h2>
              <p className="text-white/80">Enterprise IT & Asset Platform</p>
            </div>
          </div>

        </div>

        {/* RIGHT */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-green-100">

          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Create Account
            </h1>
            <p className="text-gray-500">
              Register your enterprise profile
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Full Name"
                className="input"
                required
              />

              <input
                name="employeeId"
                value={form.employeeId}
                onChange={handleChange}
                placeholder="Employee ID"
                className="input"
                required
              />

            </div>

            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email Address"
              className="input"
              required
            />

            {/* PASSWORD + VIEW */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Password"
                className="input pr-20"
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

            {/* CONFIRM PASSWORD */}
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              className="input"
              required
            />

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-3 rounded-2xl font-semibold hover:scale-[1.01] transition"
            >
              Create Account
            </button>
          </form>

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