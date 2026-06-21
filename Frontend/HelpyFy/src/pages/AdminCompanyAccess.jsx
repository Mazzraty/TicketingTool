import { useEffect, useState } from "react";
import Select from "react-select";
import api from "../api/axios";
import toast from "react-hot-toast";

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

      loadEmployees();
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

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow p-6">

        <h1 className="text-2xl font-bold mb-6">
          Company Access Management
        </h1>

        {/* EMPLOYEE */}
        <div className="mb-4">
          <label className="block mb-2 font-medium">
            Employee
          </label>

          <Select
            options={employees}
            value={selectedEmployee}
            onChange={setSelectedEmployee}
            placeholder="Search Employee Name / Staff Code"
            isSearchable
          />
        </div>

        {/* COMPANY */}
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
            <option value="">
              Select Company
            </option>

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

        {/* ROLE */}
        <div className="mb-6">
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
            <option value="user">
              User
            </option>

            <option value="company_admin">
              Company Admin
            </option>

            <option value="it_support">
              IT Support
            </option>
          </select>
        </div>

        {/* BUTTON */}
        <button
          onClick={assignAccess}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg disabled:opacity-50"
        >
          {loading
            ? "Assigning..."
            : "Assign Company Access"}
        </button>

        {/* PREVIEW */}
        {selectedEmployee && (
          <div className="mt-6 border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold mb-3">
              Selected Employee
            </h3>

            <p>
              <strong>Name:</strong>{" "}
              {selectedEmployee.employee.name}
            </p>

            <p>
              <strong>Staff Code:</strong>{" "}
              {selectedEmployee.employee.staffCode}
            </p>

            <p>
              <strong>Department:</strong>{" "}
              {selectedEmployee.employee.department || "-"}
            </p>

            <p>
              <strong>Designation:</strong>{" "}
              {selectedEmployee.employee.designation || "-"}
            </p>

            <p>
              <strong>User Linked:</strong>{" "}
              {selectedEmployee.value ? "Yes" : "No"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}