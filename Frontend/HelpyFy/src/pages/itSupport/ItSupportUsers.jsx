import { useEffect, useState } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";

export default function ITSupportUsers() {
    const [users, setUsers] = useState([]);
    const [company, setCompany] = useState(null);
    const [loading, setLoading] = useState(true);
    const [myId, setMyId] = useState(null);

    // reset password flow
    const [resetTarget, setResetTarget] = useState(null); // user being reset
    const [customPassword, setCustomPassword] = useState("");
    const [resetting, setResetting] = useState(false);
    const [tempPassword, setTempPassword] = useState(null); // result shown once
    const [copied, setCopied] = useState(false);

    const loadUsers = async () => {
        try {
            const me = await api.get("/auth/me");

            setMyId(me.data._id);

            const access = me.data.companyAccess?.find(
                (c) => c.role === "it_support" && c.isActive
            );

            if (!access) {
                toast.error("No company assigned");
                return;
            }

            setCompany(access);

            const companyId = access.companyId?._id || access.companyId;

            const res = await api.get(`/users/company/${companyId}`);

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

    /* ================= RESET PASSWORD ================= */
    const openReset = (user) => {
        setResetTarget(user);
        setCustomPassword("");
    };

    const closeReset = () => {
        if (resetting) return;
        setResetTarget(null);
        setCustomPassword("");
    };

    const closeResult = () => {
        setTempPassword(null);
        setResetTarget(null);
        setCopied(false);
    };

    const confirmReset = async () => {
        if (!resetTarget || resetting) return;

        const pwd = customPassword.trim();
        if (pwd && pwd.length < 8) {
            return toast.error("Password must be at least 8 characters");
        }

        setResetting(true);
        try {
            const res = await api.put(
                `/auth/users/${resetTarget._id}/reset-password`,
                pwd ? { newPassword: pwd } : {}
            );

            setTempPassword(res.data.tempPassword);
            setCopied(false);
            toast.success("Password reset successfully");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to reset password");
            setResetTarget(null);
        } finally {
            setResetting(false);
            setCustomPassword("");
        }
    };

    const copyPassword = async () => {
        try {
            await navigator.clipboard.writeText(tempPassword);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error("Could not copy. Select the password and copy it manually.");
        }
    };

    // IT support can only reset regular users (not themselves, not admins).
    // If the API doesn't return `role`, the button shows and the backend decides.
    const canReset = (user) =>
        String(user._id) !== String(myId) && (!user.role || user.role === "user");

    if (loading) return <div>Loading...</div>;

    return (
        <div className="p-6">
            <div className="bg-white rounded-xl shadow p-6">
                <h1 className="text-2xl font-bold mb-2">IT Support Dashboard</h1>

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
                            <th className="border p-2">Actions</th>
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
                                <td className="border p-2 text-center">
                                    {canReset(user) ? (
                                        <button
                                            onClick={() => openReset(user)}
                                            className="px-3 py-1 text-sm font-medium text-white bg-teal-700 rounded hover:bg-teal-800 transition cursor-pointer"
                                        >
                                            Reset password
                                        </button>
                                    ) : (
                                        <span className="text-gray-400">-</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ================= CONFIRM MODAL ================= */}
            {resetTarget && !tempPassword && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="px-6 py-4 border-b">
                            <h2 className="text-lg font-semibold">Reset password</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {resetTarget.name} ({resetTarget.email})
                            </p>
                        </div>

                        <div className="px-6 py-5 space-y-4">
                            <p className="text-sm text-gray-700">
                                A temporary password will be created and emailed
                                to the user. They will be asked to choose a new
                                password the next time they log in.
                            </p>

                            <div>
                                <label className="block text-sm font-semibold mb-1">
                                    Custom password (optional)
                                </label>
                                <input
                                    type="text"
                                    value={customPassword}
                                    onChange={(e) =>
                                        setCustomPassword(e.target.value)
                                    }
                                    placeholder="Leave empty to generate one"
                                    className="w-full px-3 py-2 text-sm border rounded outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600"
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    At least 8 characters.
                                </p>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl flex justify-end gap-2">
                            <button
                                onClick={closeReset}
                                disabled={resetting}
                                className="px-4 py-2 text-sm text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmReset}
                                disabled={resetting}
                                className="px-4 py-2 text-sm font-medium text-white bg-teal-700 rounded hover:bg-teal-800 disabled:opacity-50 cursor-pointer"
                            >
                                {resetting ? "Resetting..." : "Reset password"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= RESULT MODAL (shown once) ================= */}
            {tempPassword && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="px-6 py-4 border-b">
                            <h2 className="text-lg font-semibold">
                                Password reset
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {resetTarget?.name}
                            </p>
                        </div>

                        <div className="px-6 py-5 space-y-4">
                            <p className="text-sm text-gray-700">
                                Temporary password:
                            </p>

                            <div className="flex items-center gap-2">
                                <code className="flex-1 px-3 py-2 text-sm font-mono bg-gray-100 border rounded break-all select-all">
                                    {tempPassword}
                                </code>
                                <button
                                    onClick={copyPassword}
                                    className="px-3 py-2 text-sm font-medium border rounded hover:bg-gray-100 cursor-pointer"
                                >
                                    {copied ? "Copied" : "Copy"}
                                </button>
                            </div>

                            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                                This is shown only once. Close this window and
                                it cannot be viewed again. The user has also
                                been emailed and must change it on next login.
                            </p>
                        </div>

                        <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl flex justify-end">
                            <button
                                onClick={closeResult}
                                className="px-4 py-2 text-sm font-medium text-white bg-teal-700 rounded hover:bg-teal-800 cursor-pointer"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}