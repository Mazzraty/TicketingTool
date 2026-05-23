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

  // PAGINATION
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ================= LOAD ================= */
  const loadAssets = async () => {
    try {
      const res = await api.get("/assets");

      // ✅ FIX: always force array
      const data =
        Array.isArray(res.data)
          ? res.data
          : res.data?.data || res.data?.assets || [];

      setAssets(data);

    } catch (err) {
      console.error(err);
      toast.error("Failed to load assets");
      setAssets([]); // safety
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  /* ================= FILTER (SAFE) ================= */
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

  const paginatedData = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  /* ================= KPI ================= */
  const total = assets.length;

  const laptop = assets.filter((a) => a.type === "Laptop").length;
  const printer = assets.filter((a) => a.type === "Printer").length;
  const hht = assets.filter((a) => a.type === "HHT").length;

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
    <div className="p-6 bg-[#f5f7fa] min-h-screen">

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Asset Details
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Asset Management Dashboard
        </p>
      </div>

      {/* PAGE SIZE SELECTOR */}
      <div className="flex justify-end mb-3">
        <select
          className="border p-2 rounded-lg"
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-2xl shadow-sm overflow-auto">

        <table className="w-full text-sm">

          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-3">Asset Code</th>
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3">Model</th>
              <th className="text-left p-3">Serial</th>
              <th className="text-left p-3">Salesman</th>
              <th className="text-left p-3">Route</th>
              <th className="text-left p-3">Status</th>
              <th className="text-center p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center p-10 text-gray-400">
                  No assets found
                </td>
              </tr>
            ) : (
              paginatedData.map((a) => (
                <tr key={a._id} className="border-t hover:bg-gray-50">

                  <td className="p-3 font-medium">{a.assetCode}</td>
                  <td className="p-3">{a.type}</td>
                  <td className="p-3">{a.model || "-"}</td>
                  <td className="p-3">{a.serialNumber || "-"}</td>
                  <td className="p-3">{a.salesmanName || "-"}</td>
                  <td className="p-3">{a.route || "-"}</td>

                  <td className="p-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      a.status === "available"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {a.status}
                    </span>
                  </td>

                  <td className="p-3">
                    <div className="flex gap-2 justify-center">

                      <button
                        onClick={() =>
                          window.open(`/admin/assets/history?code=${a.assetCode}`)
                        }
                        className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs"
                      >
                        History
                      </button>

                      <button
                        onClick={() => openEdit(a)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded-lg text-xs"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => deleteAsset(a._id)}
                        className="bg-red-600 text-white px-3 py-1 rounded-lg text-xs"
                      >
                        Delete
                      </button>

                    </div>
                  </td>

                </tr>
              ))
            )}
          </tbody>

        </table>
      </div>

      {/* PAGINATION CONTROLS */}
      <div className="flex justify-center gap-2 mt-5">

        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-3 py-1 border rounded disabled:opacity-40"
        >
          Prev
        </button>

        <span className="px-3 py-1">
          Page {page} / {totalPages || 1}
        </span>

        <button
          disabled={page === totalPages || totalPages === 0}
          onClick={() => setPage(page + 1)}
          className="px-3 py-1 border rounded disabled:opacity-40"
        >
          Next
        </button>

      </div>

      {/* EDIT MODAL (UNCHANGED) */}
      {editOpen && selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl">

            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">Edit Asset</h2>
              <button onClick={() => setEditOpen(false)}>✕</button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">

              <input className="border p-3 rounded-xl"
                value={selected.assetCode || ""}
                onChange={(e) =>
                  setSelected({ ...selected, assetCode: e.target.value })
                }
              />

              <select className="border p-3 rounded-xl"
                value={selected.type || ""}
                onChange={(e) =>
                  setSelected({ ...selected, type: e.target.value })
                }
              >
                <option value="Laptop">Laptop</option>
                <option value="Printer">Printer</option>
                <option value="HHT">HHT</option>
              </select>

            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={updateAsset}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl"
              >
                Save Changes
              </button>

              <button
                onClick={() => setEditOpen(false)}
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