import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function ITSupportEmployeeView() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // ================= USER =================
  const user = JSON.parse(localStorage.getItem("user"));

  const allowedCompanyIds =
    user?.companyAccess
      ?.filter((c) => c.isActive)
      ?.map((c) => c.companyId) || [];

  // ================= LOAD =================
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

  // ================= FILTER (ONLY ACCESS COMPANIES) =================
  const filteredEmployees = employees
    .filter((e) => {
      // 🔐 STRICT IT SUPPORT ACCESS CONTROL
      if (allowedCompanyIds.length > 0) {
        return allowedCompanyIds.includes(e.companyId);
      }
      return false; // if no access → show nothing
    })
    .filter(
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

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* HEADER */}
      <div className="bg-white p-4 rounded-xl shadow mb-4">
        <h1 className="text-xl font-bold">IT Support - Employee Access</h1>

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
              <th className="p-2 text-left">Company</th>
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
                  {emp.companyId?.name || "-"}
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-between mt-4 bg-white p-3 rounded-xl shadow">

        <div className="text-sm text-gray-600">
          Page <b>{page}</b> of <b>{totalPages || 1}</b>
        </div>

        <div className="flex gap-2">

          <button onClick={() => setPage(1)} disabled={page === 1}>
            ⏮
          </button>

          <button onClick={() => setPage(page - 1)} disabled={page === 1}>
            ◀
          </button>

          <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>
            ▶
          </button>

          <button onClick={() => setPage(totalPages)} disabled={page === totalPages}>
            ⏭
          </button>

        </div>

      </div>

    </div>
  );
}