import { useState, useEffect } from "react";
import api from "../api/axios.js";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../auth/AuthContext.jsx";
import { motion, AnimatePresence } from "framer-motion";

import milkImage from "../assets/milk.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);

  const [resetEmail, setResetEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loginLoading, setLoginLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const navigate = useNavigate();
  const { login } = useAuth();

  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (!showModal) return;
    const onKey = (e) => e.key === "Escape" && closeModal();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const closeModal = () => {
    setShowModal(false);
    setStep(1);
    setResetEmail("");
    setOtp("");
    setNewPassword("");
  };

  // LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Email and password are required");
      triggerShake();
      return;
    }
    if (!isValidEmail(email)) {
      toast.error("Enter a valid email");
      triggerShake();
      return;
    }

    setLoginLoading(true);
    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      const meRes = await api.get("/auth/me");
      const serverUser = meRes.data;
      const normalizedUser = {
        ...serverUser,
        companyAccess:
          serverUser?.companyAccess || res.data.user?.companyAccess || [],
      };

      login(normalizedUser);

      toast.success("Login successful");

      const adminRoles = ["company_admin", "super_admin", "it_support"];
      const isAdminRole = adminRoles.includes(normalizedUser.role);

      if (isAdminRole) {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      toast.error(err.response?.data?.msg || "Login failed");
      triggerShake();
    } finally {
      setLoginLoading(false);
    }
  };

  // SEND OTP
  const sendOtp = async () => {
    if (!resetEmail) {
      toast.error("Enter your email");
      return;
    }
    if (!isValidEmail(resetEmail)) {
      toast.error("Enter a valid email");
      return;
    }

    setOtpLoading(true);
    try {
      await api.post("/auth/forgot-password", {
        email: resetEmail,
      });

      toast.success("OTP sent to email");
      setStep(2);
      setCooldown(30);
    } catch (err) {
      toast.error(err.response?.data?.msg || "Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  // RESET PASSWORD
  const resetPassword = async () => {
    if (!otp || !newPassword) {
      toast.error("OTP and new password are required");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setResetLoading(true);
    try {
      await api.post("/auth/reset-password", {
        email: resetEmail,
        otp,
        password: newPassword,
      });

      toast.success("Password reset successful");
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Reset failed");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* BACKGROUND IMAGE */}
      <div className="absolute inset-0 z-0">
        <img
          src={milkImage}
          alt="Milk Background"
          className="w-full h-full object-cover"
        />

        {/* OVERLAY */}
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* MAIN CONTENT */}
      <div className="relative z-10 w-full flex items-center justify-center p-4">

        {/* LOGIN CARD */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{
            opacity: 1,
            y: 0,
            x: shake ? [0, -8, 8, -8, 8, 0] : 0,
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-[28px] shadow-2xl border border-white/30 p-8"
        >

          {/* HEADER */}
          <div className="text-center mb-8">

            <div className="flex justify-center mb-4">
              <motion.img
                src="https://www.mazzraty.com/_next/image?url=%2Fimages%2FMazzraty_Logo.png&w=3840&q=75"
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="h-12"
                alt="logo"
              />
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-3xl font-bold text-gray-900"
            >
              Welcome Back
            </motion.h2>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="text-gray-500 text-sm mt-2"
            >
              Sign in to your enterprise dashboard
            </motion.p>

          </div>

          {/* FORM */}
          <form onSubmit={handleLogin} className="space-y-5">

            {/* EMAIL */}
            <motion.div
              whileFocus={{ scale: 1.01 }}
              className="bg-gray-50 p-4 rounded-2xl border border-gray-200 focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-100 transition-all duration-200"
            >
              <input
                type="email"
                className="w-full bg-transparent outline-none text-sm"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email Address"
              />
            </motion.div>

            {/* PASSWORD */}
            <motion.div
              whileFocus={{ scale: 1.01 }}
              className="bg-gray-50 p-4 rounded-2xl border border-gray-200 flex items-center justify-between focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-100 transition-all duration-200"
            >
              <input
                type={showPw ? "text" : "password"}
                className="w-full bg-transparent outline-none text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-label="Password"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="text-xs text-gray-400 hover:text-gray-600 ml-2 shrink-0"
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </motion.div>

            {/* FORGOT PASSWORD */}
            <div className="text-right -mt-2">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="text-xs text-blue-600 hover:underline"
              >
                Forgot Password?
              </button>
            </div>

            {/* BUTTON */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: loginLoading ? 1 : 1.01 }}
              type="submit"
              disabled={loginLoading}
              className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 transition-all duration-300 text-white py-3 rounded-2xl font-semibold shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loginLoading ? (
                <motion.span
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  Signing in...
                </motion.span>
              ) : (
                "Sign In"
              )}
            </motion.button>

          </form>

          {/* REGISTER */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="text-sm text-green-600 hover:underline"
            >
              Create new account
            </button>
          </div>

        </motion.div>
      </div>

      {/* ================= FORGOT PASSWORD MODAL ================= */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.25 }}
            className="fixed top-6 right-6 z-50 w-80"
          >

            <div
              className="bg-white shadow-2xl border border-gray-200 rounded-2xl p-4"
              onClick={(e) => e.stopPropagation()}
            >

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h2 className="font-semibold text-sm mb-3">
                      Forgot Password
                    </h2>

                    <input
                      autoFocus
                      className="w-full border p-2 text-sm rounded-lg mb-3"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="Enter email"
                    />

                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={sendOtp}
                      disabled={otpLoading || cooldown > 0}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm p-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {otpLoading
                        ? "Sending..."
                        : cooldown > 0
                        ? `Resend in ${cooldown}s`
                        : "Send OTP"}
                    </motion.button>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h2 className="font-semibold text-sm mb-3">
                      Reset Password
                    </h2>

                    <input
                      autoFocus
                      className="w-full border p-2 text-sm rounded-lg mb-2"
                      placeholder="OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />

                    <input
                      type="password"
                      className="w-full border p-2 text-sm rounded-lg mb-3"
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />

                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={resetPassword}
                      disabled={resetLoading}
                      className="w-full bg-green-600 hover:bg-green-700 text-white text-sm p-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {resetLoading ? "Resetting..." : "Reset Password"}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* CLOSE */}
              <button
                className="mt-3 text-xs text-gray-400 w-full text-center hover:text-gray-600"
                onClick={closeModal}
              >
                Close
              </button>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
