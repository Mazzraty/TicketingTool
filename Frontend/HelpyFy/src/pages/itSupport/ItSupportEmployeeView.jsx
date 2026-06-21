import { useEffect, useState } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../../auth/AuthContext";

export default function ITSupportEmployeeView() {
  const { user } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const pageSize = 10;

  useEffect(() => {
    console.log("IT Support User:", user);
  }, [user]);

  const loadEmployees = async () => {
    try {
      const res = await api.get("/employees");

      // Backend already filters according to JWT
      setEmployees(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load employees");
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const filteredEmployees = employees.filter(
    (e) =>
      e.staffCode?.toLowerCase().includes(search.toLowerCase()) ||
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.department?.toLowerCase().includes(search.toLowerCase()) ||
      e.designation?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredEmployees.length / pageSize);

  const paginatedEmployees = filteredEmployees.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* Header */}
      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <h1 className="text-2xl font-bold">
          IT Support Employee Access
        </h1>

        <p className="text-gray-500 text-sm mt-1">
          View employees from assigned companies only
        </p>

        <input
          type="text"
          placeholder="Search employee..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="mt-4 border rounded-lg px-3 py-2 w-full md:w-80"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">

            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-3">Staff Code</th>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Department</th>
                <th className="text-left p-3">Designation</th>
                <th className="text-left p-3">Visa No</th>
                <th className="text-left p-3">Visa Expiry</th>
                <th className="text-left p-3">Status</th>
              </tr>
            </thead>

            <tbody>
              {paginatedEmployees.length > 0 ? (
                paginatedEmployees.map((emp) => (
                  <tr
                    key={emp._id}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="p-3">{emp.staffCode}</td>
                    <td className="p-3">{emp.name}</td>
                    <td className="p-3">{emp.department || "-"}</td>
                    <td className="p-3">{emp.designation || "-"}</td>
                    <td className="p-3">{emp.visaNo || "-"}</td>
                    <td className="p-3">
                      {emp.visaExpiryDate
                        ? new Date(
                            emp.visaExpiryDate
                          ).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          emp.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {emp.status || "active"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center p-6 text-gray-500"
                  >
                    No employees found
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="bg-white rounded-xl shadow p-3 mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Page <b>{page}</b> of <b>{totalPages || 1}</b>
        </div>

        <div className="flex gap-2">

          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            className="border px-3 py-1 rounded disabled:opacity-40"
          >
            ⏮
          </button>

          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="border px-3 py-1 rounded disabled:opacity-40"
          >
            ◀
          </button>

          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages || totalPages === 0}
            className="border px-3 py-1 rounded disabled:opacity-40"
          >
            ▶
          </button>

          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages || totalPages === 0}
            className="border px-3 py-1 rounded disabled:opacity-40"
          >
            ⏭
          </button>

        </div>
      </div>

    </div>
  );
}