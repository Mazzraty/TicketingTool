// pages/AdminSoftwareDashboard.jsx

import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function AdminSoftwareDashboard() {
  const [softwares, setSoftwares] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const limit = 8;

  const [addModal, setAddModal] = useState(false);

  const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState(null);

  const [form, setForm] = useState({
    serviceName: "",
    vendor: "",
    durationMonths: "",
    amount: "",
    purchaseDate: "",
    expiryDate: "",
    status: "Active",
  });

  /* =========================
     FETCH SOFTWARES
  ========================= */
  useEffect(() => {
    fetchSoftwares();
  }, []);

  const fetchSoftwares = async () => {
    try {
      const res = await api.get("/software");

      setSoftwares(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load softwares");
    }
  };

  /* =========================
     ADD SOFTWARE
  ========================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        serviceName: form.serviceName,
        vendor: form.vendor,
        durationMonths: Number(form.durationMonths) || 0,
        amount: Number(form.amount) || 0,
        purchaseDate: form.purchaseDate || null,
        expiryDate: form.expiryDate || null,
        status: form.status,
      };

      await api.post("/software", payload);

      toast.success("Vendor Added Successfully");

      setForm({
        serviceName: "",
        vendor: "",
        durationMonths: "",
        amount: "",
        purchaseDate: "",
        expiryDate: "",
        status: "Active",
      });

      setAddModal(false);

      fetchSoftwares();
    } catch (err) {
      console.error(err);

      toast.error(
        err?.response?.data?.message || "Failed to add vendor"
      );
    }
  };

  /* =========================
     DELETE SOFTWARE
  ========================= */
  const deleteSoftware = async (id) => {
    try {
      if (!window.confirm("Delete this vendor?")) return;

      await api.delete(`/software/${id}`);

      toast.success("Deleted Successfully");

      fetchSoftwares();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  /* =========================
     OPEN EDIT
  ========================= */
  const openEdit = (item) => {
    setEditData({
      ...item,

      purchaseDate: item.purchaseDate
        ? item.purchaseDate.split("T")[0]
        : "",

      expiryDate: item.expiryDate
        ? item.expiryDate.split("T")[0]
        : "",
    });

    setEditModal(true);
  };

  /* =========================
     UPDATE SOFTWARE
  ========================= */
  const handleUpdate = async () => {
    try {
      const payload = {
        ...editData,
        durationMonths: Number(editData.durationMonths) || 0,
        amount: Number(editData.amount) || 0,
      };

      await api.put(`/software/${editData._id}`, payload);

      toast.success("Updated Successfully");

      setEditModal(false);
      setEditData(null);

      fetchSoftwares();
    } catch (err) {
      console.error(err);

      toast.error(
        err?.response?.data?.message || "Update failed"
      );
    }
  };

  /* =========================
     FILTER
  ========================= */
  const filtered = useMemo(() => {
    return softwares.filter((s) =>
      `${s.serviceName} ${s.vendor} ${s.status}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [softwares, search]);

  /* =========================
     PAGINATION
  ========================= */
  const paginated = useMemo(() => {
    const start = (page - 1) * limit;

    return filtered.slice(start, start + limit);
  }, [filtered, page]);

  /* =========================
     KPI
  ========================= */
  const kpi = useMemo(() => {
    return {
      total: softwares.length,

      active: softwares.filter(
        (s) => s.status === "Active"
      ).length,

      expired: softwares.filter(
        (s) => s.status === "Expired"
      ).length,

      renewed: softwares.filter(
        (s) => s.status === "Renewed"
      ).length,
    };
  }, [softwares]);

  return (
    <div className="bg-[#f4f6f9] min-h-screen">

      {/* HEADER */}
      <div className="bg-white border-b shadow-sm px-6 py-4 flex items-center justify-between">

        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Vendor Dashboard
          </h1>

          <p className="text-sm text-gray-500">
            Software & License Management
          </p>
        </div>

        <button
          onClick={() => setAddModal(true)}
          className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800"
        >
          + Add Vendor
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 p-6">

        <div className="bg-white rounded-xl shadow-sm border p-5">
          <p className="text-gray-500 text-sm">Total Vendors</p>
          <h2 className="text-3xl font-bold mt-2">
            {kpi.total}
          </h2>
        </div>

        <div className="bg-green-50 rounded-xl shadow-sm border p-5">
          <p className="text-green-700 text-sm">Active</p>
          <h2 className="text-3xl font-bold text-green-700 mt-2">
            {kpi.active}
          </h2>
        </div>

        <div className="bg-red-50 rounded-xl shadow-sm border p-5">
          <p className="text-red-700 text-sm">Expired</p>
          <h2 className="text-3xl font-bold text-red-700 mt-2">
            {kpi.expired}
          </h2>
        </div>

        <div className="bg-blue-50 rounded-xl shadow-sm border p-5">
          <p className="text-blue-700 text-sm">Renewed</p>
          <h2 className="text-3xl font-bold text-blue-700 mt-2">
            {kpi.renewed}
          </h2>
        </div>

      </div>

      {/* SEARCH */}
      <div className="px-6 mb-5">
        <input
          className="w-full md:w-[350px] border rounded-lg px-4 py-2 bg-white"
          placeholder="Search software..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* TABLE */}
      <div className="px-6 pb-10">

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">

          <table className="w-full text-sm">

            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-4 py-3">
                  Service
                </th>

                <th className="text-left px-4 py-3">
                  Vendor
                </th>

                <th className="text-left px-4 py-3">
                  Duration
                </th>

                <th className="text-left px-4 py-3">
                  Amount
                </th>

                <th className="text-left px-4 py-3">
                  Start Date
                </th>

                <th className="text-left px-4 py-3">
                  End Date
                </th>

                <th className="text-left px-4 py-3">
                  Status
                </th>

                <th className="text-center px-4 py-3">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {paginated.map((s) => (
                <tr
                  key={s._id}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="px-4 py-3 font-medium">
                    {s.serviceName}
                  </td>

                  <td className="px-4 py-3">
                    {s.vendor}
                  </td>

                  <td className="px-4 py-3">
                    {s.durationMonths} Months
                  </td>

                  <td className="px-4 py-3">
                    QAR {s.amount}
                  </td>

                  <td className="px-4 py-3">
                    {s.purchaseDate
                      ? new Date(
                          s.purchaseDate
                        ).toLocaleDateString()
                      : "-"}
                  </td>

                  <td className="px-4 py-3">
                    {s.expiryDate
                      ? new Date(
                          s.expiryDate
                        ).toLocaleDateString()
                      : "-"}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold
                      ${
                        s.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : s.status === "Expired"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => openEdit(s)}
                      className="bg-blue-50 text-blue-700 px-3 py-1 rounded mr-2 text-xs"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteSoftware(s._id)}
                      className="bg-red-50 text-red-700 px-3 py-1 rounded text-xs"
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

      {/* ADD MODAL */}
      {addModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white w-[700px] rounded-2xl p-6">

            <h2 className="text-xl font-bold mb-5">
              Add Vendor
            </h2>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-2 gap-4"
            >

              <input
                className="border p-3 rounded-lg"
                placeholder="Service Name"
                value={form.serviceName}
                onChange={(e) =>
                  setForm({
                    ...form,
                    serviceName: e.target.value,
                  })
                }
                required
              />

              <input
                className="border p-3 rounded-lg"
                placeholder="Vendor"
                value={form.vendor}
                onChange={(e) =>
                  setForm({
                    ...form,
                    vendor: e.target.value,
                  })
                }
                required
              />

              <input
                type="number"
                className="border p-3 rounded-lg"
                placeholder="Duration Months"
                value={form.durationMonths}
                onChange={(e) =>
                  setForm({
                    ...form,
                    durationMonths: e.target.value,
                  })
                }
              />

              <input
                type="number"
                className="border p-3 rounded-lg"
                placeholder="Amount"
                value={form.amount}
                onChange={(e) =>
                  setForm({
                    ...form,
                    amount: e.target.value,
                  })
                }
              />

              <div>
                <label className="text-xs text-gray-500">
                  Purchase Date
                </label>

                <input
                  type="date"
                  className="border p-3 rounded-lg w-full"
                  value={form.purchaseDate}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      purchaseDate: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-xs text-gray-500">
                  Expiry Date
                </label>

                <input
                  type="date"
                  className="border p-3 rounded-lg w-full"
                  value={form.expiryDate}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      expiryDate: e.target.value,
                    })
                  }
                />
              </div>

              <select
                className="border p-3 rounded-lg col-span-2"
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value,
                  })
                }
              >
                <option>Active</option>
                <option>Expired</option>
                <option>Renewed</option>
              </select>

              <div className="col-span-2 flex justify-end gap-3 mt-2">

                <button
                  type="button"
                  onClick={() => setAddModal(false)}
                  className="bg-gray-400 text-white px-5 py-2 rounded-lg"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-black text-white px-5 py-2 rounded-lg"
                >
                  Save Vendor
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModal && editData && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white w-[700px] rounded-2xl p-6">

            <h2 className="text-xl font-bold mb-5">
              Edit Vendor
            </h2>

            <div className="grid grid-cols-2 gap-4">

              <input
                className="border p-3 rounded-lg"
                value={editData.serviceName}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    serviceName: e.target.value,
                  })
                }
              />

              <input
                className="border p-3 rounded-lg"
                value={editData.vendor}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    vendor: e.target.value,
                  })
                }
              />

              <input
                type="number"
                className="border p-3 rounded-lg"
                value={editData.durationMonths}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    durationMonths: e.target.value,
                  })
                }
              />

              <input
                type="number"
                className="border p-3 rounded-lg"
                value={editData.amount}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    amount: e.target.value,
                  })
                }
              />

              <input
                type="date"
                className="border p-3 rounded-lg"
                value={editData.purchaseDate || ""}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    purchaseDate: e.target.value,
                  })
                }
              />

              <input
                type="date"
                className="border p-3 rounded-lg"
                value={editData.expiryDate || ""}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    expiryDate: e.target.value,
                  })
                }
              />

              <select
                className="border p-3 rounded-lg col-span-2"
                value={editData.status}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    status: e.target.value,
                  })
                }
              >
                <option>Active</option>
                <option>Expired</option>
                <option>Renewed</option>
              </select>

            </div>

            <div className="flex justify-end gap-3 mt-5">

              <button
                onClick={() => setEditModal(false)}
                className="bg-gray-400 text-white px-5 py-2 rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={handleUpdate}
                className="bg-green-600 text-white px-5 py-2 rounded-lg"
              >
                Update
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}