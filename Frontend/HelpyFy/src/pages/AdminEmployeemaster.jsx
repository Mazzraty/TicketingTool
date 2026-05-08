import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function AdminEmployeeMaster() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");

  const loadEmployees = async () => {
    try {
      const res = await api.get("/employees");
      setEmployees(res.data);
    } catch (err) {
      toast.error("Failed to load employees");
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  // 🔍 SEARCH FILTER (ERP STYLE MULTI FIELD)
  const filtered = employees.filter((emp) => {
    const s = search.toLowerCase();
    return (
      emp.employeeId?.toLowerCase().includes(s) ||
      emp.name?.toLowerCase().includes(s) ||
      emp.department?.toLowerCase().includes(s) ||
      emp.position?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="p-6 bg-[#f4f6f9] min-h-screen">

      {/* HEADER CARD */}
      <div className="bg-white border rounded-lg p-4 mb-4 shadow-sm">
        <h1 className="text-xl font-bold text-gray-800">
          Employee Master
        </h1>
        <p className="text-xs text-gray-500">
          ERP System → HR & Asset Management Module
        </p>
      </div>

      {/* SEARCH BAR (SAP STYLE) */}
      <div className="bg-white border rounded-lg p-4 mb-4 flex items-center gap-3 shadow-sm">

        <input
          className="w-full md:w-1/3 border px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="🔍 Search by ID, Name, Department, Position..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="text-xs text-gray-500">
          Total Employees: <b>{employees.length}</b>
        </div>

      </div>

      {/* TABLE CARD */}
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            {/* HEADER (STICKY LIKE SAP) */}
            <thead className="bg-[#f1f5f9] text-gray-700 sticky top-0 z-10">
              <tr>
                <th className="p-3 text-left border-b">#</th>
                <th className="p-3 text-left border-b">Employee ID</th>
                <th className="p-3 text-left border-b">Name</th>
                <th className="p-3 text-left border-b">Position</th>
                <th className="p-3 text-left border-b">Department</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length > 0 ? (
                filtered.map((emp, index) => (
                  <tr
                    key={emp._id}
                    className="border-b hover:bg-blue-50 transition"
                  >

                    <td className="p-3 font-semibold text-gray-600">
                      {index + 1}
                    </td>

                    <td className="p-3 font-medium text-blue-700">
                      {emp.employeeId}
                    </td>

                    <td className="p-3">
                      {emp.name}
                    </td>

                    <td className="p-3">
                      {emp.position}
                    </td>

                    <td className="p-3">
                      {emp.department}
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center p-6 text-gray-400"
                  >
                    No employees found
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