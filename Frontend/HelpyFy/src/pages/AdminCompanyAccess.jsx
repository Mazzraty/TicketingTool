import { useEffect, useState } from "react";
import Select from "react-select";
import api from "../api/axios";
import toast from "react-hot-toast";
import {
  Users,
  Building2,
  Shield,
  CheckCircle,
  XCircle,
  Trash2,
  ChevronRight,
  UserCheck,
} from "lucide-react";

export default function AdminCompanyAccess() {
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedRole, setSelectedRole] = useState("it_support");

  const [loading, setLoading] = useState(false);

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
     INITIAL LOAD
  ========================= */
  useEffect(() => {
    loadEmployees();
    loadCompanies();
  }, []);

  /* =========================
     ASSIGN ACCESS
  ========================= */
  const assignAccess = async () => {
    try {
      if (!selectedEmployee) {
        return toast.error("Select Employee");
      }

      if (!selectedEmployee.value) {
        return toast.error(
          "Selected employee does not have a user account"
        );
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

      toast.success("Company access assigned successfully");

      setSelectedEmployee(null);
      setSelectedCompany("");
      setSelectedRole("it_support");

      await loadEmployees();
    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.message ||
        "Failed to assign access"
      );
    } finally {
      setLoading(false);
    }
  };

  const revokeAccess = async (companyId) => {
    try {
      if (!selectedEmployee?.value) {
        return toast.error("Select Employee");
      }

      await api.post(
        `/superadmin/users/${selectedEmployee.value}/revoke-company`,
        {
          companyId,
        }
      );

      toast.success("Access revoked successfully");

      await loadEmployees();
    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.message ||
        "Failed to revoke access"
      );
    }
  };

  const getRoleLabel = (role) => {
    const roleMap = {
      user: "User",
      company_admin: "Company Admin",
      it_support: "IT Support",
    };
    return roleMap[role] || role;
  };

  const getRoleColor = (role) => {
    const colorMap = {
      user: "bg-blue-50 text-blue-700 border-blue-200",
      company_admin: "bg-purple-50 text-purple-700 border-purple-200",
      it_support: "bg-orange-50 text-orange-700 border-orange-200",
    };
    return colorMap[role] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Company Access Management
            </h1>
          </div>
          <p className="text-gray-600 ml-11">
            Manage employee access to companies and assign roles
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Assignment Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                Assign Company Access
              </h2>

              {/* Employee Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-gray-600" />
                    Select Employee
                  </div>
                </label>
                <Select
                  options={employees}
                  value={selectedEmployee}
                  onChange={setSelectedEmployee}
                  placeholder="Search by name or staff code..."
                  isSearchable
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderColor: "#e5e7eb",
                      borderRadius: "0.5rem",
                      padding: "0.25rem",
                      boxShadow: "none",
                      "&:hover": {
                        borderColor: "#3b82f6",
                      },
                      "&:focus-within": {
                        borderColor: "#3b82f6",
                        boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                      },
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isSelected
                        ? "#3b82f6"
                        : state.isFocused
                          ? "#eff6ff"
                          : "#fff",
                      color: state.isSelected ? "#fff" : "#1f2937",
                    }),
                  }}
                />
              </div>

              {/* Company Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Building2 className="w-4 h-4 text-gray-600" />
                    Select Company
                  </div>
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  value={selectedCompany}
                  onChange={(e) =>
                    setSelectedCompany(e.target.value)
                  }
                >
                  <option value="">Choose a company...</option>

                  {companies.map((company) => (
                    <option
                      key={company._id}
                      value={company._id}
                    >
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role Selection */}
              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-gray-600" />
                    Select Role
                  </div>
                </label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  value={selectedRole}
                  onChange={(e) =>
                    setSelectedRole(e.target.value)
                  }
                >
                  <option value="user">User</option>
                  <option value="company_admin">Company Admin</option>
                  <option value="it_support">IT Support</option>
                </select>
              </div>

              {/* Assign Button */}
              <button
                onClick={assignAccess}
                disabled={loading || !selectedEmployee || !selectedCompany}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-lg transition transform disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                {loading ? "Assigning..." : "Assign Company Access"}
              </button>
            </div>
          </div>

          {/* Summary Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Selection Summary
              </h3>

              <div className="space-y-4">
                {/* Employee Summary */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                    Employee
                  </p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {selectedEmployee?.employee?.name || "Not selected"}
                  </p>
                  {selectedEmployee?.employee?.staffCode && (
                    <p className="text-xs text-gray-600 mt-1">
                      Code: {selectedEmployee.employee.staffCode}
                    </p>
                  )}
                </div>

                {/* Company Summary */}
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">
                    Company
                  </p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {companies.find((c) => c._id === selectedCompany)?.name ||
                      "Not selected"}
                  </p>
                </div>

                {/* Role Summary */}
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">
                    Role
                  </p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {getRoleLabel(selectedRole)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Employee Details Section */}
        {selectedEmployee && (
          <div className="mt-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-600" />
                  Employee Details
                </h3>
              </div>

              <div className="p-6">
                {/* Employee Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Full Name
                    </p>
                    <p className="text-lg font-medium text-gray-900 mt-1">
                      {selectedEmployee.employee.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Staff Code
                    </p>
                    <p className="text-lg font-medium text-gray-900 mt-1">
                      {selectedEmployee.employee.staffCode}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Department
                    </p>
                    <p className="text-lg font-medium text-gray-900 mt-1">
                      {selectedEmployee.employee.department || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Designation
                    </p>
                    <p className="text-lg font-medium text-gray-900 mt-1">
                      {selectedEmployee.employee.designation || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      User Status
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      {selectedEmployee.value ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-green-700">
                            User Account Linked
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-red-600" />
                          <span className="font-medium text-red-700">
                            No User Account
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Company Access Section */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-600" />
                    Company Access
                  </h4>

                  {!selectedEmployee.employee.companyAccess ||
                    selectedEmployee.employee.companyAccess.length === 0 ? (
                    <div className="p-6 text-center bg-gray-50 rounded-lg border border-gray-200">
                      <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-600 font-medium">
                        No company access assigned
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Use the form above to assign company access
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedEmployee.employee.companyAccess.map(
                        (access, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                          >
                            <div className="flex items-start gap-4 flex-1">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Building2 className="w-5 h-5 text-blue-600" />
                              </div>

                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">
                                  {access.companyName}
                                </p>

                                <div className="flex items-center gap-3 mt-2">
                                  <span
                                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(
                                      access.role
                                    )}`}
                                  >
                                    {getRoleLabel(access.role)}
                                  </span>

                                  {access.isActive ? (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                      <CheckCircle className="w-3 h-3" />
                                      Active
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                      <XCircle className="w-3 h-3" />
                                      Revoked
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {access.isActive && (
                              <button
                                onClick={() =>
                                  revokeAccess(access.companyId)
                                }
                                className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition flex items-center gap-2"
                                title="Revoke access"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
