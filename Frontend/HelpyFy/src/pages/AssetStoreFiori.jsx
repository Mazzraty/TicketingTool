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

  /* ================= PAGINATION ================= */
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ================= LOAD ================= */
  const loadAssets = async () => {
    try {
      const res = await api.get("/assets");

      // ✅ SAFE FIX: ensure array always
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.assets || [];

      setAssets(data);

    } catch (err) {
      console.error(err);
      toast.error("Failed to load assets");
      setAssets([]); // safety fallback
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

  /* ================= PAGINATION LOGIC ================= */
  const totalPages = Math.ceil(filtered.length / pageSize);

  const paginatedFiltered = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter, pageSize]);

  /* ================= KPI ================= */
  const total = assets.length;

  const laptop = assets.filter((a) => a.type === "Laptop").length;
  const printer = assets.filter((a) => a.type === "Printer").length;
  const hht = assets.filter((a) => a.type === "HHT").length;

  const showHHTFields = filter === "HHT";

  const getCurrentUser = (asset) => {
    if (asset.employee?.name) return asset.employee.name;
    if (asset.employee?.employeeName) return asset.employee.employeeName;
    if (asset.assignedTo?.name) return asset.assignedTo.name;
    if (asset.assignedTo?.employeeName) return asset.assignedTo.employeeName;
    if (asset.user?.name) return asset.user.name;
    if (asset.salesmanName) return asset.salesmanName;
    return "Not Assigned";
  };

  const openEdit = (asset) => {
    setSelected(asset);
    setEditOpen(true);
  };

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

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
          <p className="text-gray-500 text-sm">Total Assets</p>
          <h2 className="text-4xl font-bold mt-3 text-gray-800">{total}</h2>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
          <p className="text-gray-500 text-sm">Laptops</p>
          <h2 className="text-4xl font-bold mt-3 text-blue-600">{laptop}</h2>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
          <p className="text-gray-500 text-sm">Printers</p>
          <h2 className="text-4xl font-bold mt-3 text-green-600">{printer}</h2>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
          <p className="text-gray-500 text-sm">HHT Devices</p>
          <h2 className="text-4xl font-bold mt-3 text-purple-600">{hht}</h2>
        </div>
      </div>

      {/* FILTER */}
      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-5 mb-8">

        <div className="flex flex-col lg:flex-row gap-4">

          <input
            className="flex-1 border border-gray-300 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search asset / serial / salesman..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex gap-3 flex-wrap">
            {["All", "Laptop", "Printer", "HHT"].map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-5 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                  filter === t
                    ? "bg-[#0a6ed1] text-white shadow-md"
                    : "bg-white border border-gray-300 hover:bg-gray-100 text-gray-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* PAGE SIZE */}
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="border border-gray-300 rounded-2xl px-4 py-3"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>

        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-[#f7f9fb] border-b">
              <tr className="text-gray-700">
                <th className="text-left px-6 py-4 font-semibold">Asset Code</th>
                <th className="text-left px-6 py-4 font-semibold">Type</th>

                {!showHHTFields && (
                  <>
                    <th className="text-left px-6 py-4 font-semibold">Model</th>
                    <th className="text-left px-6 py-4 font-semibold">Serial</th>
                  </>
                )}

                <th className="text-left px-6 py-4 font-semibold">Current User</th>
                <th className="text-left px-6 py-4 font-semibold">Status</th>
                <th className="text-center px-6 py-4 font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody>

              {paginatedFiltered.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-14 text-gray-400">
                    No assets found
                  </td>
                </tr>
              ) : (
                paginatedFiltered.map((a) => (
                  <tr key={a._id} className="border-b hover:bg-blue-50/40">

                    <td className="px-6 py-4 font-semibold">{a.assetCode}</td>
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

      {/* PAGINATION */}
      <div className="flex justify-between items-center mt-6">

        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
          className="px-4 py-2 bg-gray-200 rounded-xl disabled:opacity-50"
        >
          Prev
        </button>

        <span>
          Page {currentPage} of {totalPages || 1}
        </span>

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => p + 1)}
          className="px-4 py-2 bg-gray-200 rounded-xl disabled:opacity-50"
        >
          Next
        </button>

      </div>

    </div>
  );
}