import { useState } from "react";
import api from "../api/axios.js";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import jwtDecode from "jwt-decode";
import { useAuth } from "../auth/AuthContext.jsx";

import milkImage from "../assets/milk2.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      // 🔐 store ONLY token
      const token = res.data.token;
      const decoded = jwtDecode(token);
      const role = decoded?.role || "user";
      login(token, decoded);

      toast.success("Login successful");

      // 🚀 role-based redirect
      if (role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }

    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef5e8] flex items-center justify-center p-4">

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-6">

        {/* ================= LEFT SIDE ================= */}
        <div className="relative rounded-[32px] overflow-hidden shadow-2xl hidden lg:block">

          <img
            src={milkImage}
            alt="Milk Farm"
            className="absolute inset-0 w-full h-full object-cover scale-105"
          />

          <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/30 to-green-900/70"></div>

          <div className="relative z-10 p-10 h-full flex flex-col justify-between text-white">

            {/* LOGO */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-2xl w-fit">
              <img
                src="https://www.mazzraty.com/_next/image?url=%2Fimages%2FMazzraty_Logo.png&w=3840&q=75"
                className="h-10"
                alt="logo"
              />
            </div>

            {/* TEXT */}
            <div className="space-y-5">

              <p className="text-green-200 tracking-[6px] text-sm">
                ENTERPRISE PLATFORM
              </p>

              <h1 className="text-5xl font-bold leading-tight">
                Smart IT Helpdesk
                <br />
                System
              </h1>

              <p className="text-white/80 text-lg">
                Manage tickets, employees, assets and IT operations
                in a single unified enterprise system.
              </p>

              {/* STATS */}
              <div className="grid grid-cols-3 gap-4 mt-6">

                <div className="bg-white/10 border border-white/10 backdrop-blur-lg p-4 rounded-xl text-center">
                  <h3 className="text-xl font-bold">24/7</h3>
                  <p className="text-xs text-white/70">Support</p>
                </div>

                <div className="bg-white/10 border border-white/10 backdrop-blur-lg p-4 rounded-xl text-center">
                  <h3 className="text-xl font-bold">Secure</h3>
                  <p className="text-xs text-white/70">Login</p>
                </div>

                <div className="bg-white/10 border border-white/10 backdrop-blur-lg p-4 rounded-xl text-center">
                  <h3 className="text-xl font-bold">Fast</h3>
                  <p className="text-xs text-white/70">System</p>
                </div>

              </div>
            </div>

            <div className="text-xs text-white/60 border-t border-white/10 pt-5">
              © 2026 Mazzraty Enterprise System
            </div>

          </div>
        </div>

        {/* ================= RIGHT SIDE ================= */}
        <div className="flex items-center justify-center">

          <div className="w-full max-w-md bg-white rounded-[28px] shadow-2xl border border-green-100 p-8">

            {/* HEADER */}
            <div className="text-center mb-8">

              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-xs font-semibold mb-4">
                🔐 Secure Login
              </div>

              <h2 className="text-3xl font-bold text-gray-900">
                Welcome Back
              </h2>

              <p className="text-gray-500 text-sm mt-2">
                Sign in to your enterprise dashboard
              </p>
            </div>

            {/* FORM */}
            <form onSubmit={handleLogin} className="space-y-5">

              <div className="bg-gray-50 p-4 rounded-2xl border">
                <label className="text-xs text-gray-500">Email</label>
                <input
                  type="email"
                  className="w-full bg-transparent outline-none mt-1 text-sm"
                  placeholder="name@mazzraty.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border">
                <label className="text-xs text-gray-500">Password</label>
                <input
                  type="password"
                  className="w-full bg-transparent outline-none mt-1 text-sm"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-3 rounded-2xl font-semibold shadow-lg hover:scale-[1.02] transition disabled:opacity-60"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            {/* FOOTER */}
            <div className="mt-5 space-y-3">

              <button
                onClick={() => navigate("/register")}
                className="w-full border border-gray-200 py-3 rounded-2xl hover:bg-gray-50 transition"
              >
                Create New Account
              </button>

              <p className="text-center text-xs text-gray-400">
                Secure enterprise authentication system
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}