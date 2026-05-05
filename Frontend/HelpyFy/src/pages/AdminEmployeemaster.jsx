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

  // 🔍 SEARCH FILTER
  const filtered = employees.filter((emp) =>
    emp.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
    emp.name?.toLowerCase().includes(search.toLowerCase()) ||
    emp.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">

      <h1 className="text-2xl font-bold mb-4">
        Employee Master
      </h1>

      {/* SEARCH */}
      <input
        className="border p-2 mb-4 w-full md:w-1/3"
        placeholder="Search employee..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* TABLE */}
      <div className="bg-white shadow rounded overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Employee ID</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Position</th>
              <th className="p-3 text-left">Department</th>
              <th className="p-3 text-left">Email</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((emp) => (
              <tr key={emp._id} className="border-t hover:bg-gray-50">

                <td className="p-3 font-medium">
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

                <td className="p-3">
                  {emp.email}
                </td>

              </tr>
            ))}
          </tbody>

        </table>

      </div>
    </div>
  );
}