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

  // LOAD
  useEffect(() => {
    fetchSoftwares();
  }, []);

  const fetchSoftwares = async () => {
    try {
      const res = await api.get("/software");
      setSoftwares(res.data.data || res.data);
    } catch (err) {
      toast.error("Failed to load softwares");
    }
  };

  // ADD
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
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

      fetchSoftwares();
    } catch (err) {
      toast.error("Failed to add software");
    }
  };

  // DELETE
  const deleteSoftware = async (id) => {
    try {
      if (!window.confirm("Delete this software?")) return;

      await api.delete(`/software/${id}`);

      toast.success("Software Deleted");
      fetchSoftwares();
    } catch (err) {
      toast.error("Delete Failed");
    }
  };

  // EDIT
  const openEdit = (item) => {
    setEditData(item);
    setEditModal(true);
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/software/${editData._id}`, editData);

      toast.success("Updated Successfully");

      setEditModal(false);
      setEditData(null);

      fetchSoftwares();
    } catch (err) {
      toast.error("Update Failed");
    }
  };

  // SEARCH
  const filteredSoftwares = useMemo(() => {
    return softwares.filter((s) =>
      `${s.serviceName} ${s.vendor} ${s.status}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [softwares, search]);

  // PAGINATION
  const totalPages = Math.ceil(filteredSoftwares.length / limit);

  const paginatedSoftwares = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredSoftwares.slice(start, start + limit);
  }, [filteredSoftwares, page]);

  // DASHBOARD
  const dashboard = useMemo(() => {
    const today = new Date();

    return {
      totalActiveLicenses: softwares.filter((s) => s.status === "Active").length,
      expiringThisMonth: softwares.filter((s) => {
        const d = new Date(s.expiryDate);
        return d.getMonth() === today.getMonth();
      }).length,
      expiredServices: softwares.filter((s) => new Date(s.expiryDate) < today).length,
      annualSoftwareCost: softwares.reduce((a, b) => a + Number(b.amount || 0), 0),
    };
  }, [softwares]);

  // PDF
  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.text("Software Report", 14, 15);

    autoTable(doc, {
      startY: 25,
      head: [["Service", "Vendor", "Duration", "Expiry", "Amount", "Status"]],
      body: softwares.map((s) => [
        s.serviceName,
        s.vendor,
        `${s.durationMonths} Months`,
        new Date(s.expiryDate).toLocaleDateString(),
        `QAR ${s.amount}`,
        s.status,
      ]),
    });

    doc.save("software.pdf");
  };

  return (
    <div className="p-6 bg-[#f4f6f9] min-h-screen">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Vendor List</h1>

        <button
          onClick={downloadPDF}
          className="bg-red-600 text-white px-5 py-3 rounded-xl"
        >
          Download PDF
        </button>
      </div>

      {/* SEARCH */}
      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="border p-3 rounded-xl w-full md:w-1/3"
          placeholder="Search software..."
        />
      </div>

      {/* DASHBOARD CARDS */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-600 text-white p-4 rounded-xl">Active: {dashboard.totalActiveLicenses}</div>
        <div className="bg-yellow-500 text-white p-4 rounded-xl">Expiring: {dashboard.expiringThisMonth}</div>
        <div className="bg-red-600 text-white p-4 rounded-xl">Expired: {dashboard.expiredServices}</div>
        <div className="bg-green-600 text-white p-4 rounded-xl">Cost: QAR {dashboard.annualSoftwareCost}</div>
      </div>

      {/* ADD SOFTWARE */}
      <div className="bg-white p-6 rounded-2xl shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Add Software</h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-4">

          <input className="border p-2 rounded" placeholder="Service Name"
            value={form.serviceName}
            onChange={(e) => setForm({ ...form, serviceName: e.target.value })}
          />

          <input className="border p-2 rounded" placeholder="Vendor"
            value={form.vendor}
            onChange={(e) => setForm({ ...form, vendor: e.target.value })}
          />

          <input className="border p-2 rounded" placeholder="Months"
            value={form.durationMonths}
            onChange={(e) => setForm({ ...form, durationMonths: e.target.value })}
          />

          <input className="border p-2 rounded" placeholder="Amount"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />

          <input type="date" className="border p-2 rounded"
            value={form.purchaseDate}
            onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
          />

          <input type="date" className="border p-2 rounded"
            value={form.expiryDate}
            onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
          />

          <select className="border p-2 rounded"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option>Active</option>
            <option>Expired</option>
            <option>Renewed</option>
          </select>

          <button className="bg-black text-white rounded p-2 col-span-3">
            Save Software
          </button>

        </form>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow overflow-auto">

        <table className="w-full">

          <thead className="bg-gray-200">
            <tr>
              <th className="p-4 text-left">Service</th>
              <th className="p-4 text-left">Vendor</th>
              <th className="p-4 text-left">Expiry</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Action</th>
            </tr>
          </thead>

          <tbody>

            {paginatedSoftwares.map((s) => (
              <tr key={s._id} className="border-b">

                <td className="p-4">{s.serviceName}</td>
                <td className="p-4">{s.vendor}</td>
                <td className="p-4">{new Date(s.expiryDate).toLocaleDateString()}</td>
                <td className="p-4">{s.status}</td>

                {/* ================= SAP STYLE ACTION BUTTONS ================= */}
                <td className="p-4">
                  <div className="flex items-center gap-2">

                    <button
                      onClick={() => openEdit(s)}
                      className="px-3 py-1 text-xs font-semibold rounded-md 
                                 bg-blue-50 text-blue-700 border border-blue-200
                                 hover:bg-blue-100 transition"
                    >
                      ✏ Edit
                    </button>

                    <button
                      onClick={() => deleteSoftware(s._id)}
                      className="px-3 py-1 text-xs font-semibold rounded-md 
                                 bg-red-50 text-red-700 border border-red-200
                                 hover:bg-red-100 transition"
                    >
                      🗑 Delete
                    </button>

                  </div>
                </td>

              </tr>
            ))}

          </tbody>

        </table>

      </div>

      {/* PAGINATION */}
      <div className="flex justify-center mt-5 gap-3">

        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Prev
        </button>

        <span>{page} / {totalPages || 1}</span>

        <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>
          Next
        </button>

      </div>

      {/* EDIT MODAL */}
      {editModal && editData && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

          <div className="bg-white p-6 rounded-xl w-[400px]">

            <h2 className="text-xl font-bold mb-4">Edit Software</h2>

            <input
              className="border p-2 w-full mb-2"
              value={editData.serviceName}
              onChange={(e) =>
                setEditData({ ...editData, serviceName: e.target.value })
              }
            />

            <input
              className="border p-2 w-full mb-2"
              value={editData.vendor}
              onChange={(e) =>
                setEditData({ ...editData, vendor: e.target.value })
              }
            />

            <button
              onClick={handleUpdate}
              className="bg-green-600 text-white px-4 py-2 rounded mr-2"
            >
              Save
            </button>

            <button
              onClick={() => setEditModal(false)}
              className="bg-gray-400 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>

          </div>

        </div>
      )}

    </div>
  );
}
