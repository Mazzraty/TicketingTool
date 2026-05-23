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
          <p className="text-gray-500 text-sm">
            Total Assets
          </p>

          <h2 className="text-4xl font-bold mt-3 text-gray-800">
            {total}
          </h2>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
          <p className="text-gray-500 text-sm">
            Laptops
          </p>

          <h2 className="text-4xl font-bold mt-3 text-blue-600">
            {laptop}
          </h2>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
          <p className="text-gray-500 text-sm">
            Printers
          </p>

          <h2 className="text-4xl font-bold mt-3 text-green-600">
            {printer}
          </h2>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
          <p className="text-gray-500 text-sm">
            HHT Devices
          </p>

          <h2 className="text-4xl font-bold mt-3 text-purple-600">
            {hht}
          </h2>
        </div>

      </div>

      {/* FILTER */}
      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm p-5 mb-8">

        <div className="flex flex-col lg:flex-row gap-4">

          <input
            className="flex-1 border border-gray-300 rounded-2xl px-5 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search asset / serial / salesman..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          <div className="flex gap-3 flex-wrap">

            {[
              "All",
              "Laptop",
              "Printer",
              "HHT",
            ].map((t) => (

              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-5 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                  filter === t
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white border border-gray-300 hover:bg-gray-100 text-gray-700"
                }`}
              >
                {t}
              </button>

            ))}

          </div>

        </div>

      </div>

      {/* TABLE */}
      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">

              <tr className="text-gray-700">

                <th className="text-left px-6 py-4 font-semibold">
                  Asset Code
                </th>

                <th className="text-left px-6 py-4 font-semibold">
                  Type
                </th>

                {/* LAPTOP + PRINTER */}
                {!showHHTFields && (
                  <>
                    <th className="text-left px-6 py-4 font-semibold">
                      Model
                    </th>

                    <th className="text-left px-6 py-4 font-semibold">
                      Serial
                    </th>
                  </>
                )}

                {/* HHT ONLY */}
                {showHHTFields && (
                  <>
                    <th className="text-left px-6 py-4 font-semibold">
                      Salesman
                    </th>

                    <th className="text-left px-6 py-4 font-semibold">
                      Route
                    </th>
                  </>
                )}

                <th className="text-left px-6 py-4 font-semibold">
                  Status
                </th>

                <th className="text-center px-6 py-4 font-semibold">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {filtered.length === 0 ? (

                <tr>
                  <td
                    colSpan="8"
                    className="text-center py-14 text-gray-400"
                  >
                    No assets found
                  </td>
                </tr>

              ) : (

                filtered.map((a, index) => (

                  <tr
                    key={a._id}
                    className={`border-b last:border-0 hover:bg-blue-50/40 transition ${
                      index % 2 === 0
                        ? "bg-white"
                        : "bg-gray-50/40"
                    }`}
                  >

                    <td className="px-6 py-4 font-semibold text-gray-800">
                      {a.assetCode}
                    </td>

                    <td className="px-6 py-4">

                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        a.type === "Laptop"
                          ? "bg-blue-100 text-blue-700"
                          : a.type === "Printer"
                          ? "bg-green-100 text-green-700"
                          : "bg-purple-100 text-purple-700"
                      }`}>
                        {a.type}
                      </span>

                    </td>

                    {/* LAPTOP + PRINTER */}
                    {!showHHTFields && (
                      <>
                        <td className="px-6 py-4 text-gray-700">
                          {a.model || "-"}
                        </td>

                        <td className="px-6 py-4 text-gray-700">
                          {a.serialNumber || "-"}
                        </td>
                      </>
                    )}

                    {/* HHT ONLY */}
                    {showHHTFields && (
                      <>
                        <td className="px-6 py-4 text-gray-700">
                          {a.salesmanName || "-"}
                        </td>

                        <td className="px-6 py-4 text-gray-700">
                          {a.route || "-"}
                        </td>
                      </>
                    )}

                    <td className="px-6 py-4">

                      <span
                        className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                          a.status === "available"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {a.status}
                      </span>

                    </td>

                    <td className="px-6 py-4">

                      <div className="flex items-center justify-center gap-2">

                        {/* HISTORY */}
                        <button
                          onClick={() =>
                            window.open(
                              `/admin/assets/history?code=${a.assetCode}`
                            )
                          }
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-sm hover:shadow-md"
                        >
                          History
                        </button>

                        {/* EDIT */}
                        <button
                          onClick={() => openEdit(a)}
                          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition shadow-sm hover:shadow-md"
                        >
                          Edit
                        </button>

                        {/* DELETE */}
                        <button
                          onClick={() => deleteAsset(a._id)}
                          className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition shadow-sm hover:shadow-md"
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

      {/* EDIT MODAL */}
      {editOpen && selected && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between mb-6">

              <h2 className="text-2xl font-bold text-gray-800">
                Edit Asset
              </h2>

              <button
                onClick={() => setEditOpen(false)}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-lg"
              >
                ✕
              </button>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* COMMON */}
              <div>
                <label className="text-sm text-gray-600 mb-2 block">
                  Asset Code
                </label>

                <input
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3"
                  value={selected.assetCode || ""}
                  onChange={(e) =>
                    setSelected({
                      ...selected,
                      assetCode: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-2 block">
                  Type
                </label>

                <select
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3"
                  value={selected.type || ""}
                  onChange={(e) =>
                    setSelected({
                      ...selected,
                      type: e.target.value,
                    })
                  }
                >
                  <option value="Laptop">Laptop</option>
                  <option value="Printer">Printer</option>
                  <option value="HHT">HHT</option>
                </select>
              </div>

              {/* LAPTOP / PRINTER */}
              {(selected.type === "Laptop" ||
                selected.type === "Printer") && (
                <>
                  <div>
                    <label className="text-sm text-gray-600 mb-2 block">
                      Model
                    </label>

                    <input
                      className="w-full border border-gray-300 rounded-2xl px-4 py-3"
                      value={selected.model || ""}
                      onChange={(e) =>
                        setSelected({
                          ...selected,
                          model: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600 mb-2 block">
                      Serial Number
                    </label>

                    <input
                      className="w-full border border-gray-300 rounded-2xl px-4 py-3"
                      value={selected.serialNumber || ""}
                      onChange={(e) =>
                        setSelected({
                          ...selected,
                          serialNumber: e.target.value,
                        })
                      }
                    />
                  </div>
                </>
              )}

              {/* HHT */}
              {selected.type === "HHT" && (
                <>
                  <div>
                    <label className="text-sm text-gray-600 mb-2 block">
                      Salesman Name
                    </label>

                    <input
                      className="w-full border border-gray-300 rounded-2xl px-4 py-3"
                      value={selected.salesmanName || ""}
                      onChange={(e) =>
                        setSelected({
                          ...selected,
                          salesmanName: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600 mb-2 block">
                      Route
                    </label>

                    <input
                      className="w-full border border-gray-300 rounded-2xl px-4 py-3"
                      value={selected.route || ""}
                      onChange={(e) =>
                        setSelected({
                          ...selected,
                          route: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600 mb-2 block">
                      IMEI
                    </label>

                    <input
                      className="w-full border border-gray-300 rounded-2xl px-4 py-3"
                      value={selected.imei || ""}
                      onChange={(e) =>
                        setSelected({
                          ...selected,
                          imei: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-600 mb-2 block">
                      SIM Number
                    </label>

                    <input
                      className="w-full border border-gray-300 rounded-2xl px-4 py-3"
                      value={selected.simNumber || ""}
                      onChange={(e) =>
                        setSelected({
                          ...selected,
                          simNumber: e.target.value,
                        })
                      }
                    />
                  </div>
                </>
              )}

              {/* STATUS */}
              <div className="md:col-span-2">

                <label className="text-sm text-gray-600 mb-2 block">
                  Status
                </label>

                <select
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3"
                  value={selected.status || ""}
                  onChange={(e) =>
                    setSelected({
                      ...selected,
                      status: e.target.value,
                    })
                  }
                >
                  <option value="available">
                    available
                  </option>

                  <option value="assigned">
                    assigned
                  </option>
                </select>

              </div>

              {/* NOTES */}
              <div className="md:col-span-2">

                <label className="text-sm text-gray-600 mb-2 block">
                  Notes
                </label>

                <textarea
                  rows="4"
                  className="w-full border border-gray-300 rounded-2xl px-4 py-3"
                  value={selected.notes || ""}
                  onChange={(e) =>
                    setSelected({
                      ...selected,
                      notes: e.target.value,
                    })
                  }
                />

              </div>

            </div>

            {/* BUTTONS */}
            <div className="flex gap-4 mt-8">

              <button
                onClick={updateAsset}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-semibold transition"
              >
                Save Changes
              </button>

              <button
                onClick={() => setEditOpen(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-2xl font-semibold transition"
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