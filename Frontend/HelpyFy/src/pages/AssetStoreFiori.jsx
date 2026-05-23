import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function AssetStoreFiori() {

  const [assets, setAssets] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  // EDIT
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  // ================= PAGINATION =================
  const [page, setPage] = useState(1);
  const pageSize = 10;

  /* ================= LOAD ================= */
  const loadAssets = async () => {
    try {
      const res = await api.get("/assets");

      // ✅ FIX: ensure always array
      const data = res.data;
      setAssets(
        Array.isArray(data)
          ? data
          : data?.assets || data?.data || []
      );

    } catch (err) {
      console.error(err);
      toast.error("Failed to load assets");
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  /* ================= FILTER ================= */
  const filtered = (Array.isArray(assets) ? assets : []).filter((a) => {

    const type = a.type?.toLowerCase();
    const selectedFilter = filter?.toLowerCase();

    const matchType =
      selectedFilter === "all" || type === selectedFilter;

    const text = search.toLowerCase();

    const matchSearch =
      a.assetCode?.toLowerCase().includes(text) ||
      a.model?.toLowerCase().includes(text) ||
      a.serialNumber?.toLowerCase().includes(text) ||
      a.salesmanName?.toLowerCase().includes(text) ||
      a.salesmanCode?.toLowerCase().includes(text);

    return matchType && matchSearch;
  });

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(filtered.length / pageSize);

  const paginated = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  /* ================= KPI ================= */
  const total = assets.length;

  const laptop = assets.filter((a) => a.type === "Laptop").length;
  const printer = assets.filter((a) => a.type === "Printer").length;
  const hht = assets.filter((a) => a.type === "HHT").length;

  const showHHTFields = filter === "HHT";

  /* ================= CURRENT USER ================= */
  const getCurrentUser = (asset) => {

    if (asset.employee?.name) return asset.employee.name;
    if (asset.employee?.employeeName) return asset.employee.employeeName;
    if (asset.assignedTo?.name) return asset.assignedTo.name;
    if (asset.assignedTo?.employeeName) return asset.assignedTo.employeeName;
    if (asset.user?.name) return asset.user.name;
    if (asset.salesmanName) return asset.salesmanName;

    return "Not Assigned";
  };

  /* ================= EDIT ================= */
  const openEdit = (asset) => {
    setSelected(asset);
    setEditOpen(true);
  };

  /* ================= UPDATE ================= */
  const updateAsset = async () => {
    try {
      await api.put(`/assets/${selected._id}`, selected);
      toast.success("Asset Updated");
      setEditOpen(false);
      loadAssets();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.msg || "Update failed");
    }
  };

  /* ================= DELETE ================= */
  const deleteAsset = async (id) => {
    const confirmDelete = window.confirm("Delete this asset?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/assets/${id}`);
      toast.success("Asset Deleted");
      loadAssets();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.msg || "Delete failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] p-6">

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Asset Details
        </h1>
        <p className="text-gray-500 mt-1">
          Asset Management Dashboard
        </p>
      </div>

      {/* FILTER */}
      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-5 mb-8">

        <div className="flex flex-col lg:flex-row gap-4">

          <input
            className="flex-1 border border-gray-300 rounded-2xl px-5 py-3"
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

          <div className="flex gap-3 flex-wrap">
            {["All", "Laptop", "Printer", "HHT"].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setFilter(t);
                  setPage(1);
                }}
                className={`px-5 py-3 rounded-2xl text-sm font-semibold ${
                  filter === t
                    ? "bg-[#0a6ed1] text-white"
                    : "bg-white border"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3xl border overflow-hidden">

        <div className="overflow-x-auto">
          <table className="w-full text-sm">

            <thead>
              <tr>
                <th className="px-6 py-4 text-left">Asset Code</th>
                <th className="px-6 py-4 text-left">Type</th>
                <th className="px-6 py-4 text-left">Model</th>
                <th className="px-6 py-4 text-left">Serial</th>
                <th className="px-6 py-4 text-left">User</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>

              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10">
                    No assets found
                  </td>
                </tr>
              ) : (
                paginated.map((a) => (
                  <tr key={a._id}>
                    <td className="px-6 py-4">{a.assetCode}</td>
                    <td className="px-6 py-4">{a.type}</td>
                    <td className="px-6 py-4">{a.model || "-"}</td>
                    <td className="px-6 py-4">{a.serialNumber || "-"}</td>
                    <td className="px-6 py-4">{getCurrentUser(a)}</td>
                    <td className="px-6 py-4">{a.status}</td>

                    <td className="px-6 py-4 flex gap-2 justify-center">
                      <button onClick={() => openEdit(a)}>Edit</button>
                      <button onClick={() => deleteAsset(a._id)}>Delete</button>
                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>
        </div>
      </div>

      {/* ================= PAGINATION ================= */}
      <div className="flex justify-center items-center gap-3 mt-6">

        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Prev
        </button>

        <span>
          Page {page} / {totalPages || 1}
        </span>

        <button
          disabled={page === totalPages || totalPages === 0}
          onClick={() => setPage(page + 1)}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Next
        </button>

      </div>

    </div>
  );
}