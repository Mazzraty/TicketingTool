import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function AssetStoreFiori() {
  const [assets, setAssets] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  /* ================= LOAD ================= */
  const loadAssets = async () => {
    try {
      const res = await api.get("/assets?limit=1000");

      setAssets(
        Array.isArray(res.data.assets)
          ? res.data.assets
          : []
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to load assets");
      setAssets([]);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  /* ================= FILTER ================= */
  const filtered = Array.isArray(assets)
    ? assets.filter((a) => {
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
      })
    : [];

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

  const updateAsset = async () => {
    try {
      await api.put(`/assets/${selected._id}`, selected);
      toast.success("Asset Updated");
      setEditOpen(false);
      loadAssets();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Update failed");
    }
  };

  const deleteAsset = async (id) => {
    if (!window.confirm("Delete this asset?")) return;

    try {
      await api.delete(`/assets/${id}`);
      toast.success("Asset Deleted");
      loadAssets();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Delete failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] pt-20 p-6">

      {/* ================= FIXED NAVBAR ================= */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">

        <div className="h-16 px-6 flex items-center justify-between">

          {/* TITLE */}
          <div>
            <h1 className="text-lg font-bold text-gray-800">
              Asset Management
            </h1>
            <p className="text-xs text-gray-500">
              SAP Fiori Dashboard
            </p>
          </div>

          {/* NAV BUTTONS */}
          <div className="flex items-center gap-3">

            <button
              onClick={() => window.location.href = "/admin/assets"}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#0a6ed1] text-white hover:bg-[#085caf]"
            >
              Assign
            </button>

            <button
              onClick={() => window.location.href = "/admin/assets/history"}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-white border hover:bg-gray-100"
            >
              History
            </button>

            <button
              onClick={() => window.location.href = "/admin/assets/upload-excel"}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-white border hover:bg-gray-100"
            >
              Employees
            </button>

            <button
              onClick={() => window.location.href = "/admin/assets/upload-printer"}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-white border hover:bg-gray-100"
            >
              Printer
            </button>

            <button
              onClick={() => window.location.href = "/admin/assets/upload-laptop"}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-white border hover:bg-gray-100"
            >
              Laptop
            </button>

          </div>

          <div className="w-[120px]" />
        </div>
      </div>

      {/* ================= KPI ================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">

        <div className="bg-white rounded-3xl border p-6 shadow-sm">
          <p className="text-gray-500 text-sm">Total Assets</p>
          <h2 className="text-4xl font-bold">{total}</h2>
        </div>

        <div className="bg-white rounded-3xl border p-6 shadow-sm">
          <p className="text-gray-500 text-sm">Laptops</p>
          <h2 className="text-4xl font-bold text-blue-600">{laptop}</h2>
        </div>

        <div className="bg-white rounded-3xl border p-6 shadow-sm">
          <p className="text-gray-500 text-sm">Printers</p>
          <h2 className="text-4xl font-bold text-green-600">{printer}</h2>
        </div>

        <div className="bg-white rounded-3xl border p-6 shadow-sm">
          <p className="text-gray-500 text-sm">HHT</p>
          <h2 className="text-4xl font-bold text-purple-600">{hht}</h2>
        </div>

      </div>

      {/* ================= FILTER ================= */}
      <div className="bg-white border rounded-3xl p-5 mb-8 shadow-sm">

        <div className="flex flex-col lg:flex-row gap-4">

          <input
            className="flex-1 border rounded-2xl px-5 py-3"
            placeholder="Search asset / serial / salesman..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex gap-3 flex-wrap">

            {["All", "Laptop", "Printer", "HHT"].map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-5 py-3 rounded-2xl text-sm font-semibold ${
                  filter === t
                    ? "bg-[#0a6ed1] text-white"
                    : "bg-white border hover:bg-gray-100"
                }`}
              >
                {t}
              </button>
            ))}

          </div>

        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left">Asset Code</th>
                <th className="p-4 text-left">Type</th>
                <th className="p-4 text-left">Model</th>
                <th className="p-4 text-left">Serial</th>
                <th className="p-4 text-left">Current User</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>

              {filtered.map((a) => (
                <tr key={a._id} className="border-t hover:bg-gray-50">

                  <td className="p-4 font-semibold">{a.assetCode}</td>

                  <td className="p-4">{a.type}</td>

                  <td className="p-4">{a.model || "-"}</td>

                  <td className="p-4">{a.serialNumber || "-"}</td>

                  <td className="p-4">{getCurrentUser(a)}</td>

                  <td className="p-4">{a.status}</td>

                  <td className="p-4 text-center flex gap-2 justify-center">

                    <button
                      onClick={() => openEdit(a)}
                      className="px-3 py-1 border rounded text-blue-600"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteAsset(a._id)}
                      className="px-3 py-1 border rounded text-red-600"
                    >
                      Delete
                    </button>

                  </td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>

      </div>

      {/* EDIT MODAL (UNCHANGED LOGIC) */}
      {editOpen && selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-2xl w-[500px]">

            <h2 className="font-bold text-lg mb-4">Edit Asset</h2>

            <button
              onClick={() => setEditOpen(false)}
              className="mt-4 px-4 py-2 border rounded"
            >
              Close
            </button>

            <button
              onClick={updateAsset}
              className="mt-4 ml-2 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Save
            </button>

          </div>
        </div>
      )}

    </div>
  );
}