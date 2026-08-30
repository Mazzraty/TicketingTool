import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function AssetStoreFiori() {
  const [assets, setAssets] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  // EDIT STATE
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  /* ================= LOAD ================= */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/assets");
        setAssets(res.data);
      } catch (err) {
        toast.error("Failed to load assets");
      }
    };

    load();
  }, []);

  /* ================= FILTER ================= */
  const filtered = assets.filter((a) => {
    const matchType = filter === "All" || a.type === filter;

    const matchSearch =
      a.assetCode?.toLowerCase().includes(search.toLowerCase()) ||
      a.model?.toLowerCase().includes(search.toLowerCase());

    return matchType && matchSearch;
  });

  /* ================= KPIs ================= */
  const total = assets.length;
  const laptop = assets.filter((a) => a.type === "Laptop").length;
  const printer = assets.filter((a) => a.type === "Printer").length;
  const hht = assets.filter((a) => a.type === "HHT").length;

  /* ================= OPEN EDIT ================= */
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

      // refresh
      const res = await api.get("/assets");
      setAssets(res.data);

    } catch (err) {
      toast.error(err.response?.data?.msg || "Update failed");
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* HEADER */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800">
          Asset Management Dashboard
        </h1>
        <p className="text-sm text-gray-500">
          SAP Fiori Style Asset Store
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-gray-500 text-sm">Total Assets</p>
          <h2 className="text-2xl font-bold">{total}</h2>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-gray-500 text-sm">Laptops</p>
          <h2 className="text-2xl font-bold text-blue-600">{laptop}</h2>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-gray-500 text-sm">Printers</p>
          <h2 className="text-2xl font-bold text-green-600">{printer}</h2>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-gray-500 text-sm">HHT Devices</p>
          <h2 className="text-2xl font-bold text-purple-600">{hht}</h2>
        </div>

      </div>

      {/* FILTER */}
      <div className="bg-white p-4 rounded-xl shadow-sm border mb-5">

        <input
          className="w-full border p-2 rounded mb-3"
          placeholder="Search asset code / model..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex gap-2 flex-wrap">

          {["All", "Laptop", "Printer", "HHT"].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-4 py-2 rounded-full text-sm border ${
                filter === t
                  ? "bg-blue-600 text-white"
                  : "bg-white hover:bg-gray-100"
              }`}
            >
              {t}
            </button>
          ))}

        </div>
      </div>

      {/* GRID */}
      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">

        {filtered.map((a) => (
          <div
            key={a._id}
            className="bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition"
          >

            <div className="flex justify-between items-center mb-2">
              <span className="font-bold">{a.assetCode}</span>

              <span className={`text-xs px-2 py-1 rounded-full ${
                a.status === "available"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}>
                {a.status}
              </span>
            </div>

            <div className="text-sm text-gray-600">
              <p>{a.type}</p>
              <p>{a.model || "-"}</p>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-2 mt-3">

              <button
                onClick={() =>
                  window.open(`/asset-history?code=${a.assetCode}`)
                }
                className="w-full bg-blue-600 text-white text-sm py-2 rounded"
              >
                History
              </button>

              <button
                onClick={() => openEdit(a)}
                className="w-full bg-yellow-500 text-white text-sm py-2 rounded"
              >
                Edit
              </button>

            </div>

          </div>
        ))}

      </div>

      {/* ================= EDIT MODAL ================= */}
      {editOpen && selected && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">

          <div className="bg-white p-6 rounded-xl w-[400px]">

            <h2 className="text-lg font-bold mb-4">
              Edit Asset
            </h2>

            <input
              className="w-full border p-2 mb-2"
              value={selected.assetCode}
              onChange={(e) =>
                setSelected({ ...selected, assetCode: e.target.value })
              }
            />

            <input
              className="w-full border p-2 mb-2"
              value={selected.model || ""}
              onChange={(e) =>
                setSelected({ ...selected, model: e.target.value })
              }
            />

            <select
              className="w-full border p-2 mb-3"
              value={selected.type}
              onChange={(e) =>
                setSelected({ ...selected, type: e.target.value })
              }
            >
              <option>Laptop</option>
              <option>Printer</option>
              <option>HHT</option>
            </select>

            <div className="flex gap-2">

              <button
                onClick={updateAsset}
                className="bg-green-600 text-white px-4 py-2 w-full rounded"
              >
                Save
              </button>

              <button
                onClick={() => setEditOpen(false)}
                className="bg-gray-400 text-white px-4 py-2 w-full rounded"
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