// pages/AssetHistoryPage.jsx

import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AssetHistoryPage() {
  const [employees, setEmployees] = useState([]);
  const [assets, setAssets] = useState([]);

  const [employeeId, setEmployeeId] = useState("");
  const [assetCode, setAssetCode] = useState("");
  const [assetType, setAssetType] = useState("All");

  const [empHistory, setEmpHistory] = useState([]);
  const [assetHistory, setAssetHistory] = useState([]);

  const [loadingEmp, setLoadingEmp] = useState(false);
  const [loadingAsset, setLoadingAsset] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  /* ===============================
     LOAD DATA (with refresh support)
  =============================== */
  const loadData = async () => {
    try {
      setLoadingData(true);

      const [empRes, assetRes] = await Promise.all([
        api.get("/employees"),
        api.get("/assets?limit=1000"),
      ]);

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
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ===============================
     EMP HISTORY
  =============================== */
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

        setEmpHistory(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
        toast.error("Employee history not found");
      } finally {
        setLoadingEmp(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [employeeId, assetType]);

  /* ===============================
     ASSET HISTORY
  =============================== */
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

        setAssetHistory(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
        toast.error("Asset history not found");
      } finally {
        setLoadingAsset(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [assetCode, assetType]);

  /* ===============================
     STATUS BADGE
  =============================== */
  const statusBadge = (h) => {
    if (!h.returnedDate) {
      return (
        <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">
          Active
        </span>
      );
    }

    return (
      <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">
        Returned
      </span>
    );
  };

  /* ===============================
     PDF EXPORTS
  =============================== */
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

  const exportAssetPDF = () => {
    const doc = new jsPDF();
    doc.text("Asset History", 14, 10);

    autoTable(doc, {
      head: [["Employee", "Type", "Status", "Assigned", "Returned"]],
      body: assetHistory.map((h) => [
        `${h.employee?.staffCode || "-"} - ${h.employee?.name || "-"}`,
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

  /* ===============================
     UI
  =============================== */
  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-2xl font-bold">Asset History</h1>
          <p className="text-sm text-gray-500">
            Track employee & asset assignment history
          </p>
        </div>

        <button
          onClick={loadData}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          🔄 Refresh
        </button>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-5 rounded-xl shadow mb-5">
        <div className="grid md:grid-cols-3 gap-4">

          {/* EMPLOYEE SEARCH */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Search Employee
            </label>

            <input
              list="employee-list"
              className="border p-2 rounded w-full"
              placeholder="Search employee..."
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            />

            <datalist id="employee-list">
              {employees.map((emp) => (
                <option
                  key={emp.staffCode}
                  value={emp._id}
                >
                  {emp.staffCode} - {emp.name}
                </option>
              ))}
            </datalist>
          </div>

          {/* ASSET SEARCH */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Search Asset
            </label>

            <input
              list="asset-list"
              className="border p-2 rounded w-full"
              placeholder="Search asset..."
              value={assetCode}
              onChange={(e) => setAssetCode(e.target.value)}
            />

            <datalist id="asset-list">
              {assets.map((asset) => (
                <option
                  key={asset.assetCode}
                  value={asset.assetCode}
                >
                  {asset.assetCode} - {asset.type}
                </option>
              ))}
            </datalist>
          </div>

          {/* TYPE */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Asset Type
            </label>

            <select
              className="border p-2 rounded w-full"
              value={assetType}
              onChange={(e) => setAssetType(e.target.value)}
            >
              <option value="All">All</option>
              <option value="Laptop">Laptop</option>
              <option value="Printer">Printer</option>
              <option value="HHT">HHT</option>
            </select>
          </div>
        </div>
      </div>

      {/* EMP HISTORY */}
      <div className="bg-white rounded-xl shadow p-5 mb-5">
        <div className="flex justify-between mb-4">
          <h2 className="font-bold text-lg">Employee History</h2>

          <button
            onClick={exportEmpPDF}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            Export PDF
          </button>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th>Asset</th>
              <th>Type</th>
              <th>Status</th>
              <th>Assigned</th>
              <th>Returned</th>
            </tr>
          </thead>

          <tbody>
            {empHistory.map((h, i) => (
              <tr key={i} className="border-t">
                <td>{h.asset?.assetCode}</td>
                <td>{h.assetType}</td>
                <td>{statusBadge(h)}</td>
                <td>{new Date(h.assignedDate).toLocaleString()}</td>
                <td>
                  {h.returnedDate
                    ? new Date(h.returnedDate).toLocaleString()
                    : "Active"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ASSET HISTORY */}
      <div className="bg-white rounded-xl shadow p-5">
        <div className="flex justify-between mb-4">
          <h2 className="font-bold text-lg">Asset History</h2>

          <button
            onClick={exportAssetPDF}
            className="bg-red-600 text-white px-4 py-2 rounded"
          >
            Export PDF
          </button>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th>Employee</th>
              <th>Type</th>
              <th>Status</th>
              <th>Assigned</th>
              <th>Returned</th>
            </tr>
          </thead>

          <tbody>
            {assetHistory.map((h, i) => (
              <tr key={i} className="border-t">
                <td>
                  {h.employee?.staffCode} - {h.employee?.name}
                </td>
                <td>{h.assetType}</td>
                <td>{statusBadge(h)}</td>
                <td>{new Date(h.assignedDate).toLocaleString()}</td>
                <td>
                  {h.returnedDate
                    ? new Date(h.returnedDate).toLocaleString()
                    : "Active"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}