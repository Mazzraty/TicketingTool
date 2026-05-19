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
    visaExpiryDate: "",
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
        visaExpiryDate: "",
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

    data = data.filter(
      (e) =>
        e.staffCode
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        e.name
          ?.toLowerCase()
          .includes(search.toLowerCase()) ||
        e.department
          ?.toLowerCase()
          .includes(search.toLowerCase())
    );

    if (departmentFilter !== "all") {
      data = data.filter(
        (e) => e.department === departmentFilter
      );
    }

    data.sort((a, b) => {
      const valA = (a[sortKey] || "").toString();

      const valB = (b[sortKey] || "").toString();

      return sortOrder === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });

    return data;
  }, [
    employees,
    search,
    sortKey,
    sortOrder,
    departmentFilter,
  ]);

  const totalPages = Math.ceil(
    processed.length / pageSize
  );

  const paginated = processed.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(processed);

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      ws,
      "Employees"
    );

    XLSX.writeFile(
      wb,
      "EmployeeMaster.xlsx"
    );
  };

  const departments = [
    "all",
    ...new Set(
      employees
        .map((e) => e.department)
        .filter(Boolean)
    ),
  ];

  return (
    <div className="p-6 bg-[#f4f6f9] min-h-screen">

      {/* HEADER */}
      <div className="bg-white border rounded-xl p-4 mb-4 shadow-sm">

        <h1 className="text-xl font-bold">
          Employee Master
        </h1>

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
              setDepartmentFilter(
                e.target.value
              );
              setPage(1);
            }}
          >
            {departments.map((d) => (
              <option key={d}>
                {d}
              </option>
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

        <h2 className="font-bold mb-3">
          ➕ Add Employee
        </h2>

        <div className="grid md:grid-cols-6 gap-3">

          <input
            className="border p-2 rounded"
            placeholder="Staff Code"
            value={newEmployee.staffCode}
            onChange={(e) =>
              setNewEmployee({
                ...newEmployee,
                staffCode: e.target.value,
              })
            }
          />

          <input
            className="border p-2 rounded"
            placeholder="Name"
            value={newEmployee.name}
            onChange={(e) =>
              setNewEmployee({
                ...newEmployee,
                name: e.target.value,
              })
            }
          />

          <input
            className="border p-2 rounded"
            placeholder="Department"
            value={newEmployee.department}
            onChange={(e) =>
              setNewEmployee({
                ...newEmployee,
                department: e.target.value,
              })
            }
          />

          <input
            className="border p-2 rounded"
            placeholder="Designation"
            value={newEmployee.designation}
            onChange={(e) =>
              setNewEmployee({
                ...newEmployee,
                designation: e.target.value,
              })
            }
          />

          <input
            className="border p-2 rounded"
            placeholder="Visa No"
            value={newEmployee.visaNo}
            onChange={(e) =>
              setNewEmployee({
                ...newEmployee,
                visaNo: e.target.value,
              })
            }
          />

          <input
            type="date"
            className="border p-2 rounded"
            value={
              newEmployee.visaExpiryDate
            }
            onChange={(e) =>
              setNewEmployee({
                ...newEmployee,
                visaExpiryDate:
                  e.target.value,
              })
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

              <th className="p-2 text-left">
                Staff Code
              </th>

              <th className="p-2 text-left">
                Employee Name
              </th>

              <th className="p-2 text-left">
                Dept
              </th>

              <th className="p-2 text-left">
                Designation
              </th>

              <th className="p-2 text-left">
                Visa
              </th>

              <th className="p-2 text-left">
                Visa Expiry
              </th>

              <th className="p-2 text-left">
                Status
              </th>

              <th className="p-2 text-left">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {paginated.map((emp) => (

              <tr
                key={emp._id}
                className="border-t"
              >

                <td className="p-2">
                  {emp.staffCode}
                </td>

                <td className="p-2">
                  {emp.name}
                </td>

                <td className="p-2">
                  {emp.department}
                </td>

                <td className="p-2">
                  {emp.designation}
                </td>

                <td className="p-2">
                  {emp.visaNo}
                </td>

                <td className="p-2">
                  {emp.visaExpiryDate
                    ? new Date(
                        emp.visaExpiryDate
                      ).toLocaleDateString()
                    : "-"}
                </td>

                <td
                  className={`p-2 ${statusColor(
                    getVisaStatus(
                      emp.visaExpiryDate
                    )
                  )}`}
                >
                  {getVisaStatus(
                    emp.visaExpiryDate
                  )}
                </td>

                <td className="p-2">

                  <button
                    onClick={() => {
                      setEditId(emp._id);

                      setEditForm(emp);
                    }}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-xs"
                  >
                    Edit
                  </button>

                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

      {/* PAGINATION */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4">

        <div className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </div>

        <div className="flex items-center gap-2">

          <button
            disabled={page === 1}
            onClick={() =>
              setPage(page - 1)
            }
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>

          <button
            disabled={
              page === totalPages
            }
            onClick={() =>
              setPage(page + 1)
            }
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>

          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(
                Number(e.target.value)
              );

              setPage(1);
            }}
            className="border px-2 py-1 rounded"
          >
            <option value={10}>
              10
            </option>

            <option value={20}>
              20
            </option>

            <option value={50}>
              50
            </option>

            <option value={100}>
              100
            </option>

          </select>

          <input
            type="number"
            placeholder="Go"
            value={jumpPage}
            onChange={(e) =>
              setJumpPage(
                e.target.value
              )
            }
            className="border px-2 py-1 rounded w-16"
          />

          <button
            onClick={() => {
              const p =
                Number(jumpPage);

              if (
                p >= 1 &&
                p <= totalPages
              ) {
                setPage(p);
              }
            }}
            className="bg-blue-600 text-white px-3 py-1 rounded"
          >
            Go
          </button>

        </div>

      </div>

      {/* EDIT MODAL */}
      {editId && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white w-full max-w-3xl rounded-2xl p-6 shadow-2xl">

            <div className="flex justify-between items-center mb-5">

              <h2 className="text-xl font-bold">
                Edit Employee
              </h2>

              <button
                onClick={() =>
                  setEditId(null)
                }
                className="text-gray-500 text-xl"
              >
                ✕
              </button>

            </div>

            <div className="grid md:grid-cols-2 gap-4">

              <input
                className="border p-3 rounded-xl"
                placeholder="Staff Code"
                value={
                  editForm.staffCode ||
                  ""
                }
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    staffCode:
                      e.target.value,
                  })
                }
              />

              <input
                className="border p-3 rounded-xl"
                placeholder="Name"
                value={
                  editForm.name || ""
                }
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    name:
                      e.target.value,
                  })
                }
              />

              <input
                className="border p-3 rounded-xl"
                placeholder="Department"
                value={
                  editForm.department ||
                  ""
                }
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    department:
                      e.target.value,
                  })
                }
              />

              <input
                className="border p-3 rounded-xl"
                placeholder="Designation"
                value={
                  editForm.designation ||
                  ""
                }
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    designation:
                      e.target.value,
                  })
                }
              />

              <input
                className="border p-3 rounded-xl"
                placeholder="Visa No"
                value={
                  editForm.visaNo ||
                  ""
                }
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    visaNo:
                      e.target.value,
                  })
                }
              />

              <input
                type="date"
                className="border p-3 rounded-xl"
                value={
                  editForm.visaExpiryDate
                    ? editForm.visaExpiryDate.split(
                        "T"
                      )[0]
                    : ""
                }
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    visaExpiryDate:
                      e.target.value,
                  })
                }
              />

            </div>

            <div className="flex gap-3 mt-6">

              <button
                onClick={() =>
                  saveEdit(editId)
                }
                className="flex-1 bg-green-600 text-white py-3 rounded-xl"
              >
                Save Changes
              </button>

              <button
                onClick={() =>
                  setEditId(null)
                }
                className="flex-1 bg-gray-200 py-3 rounded-xl"
              >
                Cancel
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}