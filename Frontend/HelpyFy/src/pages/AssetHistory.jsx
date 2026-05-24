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
  const [assetSearch, setAssetSearch] = useState("");

  const [empHistory, setEmpHistory] = useState([]);
  const [assetHistory, setAssetHistory] = useState([]);

  const [loadingEmp, setLoadingEmp] = useState(false);
  const [loadingAsset, setLoadingAsset] = useState(false);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    const loadData = async () => {
      try {
        const [empRes, assetRes] = await Promise.all([
          api.get("/employees"),
          api.get("/assets"),
        ]);

        // ✅ FIXED
        setEmployees(empRes.data || []);
        setAssets(assetRes.data?.assets || []);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load data");
      }
    };

    loadData();
  }, []);

  /* ================= EMP HISTORY ================= */
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

  /* ================= ASSET HISTORY ================= */
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

  /* ================= STATUS ================= */
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

  /* ================= PDF EMP ================= */
  const exportEmpPDF = () => {
    const doc = new jsPDF();
    doc.text("Employee Asset History", 14, 10);

    autoTable(doc, {
      head: [["Asset", "Type", "Status", "Assigned", "Returned"]],
      body: empHistory.map((h) => [
        h.asset?.assetCode,
        h.assetType,
        h.status,
        new Date(h.assignedDate).toLocaleString(),
        h.returnedDate
          ? new Date(h.returnedDate).toLocaleString()
          : "Active",
      ]),
    });

    doc.save("employee-history.pdf");
  };

  /* ================= PDF ASSET ================= */
  const exportAssetPDF = () => {
    const doc = new jsPDF();
    doc.text("Asset History", 14, 10);

    autoTable(doc, {
      head: [["Employee", "Type", "Status", "Assigned", "Returned"]],
      body: assetHistory.map((h) => [
        `${h.employee?.staffCode} - ${h.employee?.name}`,
        h.assetType,
        h.status,
        new Date(h.assignedDate).toLocaleString(),
        h.returnedDate
          ? new Date(h.returnedDate).toLocaleString()
          : "Active",
      ]),
    });

    doc.save("asset-history.pdf");
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* HEADER */}
      <h1 className="text-2xl font-bold mb-4">Asset History</h1>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded shadow mb-5">
        <div className="grid md:grid-cols-3 gap-4">

          {/* EMPLOYEE */}
          <select
            className="border p-2 rounded"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          >
            <option value="">Select Employee</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {emp.staffCode} - {emp.name}
              </option>
            ))}
          </select>

          {/* ASSET SEARCH */}
          <div>
            <input
              className="border p-2 rounded w-full mb-2"
              placeholder="Search asset code..."
              value={assetSearch}
              onChange={(e) => setAssetSearch(e.target.value)}
            />

            <select
              className="border p-2 rounded w-full"
              value={assetCode}
              onChange={(e) => setAssetCode(e.target.value)}
            >
              <option value="">Select Asset</option>

              {assets
                .filter((a) =>
                  a.assetCode
                    ?.toLowerCase()
                    .includes(assetSearch.toLowerCase())
                )
                .map((asset) => (
                  <option key={asset._id} value={asset.assetCode}>
                    {asset.assetCode} - {asset.type}
                  </option>
                ))}
            </select>
          </div>

          {/* TYPE */}
          <select
            className="border p-2 rounded"
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

      {/* EMP TABLE */}
      <div className="bg-white p-4 rounded shadow mb-5">
        <div className="flex justify-between mb-3">
          <h2 className="font-bold">Employee History</h2>

          <button
            onClick={exportEmpPDF}
            className="bg-red-600 text-white px-3 py-1 rounded"
          >
            Export PDF
          </button>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Asset</th>
              <th className="p-2 text-left">Type</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Assigned</th>
              <th className="p-2 text-left">Returned</th>
            </tr>
          </thead>

          <tbody>
            {empHistory.map((h) => (
              <tr key={h._id} className="border-t">
                <td className="p-2">{h.asset?.assetCode}</td>
                <td className="p-2">{h.assetType}</td>
                <td className="p-2">{statusBadge(h)}</td>
                <td className="p-2">
                  {new Date(h.assignedDate).toLocaleString()}
                </td>
                <td className="p-2">
                  {h.returnedDate
                    ? new Date(h.returnedDate).toLocaleString()
                    : "Active"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ASSET TABLE */}
      <div className="bg-white p-4 rounded shadow">
        <div className="flex justify-between mb-3">
          <h2 className="font-bold">Asset History</h2>

          <button
            onClick={exportAssetPDF}
            className="bg-red-600 text-white px-3 py-1 rounded"
          >
            Export PDF
          </button>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Employee</th>
              <th className="p-2 text-left">Type</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Assigned</th>
              <th className="p-2 text-left">Returned</th>
            </tr>
          </thead>

          <tbody>
            {assetHistory.map((h) => (
              <tr key={h._id} className="border-t">
                <td className="p-2">
                  {h.employee?.staffCode} - {h.employee?.name}
                </td>
                <td className="p-2">{h.assetType}</td>
                <td className="p-2">{statusBadge(h)}</td>
                <td className="p-2">
                  {new Date(h.assignedDate).toLocaleString()}
                </td>
                <td className="p-2">
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