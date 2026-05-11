// pages/AdminSoftwareDashboard.jsx

import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AdminSoftwareDashboard() {

  const [softwares, setSoftwares] = useState([]);

  // ================= NEW UI STATES (ADDED ONLY) =================
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

  // ================= LOAD SOFTWARES (NO CHANGE) =================
  useEffect(() => {
    fetchSoftwares();
  }, []);

  const fetchSoftwares = async () => {
    try {
      const res = await api.get("/software");
      setSoftwares(res.data.data || res.data);
    } catch (err) {
      console.log(err);
      toast.error("Failed to load softwares");
    }
  };

  // ================= ADD SOFTWARE (NO CHANGE) =================
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
      console.log(err);
      toast.error(err.response?.data?.message || "Failed to add software");
    }
  };

  // ================= DELETE SOFTWARE (NO CHANGE) =================
  const deleteSoftware = async (id) => {
    try {
      if (!window.confirm("Delete this software?")) return;

      await api.delete(`/software/${id}`);

      toast.success("Software Deleted");

      fetchSoftwares();
    } catch (err) {
      console.log(err);
      toast.error("Delete Failed");
    }
  };

  // ================= EDIT (ADDED ONLY - NO CHANGE TO EXISTING LOGIC) =================
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
      console.log(err);
      toast.error("Update Failed");
    }
  };

  // ================= SEARCH (ADDED ONLY) =================
  const filteredSoftwares = useMemo(() => {
    return softwares.filter((s) =>
      `${s.serviceName} ${s.vendor} ${s.status}`
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [softwares, search]);

  // ================= PAGINATION (ADDED ONLY) =================
  const totalPages = Math.ceil(filteredSoftwares.length / limit);

  const paginatedSoftwares = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredSoftwares.slice(start, start + limit);
  }, [filteredSoftwares, page]);

  // ================= DASHBOARD (NO CHANGE) =================
  const dashboard = useMemo(() => {
    const today = new Date();

    const totalActiveLicenses =
      softwares.filter((s) => s.status === "Active").length;

    const expiringThisMonth =
      softwares.filter((s) => {
        const expiry = new Date(s.expiryDate);
        return (
          expiry.getMonth() === today.getMonth() &&
          expiry.getFullYear() === today.getFullYear()
        );
      }).length;

    const expiredServices =
      softwares.filter((s) => new Date(s.expiryDate) < today).length;

    const annualSoftwareCost =
      softwares.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return {
      totalActiveLicenses,
      expiringThisMonth,
      expiredServices,
      annualSoftwareCost,
    };
  }, [softwares]);

  // ================= PDF (NO CHANGE) =================
  const downloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Software License Report", 14, 18);

    doc.setFontSize(10);
    doc.text(
      `Generated: ${new Date().toLocaleString()}`,
      14,
      26
    );

    autoTable(doc, {
      startY: 35,
      head: [["Service", "Vendor", "Duration", "Expiry Date", "Amount", "Status"]],
      body: softwares.map((s) => [
        s.serviceName,
        s.vendor,
        `${s.durationMonths} Months`,
        new Date(s.expiryDate).toLocaleDateString(),
        `QAR ${s.amount}`,
        s.status,
      ]),
    });

    doc.text(
      `Total Annual Cost: QAR ${dashboard.annualSoftwareCost}`,
      14,
      doc.lastAutoTable.finalY + 15
    );

    doc.save("software-report.pdf");
  };

  return (
    <div className="p-6 bg-[#f4f6f9] min-h-screen">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Software License Dashboard
          </h1>
        </div>

        <button
          onClick={downloadPDF}
          className="bg-red-600 text-white px-5 py-3 rounded-xl"
        >
          Download PDF
        </button>
      </div>

      {/* ================= SEARCH (ADDED ONLY) ================= */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search software..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full md:w-1/3 border p-3 rounded-xl"
        />
      </div>

      {/* DASHBOARD CARDS (NO CHANGE) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">

        <div className="bg-blue-600 text-white p-6 rounded-xl">
          Active: {dashboard.totalActiveLicenses}
        </div>

        <div className="bg-yellow-500 text-white p-6 rounded-xl">
          Expiring: {dashboard.expiringThisMonth}
        </div>

        <div className="bg-red-600 text-white p-6 rounded-xl">
          Expired: {dashboard.expiredServices}
        </div>

        <div className="bg-green-600 text-white p-6 rounded-xl">
          Cost: QAR {dashboard.annualSoftwareCost}
        </div>

      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow overflow-auto">

        <table className="w-full">

          <thead className="bg-gray-200">
            <tr>
              <th className="p-4">Service</th>
              <th className="p-4">Vendor</th>
              <th className="p-4">Expiry</th>
              <th className="p-4">Status</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>

          <tbody>
            {paginatedSoftwares.map((s) => (
              <tr key={s._id} className="border-b">

                <td className="p-4">{s.serviceName}</td>
                <td className="p-4">{s.vendor}</td>
                <td className="p-4">
                  {new Date(s.expiryDate).toLocaleDateString()}
                </td>
                <td className="p-4">{s.status}</td>

                <td className="p-4 flex gap-2">

                  {/* ================= EDIT BUTTON (ADDED ONLY) ================= */}
                  <button
                    onClick={() => openEdit(s)}
                    className="bg-blue-600 text-white px-3 py-1 rounded"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => deleteSoftware(s._id)}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>

                </td>

              </tr>
            ))}
          </tbody>

        </table>

      </div>

      {/* ================= PAGINATION (ADDED ONLY) ================= */}
      <div className="flex justify-center gap-2 mt-5">

        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-4 py-2 bg-gray-300 rounded"
        >
          Prev
        </button>

        <span className="px-4 py-2">
          {page} / {totalPages || 1}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="px-4 py-2 bg-gray-300 rounded"
        >
          Next
        </button>

      </div>

      {/* ================= EDIT MODAL (ADDED ONLY, SAP STYLE SIMPLE) ================= */}
      {editModal && editData && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">

          <div className="bg-white p-6 rounded-xl w-[400px]">

            <h2 className="text-xl font-bold mb-4">
              Edit Software
            </h2>

            <input
              className="border w-full p-2 mb-2"
              value={editData.serviceName}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  serviceName: e.target.value,
                })
              }
            />

            <input
              className="border w-full p-2 mb-2"
              value={editData.vendor}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  vendor: e.target.value,
                })
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