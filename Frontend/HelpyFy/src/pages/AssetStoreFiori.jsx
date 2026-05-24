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
      const res = await api.get("/assets?limit=1000");

      console.log("ASSET RESPONSE:", res.data);

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
          selectedFilter === "all" ||
          type === selectedFilter;

        const text = search.toLowerCase();

        const matchSearch =
          a.assetCode
            ?.toLowerCase()
            .includes(text) ||
          a.model?.toLowerCase().includes(text) ||
          a.serialNumber
            ?.toLowerCase()
            .includes(text) ||
          a.salesmanName
            ?.toLowerCase()
            .includes(text) ||
          a.salesmanCode
            ?.toLowerCase()
            .includes(text);

        return matchType && matchSearch;
      })
    : [];

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

  /* ================= CURRENT USER ================= */
  const getCurrentUser = (asset) => {
    if (asset.employee?.name) {
      return asset.employee.name;
    }

    if (asset.employee?.employeeName) {
      return asset.employee.employeeName;
    }

    if (asset.assignedTo?.name) {
      return asset.assignedTo.name;
    }

    if (asset.assignedTo?.employeeName) {
      return asset.assignedTo.employeeName;
    }

    if (asset.user?.name) {
      return asset.user.name;
    }

    if (asset.salesmanName) {
      return asset.salesmanName;
    }

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
                  Current User
                </th>

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
                    colSpan="9"
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
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          a.type === "Laptop"
                            ? "bg-blue-100 text-blue-700"
                            : a.type === "Printer"
                            ? "bg-green-100 text-green-700"
                            : "bg-purple-100 text-purple-700"
                        }`}
                      >
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

                    <td className="px-6 py-4 text-gray-700 font-medium">
                      {getCurrentUser(a)}
                    </td>

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
                        <button
                          onClick={() =>
                            window.open(
                              `/admin/assets/history?code=${a.assetCode}`
                            )
                          }
                          className="min-w-[85px] h-9 rounded-lg bg-[#0a6ed1] hover:bg-[#085caf] text-white text-xs font-semibold border border-[#0a6ed1] shadow-sm transition-all"
                        >
                          History
                        </button>

                        <button
                          onClick={() => openEdit(a)}
                          className="min-w-[85px] h-9 rounded-lg bg-white hover:bg-[#f5f7fa] text-[#0a6ed1] text-xs font-semibold border border-[#0a6ed1] shadow-sm transition-all"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            deleteAsset(a._id)
                          }
                          className="min-w-[85px] h-9 rounded-lg bg-white hover:bg-red-50 text-red-600 text-xs font-semibold border border-red-200 shadow-sm transition-all"
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

      {/* ================= EDIT MODAL ================= */}
      {editOpen && selected && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* HEADER */}
            <div className="bg-[#0a6ed1] px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Edit Asset
                </h2>

                <p className="text-blue-100 text-sm">
                  Update asset information
                </p>
              </div>

              <button
                onClick={() =>
                  setEditOpen(false)
                }
                className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 text-white transition"
              >
                ✕
              </button>
            </div>

            {/* BODY */}
            <div className="p-6 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">
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
                  <label className="text-sm font-semibold text-gray-700 block mb-2">
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
                    <option value="Laptop">
                      Laptop
                    </option>

                    <option value="Printer">
                      Printer
                    </option>

                    <option value="HHT">
                      HHT
                    </option>
                  </select>
                </div>

                {(selected.type === "Laptop" ||
                  selected.type === "Printer") && (
                  <>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-2">
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
                      <label className="text-sm font-semibold text-gray-700 block mb-2">
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

                {selected.type === "Printer" && (
                  <>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-2">
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
                      <label className="text-sm font-semibold text-gray-700 block mb-2">
                        Supervisor
                      </label>

                      <input
                        className="w-full border border-gray-300 rounded-2xl px-4 py-3"
                        value={selected.supervisor || ""}
                        onChange={(e) =>
                          setSelected({
                            ...selected,
                            supervisor: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-2">
                        Salesman Code
                      </label>

                      <input
                        className="w-full border border-gray-300 rounded-2xl px-4 py-3"
                        value={selected.salesmanCode || ""}
                        onChange={(e) =>
                          setSelected({
                            ...selected,
                            salesmanCode: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-2">
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
                  </>
                )}

                {selected.type === "HHT" && (
                  <>
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-2">
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
                      <label className="text-sm font-semibold text-gray-700 block mb-2">
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
                      <label className="text-sm font-semibold text-gray-700 block mb-2">
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
                      <label className="text-sm font-semibold text-gray-700 block mb-2">
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

                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700 block mb-2">
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

                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700 block mb-2">
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

              {/* FOOTER */}
              <div className="flex gap-4 mt-8">
                <button
                  onClick={updateAsset}
                  className="flex-1 h-12 rounded-2xl bg-[#0a6ed1] hover:bg-[#085caf] text-white font-semibold shadow-sm transition"
                >
                  Save Changes
                </button>

                <button
                  onClick={() =>
                    setEditOpen(false)
                  }
                  className="flex-1 h-12 rounded-2xl border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-semibold transition"
                >
                  Cancel
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}