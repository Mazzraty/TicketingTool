// pages/AdminSoftwareDashboard.jsx

import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AdminSoftwareDashboard() {

  const [softwares, setSoftwares] = useState([]);

  const [form, setForm] = useState({
    serviceName: "",
    vendor: "",
    durationMonths: "",
    amount: "",
    purchaseDate: "",
    expiryDate: "",
    status: "Active",
  });

  // ================= LOAD SOFTWARES =================
  useEffect(() => {

    fetchSoftwares();

  }, []);

  const fetchSoftwares = async () => {

    try {

      const res = await api.get("/software");

      setSoftwares(res.data);

    } catch (err) {

      console.log(err);

      toast.error("Failed to load softwares");
    }
  };

  // ================= ADD SOFTWARE =================
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

      toast.error(
        err.response?.data?.message ||
          "Failed to add software"
      );
    }
  };

  // ================= DELETE SOFTWARE =================
  const deleteSoftware = async (id) => {

    try {

      if (
        !window.confirm(
          "Delete this software?"
        )
      )
        return;

      await api.delete(`/software/${id}`);

      toast.success("Software Deleted");

      fetchSoftwares();

    } catch (err) {

      console.log(err);

      toast.error("Delete Failed");
    }
  };

  // ================= DASHBOARD =================
  const dashboard = useMemo(() => {

    const today = new Date();

    const totalActiveLicenses =
      softwares.filter(
        (s) => s.status === "Active"
      ).length;

    const expiringThisMonth =
      softwares.filter((s) => {

        const expiry = new Date(
          s.expiryDate
        );

        return (
          expiry.getMonth() ===
            today.getMonth() &&
          expiry.getFullYear() ===
            today.getFullYear()
        );
      }).length;

    const expiredServices =
      softwares.filter(
        (s) =>
          new Date(s.expiryDate) <
          today
      ).length;

    const annualSoftwareCost =
      softwares.reduce(
        (sum, item) =>
          sum +
          Number(item.amount || 0),
        0
      );

    return {
      totalActiveLicenses,
      expiringThisMonth,
      expiredServices,
      annualSoftwareCost,
    };

  }, [softwares]);

  // ================= PDF DOWNLOAD =================
  const downloadPDF = () => {

    const doc = new jsPDF();

    doc.setFontSize(18);

    doc.text(
      "Software License Report",
      14,
      18
    );

    doc.setFontSize(10);

    doc.text(
      `Generated: ${new Date().toLocaleString()}`,
      14,
      26
    );

    autoTable(doc, {
      startY: 35,

      head: [
        [
          "Service",
          "Vendor",
          "Duration",
          "Expiry Date",
          "Amount",
          "Status",
        ],
      ],

      body: softwares.map((s) => [
        s.serviceName,
        s.vendor,
        `${s.durationMonths} Months`,
        new Date(
          s.expiryDate
        ).toLocaleDateString(),
        `QAR ${s.amount}`,
        s.status,
      ]),

      didParseCell: function (data) {

        if (
          data.section === "body" &&
          data.row.raw[5] ===
            "Expired"
        ) {
          data.cell.styles.textColor =
            [255, 0, 0];
        }
      },
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

          <p className="text-sm text-gray-500">
            Manage company software &
            subscription renewals
          </p>
        </div>

        <button
          onClick={downloadPDF}
          className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl shadow"
        >
          Download PDF
        </button>

      </div>

      {/* DASHBOARD CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">

        <div className="bg-blue-600 text-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-sm opacity-80">
            Total Active Licenses
          </h2>

          <h1 className="text-4xl font-bold mt-3">
            {
              dashboard.totalActiveLicenses
            }
          </h1>
        </div>

        <div className="bg-yellow-500 text-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-sm opacity-80">
            Expiring This Month
          </h2>

          <h1 className="text-4xl font-bold mt-3">
            {
              dashboard.expiringThisMonth
            }
          </h1>
        </div>

        <div className="bg-red-600 text-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-sm opacity-80">
            Expired Services
          </h2>

          <h1 className="text-4xl font-bold mt-3">
            {
              dashboard.expiredServices
            }
          </h1>
        </div>

        <div className="bg-green-600 text-white rounded-2xl p-6 shadow-lg">
          <h2 className="text-sm opacity-80">
            Annual Software Cost
          </h2>

          <h1 className="text-4xl font-bold mt-3">
            QAR{" "}
            {
              dashboard.annualSoftwareCost
            }
          </h1>
        </div>

      </div>

      {/* ADD SOFTWARE */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">

        <h2 className="text-xl font-semibold mb-5">
          Add Software
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >

          <input
            type="text"
            placeholder="Service Name"
            value={form.serviceName}
            onChange={(e) =>
              setForm({
                ...form,
                serviceName:
                  e.target.value,
              })
            }
            className="border rounded-xl p-3"
            required
          />

          <input
            type="text"
            placeholder="Vendor"
            value={form.vendor}
            onChange={(e) =>
              setForm({
                ...form,
                vendor:
                  e.target.value,
              })
            }
            className="border rounded-xl p-3"
            required
          />

          <input
            type="number"
            placeholder="Duration Months"
            value={
              form.durationMonths
            }
            onChange={(e) =>
              setForm({
                ...form,
                durationMonths:
                  e.target.value,
              })
            }
            className="border rounded-xl p-3"
            required
          />

          <input
            type="number"
            placeholder="Amount"
            value={form.amount}
            onChange={(e) =>
              setForm({
                ...form,
                amount:
                  e.target.value,
              })
            }
            className="border rounded-xl p-3"
          />

          <input
            type="date"
            value={form.purchaseDate}
            onChange={(e) =>
              setForm({
                ...form,
                purchaseDate:
                  e.target.value,
              })
            }
            className="border rounded-xl p-3"
            required
          />

          <input
            type="date"
            value={form.expiryDate}
            onChange={(e) =>
              setForm({
                ...form,
                expiryDate:
                  e.target.value,
              })
            }
            className="border rounded-xl p-3"
            required
          />

          <select
            value={form.status}
            onChange={(e) =>
              setForm({
                ...form,
                status:
                  e.target.value,
              })
            }
            className="border rounded-xl p-3"
          >
            <option value="Active">
              Active
            </option>

            <option value="Expired">
              Expired
            </option>

            <option value="Renewed">
              Renewed
            </option>
          </select>

          <button
            type="submit"
            className="bg-black hover:bg-gray-800 text-white rounded-xl p-3"
          >
            Save Software
          </button>

        </form>

      </div>

      {/* SOFTWARE TABLE */}
      <div className="bg-white rounded-2xl shadow-lg overflow-auto">

        <table className="w-full">

          <thead className="bg-gray-200">

            <tr>

              <th className="p-4 text-left">
                Service
              </th>

              <th className="p-4 text-left">
                Vendor
              </th>

              <th className="p-4 text-left">
                Duration
              </th>

              <th className="p-4 text-left">
                Expiry Date
              </th>

              <th className="p-4 text-left">
                Amount
              </th>

              <th className="p-4 text-left">
                Status
              </th>

              <th className="p-4 text-left">
                Action
              </th>

            </tr>

          </thead>

          <tbody>

            {softwares.map((s) => {

              const isExpired =
                new Date(
                  s.expiryDate
                ) < new Date();

              return (
                <tr
                  key={s._id}
                  className="border-b hover:bg-gray-50"
                >

                  <td className="p-4">
                    {s.serviceName}
                  </td>

                  <td className="p-4">
                    {s.vendor}
                  </td>

                  <td className="p-4">
                    {s.durationMonths} Months
                  </td>

                  <td
                    className={`p-4 font-semibold ${
                      isExpired
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {new Date(
                      s.expiryDate
                    ).toLocaleDateString()}
                  </td>

                  <td className="p-4">
                    QAR {s.amount}
                  </td>

                  <td className="p-4">

                    <span
                      className={`px-3 py-1 rounded-full text-white text-sm ${
                        s.status ===
                        "Expired"
                          ? "bg-red-600"
                          : s.status ===
                            "Renewed"
                          ? "bg-blue-600"
                          : "bg-green-600"
                      }`}
                    >
                      {s.status}
                    </span>

                  </td>

                  <td className="p-4">

                    <button
                      onClick={() =>
                        deleteSoftware(
                          s._id
                        )
                      }
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                    >
                      Delete
                    </button>

                  </td>

                </tr>
              );
            })}

          </tbody>

        </table>

      </div>

    </div>
  );
}