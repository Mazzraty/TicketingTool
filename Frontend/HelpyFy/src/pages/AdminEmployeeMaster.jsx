import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import {
  Search,
  Plus,
  Edit2,
  X,
  ChevronLeft,
  ChevronRight,
  Upload,
  ArrowLeft,
  Users,
  Building2,
  Calendar,
} from "lucide-react";

export default function AdminEmployeeMaster() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [companies, setCompanies] = useState([]);

  const [newEmployee, setNewEmployee] = useState({
    staffCode: "",
    name: "",
    department: "",
    designation: "",
    visaNo: "",
    visaExpiryDate: "",
    companyId: "",
  });

  // ================= USER INFO =================
  const user = JSON.parse(localStorage.getItem("user"));

  const isSuperAdmin = user?.role === "super_admin";

  // ================= LOAD EMPLOYEES & COMPANIES =================
  const loadEmployees = async () => {
    try {
      const res = await api.get("/employees");
      setEmployees(res.data);
    } catch {
      toast.error("Failed to load employees");
    }
  };

  const loadCompanies = async () => {
    try {
      const res = await api.get("/companies");
      setCompanies(res.data.companies || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadEmployees();
    if (isSuperAdmin) {
      loadCompanies();
    }
  }, []);

  // ================= ADD EMPLOYEE =================
  const addEmployee = async () => {
    try {
      if (!newEmployee.staffCode || !newEmployee.name) {
        return toast.error("Staff Code & Name required");
      }

      if (isSuperAdmin && !newEmployee.companyId) {
        return toast.error("Please select a company");
      }

      await api.post("/employees", newEmployee);

      toast.success("Employee Added Successfully");

      setNewEmployee({
        staffCode: "",
        name: "",
        department: "",
        designation: "",
        visaNo: "",
        visaExpiryDate: "",
        companyId: "",
      });

      setShowAddForm(false);
      loadEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add employee");
    }
  };

  // ================= EDIT SAVE =================
  const saveEdit = async (id) => {
    try {
      await api.put(`/employees/${id}`, editForm);
      toast.success("Employee Updated");
      setEditId(null);
      loadEmployees();
    } catch {
      toast.error("Update failed");
    }
  };

  // ================= COMPANY FILTER + SEARCH =================
  // NOTE: Company-level access control is enforced by the backend
  // (via companyCheck / tenant scoping inside getEmployees), NOT re-derived
  // here from potentially stale localStorage data. The previous version of
  // this filter silently hid employees for non-super_admin roles (like
  // it_support) whenever their cached companyId/companyAccess didn't
  // include the employee's company — even though the backend had already
  // correctly returned them. If the backend returned it, we show it.
  const filteredEmployees = employees.filter(
    (e) =>
      e.staffCode?.toLowerCase().includes(search.toLowerCase()) ||
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.department?.toLowerCase().includes(search.toLowerCase())
  );

  // ================= PAGINATION =================
  const totalPages = Math.ceil(filteredEmployees.length / pageSize);

  const paginated = filteredEmployees.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // ================= STATUS BADGE =================
  const VisaBadge = ({ expiryDate }) => {
    if (!expiryDate) return <span className="text-gray-400 text-sm">—</span>;

    const daysLeft = Math.floor((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
          <span className="w-2 h-2 bg-red-600 rounded-full"></span>
          Expired
        </span>
      );
    }
    if (daysLeft < 30) {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
          <span className="w-2 h-2 bg-amber-600 rounded-full"></span>
          Expiring Soon
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
        <span className="w-2 h-2 bg-green-600 rounded-full"></span>
        Active
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* HEADER */}
      <div className="border-b border-gray-100 bg-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Employee Master</h1>
              <p className="text-sm text-gray-500 mt-1">Manage and organize your workforce</p>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* SEARCH & ACTIONS */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              placeholder="Search by staff code, name, or department..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          <button
            onClick={() => (window.location.href = "/admin/assets/upload-excel")}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
          >
            <Upload size={18} />
            Upload Bulk
          </button>

          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
          >
            <Plus size={18} />
            Add Employee
          </button>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Total Employees</p>
                <h3 className="text-3xl font-bold text-gray-900">{employees.length}</h3>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users size={20} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Departments</p>
                <h3 className="text-3xl font-bold text-gray-900">
                  {new Set(employees.map((e) => e.department)).size}
                </h3>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Building2 size={20} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Staff Code
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Designation
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Visa Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      No employees found
                    </td>
                  </tr>
                ) : (
                  paginated.map((emp) => (
                    <tr key={emp._id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {emp.company?.name || emp.companyName || emp.company || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-semibold">
                        {emp.staffCode}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {emp.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {emp.department}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {emp.designation}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <VisaBadge expiryDate={emp.visaExpiryDate} />
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => {
                            setEditId(emp._id);
                            setEditForm(emp);
                          }}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-medium transition"
                        >
                          <Edit2 size={14} />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
            <div className="text-sm text-gray-600">
              Page <span className="font-semibold">{page}</span> of{" "}
              <span className="font-semibold">{totalPages || 1}</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="p-2 text-gray-600 hover:bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                title="First page"
              >
                ⏮
              </button>

              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="p-2 text-gray-600 hover:bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={18} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    (p >= page - 2 && p <= page + 2)
                )
                .map((p, i, arr) => (
                  <div key={p} className="flex items-center gap-1">
                    {i > 0 && arr[i - 1] !== p - 1 && (
                      <span className="text-gray-400 px-2">...</span>
                    )}

                    <button
                      onClick={() => setPage(p)}
                      className={`px-3 py-2 rounded-lg font-medium transition ${
                        page === p
                          ? "bg-blue-600 text-white"
                          : "text-gray-600 hover:bg-white"
                      }`}
                    >
                      {p}
                    </button>
                  </div>
                ))}

              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="p-2 text-gray-600 hover:bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={18} />
              </button>

              <button
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
                className="p-2 text-gray-600 hover:bg-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                title="Last page"
              >
                ⏭
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ADD EMPLOYEE MODAL */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Plus size={20} className="text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Add New Employee</h2>
              </div>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* MODAL CONTENT */}
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-5">
                {/* COMPANY SELECTOR FOR SUPER ADMIN */}
                {isSuperAdmin && (
                  <div className="md:col-span-2 flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-2">Company *</label>
                    <select
                      value={newEmployee.companyId}
                      onChange={(e) =>
                        setNewEmployee({ ...newEmployee, companyId: e.target.value })
                      }
                      className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white cursor-pointer"
                    >
                      <option value="">Select a company</option>
                      {companies.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex flex-col">
                  <label className="text-sm font-semibold text-gray-700 mb-2">Staff Code *</label>
                  <input
                    className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Enter staff code"
                    value={newEmployee.staffCode}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, staffCode: e.target.value })
                    }
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-semibold text-gray-700 mb-2">Name *</label>
                  <input
                    className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Enter full name"
                    value={newEmployee.name}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, name: e.target.value })
                    }
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-semibold text-gray-700 mb-2">Department</label>
                  <input
                    className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Enter department"
                    value={newEmployee.department}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, department: e.target.value })
                    }
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-semibold text-gray-700 mb-2">Designation</label>
                  <input
                    className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Enter designation"
                    value={newEmployee.designation}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, designation: e.target.value })
                    }
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-semibold text-gray-700 mb-2">Visa No</label>
                  <input
                    className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="Enter visa number"
                    value={newEmployee.visaNo}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, visaNo: e.target.value })
                    }
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-semibold text-gray-700 mb-2">Visa Expiry Date</label>
                  <input
                    type="date"
                    className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    value={newEmployee.visaExpiryDate}
                    onChange={(e) =>
                      setNewEmployee({
                        ...newEmployee,
                        visaExpiryDate: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 sticky bottom-0">
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={addEmployee}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
              >
                Save Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Edit2 size={20} className="text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Edit Employee</h2>
              </div>
              <button
                onClick={() => setEditId(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* MODAL CONTENT */}
            <div className="p-6 space-y-4">
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-2">Staff Code</label>
                <input
                  className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  value={editForm.staffCode || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, staffCode: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-2">Name</label>
                <input
                  className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  value={editForm.name || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-2">Department</label>
                <input
                  className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  value={editForm.department || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, department: e.target.value })
                  }
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-2">Designation</label>
                <input
                  className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  value={editForm.designation || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, designation: e.target.value })
                  }
                />
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setEditId(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => saveEdit(editId)}
                className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}