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
                    ? "bg-[#0a6ed1] text-white shadow-md"
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

            <thead className="bg-[#f7f9fb] border-b">

              <tr className="text-gray-700">

                <th className="text-left px-6 py-4 font-semibold">
                  Asset Code
                </th>

                <th className="text-left px-6 py-4 font-semibold">
                  Type
                </th>

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

                      <div className="flex items-center justify-center gap-3">

                        {/* HISTORY */}
                        <button
                          onClick={() =>
                            window.open(
                              `/admin/assets/history?code=${a.assetCode}`
                            )
                          }
                          className="
                            min-w-[90px]
                            h-10
                            rounded-xl
                            bg-[#0a6ed1]
                            hover:bg-[#085caf]
                            text-white
                            text-sm
                            font-semibold
                            shadow-sm
                            border border-[#0a6ed1]
                            transition-all
                          "
                        >
                          History
                        </button>

                        {/* EDIT */}
                        <button
                          onClick={() => openEdit(a)}
                          className="
                            min-w-[90px]
                            h-10
                            rounded-xl
                            bg-white
                            hover:bg-[#f5f7fa]
                            text-[#0a6ed1]
                            text-sm
                            font-semibold
                            border
                            border-[#0a6ed1]
                            shadow-sm
                            transition-all
                          "
                        >
                          Edit
                        </button>

                        {/* DELETE */}
                        <button
                          onClick={() => deleteAsset(a._id)}
                          className="
                            min-w-[90px]
                            h-10
                            rounded-xl
                            bg-white
                            hover:bg-red-50
                            text-red-600
                            text-sm
                            font-semibold
                            border
                            border-red-200
                            shadow-sm
                            transition-all
                          "
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

          <div className="
            bg-white
            rounded-2xl
            w-full
            max-w-3xl
            shadow-[0_8px_32px_rgba(0,0,0,0.15)]
            border
            border-gray-200
            overflow-hidden
          ">

            {/* HEADER */}
            <div className="
              flex
              items-center
              justify-between
              px-8
              py-5
              border-b
              bg-[#f7f9fb]
            ">

              <h2 className="text-2xl font-bold text-gray-800">
                Edit Asset
              </h2>

              <button
                onClick={() => setEditOpen(false)}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200"
              >
                ✕
              </button>

            </div>

            {/* BODY */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8">

              <input
                className="border border-gray-300 rounded-xl px-4 py-3"
                placeholder="Asset Code"
                value={selected.assetCode || ""}
                onChange={(e) =>
                  setSelected({
                    ...selected,
                    assetCode: e.target.value,
                  })
                }
              />

              <select
                className="border border-gray-300 rounded-xl px-4 py-3"
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

              {(selected.type === "Laptop" ||
                selected.type === "Printer") && (
                <>
                  <input
                    className="border border-gray-300 rounded-xl px-4 py-3"
                    placeholder="Model"
                    value={selected.model || ""}
                    onChange={(e) =>
                      setSelected({
                        ...selected,
                        model: e.target.value,
                      })
                    }
                  />

                  <input
                    className="border border-gray-300 rounded-xl px-4 py-3"
                    placeholder="Serial Number"
                    value={selected.serialNumber || ""}
                    onChange={(e) =>
                      setSelected({
                        ...selected,
                        serialNumber: e.target.value,
                      })
                    }
                  />
                </>
              )}

              {selected.type === "HHT" && (
                <>
                  <input
                    className="border border-gray-300 rounded-xl px-4 py-3"
                    placeholder="Salesman Name"
                    value={selected.salesmanName || ""}
                    onChange={(e) =>
                      setSelected({
                        ...selected,
                        salesmanName: e.target.value,
                      })
                    }
                  />

                  <input
                    className="border border-gray-300 rounded-xl px-4 py-3"
                    placeholder="Route"
                    value={selected.route || ""}
                    onChange={(e) =>
                      setSelected({
                        ...selected,
                        route: e.target.value,
                      })
                    }
                  />
                </>
              )}

            </div>

            {/* FOOTER */}
            <div className="
              flex
              justify-end
              gap-3
              px-8
              py-5
              border-t
              bg-[#f7f9fb]
            ">

              <button
                onClick={updateAsset}
                className="
                  min-w-[140px]
                  h-11
                  bg-[#0a6ed1]
                  hover:bg-[#085caf]
                  text-white
                  rounded-xl
                  font-semibold
                  transition-all
                "
              >
                Save Changes
              </button>

              <button
                onClick={() => setEditOpen(false)}
                className="
                  min-w-[140px]
                  h-11
                  bg-white
                  hover:bg-gray-100
                  text-gray-700
                  border
                  border-gray-300
                  rounded-xl
                  font-semibold
                  transition-all
                "
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