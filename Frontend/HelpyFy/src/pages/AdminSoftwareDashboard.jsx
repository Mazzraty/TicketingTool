// pages/AdminSoftwareDashboard.jsx

import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function AdminSoftwareDashboard() {
  const [softwares, setSoftwares] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 8;

  // MODALS ONLY
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState(null);

  const [sortConfig, setSortConfig] = useState({
    key: "serviceName",
    direction: "asc",
  });

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

  // OPEN EDIT MODAL
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

  // SORT
  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    const data = [...softwares];

    data.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [softwares, sortConfig]);

  const filtered = useMemo(() => {
    return sortedData.filter((s) =>
      `${s.serviceName} ${s.vendor} ${s.status}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [sortedData, search]);

  const paginated = useMemo(() => {
    const start = (page - 1) * limit;
    return filtered.slice(start, start + limit);
  }, [filtered, page]);

  const dashboard = useMemo(() => {
    const today = new Date();

    return {
      active: softwares.filter((s) => s.status === "Active").length,
      expiring: softwares.filter((s) => {
        const d = new Date(s.expiryDate);
        return d.getMonth() === today.getMonth();
      }).length,
      expired: softwares.filter((s) => new Date(s.expiryDate) < today).length,
      cost: softwares.reduce((a, b) => a + Number(b.amount || 0), 0),
    };
  }, [softwares]);

  return (
    <div className="bg-gray-100 min-h-screen">

      {/* HEADER */}
      <div className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <h1 className="font-bold text-xl">Software Dashboard</h1>

        <button
          onClick={() => setAddModal(true)}
          className="bg-black text-white px-4 py-2 rounded"
        >
          + Add Software
        </button>
      </div>

      {/* KPI (NON-STICKY SIMPLE BAR) */}
      <div className="grid grid-cols-4 gap-4 p-6">
        <div className="bg-white p-4 rounded shadow">Active: {dashboard.active}</div>
        <div className="bg-white p-4 rounded shadow">Expiring: {dashboard.expiring}</div>
        <div className="bg-white p-4 rounded shadow">Expired: {dashboard.expired}</div>
        <div className="bg-white p-4 rounded shadow">Cost: QAR {dashboard.cost}</div>
      </div>

      <div className="px-6">

        {/* SEARCH */}
        <input
          className="border p-2 rounded w-1/3 mb-4"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* TABLE */}
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="w-full">

            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 cursor-pointer" onClick={() => requestSort("serviceName")}>
                  Service
                </th>
                <th className="p-3 cursor-pointer" onClick={() => requestSort("vendor")}>
                  Vendor
                </th>
                <th className="p-3">Expiry</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {paginated.map((s) => (
                <tr key={s._id} className="border-t hover:bg-gray-50">

                  <td className="p-3">{s.serviceName}</td>
                  <td className="p-3">{s.vendor}</td>
                  <td className="p-3">
                    {new Date(s.expiryDate).toLocaleDateString()}
                  </td>

                  <td className="p-3">
                    <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">
                      {s.status}
                    </span>
                  </td>

                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => openEdit(s)}
                      className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteSoftware(s._id)}
                      className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded"
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
          <div className="bg-white w-[600px] p-6 rounded-xl">

            <h2 className="font-bold mb-4">Add Software</h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">

              <input className="border p-2" placeholder="Service Name"
                value={form.serviceName}
                onChange={(e) => setForm({ ...form, serviceName: e.target.value })}
              />

              <input className="border p-2" placeholder="Vendor"
                value={form.vendor}
                onChange={(e) => setForm({ ...form, vendor: e.target.value })}
              />

              <input className="border p-2" placeholder="Amount"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />

              <input type="date" className="border p-2"
                value={form.purchaseDate}
                onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
              />

              <input type="date" className="border p-2"
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
              />

              <select className="border p-2 col-span-2"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option>Active</option>
                <option>Expired</option>
                <option>Renewed</option>
              </select>

              <button className="bg-black text-white p-2 col-span-2 rounded">
                Save
              </button>

            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT MODAL ================= */}
      {editModal && editData && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white w-[500px] p-6 rounded-xl">

            <h2 className="font-bold mb-4">Edit Software</h2>

            <input className="border p-2 w-full mb-2"
              value={editData.serviceName}
              onChange={(e) =>
                setEditData({ ...editData, serviceName: e.target.value })
              }
            />

            <input className="border p-2 w-full mb-4"
              value={editData.vendor}
              onChange={(e) =>
                setEditData({ ...editData, vendor: e.target.value })
              }
            />

            <button
              onClick={handleUpdate}
              className="bg-green-600 text-white w-full p-2 rounded"
            >
              Update
            </button>

          </div>
        </div>
      )}

    </div>
  );
}