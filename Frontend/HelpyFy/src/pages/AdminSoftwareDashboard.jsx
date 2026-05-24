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

  useEffect(() => {
    fetchSoftwares();
  }, []);

  const fetchSoftwares = async () => {
    try {
      const res = await api.get("/software");
      setSoftwares(res.data.data || res.data);
    } catch {
      toast.error("Failed to load softwares");
    }
  };

  // ADD
  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post("/software", form);
    toast.success("Software Added");

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
  };

  // DELETE
  const deleteSoftware = async (id) => {
    if (!window.confirm("Delete this software?")) return;
    await api.delete(`/software/${id}`);
    toast.success("Deleted");
    fetchSoftwares();
  };

  // EDIT
  const openEdit = (item) => {
    setEditData(item);
    setEditModal(true);
  };

  const handleUpdate = async () => {
    await api.put(`/software/${editData._id}`, editData);
    toast.success("Updated Successfully");

    setEditModal(false);
    setEditData(null);
    fetchSoftwares();
  };

  // FILTER
  const filtered = useMemo(() => {
    return softwares.filter((s) =>
      `${s.serviceName} ${s.vendor} ${s.status}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [softwares, search]);

  // PAGINATION
  const paginated = useMemo(() => {
    const start = (page - 1) * limit;
    return filtered.slice(start, start + limit);
  }, [filtered, page]);

  // KPI
  const kpi = useMemo(() => {
    return {
      total: softwares.length,
      active: softwares.filter((s) => s.status === "Active").length,
      expired: softwares.filter((s) => s.status === "Expired").length,
      renewed: softwares.filter((s) => s.status === "Renewed").length,
    };
  }, [softwares]);

  return (
    <div className="bg-gray-100 min-h-screen">

      {/* HEADER */}
      <div className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="font-bold text-xl">Vendor Dashboard</h1>

        <button
          onClick={() => setAddModal(true)}
          className="bg-black text-white px-4 py-2 rounded"
        >
          + Add Vendor
        </button>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-4 gap-4 p-6">

        <div className="bg-white p-4 rounded shadow text-center">
          <p>Total</p>
          <p className="font-bold text-xl">{kpi.total}</p>
        </div>

        <div className="bg-green-100 p-4 rounded shadow text-center">
          <p className="text-green-700">Active</p>
          <p className="font-bold text-xl text-green-700">{kpi.active}</p>
        </div>

        <div className="bg-red-100 p-4 rounded shadow text-center">
          <p className="text-red-700">Expired</p>
          <p className="font-bold text-xl text-red-700">{kpi.expired}</p>
        </div>

        <div className="bg-blue-100 p-4 rounded shadow text-center">
          <p className="text-blue-700">Renewed</p>
          <p className="font-bold text-xl text-blue-700">{kpi.renewed}</p>
        </div>

      </div>

      {/* SEARCH */}
      <div className="px-6">
        <input
          className="border p-2 rounded w-1/3 mb-4"
          placeholder="Search software..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* TABLE */}
        <div className="bg-white rounded shadow overflow-hidden">

          <table className="w-full text-sm">

            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-4">Service</th>
                <th className="p-4">Vendor</th>
                <th className="p-4">Start Date</th>
                <th className="p-4">End Date</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {paginated.map((s) => (
                <tr key={s._id} className="border-t hover:bg-gray-50">

                  <td className="p-4">{s.serviceName}</td>
                  <td className="p-4">{s.vendor}</td>

                  <td className="p-4">
                    {new Date(s.purchaseDate).toLocaleDateString()}
                  </td>

                  <td className="p-4">
                    {new Date(s.expiryDate).toLocaleDateString()}
                  </td>

                  <td className="p-4">
                    <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">
                      {s.status}
                    </span>
                  </td>

                  <td className="p-4 text-center">
                    <button
                      onClick={() => openEdit(s)}
                      className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded mr-2"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteSoftware(s._id)}
                      className="px-3 py-1 text-xs bg-red-50 text-red-700 rounded"
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

      {/* ================= ADD MODAL ================= */}
     {addModal && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
    <div className="bg-white w-[650px] p-6 rounded-xl">

      <h2 className="font-bold mb-4">Add Vendor</h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">

        <input
          className="border p-2 rounded"
          placeholder="Service Name"
          value={form.serviceName}
          onChange={(e) =>
            setForm({ ...form, serviceName: e.target.value })
          }
        />

        <input
          className="border p-2 rounded"
          placeholder="Vendor"
          value={form.vendor}
          onChange={(e) =>
            setForm({ ...form, vendor: e.target.value })
          }
        />

        <input
          className="border p-2 rounded"
          placeholder="Duration"
          value={form.durationMonths}
          onChange={(e) =>
            setForm({ ...form, durationMonths: e.target.value })
          }
        />

        <input
          className="border p-2 rounded"
          placeholder="Amount"
          value={form.amount}
          onChange={(e) =>
            setForm({ ...form, amount: e.target.value })
          }
        />

        {/* START DATE */}
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">
            Start Date
          </label>

          <input
            type="date"
            className="border p-2 rounded"
            value={form.purchaseDate}
            onChange={(e) =>
              setForm({
                ...form,
                purchaseDate: e.target.value,
              })
            }
          />
        </div>

        {/* END DATE */}
        <div className="flex flex-col">
          <label className="text-xs text-gray-500 mb-1">
            End Date
          </label>

          <input
            type="date"
            className="border p-2 rounded"
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
          className="border p-2 rounded col-span-2"
          value={form.status}
          onChange={(e) =>
            setForm({ ...form, status: e.target.value })
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
            className="px-4 py-2 bg-gray-400 text-white rounded"
          >
            Cancel
          </button>

          <button className="px-4 py-2 bg-black text-white rounded">
            Save
          </button>
        </div>

      </form>
    </div>
  </div>
)}

      {/* ================= EDIT MODAL ================= */}
      {editModal && editData && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

          <div className="bg-white w-[650px] p-6 rounded-xl">

            <h2 className="font-bold mb-4">Edit vendor</h2>

            <div className="grid grid-cols-2 gap-4">

              <input className="border p-2 rounded"
                value={editData.serviceName}
                onChange={(e) =>
                  setEditData({ ...editData, serviceName: e.target.value })
                }
              />

              <input className="border p-2 rounded"
                value={editData.vendor}
                onChange={(e) =>
                  setEditData({ ...editData, vendor: e.target.value })
                }
              />

              <input className="border p-2 rounded"
                value={editData.durationMonths}
                onChange={(e) =>
                  setEditData({ ...editData, durationMonths: e.target.value })
                }
              />

              <input className="border p-2 rounded"
                value={editData.amount}
                onChange={(e) =>
                  setEditData({ ...editData, amount: e.target.value })
                }
              />

              <input type="date" className="border p-2 rounded"
                value={editData.purchaseDate}
                onChange={(e) =>
                  setEditData({ ...editData, purchaseDate: e.target.value })
                }
              />

              <input type="date" className="border p-2 rounded"
                value={editData.expiryDate}
                onChange={(e) =>
                  setEditData({ ...editData, expiryDate: e.target.value })
                }
              />

              <select className="border p-2 rounded col-span-2"
                value={editData.status}
                onChange={(e) =>
                  setEditData({ ...editData, status: e.target.value })
                }
              >
                <option>Active</option>
                <option>Expired</option>
                <option>Renewed</option>
              </select>

            </div>

            <div className="flex justify-end gap-3 mt-4">

              <button
                onClick={() => setEditModal(false)}
                className="px-4 py-2 bg-gray-400 text-white rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-green-600 text-white rounded"
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