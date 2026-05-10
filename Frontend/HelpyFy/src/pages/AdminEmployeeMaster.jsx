import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

export default function AdminEmployeeMaster() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [sortKey, setSortKey] = useState("staffCode");
  const [sortOrder, setSortOrder] = useState("asc");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [jumpPage, setJumpPage] = useState("");

  const [newEmployee, setNewEmployee] = useState({
    staffCode: "",
    name: "",
    department: "",
    designation: "",
    visaNo: "",
  });

  const loadEmployees = async () => {
    try {
      const res = await api.get("/employees");
      setEmployees(res.data);
    } catch {
      toast.error("Failed to load employees");
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const saveEdit = async (id) => {
    try {
      await api.put(`/employees/${id}`, editForm);
      toast.success("Updated successfully");
      setEditId(null);
      loadEmployees();
    } catch {
      toast.error("Update failed");
    }
  };

  const addEmployee = async () => {
    try {
      if (!newEmployee.staffCode || !newEmployee.name) {
        return toast.error("Staff Code & Name required");
      }

      await api.post("/employees", newEmployee);

      toast.success("Employee Added");

      setNewEmployee({
        staffCode: "",
        name: "",
        department: "",
        designation: "",
        visaNo: "",
      });

      loadEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add");
    }
  };

  const getVisaStatus = (date) => {
    if (!date) return "NA";

    const d = new Date(date);
    const today = new Date();
    const diff = (d - today) / (1000 * 60 * 60 * 24);

    if (diff < 0) return "EXPIRED";
    if (diff < 30) return "EXPIRING";
    return "ACTIVE";
  };

  const statusColor = (status) => {
    if (status === "EXPIRED") return "text-red-600";
    if (status === "EXPIRING") return "text-orange-500";
    return "text-green-600";
  };

  const processed = useMemo(() => {
    let data = [...employees];

    data = data.filter((e) =>
      e.staffCode?.toLowerCase().includes(search.toLowerCase()) ||
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.department?.toLowerCase().includes(search.toLowerCase())
    );

    if (departmentFilter !== "all") {
      data = data.filter((e) => e.department === departmentFilter);
    }

    data.sort((a, b) => {
      const valA = (a[sortKey] || "").toString();
      const valB = (b[sortKey] || "").toString();

      return sortOrder === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });

    return data;
  }, [employees, search, sortKey, sortOrder, departmentFilter]);

  const totalPages = Math.ceil(processed.length / pageSize);

  const paginated = processed.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(processed);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, "EmployeeMaster.xlsx");
  };

  const departments = [
    "all",
    ...new Set(employees.map((e) => e.department).filter(Boolean)),
  ];

  return (
    <div className="p-6 bg-[#f4f6f9] min-h-screen">

      {/* HEADER */}
      <div className="bg-white border rounded-xl p-4 mb-4 shadow-sm">
        <h1 className="text-xl font-bold">Employee Master</h1>

        <div className="flex flex-wrap gap-3 mt-3 items-center">

          <input
            className="border px-3 py-2 rounded w-64"
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

          <select
            className="border px-2 py-2 rounded"
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setPage(1);
            }}
          >
            {departments.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>

          <button
            onClick={exportExcel}
            className="bg-green-600 text-white px-3 py-2 rounded"
          >
            Export
          </button>

        </div>
      </div>

      {/* ADD EMPLOYEE */}
      <div className="bg-white border rounded-xl p-4 mb-4 shadow-sm">
        <h2 className="font-bold mb-3">➕ Add Employee</h2>

        <div className="grid md:grid-cols-5 gap-3">

          <input
            className="border p-2 rounded"
            placeholder="Staff Code"
            value={newEmployee.staffCode}
            onChange={(e) =>
              setNewEmployee({ ...newEmployee, staffCode: e.target.value })
            }
          />

          <input
            className="border p-2 rounded"
            placeholder="Name"
            value={newEmployee.name}
            onChange={(e) =>
              setNewEmployee({ ...newEmployee, name: e.target.value })
            }
          />

          <input
            className="border p-2 rounded"
            placeholder="Department"
            value={newEmployee.department}
            onChange={(e) =>
              setNewEmployee({ ...newEmployee, department: e.target.value })
            }
          />

          <input
            className="border p-2 rounded"
            placeholder="Designation"
            value={newEmployee.designation}
            onChange={(e) =>
              setNewEmployee({ ...newEmployee, designation: e.target.value })
            }
          />

          <input
            className="border p-2 rounded"
            placeholder="Visa No"
            value={newEmployee.visaNo}
            onChange={(e) =>
              setNewEmployee({ ...newEmployee, visaNo: e.target.value })
            }
          />

        </div>

        <button
          onClick={addEmployee}
          className="mt-3 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Save Employee
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-xl shadow-sm overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Staff</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Dept</th>
              <th className="p-2 text-left">Designation</th>
              <th className="p-2 text-left">Visa</th>
              <th className="p-2 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {paginated.map((emp) => (
              <tr key={emp._id} className="border-t">

                <td className="p-2">{emp.staffCode}</td>
                <td className="p-2">{emp.name}</td>
                <td className="p-2">{emp.department}</td>
                <td className="p-2">{emp.designation}</td>
                <td className="p-2">{emp.visaNo}</td>

                <td className={`p-2 ${statusColor(getVisaStatus(emp.visaExpiryDate))}`}>
                  {getVisaStatus(emp.visaExpiryDate)}
                </td>

              </tr>
            ))}
          </tbody>

        </table>

      </div>

    </div>
  );
}