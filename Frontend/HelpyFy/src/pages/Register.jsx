import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../auth/AuthContext.jsx";
import { motion } from "framer-motion";

import milkImage from "../assets/milk.png";

/**
 * FONTS — add once to index.html <head> (same as Login.jsx):
 * <link rel="preconnect" href="https://fonts.googleapis.com">
 * <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
 * <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
 */

const ADMIN_ROLES = ["company_admin", "super_admin", "it_support"];

function FloatingInput({ id, label, type = "text", name, value, onChange, autoComplete, trailing }) {
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        name={name}
        autoComplete={autoComplete}
        className="peer w-full border border-[#dde3dc] rounded-xl px-4 pt-5 pb-2 text-sm text-[#14251c] bg-white outline-none transition-colors focus:border-[#2f5c42] focus:ring-2 focus:ring-[#2f5c42]/10"
        placeholder=" "
        value={value}
        onChange={onChange}
      />
      <label
        htmlFor={id}
        className="absolute left-4 top-2 text-[11px] text-[#8a978f] transition-all
          peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-[#9aa79e]
          peer-focus:top-2 peer-focus:text-[11px] peer-focus:text-[#2f5c42]"
      >
        {label}
      </label>
      {trailing}
    </div>
  );
}

export default function Register() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    staffCode: "",
    position: "Employee",
    department: "General",
    companyId: "",
    role: "user",
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = ADMIN_ROLES.includes(user?.role);
  const isValidEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const passwordsMatch = confirmPassword.length === 0 || form.password === confirmPassword;

  useEffect(() => {
    if (user && !isAdmin) {
      navigate("/login");
      return;
    }
    loadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin, navigate]);

  const loadCompanies = async () => {
    setCompaniesLoading(true);
    try {
      const res = await api.get("/companies");
      setCompanies(res.data.companies || []);
    } catch (err) {
      toast.error("Failed to load companies");
    } finally {
      setCompaniesLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password || !form.companyId) {
      return toast.error("Please fill all required fields");
    }
    if (!isValidEmail(form.email)) {
      return toast.error("Enter a valid email");
    }
    if (form.password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }
    if (form.password !== confirmPassword) {
      return toast.error("Passwords do not match");
    }

    setSubmitting(true);
    try {
      await api.post("/auth/register", form);
      toast.success("Account created successfully");
      setTimeout(() => navigate("/login"), 500);
    } catch (err) {
      toast.error(
        err.response?.data?.msg ||
        err.response?.data?.message ||
        "Registration failed"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#faf8f4] font-['Inter',sans-serif]">
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
      <div className="hidden lg:flex lg:w-[42%] relative overflow-hidden bg-gradient-to-b from-[#0f2419] via-[#163828] to-[#1f4a35]">
        <img
          src={milkImage}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover opacity-[0.10] mix-blend-luminosity"
        />

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
            <h1 className="font-['Fraunces',serif] text-[2.5rem] leading-[1.15] font-medium text-[#f4f1ea]">
              Bring your team onto one platform.
            </h1>
            <p className="mt-5 text-[#c9d8cd] text-[15px] leading-relaxed">
              New accounts are linked to a company and role, so everyone
              sees exactly what their job needs — nothing more.
            </p>

            <ul className="mt-8 space-y-3">
              {[
                "Assigned by company, role, and department",
                "Access adjusts automatically to permissions",
                "Set up once, ready to sign in immediately",
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
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-2xl"
        >
          <div className="flex lg:hidden justify-center mb-8">
            <img
              src="https://www.mazzraty.com/_next/image?url=%2Fimages%2FMazzraty_Logo.png&w=3840&q=75"
              alt="Mazzraty"
              className="h-10"
            />
          </div>

          <p className="text-xs tracking-[0.2em] uppercase text-[#4a7c59] font-semibold mb-2">
            New Account
          </p>
          <h2 className="font-['Fraunces',serif] text-3xl font-medium text-[#14251c]">
            Create your account
          </h2>
          <p className="text-[#6b7a70] text-sm mt-2 mb-9">
            Register a new enterprise user.
          </p>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4" noValidate>
            <FloatingInput
              id="name"
              name="name"
              label="Full name"
              value={form.name}
              onChange={handleChange}
              autoComplete="name"
            />

            <FloatingInput
              id="staffCode"
              name="staffCode"
              label="Staff code"
              value={form.staffCode}
              onChange={handleChange}
            />

            {/* Company select */}
            <div className="relative">
              <select
                id="companyId"
                name="companyId"
                value={form.companyId}
                onChange={handleChange}
                disabled={companiesLoading}
                className="peer w-full border border-[#dde3dc] rounded-xl px-4 pt-5 pb-2 text-sm text-[#14251c] bg-white outline-none transition-colors focus:border-[#2f5c42] focus:ring-2 focus:ring-[#2f5c42]/10 disabled:opacity-60 appearance-none"
              >
                <option value="">
                  {companiesLoading
                    ? "Loading companies…"
                    : companies.length === 0
                    ? "No companies available"
                    : "Select company"}
                </option>
                {companies.map((company) => (
                  <option key={company._id} value={company._id}>
                    {company.name}
                  </option>
                ))}
              </select>
              <label
                htmlFor="companyId"
                className="absolute left-4 top-2 text-[11px] text-[#8a978f]"
              >
                Company
              </label>
              <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-[#8a978f] pointer-events-none">
                <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>

            <FloatingInput
              id="email"
              name="email"
              type="email"
              label="Email address"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />

            <FloatingInput
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              label="Password"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-medium text-[#6b7a70] hover:text-[#2f5c42]"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              }
            />

            <div>
              <FloatingInput
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                label="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              {!passwordsMatch && (
                <p className="text-xs text-red-500 mt-1.5 ml-1">Passwords do not match</p>
              )}
            </div>

            <div className="md:col-span-2 mt-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={submitting}
                className="w-full bg-[#1f4a35] hover:bg-[#173a29] transition-colors text-white py-3.5 rounded-xl font-semibold text-sm shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <motion.span
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                  >
                    Creating account…
                  </motion.span>
                ) : (
                  "Create account"
                )}
              </motion.button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-[#6b7a70]">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-[#2f5c42] font-semibold hover:underline"
            >
              Sign in
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
