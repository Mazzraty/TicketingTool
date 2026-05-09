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

  // ✅ ADVANCED PAGINATION STATES
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [jumpPage, setJumpPage] = useState("");

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

  // ================= SAVE =================
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

  // ================= VISA STATUS =================
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

  // ================= FILTER + SORT =================
  const processed = useMemo(() => {
    let data = [...employees];

    // search
    data = data.filter((e) =>
      e.staffCode?.toLowerCase().includes(search.toLowerCase()) ||
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.department?.toLowerCase().includes(search.toLowerCase()) ||
      e.visaNo?.toLowerCase().includes(search.toLowerCase())
    );

    // department filter
    if (departmentFilter !== "all") {
      data = data.filter((e) => e.department === departmentFilter);
    }

    // sort
    data.sort((a, b) => {
      const valA = (a[sortKey] || "").toString();
      const valB = (b[sortKey] || "").toString();

      return sortOrder === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    });

    return data;
  }, [employees, search, sortKey, sortOrder, departmentFilter]);

  // ================= PAGINATION =================
  const totalPages = Math.ceil(processed.length / pageSize);

  const paginated = processed.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // ================= EXPORT =================
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(processed);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, "EmployeeMaster.xlsx");
  };

  // ================= DEPARTMENTS =================
  const departments = [
    "all",
    ...new Set(employees.map((e) => e.department).filter(Boolean)),
  ];

  return (
    <div className="p-6 bg-[#f4f6f9] min-h-screen">

      {/* ================= HEADER ================= */}
      <div className="bg-white border rounded-xl p-4 flex justify-between items-center mb-4 shadow-sm">

        <div>
          <h1 className="text-xl font-bold text-gray-800">
            Employee Master
          </h1>
          <p className="text-xs text-gray-500">
            SAP Fiori Pro Edition
          </p>
        </div>

        <div className="flex gap-2 items-center">

          <input
            className="border px-3 py-2 rounded w-64"
            placeholder="Search employees..."
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
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <button
            onClick={exportExcel}
            className="bg-green-600 text-white px-3 py-2 rounded text-sm"
          >
            Export
          </button>

        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white border rounded-xl overflow-x-auto shadow-sm">

        <table className="w-full text-sm table-fixed">

          {/* HEADER */}
          <thead className="bg-gray-100 text-xs uppercase text-gray-600">
            <tr>
              {["staffCode", "name", "department", "designation", "visaNo"].map((key) => (
                <th
                  key={key}
                  className="p-3 cursor-pointer text-left"
                  onClick={() => {
                    setSortKey(key);
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  }}
                >
                  {key}
                </th>
              ))}

              <th className="p-3 w-32 text-left">Status</th>
              <th className="p-3 w-28 text-left">Action</th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody>
            {paginated.map((emp) => {
              const isEditing = editId === emp._id;
              const status = getVisaStatus(emp.visaExpiryDate);

              return (
                <tr key={emp._id} className="border-t hover:bg-gray-50">

                  <td className="p-3 text-blue-600 font-semibold truncate">
                    {emp.staffCode}
                  </td>

                  <td className="p-3 truncate">
                    {isEditing ? (
                      <input
                        className="border px-2 py-1 rounded w-full"
                        value={editForm.name || ""}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                      />
                    ) : (
                      emp.name
                    )}
                  </td>

                  <td className="p-3 truncate">{emp.department}</td>
                  <td className="p-3 truncate">{emp.designation}</td>
                  <td className="p-3 truncate">{emp.visaNo}</td>

                  <td className={`p-3 font-semibold ${statusColor(status)}`}>
                    {status}
                  </td>

                  <td className="p-3 whitespace-nowrap">

                    {!isEditing ? (
                      <button
                        onClick={() => {
                          setEditId(emp._id);
                          setEditForm(emp);
                        }}
                        className="text-blue-600 text-xs font-semibold"
                      >
                        Edit
                      </button>
                    ) : (
                      <div className="flex gap-3">

                        <button
                          onClick={() => saveEdit(emp._id)}
                          className="text-green-600 text-xs font-semibold"
                        >
                          Save
                        </button>

                        <button
                          onClick={() => setEditId(null)}
                          className="text-gray-500 text-xs"
                        >
                          Cancel
                        </button>

                      </div>
                    )}

                  </td>

                </tr>
              );
            })}
          </tbody>

        </table>

        {paginated.length === 0 && (
          <div className="p-6 text-center text-gray-400">
            No records found
          </div>
        )}

      </div>

      {/* ================= ADVANCED SAP PAGINATION ================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-5 bg-white border rounded-xl px-4 py-3 shadow-sm">

        {/* INFO */}
        <div className="text-xs text-gray-500">
          Showing <b>{(page - 1) * pageSize + 1}</b> to{" "}
          <b>{Math.min(page * pageSize, processed.length)}</b> of{" "}
          <b>{processed.length}</b>
        </div>

        {/* PAGINATION */}
        <div className="flex items-center gap-2 flex-wrap justify-center">

          <button
            disabled={page === 1}
            onClick={() => setPage(1)}
            className="px-2 py-1 border rounded text-xs disabled:opacity-40"
          >
            ⏮
          </button>

          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 border rounded text-xs disabled:opacity-40"
          >
            Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))
            .map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1 border rounded text-xs ${
                  page === p ? "bg-blue-600 text-white" : ""
                }`}
              >
                {p}
              </button>
            ))}

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 border rounded text-xs disabled:opacity-40"
          >
            Next
          </button>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(totalPages)}
            className="px-2 py-1 border rounded text-xs disabled:opacity-40"
          >
            ⏭
          </button>

        </div>

        {/* CONTROLS */}
        <div className="flex items-center gap-2">

          <select
            className="border px-2 py-1 rounded text-xs"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>

          <input
            type="number"
            className="border px-2 py-1 rounded text-xs w-16"
            placeholder="Go"
            value={jumpPage}
            onChange={(e) => setJumpPage(e.target.value)}
          />

          <button
            className="px-2 py-1 border rounded text-xs"
            onClick={() => {
              const p = Number(jumpPage);
              if (p >= 1 && p <= totalPages) setPage(p);
            }}
          >
            Go
          </button>

        </div>

      </div>

    </div>
  );
}