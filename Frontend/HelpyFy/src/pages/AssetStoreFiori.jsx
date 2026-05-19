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

    const matchType =
      filter === "All" || a.type === filter;

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
          Asset Store
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

              <th className="text-left p-3">
                Model
              </th>

              <th className="text-left p-3">
                Serial
              </th>

              <th className="text-left p-3">
                Salesman
              </th>

              <th className="text-left p-3">
                Route
              </th>

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

                  <td className="p-3">
                    {a.model || "-"}
                  </td>

                  <td className="p-3">
                    {a.serialNumber || "-"}
                  </td>

                  <td className="p-3">
                    {a.salesmanName || "-"}
                  </td>

                  <td className="p-3">
                    {a.route || "-"}
                  </td>

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

      {/* ================= EDIT MODAL ================= */}
      {editOpen && selected && (

        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl overflow-auto max-h-[90vh]">

            <div className="flex justify-between items-center mb-5">

              <h2 className="text-xl font-bold">
                Edit Asset
              </h2>

              <button
                onClick={() =>
                  setEditOpen(false)
                }
                className="text-gray-500 text-xl"
              >
                ✕
              </button>

            </div>

            <div className="grid md:grid-cols-2 gap-4">

              <input
                className="border rounded-xl p-3"
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
                className="border rounded-xl p-3"
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

              <input
                className="border rounded-xl p-3"
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
                className="border rounded-xl p-3"
                placeholder="Serial Number"
                value={selected.serialNumber || ""}
                onChange={(e) =>
                  setSelected({
                    ...selected,
                    serialNumber: e.target.value,
                  })
                }
              />

              <input
                className="border rounded-xl p-3"
                placeholder="Salesman Code"
                value={selected.salesmanCode || ""}
                onChange={(e) =>
                  setSelected({
                    ...selected,
                    salesmanCode: e.target.value,
                  })
                }
              />

              <input
                className="border rounded-xl p-3"
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
                className="border rounded-xl p-3"
                placeholder="Route"
                value={selected.route || ""}
                onChange={(e) =>
                  setSelected({
                    ...selected,
                    route: e.target.value,
                  })
                }
              />

              <input
                className="border rounded-xl p-3"
                placeholder="Supervisor"
                value={selected.supervisor || ""}
                onChange={(e) =>
                  setSelected({
                    ...selected,
                    supervisor: e.target.value,
                  })
                }
              />

              <input
                className="border rounded-xl p-3"
                placeholder="SOTI"
                value={selected.soti || ""}
                onChange={(e) =>
                  setSelected({
                    ...selected,
                    soti: e.target.value,
                  })
                }
              />

              <input
                className="border rounded-xl p-3"
                placeholder="IMEI"
                value={selected.imei || ""}
                onChange={(e) =>
                  setSelected({
                    ...selected,
                    imei: e.target.value,
                  })
                }
              />

              <input
                className="border rounded-xl p-3"
                placeholder="SIM Number"
                value={selected.simNumber || ""}
                onChange={(e) =>
                  setSelected({
                    ...selected,
                    simNumber: e.target.value,
                  })
                }
              />

              <select
                className="border rounded-xl p-3"
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
            <textarea
              className="w-full border rounded-xl p-3 mt-4"
              rows="4"
              placeholder="Notes"
              value={selected.notes || ""}
              onChange={(e) =>
                setSelected({
                  ...selected,
                  notes: e.target.value,
                })
              }
            />

            {/* ACTIONS */}
            <div className="flex gap-3 mt-5">

              <button
                onClick={updateAsset}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl"
              >
                Save Changes
              </button>

              <button
                onClick={() =>
                  setEditOpen(false)
                }
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl"
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
