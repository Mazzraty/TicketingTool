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

  /* ================= LOAD ================= */
  const loadAssets = async () => {
    try {

      const res = await api.get("/assets");

      setAssets(res.data);

    } catch (err) {

      console.error(err);

      toast.error("Failed to load assets");
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  /* ================= FILTER ================= */
  const filtered = assets.filter((a) => {

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

  /* ================= KPI ================= */
  const total = assets.length;

  const laptop = assets.filter(
    (a) => a.type === "Laptop"
  ).length;

  const printer = assets.filter(
    (a) => a.type === "Printer"
  ).length;

  const hht = assets.filter(
    (a) => a.type === "HHT"
  ).length;

  /* ================= TABLE CONTROL ================= */
  const showHHTFields = filter === "HHT";

  /* ================= EDIT ================= */
  const openEdit = (asset) => {
    setSelected(asset);
    setEditOpen(true);
  };

  /* ================= UPDATE ================= */
  const updateAsset = async () => {
    try {

      await api.put(
        `/assets/${selected._id}`,
        selected
      );

      toast.success("Asset Updated");

      setEditOpen(false);

      loadAssets();

    } catch (err) {

      console.error(err);

      toast.error(
        err.response?.data?.msg ||
        "Update failed"
      );
    }
  };

  /* ================= DELETE ================= */
  const deleteAsset = async (id) => {

    const confirmDelete = window.confirm(
      "Delete this asset?"
    );

    if (!confirmDelete) return;

    try {

      await api.delete(`/assets/${id}`);

      toast.success("Asset Deleted");

      loadAssets();

    } catch (err) {

      console.error(err);

      toast.error(
        err.response?.data?.msg ||
        "Delete failed"
      );
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

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">

        <div className="bg-white border rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Total Assets
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {total}
          </h2>
        </div>

        <div className="bg-white border rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Laptops
          </p>

          <h2 className="text-3xl font-bold text-blue-600 mt-2">
            {laptop}
          </h2>
        </div>

        <div className="bg-white border rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Printers
          </p>

          <h2 className="text-3xl font-bold text-green-600 mt-2">
            {printer}
          </h2>
        </div>

        <div className="bg-white border rounded-2xl p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            HHT Devices
          </p>

          <h2 className="text-3xl font-bold text-purple-600 mt-2">
            {hht}
          </h2>
        </div>

      </div>

      {/* FILTER BAR */}
      <div className="bg-white border rounded-2xl shadow-sm p-4 mb-6">

        <div className="flex flex-col md:flex-row gap-3">

          <input
            className="flex-1 border rounded-xl p-3"
            placeholder="Search asset / serial / salesman..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          <div className="flex gap-2 flex-wrap">

            {[
              "All",
              "Laptop",
              "Printer",
              "HHT",
            ].map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-4 py-2 rounded-xl text-sm border transition ${
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

      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-2xl shadow-sm overflow-auto">

        <table className="w-full text-sm">

          <thead className="bg-gray-100">

            <tr>

              <th className="text-left p-3">
                Asset Code
              </th>

              <th className="text-left p-3">
                Type
              </th>

              {/* LAPTOP + PRINTER */}
              {!showHHTFields && (
                <>
                  <th className="text-left p-3">
                    Model
                  </th>

                  <th className="text-left p-3">
                    Serial
                  </th>
                </>
              )}

              {/* HHT ONLY */}
              {showHHTFields && (
                <>
                  <th className="text-left p-3">
                    Salesman
                  </th>

                  <th className="text-left p-3">
                    Route
                  </th>
                </>
              )}

              <th className="text-left p-3">
                Status
              </th>

              <th className="text-center p-3">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan="8"
                  className="text-center p-10 text-gray-400"
                >
                  No assets found
                </td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr
                  key={a._id}
                  className="border-t hover:bg-gray-50"
                >

                  <td className="p-3 font-medium">
                    {a.assetCode}
                  </td>

                  <td className="p-3">
                    {a.type}
                  </td>

                  {/* LAPTOP + PRINTER */}
                  {!showHHTFields && (
                    <>
                      <td className="p-3">
                        {a.model || "-"}
                      </td>

                      <td className="p-3">
                        {a.serialNumber || "-"}
                      </td>
                    </>
                  )}

                  {/* HHT ONLY */}
                  {showHHTFields && (
                    <>
                      <td className="p-3">
                        {a.salesmanName || "-"}
                      </td>

                      <td className="p-3">
                        {a.route || "-"}
                      </td>
                    </>
                  )}

                  <td className="p-3">

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        a.status === "available"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {a.status}
                    </span>

                  </td>

                  <td className="p-3">

                    <div className="flex gap-2 justify-center">

                      <button
                        onClick={() =>
                          window.open(
                            `/admin/assets/history?code=${a.assetCode}`
                          )
                        }
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-xs"
                      >
                        History
                      </button>

                      <button
                        onClick={() => openEdit(a)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded-lg text-xs"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          deleteAsset(a._id)
                        }
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-xs"
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

    </div>
  );
}