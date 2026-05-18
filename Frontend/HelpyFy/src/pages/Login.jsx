import { useState } from "react";
import api from "../api/axios.js";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../auth/AuthContext.jsx";

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

  // ================= LOGIN =================
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

  // ================= SEND OTP =================
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

  // ================= RESET PASSWORD =================
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
    <div className="min-h-screen flex items-center justify-center">

      {/* LOGIN BOX */}
      <div className="w-96 p-6 bg-white shadow rounded-xl">

        <form onSubmit={handleLogin}>
          <input
            className="w-full border p-2 mb-2"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            className="w-full border p-2 mb-2"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="w-full bg-green-600 text-white p-2">
            Login
          </button>
        </form>

        <p
          className="text-blue-600 mt-3 cursor-pointer"
          onClick={() => setShowModal(true)}
        >
          Forgot Password?
        </p>
      </div>

      {/* ================= MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">

          <div className="bg-white w-96 p-5 rounded-xl">

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
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}