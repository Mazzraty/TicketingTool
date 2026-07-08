import { useState, useEffect } from "react";
import api from "../api/axios.js";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../auth/AuthContext.jsx";
import { motion, AnimatePresence } from "framer-motion";

import milkImage from "../assets/milk.png";

/**
 * FONTS
 * Add these once to your index.html <head>, or import in your global CSS:
 *
 * <link rel="preconnect" href="https://fonts.googleapis.com">
 * <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
 * <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
 *
 * Fraunces = display face (headline, "Welcome back")
 * Inter    = body/UI face (labels, inputs, buttons)
 */

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
      const res = await api.post("/auth/login", { email, password });

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
      navigate(isAdminRole ? "/admin" : "/");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Login failed");
      triggerShake();
    } finally {
      setLoginLoading(false);
    }
  };

  // SEND OTP
  const sendOtp = async () => {
    if (!resetEmail) return toast.error("Enter your email");
    if (!isValidEmail(resetEmail)) return toast.error("Enter a valid email");

    setOtpLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: resetEmail });
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
    if (!otp || !newPassword) return toast.error("OTP and new password are required");
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");

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
    <div className="min-h-screen w-full flex bg-[#faf8f4] font-['Inter',sans-serif]">
      {/* reduced-motion guard for the ambient hill drift */}
      <style>{`
        @keyframes hillDrift {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-60px); }
        }
        .hill-layer { animation: hillDrift 22s ease-in-out infinite alternate; }
        @media (prefers-reduced-motion: reduce) {
          .hill-layer { animation: none; }
        }
      `}</style>

      {/* ============ LEFT — BRAND PANEL ============ */}
      <div className="hidden lg:flex lg:w-[46%] relative overflow-hidden bg-gradient-to-b from-[#0f2419] via-[#163828] to-[#1f4a35]">

        {/* faint texture from existing brand photo */}
        <img
          src={milkImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-[0.10] mix-blend-luminosity"
        />

        {/* content */}
        <div className="relative z-10 flex flex-col justify-between w-full px-12 py-12 text-[#f4f1ea]">

          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <img
              src="https://www.mazzraty.com/_next/image?url=%2Fimages%2FMazzraty_Logo.png&w=3840&q=75"
              alt="Mazzraty"
              className="h-9 w-9 rounded-full ring-1 ring-white/20"
            />
            <span className="text-sm tracking-[0.2em] uppercase text-[#d4a94c] font-medium">
              Mazzraty
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="max-w-md"
          >
            <p className="text-xs tracking-[0.25em] uppercase text-[#8fb89c] mb-4">
              Enterprise Platform
            </p>
            <h1 className="font-['Fraunces',serif] text-[2.75rem] leading-[1.1] font-medium text-[#f4f1ea]">
              Run the whole farm from one dashboard.
            </h1>
            <p className="mt-5 text-[#c9d8cd] text-[15px] leading-relaxed">
              Track yield, coordinate teams, and keep every field, batch,
              and shipment connected in real time.
            </p>

            <ul className="mt-8 space-y-3">
              {[
                "Live production and inventory tracking",
                "Role-based access across every site",
                "One ledger for the whole operation",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-[#dbe7de]">
                  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 mt-0.5 shrink-0 text-[#d4a94c]">
                    <path d="M4 10.5L8 14.5L16 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xs text-[#7fa189]"
          >
            © {new Date().getFullYear()} Mazzraty. All rights reserved.
          </motion.p>
        </div>

        {/* signature — layered hill silhouette, ties to the brand's existing motif */}
        <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none">
          <svg viewBox="0 0 600 160" preserveAspectRatio="none" className="w-full h-full hill-layer" style={{ opacity: 0.5 }}>
            <path d="M0 100 Q 100 60 220 90 T 460 80 T 600 100 V160 H0 Z" fill="#d4a94c" opacity="0.25" />
          </svg>
          <svg viewBox="0 0 600 160" preserveAspectRatio="none" className="w-full h-full -mt-24" style={{ opacity: 0.6 }}>
            <path d="M0 120 Q 130 80 260 110 T 600 110 V160 H0 Z" fill="#4a7c59" opacity="0.35" />
          </svg>
        </div>
      </div>

      {/* ============ RIGHT — FORM PANEL ============ */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, x: shake ? [0, -8, 8, -8, 8, 0] : 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          {/* mobile-only logo, since brand panel is hidden below lg */}
          <div className="flex lg:hidden justify-center mb-8">
            <img
              src="https://www.mazzraty.com/_next/image?url=%2Fimages%2FMazzraty_Logo.png&w=3840&q=75"
              alt="Mazzraty"
              className="h-10"
            />
          </div>

          <p className="text-xs tracking-[0.2em] uppercase text-[#4a7c59] font-semibold mb-2">
            Enterprise Access
          </p>
          <h2 className="font-['Fraunces',serif] text-3xl font-medium text-[#14251c]">
            Welcome back
          </h2>
          <p className="text-[#6b7a70] text-sm mt-2 mb-9">
            Sign in to continue to your dashboard.
          </p>

          <form onSubmit={handleLogin} className="space-y-5" noValidate>
            {/* EMAIL — floating label */}
            <div className="relative">
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="peer w-full border border-[#dde3dc] rounded-xl px-4 pt-5 pb-2 text-sm text-[#14251c] bg-white outline-none transition-colors focus:border-[#2f5c42] focus:ring-2 focus:ring-[#2f5c42]/10"
                placeholder=" "
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label
                htmlFor="email"
                className="absolute left-4 top-2 text-[11px] text-[#8a978f] transition-all
                  peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-[#9aa79e]
                  peer-focus:top-2 peer-focus:text-[11px] peer-focus:text-[#2f5c42]"
              >
                Email address
              </label>
            </div>

            {/* PASSWORD — floating label */}
            <div className="relative">
              <input
                id="password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                className="peer w-full border border-[#dde3dc] rounded-xl px-4 pt-5 pb-2 pr-14 text-sm text-[#14251c] bg-white outline-none transition-colors focus:border-[#2f5c42] focus:ring-2 focus:ring-[#2f5c42]/10"
                placeholder=" "
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label
                htmlFor="password"
                className="absolute left-4 top-2 text-[11px] text-[#8a978f] transition-all
                  peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-[#9aa79e]
                  peer-focus:top-2 peer-focus:text-[11px] peer-focus:text-[#2f5c42]"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[#6b7a70] hover:text-[#2f5c42]"
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </div>

            <div className="flex justify-end -mt-1">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="text-xs text-[#2f5c42] hover:text-[#1f4a35] font-medium hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loginLoading}
              className="w-full bg-[#1f4a35] hover:bg-[#173a29] transition-colors text-white py-3.5 rounded-xl font-semibold text-sm shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loginLoading ? (
                <motion.span
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  Signing in…
                </motion.span>
              ) : (
                "Sign in"
              )}
            </motion.button>
          </form>

          <p className="mt-8 text-center text-sm text-[#6b7a70]">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="text-[#2f5c42] font-semibold hover:underline"
            >
              Create one
            </button>
          </p>
        </motion.div>
      </div>

      {/* ============ FORGOT PASSWORD — CENTERED DIALOG ============ */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f2419]/50 backdrop-blur-sm px-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-7"
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
                    <p className="text-xs tracking-[0.2em] uppercase text-[#4a7c59] font-semibold mb-1">
                      Reset access
                    </p>
                    <h2 className="font-['Fraunces',serif] text-xl font-medium text-[#14251c] mb-5">
                      Forgot your password?
                    </h2>

                    <label htmlFor="resetEmail" className="text-xs font-medium text-[#6b7a70] mb-1.5 block">
                      Email address
                    </label>
                    <input
                      id="resetEmail"
                      autoFocus
                      className="w-full border border-[#dde3dc] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2f5c42] focus:ring-2 focus:ring-[#2f5c42]/10 mb-4"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="you@company.com"
                    />

                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={sendOtp}
                      disabled={otpLoading || cooldown > 0}
                      className="w-full bg-[#1f4a35] hover:bg-[#173a29] text-white text-sm py-3 rounded-xl font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {otpLoading ? "Sending…" : cooldown > 0 ? `Resend in ${cooldown}s` : "Send code"}
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
                    <p className="text-xs tracking-[0.2em] uppercase text-[#4a7c59] font-semibold mb-1">
                      Reset access
                    </p>
                    <h2 className="font-['Fraunces',serif] text-xl font-medium text-[#14251c] mb-5">
                      Enter your new password
                    </h2>

                    <label htmlFor="otp" className="text-xs font-medium text-[#6b7a70] mb-1.5 block">
                      Verification code
                    </label>
                    <input
                      id="otp"
                      autoFocus
                      className="w-full border border-[#dde3dc] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2f5c42] focus:ring-2 focus:ring-[#2f5c42]/10 mb-3"
                      placeholder="6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />

                    <label htmlFor="newPassword" className="text-xs font-medium text-[#6b7a70] mb-1.5 block">
                      New password
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      className="w-full border border-[#dde3dc] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#2f5c42] focus:ring-2 focus:ring-[#2f5c42]/10 mb-4"
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />

                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={resetPassword}
                      disabled={resetLoading}
                      className="w-full bg-[#1f4a35] hover:bg-[#173a29] text-white text-sm py-3 rounded-xl font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {resetLoading ? "Resetting…" : "Reset password"}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={closeModal}
                className="mt-4 text-xs text-[#9aa79e] hover:text-[#6b7a70] w-full text-center"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
