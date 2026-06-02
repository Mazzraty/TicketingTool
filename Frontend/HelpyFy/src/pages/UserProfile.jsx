import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  const [nameEditOpen, setNameEditOpen] = useState(false);
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

      setUser(res.data.user);
      setEmployee(res.data.employee);

      setName(res.data.user.name);
    } catch (err) {
      toast.error("Failed to load profile");
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
      toast.success("Name updated");
      setNameEditOpen(false);
    } catch (err) {
      toast.error("Update failed");
    }
  };

  /* ================= CHANGE PASSWORD ================= */
  const changePassword = async () => {
    try {
      await api.put("/auth/change-password", password);

      toast.success("Password updated successfully");

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

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* HEADER */}
      <div className="bg-white shadow rounded-2xl p-6 flex justify-between">
        <div>
          <h1 className="text-2xl font-bold">Employee Profile</h1>
          <p className="text-gray-500 text-sm">
           Management System
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setNameEditOpen(true)}
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

      {/* INFO GRID */}
      <div className="grid grid-cols-2 gap-6 mt-6">

        <Card label="Name" value={user.name} />
        <Card label="Email" value={user.email} />
        <Card label="Employee ID" value={user.employeeId} />

        <Card label="Department" value={employee?.department} />
        <Card label="Position" value={employee?.designation} />
        <Card label="Division" value={employee?.division} />

        <div className="bg-white p-5 rounded-xl shadow col-span-2">
          <p className="text-gray-500 text-sm">Role</p>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">
            {user.role}
          </span>
        </div>

      </div>

      {/* ================= NAME MODAL ================= */}
      {nameEditOpen && (
        <Modal title="Edit Name" onClose={() => setNameEditOpen(false)}>
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

/* ================= UI COMPONENTS ================= */

function Card({ label, value }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow">
      <p className="text-gray-500 text-sm">{label}</p>
      <p className="font-semibold">{value || "-"}</p>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white w-[420px] p-6 rounded-xl">
        <div className="flex justify-between mb-4">
          <h2 className="font-bold text-lg">{title}</h2>
          <button onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div className="mb-3">
      <p className="text-sm text-gray-500">{label}</p>
      <input
        {...props}
        className="w-full border p-2 rounded-lg"
      />
    </div>
  );
}