import { useEffect, useState } from "react";
import Select from "react-select";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function AdminCompanyAccess() {
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedRole, setSelectedRole] = useState("it_support");

  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState(""); // 🔥 logged-in user role

  /* =========================
     LOAD LOGGED USER
  ========================= */
  const loadMe = async () => {
    try {
      const res = await api.get("/auth/me");
      setUserRole(res.data.role);
    } catch (err) {
      console.error(err);
    }
  };

  /* =========================
     LOAD EMPLOYEES
  ========================= */
  const loadEmployees = async () => {
    try {
      const res = await api.get("/superadmin/employees");

      const employeeOptions = res.data.employees.map((emp) => ({
        value: emp.userId,
        label: `${emp.name} (${emp.staffCode})`,
        employee: emp,
      }));

      setEmployees(employeeOptions);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load employees");
    }
  };

  /* =========================
     LOAD COMPANIES
  ========================= */
  const loadCompanies = async () => {
    try {
      const res = await api.get("/companies");
      setCompanies(res.data.companies || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load companies");
    }
  };

  /* =========================
     LOAD USERS BY COMPANY
  ========================= */
  const loadUsers = async (companyId) => {
    if (!companyId) return;

    try {
      const url =
        userRole === "super_admin"
          ? "/users"
          : `/users/company/${companyId}`;

      const res = await api.get(url);

      setUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users");
    }
  };

  useEffect(() => {
    loadMe();
    loadEmployees();
    loadCompanies();
  }, []);

  useEffect(() => {
    if (userRole === "it_support" && selectedCompany) {
      loadUsers(selectedCompany);
    }

    if (userRole === "super_admin") {
      loadUsers(); // all users
    }
  }, [selectedCompany, userRole]);

  /* =========================
     ASSIGN ACCESS
  ========================= */
  const assignAccess = async () => {
    try {
      if (!selectedEmployee) {
        return toast.error("Select Employee");
      }

      if (!selectedCompany) {
        return toast.error("Select Company");
      }

      setLoading(true);

      await api.post(
        `/superadmin/users/${selectedEmployee.value}/assign-company`,
        {
          companyId: selectedCompany,
          role: selectedRole,
        }
      );

      toast.success("Company access assigned");

      setSelectedEmployee(null);
      setSelectedCompany("");
      setSelectedRole("it_support");

      // refresh users
      loadUsers(selectedCompany);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow p-6">

        <h1 className="text-2xl font-bold mb-6">
          Company Access Management
        </h1>

        {/* ================= COMPANY SELECT ================= */}
        <div className="mb-4">
          <label className="block mb-2 font-medium">
            Company
          </label>

          <select
            className="w-full border p-3 rounded-lg"
            value={selectedCompany}
            onChange={(e) =>
              setSelectedCompany(e.target.value)
            }
          >
            <option value="">Select Company</option>

            {companies.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* ================= EMPLOYEE SELECT ================= */}
        <div className="mb-4">
          <label className="block mb-2 font-medium">
            Employee
          </label>

          <Select
            options={employees}
            value={selectedEmployee}
            onChange={setSelectedEmployee}
            placeholder="Search Employee"
          />
        </div>

        {/* ================= ROLE ================= */}
        <div className="mb-4">
          <label className="block mb-2 font-medium">
            Role
          </label>

          <select
            className="w-full border p-3 rounded-lg"
            value={selectedRole}
            onChange={(e) =>
              setSelectedRole(e.target.value)
            }
          >
            <option value="user">User</option>
            <option value="it_support">IT Support</option>
            <option value="company_admin">Company Admin</option>
          </select>
        </div>

        {/* ================= BUTTON ================= */}
        <button
          onClick={assignAccess}
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-lg"
        >
          {loading ? "Assigning..." : "Assign Access"}
        </button>

        {/* ================= USERS TABLE ================= */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">
            Users List
          </h2>

          {users.length === 0 ? (
            <p>No users found</p>
          ) : (
            <table className="w-full border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2">Name</th>
                  <th className="border p-2">Email</th>
                  <th className="border p-2">Staff Code</th>
                  <th className="border p-2">Role</th>
                </tr>
              </thead>

              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td className="border p-2">{u.name}</td>
                    <td className="border p-2">{u.email}</td>
                    <td className="border p-2">
                      {u.staffCode}
                    </td>
                    <td className="border p-2">
                      {u.role}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}