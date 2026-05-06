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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">

      <div className="w-full max-w-md">

        {/* HEADER */}
        <div className="text-center mb-8">

          {/* LOGO */}
          <div className="flex items-center justify-center mb-4">
            <img
              src="https://www.mazzraty.com/_next/image?url=%2Fimages%2FMazzraty_Logo.png&w=3840&q=75"
              alt="Mazzraty"
              className="h-14 object-contain"
            />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Account
          </h1>

          <p className="text-gray-600">
            Join our IT Helpdesk system
          </p>
        </div>

        {/* CARD */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-green-100 p-8">

          <form onSubmit={handleSubmit} className="space-y-5">

            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Full Name"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 bg-gray-50"
              required
            />

            <input
              type="text"
              name="employeeId"
              value={form.employeeId}
              onChange={handleChange}
              placeholder="Employee ID (EMP001)"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 bg-gray-50"
              required
            />

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email Address"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 bg-gray-50"
              required
            />

            <input
              type="text"
              name="position"
              value={form.position}
              onChange={handleChange}
              placeholder="Position (e.g. IT Support)"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 bg-gray-50"
            />

            <input
              type="text"
              name="department"
              value={form.department}
              onChange={handleChange}
              placeholder="Department (IT / HR / Finance)"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 bg-gray-50"
            />

            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 bg-gray-50"
              required
            />

            {/* BUTTON */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 hover:scale-[1.02] transition-all"
            >
              Create Account
            </button>
          </form>

          {/* LOGIN LINK */}
          <button
            onClick={() => navigate("/login")}
            className="w-full mt-6 border border-gray-300 py-3 rounded-xl hover:bg-gray-50"
          >
            Already have account? Login
          </button>

          {/* FOOTER */}
          <p className="text-xs text-center mt-6 text-gray-500">
            © 2026 Mazzraty - IT Ticketing System
          </p>
        </div>
      </div>
    </div>
  );
}