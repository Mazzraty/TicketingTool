// pages/AdminSoftwareDashboard.jsx

import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AdminSoftwareDashboard() {
  const [softwares, setSoftwares] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 8;

  // MODALS
  const [addModal, setAddModal] = useState(false);
  const [editDrawer, setEditDrawer] = useState(false);
  const [editData, setEditData] = useState(null);

  // INLINE EDIT
  const [inlineEditId, setInlineEditId] = useState(null);
  const [inlineEditData, setInlineEditData] = useState({});

  // SORTING
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

  // DRAWER EDIT
  const openDrawer = (item) => {
    setEditData(item);
    setEditDrawer(true);
  };

  const handleDrawerSave = async () => {
    await api.put(`/software/${editData._id}`, editData);
    toast.success("Updated");
    setEditDrawer(false);
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
      if (!sortConfig.key) return 0;

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

  // KPI
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

  const getStatusColor = (status) => {
    if (status === "Active") return "bg-green-100 text-green-700";
    if (status === "Expired") return "bg-red-100 text-red-700";
    return "bg-blue-100 text-blue-700";
  };

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* 🔥 STICKY KPI BAR */}
      <div className="sticky top-0 z-50 bg-white shadow flex justify-between px-6 py-3">
        <h1 className="font-bold">Software Dashboard</h1>

        <div className="flex gap-5 text-sm">
          <span>Active: {dashboard.active}</span>
          <span>Expiring: {dashboard.expiring}</span>
          <span>Expired: {dashboard.expired}</span>
          <span>Cost: QAR {dashboard.cost}</span>
        </div>

        <button
          onClick={() => setAddModal(true)}
          className="bg-black text-white px-3 py-1 rounded"
        >
          + Add
        </button>
      </div>

      <div className="p-6">

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

            <thead className="bg-gray-100 text-sm">
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

                  {/* STATUS PILL */}
                  <td className="p-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(s.status)}`}>
                      {s.status}
                    </span>
                  </td>

                  <td className="p-3 flex gap-2">

                    <button
                      onClick={() => openDrawer(s)}
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

      {/* 🔥 ADD MODAL */}
      {addModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white w-[600px] p-6 rounded-xl">

            <div className="flex justify-between mb-4">
              <h2 className="font-bold">Add Software</h2>
              <button onClick={() => setAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">

              <input className="border p-2" placeholder="Service"
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

      {/* 🔥 DRAWER */}
      {editDrawer && (
        <div className="fixed inset-0 flex">

          <div className="flex-1 bg-black/40" onClick={() => setEditDrawer(false)} />

          <div className="w-[400px] bg-white p-5">
            <h2 className="font-bold mb-4">Edit Software</h2>

            <input
              className="border p-2 w-full mb-2"
              value={editData.serviceName}
              onChange={(e) =>
                setEditData({ ...editData, serviceName: e.target.value })
              }
            />

            <input
              className="border p-2 w-full mb-4"
              value={editData.vendor}
              onChange={(e) =>
                setEditData({ ...editData, vendor: e.target.value })
              }
            />

            <button
              onClick={handleDrawerSave}
              className="bg-green-600 text-white w-full p-2 rounded"
            >
              Save
            </button>
          </div>

        </div>
      )}

    </div>
  );
}