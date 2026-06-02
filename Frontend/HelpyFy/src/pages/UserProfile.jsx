import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editOpen, setEditOpen] = useState(false);
  const [passOpen, setPassOpen] = useState(false);

  const [name, setName] = useState("");

  const [password, setPassword] = useState({
    oldPassword: "",
    newPassword: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.get("/auth/me");

      const u = res.data?.user || null;
      const emp = res.data?.employee || null;

      setUser(u);
      setEmployee(emp);

      setName(u?.name || "");
    } catch (err) {
      console.error(err);
      toast.error("Failed to load profile");
      setUser(null);
      setEmployee(null);
    } finally {
      setLoading(false);
    }
  };

  /* ================= UPDATE NAME ================= */
  const updateName = async () => {
    try {
      const res = await api.put("/auth/update-profile", {
        name,
      });

      setUser(res.data.user);
      toast.success("Name updated successfully");
      setEditOpen(false);
    } catch (err) {
      toast.error("Update failed");
    }
  };

  /* ================= CHANGE PASSWORD ================= */
  const changePassword = async () => {
    try {
      await api.put("/auth/change-password", password);

      toast.success("Password updated");

      setPassOpen(false);
      setPassword({
        oldPassword: "",
        newPassword: "",
      });
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Password update failed"
      );
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="p-6 text-red-500">
        User not found or session expired
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* ================= HEADER ================= */}
      <div className="bg-white shadow rounded-2xl p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Employee Profile
          </h1>
          <p className="text-gray-500 text-sm">
            ERP User Management System
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setEditOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Edit Name
          </button>

          <button
            onClick={() => setPassOpen(true)}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg"
          >
            Change Password
          </button>
        </div>
      </div>

      {/* ================= GRID ================= */}
      <div className="grid grid-cols-2 gap-6 mt-6">

        <Card label="Name" value={user?.name} />
        <Card label="Email" value={user?.email} />
        <Card label="Employee ID" value={user?.employeeId} />

        <Card label="Department" value={employee?.department} />
        <Card label="Position" value={employee?.designation} />
        <Card label="Division" value={employee?.division} />

        <div className="bg-white p-5 rounded-xl shadow col-span-2">
          <p className="text-gray-500 text-sm">Role</p>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            {user?.role}
          </span>
        </div>

      </div>

      {/* ================= EDIT NAME MODAL ================= */}
      {editOpen && (
        <Modal title="Edit Name" onClose={() => setEditOpen(false)}>
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <button
            onClick={updateName}
            className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg"
          >
            Save
          </button>
        </Modal>
      )}

      {/* ================= PASSWORD MODAL ================= */}
      {passOpen && (
        <Modal title="Change Password" onClose={() => setPassOpen(false)}>
          
          <Input
            type="password"
            label="Old Password"
            value={password.oldPassword}
            onChange={(e) =>
              setPassword({
                ...password,
                oldPassword: e.target.value,
              })
            }
          />

          <Input
            type="password"
            label="New Password"
            value={password.newPassword}
            onChange={(e) =>
              setPassword({
                ...password,
                newPassword: e.target.value,
              })
            }
          />

          <button
            onClick={changePassword}
            className="w-full mt-4 bg-green-600 text-white py-2 rounded-lg"
          >
            Update Password
          </button>

        </Modal>
      )}
    </div>
  );
}

/* ================= CARD ================= */
function Card({ label, value }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow">
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="font-semibold text-gray-800">
        {value || "-"}
      </p>
    </div>
  );
}

/* ================= MODAL ================= */
function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white w-[420px] p-6 rounded-xl shadow-lg">

        <div className="flex justify-between mb-4">
          <h2 className="text-lg font-bold">{title}</h2>

          <button
            onClick={onClose}
            className="text-gray-500"
          >
            ✕
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

/* ================= INPUT ================= */
function Input({ label, ...props }) {
  return (
    <div className="mb-3">
      <p className="text-sm text-gray-500 mb-1">
        {label}
      </p>

      <input
        {...props}
        className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-400"
      />
    </div>
  );
}