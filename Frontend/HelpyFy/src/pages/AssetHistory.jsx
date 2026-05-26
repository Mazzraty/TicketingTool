// pages/AssetHistoryPage.jsx

import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AssetHistoryPage() {
  const [employees, setEmployees] = useState([]);
  const [assets, setAssets] = useState([]);

  // SEARCH VALUES
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [assetSearch, setAssetSearch] = useState("");

  // SELECTED VALUES
  const [employeeId, setEmployeeId] = useState("");
  const [assetCode, setAssetCode] = useState("");

  const [assetType, setAssetType] = useState("All");

  const [empHistory, setEmpHistory] = useState([]);
  const [assetHistory, setAssetHistory] = useState([]);

  const [loadingEmp, setLoadingEmp] = useState(false);
  const [loadingAsset, setLoadingAsset] = useState(false);

  /* ===================================
     LOAD EMPLOYEES + ASSETS
  =================================== */
  useEffect(() => {
    const loadData = async () => {
      try {
        const [empRes, assetRes] = await Promise.all([
          api.get("/employees"),
          api.get("/assets?limit=1000"),
        ]);

        console.log("EMPLOYEES =>", empRes.data);
        console.log("ASSETS =>", assetRes.data);

        setEmployees(
          Array.isArray(empRes.data)
            ? empRes.data
            : empRes.data?.employees || []
        );

        setAssets(
          Array.isArray(assetRes.data)
            ? assetRes.data
            : Array.isArray(assetRes.data?.assets)
            ? assetRes.data.assets
            : []
        );
      } catch (err) {
        console.error(err);
        toast.error("Failed to load data");
      }
    };

    loadData();
  }, []);

  /* ===================================
     EMPLOYEE HISTORY
  =================================== */
  useEffect(() => {
    if (!employeeId) {
      setEmpHistory([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoadingEmp(true);

        const res = await api.get(
          `/assets/employee/${employeeId}?type=${assetType}`
        );

        setEmpHistory(
          Array.isArray(res.data) ? res.data : []
        );
      } catch (err) {
        console.error(err);
        toast.error("Employee history not found");
      } finally {
        setLoadingEmp(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [employeeId, assetType]);

  /* ===================================
     ASSET HISTORY
  =================================== */
  useEffect(() => {
    if (!assetCode) {
      setAssetHistory([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoadingAsset(true);

        const res = await api.get(
          `/assets/asset/${assetCode}?type=${assetType}`
        );

        setAssetHistory(
          Array.isArray(res.data) ? res.data : []
        );
      } catch (err) {
        console.error(err);
        toast.error("Asset history not found");
      } finally {
        setLoadingAsset(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [assetCode, assetType]);

  /* ===================================
     STATUS BADGE
  =================================== */
  const statusBadge = (h) => {
    if (!h.returnedDate) {
      return (
        <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700 font-medium">
          Active
        </span>
      );
    }

    return (
      <span className="px-3 py-1 text-xs rounded-full bg-gray-200 text-gray-700 font-medium">
        Returned
      </span>
    );
  };

  /* ===================================
     EXPORT EMP PDF
  =================================== */
  const exportEmpPDF = () => {
    const doc = new jsPDF();

    doc.text("Employee Asset History", 14, 10);

    autoTable(doc, {
      head: [["Asset", "Type", "Status", "Assigned", "Returned"]],

      body: empHistory.map((h) => [
        h.asset?.assetCode || "-",
        h.assetType || "-",
        h.status || "-",
        h.assignedDate
          ? new Date(h.assignedDate).toLocaleString()
          : "-",

        h.returnedDate
          ? new Date(h.returnedDate).toLocaleString()
          : "Active",
      ]),
    });

    doc.save("employee-history.pdf");
  };

  /* ===================================
     EXPORT ASSET PDF
  =================================== */
  const exportAssetPDF = () => {
    const doc = new jsPDF();

    doc.text("Asset History", 14, 10);

    autoTable(doc, {
      head: [["Employee", "Type", "Status", "Assigned", "Returned"]],

      body: assetHistory.map((h) => [
        `${h.employee?.staffCode || "-"} - ${
          h.employee?.name || "-"
        }`,
        h.assetType || "-",
        h.status || "-",

        h.assignedDate
          ? new Date(h.assignedDate).toLocaleString()
          : "-",

        h.returnedDate
          ? new Date(h.returnedDate).toLocaleString()
          : "Active",
      ]),
    });

    doc.save("asset-history.pdf");
  };

  /* ===================================
     FILTERED SEARCH
  =================================== */

  const filteredEmployees = employees.filter((emp) =>
    `${emp.staffCode} ${emp.name}`
      .toLowerCase()
      .includes(employeeSearch.toLowerCase())
  );

  const filteredAssets = assets.filter((asset) =>
    `${asset.assetCode} ${asset.type}`
      .toLowerCase()
      .includes(assetSearch.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Asset History
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Track employee and asset assignment history
        </p>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border mb-6">

        <div className="grid md:grid-cols-3 gap-5">

          {/* EMPLOYEE */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Employee Search
            </label>

            <input
              type="text"
              placeholder="Search employee..."
              className="w-full border rounded-xl p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={employeeSearch}
              onChange={(e) =>
                setEmployeeSearch(e.target.value)
              }
            />

            <select
              className="w-full border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={employeeId}
              onChange={(e) =>
                setEmployeeId(e.target.value)
              }
            >
              <option value="">
                Select Employee
              </option>

              {filteredEmployees.map((emp) => (
                <option
                  key={emp._id}
                  value={emp._id}
                >
                  {emp.staffCode} - {emp.name}
                </option>
              ))}
            </select>
          </div>

          {/* ASSET */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Asset Search
            </label>

            <input
              type="text"
              placeholder="Search asset..."
              className="w-full border rounded-xl p-3 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={assetSearch}
              onChange={(e) =>
                setAssetSearch(e.target.value)
              }
            />

            <select
              className="w-full border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={assetCode}
              onChange={(e) =>
                setAssetCode(e.target.value)
              }
            >
              <option value="">
                Select Asset
              </option>

              {filteredAssets.map((asset) => (
                <option
                  key={asset._id}
                  value={asset.assetCode}
                >
                  {asset.assetCode} - {asset.type}
                </option>
              ))}
            </select>
          </div>

          {/* TYPE */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Asset Type
            </label>

            <select
              className="w-full border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={assetType}
              onChange={(e) =>
                setAssetType(e.target.value)
              }
            >
              <option value="All">All</option>
              <option value="Laptop">Laptop</option>
              <option value="Printer">Printer</option>
              <option value="HHT">HHT</option>
            </select>
          </div>

        </div>
      </div>

      {/* EMPLOYEE HISTORY */}
      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">

        <div className="flex justify-between items-center mb-5">

          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Employee History
            </h2>

            <p className="text-sm text-gray-500">
              Assignment records by employee
            </p>
          </div>

          <button
            onClick={exportEmpPDF}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl transition"
          >
            Export PDF
          </button>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-4 text-left font-semibold">
                  Asset
                </th>

                <th className="p-4 text-left font-semibold">
                  Type
                </th>

                <th className="p-4 text-left font-semibold">
                  Status
                </th>

                <th className="p-4 text-left font-semibold">
                  Assigned
                </th>

                <th className="p-4 text-left font-semibold">
                  Returned
                </th>
              </tr>
            </thead>

            <tbody>

              {loadingEmp ? (
                <tr>
                  <td
                    colSpan="5"
                    className="p-6 text-center"
                  >
                    Loading...
                  </td>
                </tr>
              ) : empHistory.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="p-6 text-center text-gray-500"
                  >
                    No employee history found
                  </td>
                </tr>
              ) : (
                empHistory.map((h) => (
                  <tr
                    key={h._id}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="p-4 font-medium">
                      {h.asset?.assetCode || "-"}
                    </td>

                    <td className="p-4">
                      {h.assetType}
                    </td>

                    <td className="p-4">
                      {statusBadge(h)}
                    </td>

                    <td className="p-4">
                      {new Date(
                        h.assignedDate
                      ).toLocaleString()}
                    </td>

                    <td className="p-4">
                      {h.returnedDate
                        ? new Date(
                            h.returnedDate
                          ).toLocaleString()
                        : "Active"}
                    </td>
                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>
      </div>

      {/* ASSET HISTORY */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">

        <div className="flex justify-between items-center mb-5">

          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Asset History
            </h2>

            <p className="text-sm text-gray-500">
              Assignment records by asset
            </p>
          </div>

          <button
            onClick={exportAssetPDF}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl transition"
          >
            Export PDF
          </button>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-4 text-left font-semibold">
                  Employee
                </th>

                <th className="p-4 text-left font-semibold">
                  Type
                </th>

                <th className="p-4 text-left font-semibold">
                  Status
                </th>

                <th className="p-4 text-left font-semibold">
                  Assigned
                </th>

                <th className="p-4 text-left font-semibold">
                  Returned
                </th>
              </tr>
            </thead>

            <tbody>

              {loadingAsset ? (
                <tr>
                  <td
                    colSpan="5"
                    className="p-6 text-center"
                  >
                    Loading...
                  </td>
                </tr>
              ) : assetHistory.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="p-6 text-center text-gray-500"
                  >
                    No asset history found
                  </td>
                </tr>
              ) : (
                assetHistory.map((h) => (
                  <tr
                    key={h._id}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="p-4 font-medium">
                      {h.employee?.staffCode} -{" "}
                      {h.employee?.name}
                    </td>

                    <td className="p-4">
                      {h.assetType}
                    </td>

                    <td className="p-4">
                      {statusBadge(h)}
                    </td>

                    <td className="p-4">
                      {new Date(
                        h.assignedDate
                      ).toLocaleString()}
                    </td>

                    <td className="p-4">
                      {h.returnedDate
                        ? new Date(
                            h.returnedDate
                          ).toLocaleString()
                        : "Active"}
                    </td>
                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>
      </div>

    </div>
  );
}