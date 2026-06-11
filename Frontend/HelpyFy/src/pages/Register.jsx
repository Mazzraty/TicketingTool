import { useEffect, useState } from "react";
import api from "../api/axios.js";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../auth/AuthContext.jsx";

import milkImage from "../assets/milk.png";

export default function Register() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    employeeId: "",
    position: "Employee",
    department: "General",
    companyId: "",
    role: "user",
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [companies, setCompanies] = useState([]);

  // 🔐 only check login (optional)
  useEffect(() => {
    if (!user) return;
  }, [user]);

  // 📦 load companies (FOR EVERYONE)
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await api.get("/companies");
        console.log("Companies:", res.data);
        setCompanies(res.data.companies || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load companies");
      }
    };

    fetchCompanies(); // ✅ ALWAYS RUN
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!form.companyId) {
      toast.error("Please select a company");
      return;
    }

    try {
      await api.post("/auth/register", form);
      toast.success("Account created successfully");
      navigate("/admin");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      
      <div className="w-full max-w-md bg-white p-6 rounded-xl">

        <h1 className="text-xl font-bold mb-4">Create Account</h1>

        {/* NAME */}
        <input
          name="name"
          placeholder="Full Name"
          className="sap-input"
          onChange={handleChange}
        />

        {/* EMPLOYEE ID */}
        <input
          name="employeeId"
          placeholder="Employee ID"
          className="sap-input"
          onChange={handleChange}
        />

        {/* COMPANY DROPDOWN (ALWAYS SHOW) */}
        <select
          name="companyId"
          value={form.companyId}
          onChange={handleChange}
          className="sap-input"
        >
          <option value="">Select Company</option>
          {companies.map((c) => (
            <option key={c._id} value={c._id}>
              {c.name} ({c.code})
            </option>
          ))}
        </select>

        {/* EMAIL */}
        <input
          name="email"
          placeholder="Email"
          className="sap-input"
          onChange={handleChange}
        />

        {/* PASSWORD */}
        <input
          type="password"
          name="password"
          placeholder="Password"
          className="sap-input"
          onChange={handleChange}
        />

        {/* CONFIRM PASSWORD */}
        <input
          type="password"
          placeholder="Confirm Password"
          className="sap-input"
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {/* BUTTON */}
        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white py-2 mt-4 rounded"
        >
          Create Account
        </button>

      </div>

    </div>
  );
}