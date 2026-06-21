import { useEffect, useState } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";

export default function ITSupportUsers() {
  const [users, setUsers] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      const me = await api.get("/auth/me");

      const access = me.data.companyAccess?.find(
        (c) => c.role === "it_support" && c.isActive
      );

      if (!access) {
        toast.error("No company assigned");
        return;
      }

      setCompany(access);

      const res = await api.get(
        `/users/company/${access.companyId}`
      );

      setUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-bold mb-2">
          IT Support Dashboard
        </h1>

        <p className="text-gray-600 mb-6">
          Company: {company?.companyName}
        </p>

        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Name</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Staff Code</th>
              <th className="border p-2">Department</th>
              <th className="border p-2">Position</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td className="border p-2">{user.name}</td>
                <td className="border p-2">{user.email}</td>
                <td className="border p-2">{user.staffCode}</td>
                <td className="border p-2">
                  {user.department || "-"}
                </td>
                <td className="border p-2">
                  {user.position || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}