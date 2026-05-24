import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function AdminEmployeeMaster() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");

  // pagination
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // edit
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [newEmployee, setNewEmployee] = useState({
    staffCode: "",
    name: "",
    department: "",
    designation: "",
    visaNo: "",
    visaExpiryDate: "",
  });

  // LOAD EMPLOYEES
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

  // ADD EMPLOYEE
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
      toast.error(err.response?.data?.message || "Failed to add employee");
    }
  };

  // EDIT SAVE
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

  // FILTER
  const filteredEmployees = employees.filter(
    (e) =>
      e.staffCode?.toLowerCase().includes(search.toLowerCase()) ||
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.department?.toLowerCase().includes(search.toLowerCase())
  );

  // PAGINATION LOGIC
  const totalPages = Math.ceil(filteredEmployees.length / pageSize);

  const paginated = filteredEmployees.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* HEADER */}
      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <h1 className="text-xl font-bold">Employee Master</h1>

        <input
          className="border p-2 mt-3 w-64 rounded"
          placeholder="Search employee..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* ADD EMPLOYEE */}
      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <h2 className="font-bold mb-3">➕ Add Employee</h2>

        <div className="grid md:grid-cols-3 gap-3">

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

          <input
            type="date"
            className="border p-2 rounded"
            value={newEmployee.visaExpiryDate}
            onChange={(e) =>
              setNewEmployee({
                ...newEmployee,
                visaExpiryDate: e.target.value,
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
      <div className="bg-white p-4 rounded-xl shadow overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Staff Code</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Department</th>
              <th className="p-2 text-left">Designation</th>
              <th className="p-2 text-left">Visa No</th>
              <th className="p-2 text-left">Visa Expiry</th>
              <th className="p-2 text-left">Action</th>
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
                <td className="p-2">
                  {emp.visaExpiryDate
                    ? new Date(emp.visaExpiryDate).toLocaleDateString()
                    : "-"}
                </td>

                <td className="p-2">
                  <button
                    onClick={() => {
                      setEditId(emp._id);
                      setEditForm(emp);
                    }}
                    className="bg-blue-600 text-white px-2 py-1 rounded text-xs"
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
      <div className="flex items-center justify-between mt-4">

        <div>
          Page {page} of {totalPages || 1}
        </div>

        <div className="flex gap-2">

          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>

        </div>

      </div>

      {/* EDIT MODAL */}
      {editId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

          <div className="bg-white p-6 rounded-xl w-[500px]">

            <h2 className="font-bold mb-3">Edit Employee</h2>

            <input
              className="border p-2 w-full mb-2"
              value={editForm.staffCode || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, staffCode: e.target.value })
              }
              placeholder="Staff Code"
            />

            <input
              className="border p-2 w-full mb-2"
              value={editForm.name || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
              placeholder="Name"
            />

            <input
              className="border p-2 w-full mb-2"
              value={editForm.department || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, department: e.target.value })
              }
              placeholder="Department"
            />

            <input
              className="border p-2 w-full mb-2"
              value={editForm.designation || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, designation: e.target.value })
              }
              placeholder="Designation"
            />

            <div className="flex gap-2 mt-3">

              <button
                onClick={() => saveEdit(editId)}
                className="bg-green-600 text-white px-3 py-1 rounded flex-1"
              >
                Save
              </button>

              <button
                onClick={() => setEditId(null)}
                className="bg-gray-300 px-3 py-1 rounded flex-1"
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