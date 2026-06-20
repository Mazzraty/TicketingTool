import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function AdminCompanyAccess() {
    const [users, setUsers] = useState([]);
    const [companies, setCompanies] = useState([]);

    const [selectedUser, setSelectedUser] = useState("");
    const [selectedCompany, setSelectedCompany] = useState("");
    const [selectedRole, setSelectedRole] = useState("it_support");

 const loadUsers = async () => {
  try {
    const res = await api.get("/employees");

    setUsers(res.data || []);
  } catch (err) {
    console.error(err);
    toast.error("Failed to load employees");
  }
};

    const loadCompanies = async () => {
        try {
            const res = await api.get("/companies");
            setCompanies(res.data.companies || []);
        } catch (err) {
            toast.error("Failed to load companies");
        }
    };

    useEffect(() => {
        loadUsers();
        loadCompanies();
    }, []);

    const assignAccess = async () => {
        try {
            if (!selectedUser) {
                return toast.error("Select a user");
            }

            if (!selectedCompany) {
                return toast.error("Select a company");
            }

            await api.post(
                `/super-admin/users/${selectedUser}/assign-company`,
                {
                    companyId: selectedCompany,
                    role: selectedRole,
                }
            );

            toast.success("Company access assigned");

            setSelectedUser("");
            setSelectedCompany("");
            setSelectedRole("it_support");

            loadUsers();
        } catch (err) {
            toast.error(
                err.response?.data?.message ||
                "Failed to assign company access"
            );
        }
    };

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <div className="mb-4">
                <button
                    onClick={() => window.history.back()}
                    className="px-4 py-2 bg-white border rounded-lg shadow"
                >
                    ← Back
                </button>
            </div>

            <div className="bg-white rounded-xl shadow p-6 mb-6">
                <h1 className="text-2xl font-bold mb-4">
                    Company Access Management
                </h1>

                <div className="grid md:grid-cols-3 gap-4">
                    <select
                        className="border p-3 rounded-lg"
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                    >
                        <option value="">Select User</option>

                        {users.map((user) => (
                            <option key={user._id} value={user._id}>
                                {user.name} ({user.email})
                            </option>
                        ))}
                    </select>

                    <select
                        className="border p-3 rounded-lg"
                        value={selectedCompany}
                        onChange={(e) =>
                            setSelectedCompany(e.target.value)
                        }
                    >
                        <option value="">Select Company</option>

                        {companies.map((company) => (
                            <option
                                key={company._id}
                                value={company._id}
                            >
                                {company.name}
                            </option>
                        ))}
                    </select>

                    <select
                        className="border p-3 rounded-lg"
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                    >
                        <option value="user">User</option>
                        <option value="company_admin">
                            Company Admin
                        </option>
                        <option value="it_support">
                            IT Support
                        </option>
                    </select>
                </div>

                <button
                    onClick={assignAccess}
                    className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg"
                >
                    Assign Company Access
                </button>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">
                <div className="p-4 border-b">
                    <h2 className="font-bold text-lg">
                        Users & Company Access
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-3 text-left">Name</th>
                                <th className="p-3 text-left">Email</th>
                                <th className="p-3 text-left">Role</th>
                                <th className="p-3 text-left">
                                    Company Access
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {users.map((user) => (
                                <tr
                                    key={user._id}
                                    className="border-t"
                                >
                                    <td className="p-3">
                                        {user.name}
                                    </td>

                                    <td className="p-3">
                                        {user.email}
                                    </td>

                                    <td className="p-3">
                                        <span className="px-2 py-1 bg-blue-100 rounded text-xs">
                                            {user.role}
                                        </span>
                                    </td>

                                    <td className="p-3">
                                        {user.companyAccess?.length > 0 ? (
                                            <div className="space-y-2">
                                                {user.companyAccess.map(
                                                    (access, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="border rounded p-2 bg-gray-50"
                                                        >
                                                            <div>
                                                                <strong>
                                                                    {access.companyName}
                                                                </strong>
                                                            </div>

                                                            <div className="text-xs text-gray-600">
                                                                Role: {access.role}
                                                            </div>

                                                            <div className="text-xs">
                                                                Status:
                                                                {access.isActive ? (
                                                                    <span className="text-green-600 ml-1">
                                                                        Active
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-500 ml-1">
                                                                        Inactive
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">
                                                No Company Access
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}

                            {users.length === 0 && (
                                <tr>
                                    <td
                                        colSpan="4"
                                        className="p-6 text-center text-gray-500"
                                    >
                                        No users found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}