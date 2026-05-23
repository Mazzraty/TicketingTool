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

  const [editDrawer, setEditDrawer] = useState(false);
  const [editData, setEditData] = useState(null);

  const [inlineEditId, setInlineEditId] = useState(null);
  const [inlineEditData, setInlineEditData] = useState({});

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post("/software", form);
    toast.success("Added");
    setForm({
      serviceName: "",
      vendor: "",
      durationMonths: "",
      amount: "",
      purchaseDate: "",
      expiryDate: "",
      status: "Active",
    });
    fetchSoftwares();
  };

  const deleteSoftware = async (id) => {
    if (!window.confirm("Delete?")) return;
    await api.delete(`/software/${id}`);
    toast.success("Deleted");
    fetchSoftwares();
  };

  const openDrawer = (item) => {
    setEditData(item);
    setEditDrawer(true);
  };

  const handleDrawerSave = async () => {
    await api.put(`/software/${editData._id}`, editData);
    toast.success("Updated");
    setEditDrawer(false);
    setEditData(null);
    fetchSoftwares();
  };

  // SORTING
  const sortedData = useMemo(() => {
    let sorted = [...softwares];

    if (sortConfig.key) {
      sorted.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (aVal < bVal)
          return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal)
          return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return sorted;
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

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-700";
      case "Expired":
        return "bg-red-100 text-red-700";
      case "Renewed":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* 🔥 STICKY KPI BAR */}
      <div className="sticky top-0 z-50 bg-white shadow-md p-3 flex gap-4 justify-between">
        <div className="font-bold">Software Dashboard</div>

        <div className="flex gap-4 text-sm">
          <span>Active: {dashboard.active}</span>
          <span>Expiring: {dashboard.expiring}</span>
          <span>Expired: {dashboard.expired}</span>
          <span>Cost: QAR {dashboard.cost}</span>
        </div>
      </div>

      <div className="p-6">

        {/* SEARCH */}
        <input
          className="border p-2 rounded w-1/3 mb-4"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* FORM (kept simple) */}
        <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-3 mb-6">
          <input placeholder="Service" className="border p-2"
            value={form.serviceName}
            onChange={(e) => setForm({ ...form, serviceName: e.target.value })}
          />
          <input placeholder="Vendor" className="border p-2"
            value={form.vendor}
            onChange={(e) => setForm({ ...form, vendor: e.target.value })}
          />
          <input placeholder="Amount" className="border p-2"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />

          <button className="bg-black text-white p-2 col-span-3">
            Add
          </button>
        </form>

        {/* TABLE */}
        <div className="bg-white rounded shadow overflow-auto">
          <table className="w-full">

            <thead className="bg-gray-100 text-sm">
              <tr>
                <th onClick={() => requestSort("serviceName")} className="p-3 cursor-pointer">Service</th>
                <th onClick={() => requestSort("vendor")} className="p-3 cursor-pointer">Vendor</th>
                <th className="p-3">Expiry</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {paginated.map((s) => (
                <tr key={s._id} className="border-t hover:bg-gray-50">

                  {/* INLINE EDIT */}
                  <td className="p-3">
                    {inlineEditId === s._id ? (
                      <input
                        value={inlineEditData.serviceName}
                        onChange={(e) =>
                          setInlineEditData({
                            ...inlineEditData,
                            serviceName: e.target.value,
                          })
                        }
                        className="border p-1"
                      />
                    ) : (
                      s.serviceName
                    )}
                  </td>

                  <td className="p-3">{s.vendor}</td>
                  <td className="p-3">
                    {new Date(s.expiryDate).toLocaleDateString()}
                  </td>

                  {/* STATUS BADGE */}
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(s.status)}`}>
                      {s.status}
                    </span>
                  </td>

                  <td className="p-3 flex gap-2">

                    <button
                      onClick={() => openDrawer(s)}
                      className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded"
                    >
                      Drawer
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

      {/* DRAWER EDIT */}
      {editDrawer && (
        <div className="fixed inset-0 flex">

          <div className="flex-1 bg-black/40" onClick={() => setEditDrawer(false)} />

          <div className="w-[400px] bg-white p-5 shadow-xl">
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
              className="bg-green-600 text-white px-3 py-2 rounded w-full"
            >
              Save
            </button>
          </div>

        </div>
      )}

    </div>
  );
}