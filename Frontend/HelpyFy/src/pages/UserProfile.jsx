import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.get("/auth/me"); // adjust if route is different
      setUser(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!user) {
    return <div className="p-6 text-red-500">User not found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto bg-white shadow rounded-xl p-6">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <div className="space-y-4">
        <div>
          <p className="text-gray-500">Name</p>
          <p className="font-semibold">{user.name}</p>
        </div>

        <div>
          <p className="text-gray-500">Email</p>
          <p className="font-semibold">{user.email}</p>
        </div>

        <div>
          <p className="text-gray-500">Employee ID</p>
          <p className="font-semibold">{user.employeeId}</p>
        </div>

        <div>
          <p className="text-gray-500">Department</p>
          <p className="font-semibold">{user.department}</p>
        </div>

        <div>
          <p className="text-gray-500">Position</p>
          <p className="font-semibold">{user.position}</p>
        </div>

        <div>
          <p className="text-gray-500">Role</p>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
            {user.role}
          </span>
        </div>
      </div>
    </div>
  );
}