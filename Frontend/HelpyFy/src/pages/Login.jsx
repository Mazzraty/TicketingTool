import { useState } from "react";
import api from "../api/axios.js";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../auth/AuthContext.jsx";

import milkImage from "../assets/milk2.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);

  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const navigate = useNavigate();
  const { login } = useAuth();

  // LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      login(res.data.token, res.data.user);

      toast.success("Login successful");

      if (res.data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      toast.error(err.response?.data?.msg || "Login failed");
    }
  };

  // SEND OTP
  const sendOtp = async () => {
    try {
      await api.post("/auth/forgot-password", {
        email: resetEmail,
      });

      toast.success("OTP sent to email");
      setStep(2);
    } catch (err) {
      toast.error("Failed to send OTP");
    }
  };

  // RESET PASSWORD
  const resetPassword = async () => {
    try {
      await api.post("/auth/reset-password", {
        email: resetEmail,
        otp,
        password: newPassword,
      });

      toast.success("Password reset successful");

      setShowModal(false);
      setStep(1);
      setResetEmail("");
      setOtp("");
      setNewPassword("");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Reset failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#eef5e8] flex items-center justify-center p-4">

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-6">

        {/* LEFT SIDE (YOUR ORIGINAL DESIGN) */}
        <div className="relative rounded-[32px] overflow-hidden shadow-2xl hidden lg:block">

          <img
            src={milkImage}
            alt="Milk Farm"
            className="absolute inset-0 w-full h-full object-cover scale-105"
          />

          <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/30 to-green-900/70"></div>

          <div className="relative z-10 p-10 h-full flex flex-col justify-between text-white">

            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-2xl w-fit">
              <img
                src="https://www.mazzraty.com/_next/image?url=%2Fimages%2FMazzraty_Logo.png&w=3840&q=75"
                className="h-10"
                alt="logo"
              />
            </div>

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
            </div>

            <div className="text-xs text-white/60 border-t border-white/10 pt-5">
              © 2026 Mazzraty Enterprise System
            </div>

          </div>
        </div>

        {/* RIGHT SIDE (LOGIN BOX SAME AS YOUR OLD UI STYLE) */}
        <div className="flex items-center justify-center">

          <div className="w-full max-w-md bg-white rounded-[28px] shadow-2xl border border-green-100 p-8">

            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">
                Welcome Back
              </h2>
              <p className="text-gray-500 text-sm mt-2">
                Sign in to your enterprise dashboard
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">

              <div className="bg-gray-50 p-4 rounded-2xl border">
                <input
                  type="email"
                  className="w-full bg-transparent outline-none text-sm"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border">
                <input
                  type="password"
                  className="w-full bg-transparent outline-none text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="text-right -mt-3">
                <span
                  onClick={() => setShowModal(true)}
                  className="text-xs text-blue-600 cursor-pointer hover:underline"
                >
                  Forgot Password?
                </span>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-green-600 to-green-500 text-white py-3 rounded-2xl font-semibold shadow-lg"
              >
                Sign In
              </button>

            </form>
          </div>
        </div>

      </div>

      {/* ================= MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">

          <div className="bg-white w-96 p-6 rounded-xl">

            {step === 1 && (
              <>
                <h2 className="font-bold mb-3">Enter Email</h2>

                <input
                  className="w-full border p-2 mb-3"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Email"
                />

                <button
                  onClick={sendOtp}
                  className="w-full bg-blue-600 text-white p-2"
                >
                  Send OTP
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="font-bold mb-3">Reset Password</h2>

                <input
                  className="w-full border p-2 mb-2"
                  placeholder="OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />

                <input
                  type="password"
                  className="w-full border p-2 mb-3"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />

                <button
                  onClick={resetPassword}
                  className="w-full bg-green-600 text-white p-2"
                >
                  Reset Password
                </button>
              </>
            )}

            <button
              className="mt-3 text-sm text-gray-500"
              onClick={() => {
                setShowModal(false);
                setStep(1);
              }}
            >
              Close
            </button>

          </div>
        </div>
      )}

    </div>
  );
}