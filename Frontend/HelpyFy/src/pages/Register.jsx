import { useState } from "react";
import api from "../api/axios.js";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    employeeId: "",
    position: "",
    department: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/auth/register", form);

      toast.success("Account created successfully");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-lg mb-4 overflow-hidden">
            <img src="/logo.svg" alt="HelpyFy Logo" className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Join our IT Helpdesk system</p>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Name */}
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Full Name"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 bg-gray-50"
              required
            />

            {/* Employee ID */}
            <input
              type="text"
              name="employeeId"
              value={form.employeeId}
              onChange={handleChange}
              placeholder="Employee ID (EMP001)"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 bg-gray-50"
              required
            />

            {/* Email */}
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email Address"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 bg-gray-50"
              required
            />

            {/* Position */}
            <input
              type="text"
              name="position"
              value={form.position}
              onChange={handleChange}
              placeholder="Position (e.g. IT Support)"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 bg-gray-50"
            />

            {/* Department */}
            <input
              type="text"
              name="department"
              value={form.department}
              onChange={handleChange}
              placeholder="Department (IT / HR / Finance)"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 bg-gray-50"
            />

            {/* Password */}
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 bg-gray-50"
              required
            />

            {/* Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-semibold hover:scale-[1.02] transition"
            >
              Create Account
            </button>
          </form>

          {/* Login Link */}
          <button
            onClick={() => navigate("/login")}
            className="w-full mt-6 border border-gray-300 py-3 rounded-xl hover:bg-gray-50"
          >
            Already have account? Login
          </button>

          {/* Footer */}
          <p className="text-xs text-center mt-6 text-gray-500">
            © 2026 HelpyFy
          </p>
        </div>
      </div>
    </div>
  );
}