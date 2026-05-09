import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function AdminEmployeeMaster() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    staffCode: "",
    name: "",
    dateOfJoining: "",
    division: "",
    department: "",
    designation: "",
    placeOfWork: "",
    visaNo: "",
    visaExpiryDate: "",
  });

  // =========================
  // LOAD EMPLOYEES
  // =========================
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

  // =========================
  // UPDATE EMPLOYEE
  // =========================
  const updateEmployee = async () => {
    try {
      await api.put(
        `/employees/${editing.staffCode}`,
        form
      );

      toast.success("Employee updated");
      setEditing(null);
      loadEmployees();

    } catch {
      toast.error("Update failed");
    }
  };

  // =========================
  // SEARCH FILTER
  // =========================
  const filtered = employees.filter((emp) => {
    const s = search.toLowerCase();

    return (
      emp.staffCode?.toLowerCase().includes(s) ||
      emp.name?.toLowerCase().includes(s) ||
      emp.department?.toLowerCase().includes(s) ||
      emp.designation?.toLowerCase().includes(s) ||
      emp.visaNo?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="p-6 bg-[#f4f6f9] min-h-screen">

      {/* HEADER */}
      <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
        <h1 className="text-xl font-bold text-gray-800">
          Employee Master (HR)
        </h1>
      </div>

      {/* SEARCH */}
      <div className="bg-white border rounded-lg p-4 mb-4 flex gap-3">
        <input
          className="w-full md:w-1/3 border px-3 py-2 rounded"
          placeholder="Search staff, department, visa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="text-xs text-gray-500">
          Total Employees: <b>{employees.length}</b>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-lg overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-gray-100">
              <tr>
                <th className="p-3">Staff Code</th>
                <th className="p-3">Name</th>
                <th className="p-3">Department</th>
                <th className="p-3">Designation</th>
                <th className="p-3">Visa No</th>
                <th className="p-3">Visa Expiry</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length > 0 ? (
                filtered.map((emp) => (
                  <tr key={emp._id} className="border-t">

                    <td className="p-3 font-semibold text-blue-600">
                      {emp.staffCode}
                    </td>

                    <td className="p-3">{emp.name}</td>
                    <td className="p-3">{emp.department}</td>
                    <td className="p-3">{emp.designation}</td>
                    <td className="p-3">{emp.visaNo}</td>

                    <td className="p-3">
                      {emp.visaExpiryDate
                        ? new Date(emp.visaExpiryDate).toLocaleDateString()
                        : "—"}
                    </td>

                    <td className="p-3">
                      <button
                        onClick={() => {
                          setEditing(emp);

                          setForm({
                            staffCode: emp.staffCode || "",
                            name: emp.name || "",
                            dateOfJoining: emp.dateOfJoining || "",
                            division: emp.division || "",
                            department: emp.department || "",
                            designation: emp.designation || "",
                            placeOfWork: emp.placeOfWork || "",
                            visaNo: emp.visaNo || "",
                            visaExpiryDate: emp.visaExpiryDate || "",
                          });
                        }}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-xs"
                      >
                        Edit
                      </button>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center p-6 text-gray-400">
                    No employees found
                  </td>
                </tr>
              )}
            </tbody>

          </table>

        </div>
      </div>

      {/* EDIT MODAL */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">

          <div className="bg-white w-full max-w-lg rounded-xl p-5 space-y-3">

            <h2 className="font-bold text-lg">Edit Employee</h2>

            {Object.keys(form).map((key) => (
              <input
                key={key}
                className="w-full border px-3 py-2 rounded"
                placeholder={key}
                value={form[key] || ""}
                onChange={(e) =>
                  setForm({ ...form, [key]: e.target.value })
                }
              />
            ))}

            <div className="flex justify-end gap-2">

              <button
                onClick={() => setEditing(null)}
                className="px-3 py-2 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={updateEmployee}
                className="px-3 py-2 bg-blue-600 text-white rounded"
              >
                Save
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}