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

  /* ===============================
     LOAD DATA
  =============================== */
  useEffect(() => {
    const loadData = async () => {
      try {
        const [empRes, assetRes] = await Promise.all([
          api.get("/employees"),
          api.get("/assets"),
        ]);

        setEmployees(Array.isArray(empRes.data) ? empRes.data : []);
        setAssets(Array.isArray(assetRes.data) ? assetRes.data : []);
      } catch (err) {
        toast.error("Failed to load data");
      }
    };

    loadData();
  }, []);

  /* ===============================
     EMPLOYEE HISTORY
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
      } catch {
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
      } catch {
        toast.error("Asset history not found");
      } finally {
        setLoadingAsset(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [assetCode, assetType]);

  /* ===============================
     PDF EXPORT - EMPLOYEE HISTORY
  =============================== */
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

  /* ===============================
     PDF EXPORT - ASSET HISTORY
  =============================== */
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
    <div className="p-6 bg-[#f4f6f9] min-h-screen">

      {/* HEADER */}
      <h1 className="text-2xl font-bold mb-5">
        Asset History Management
      </h1>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded-xl border mb-5">

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
              placeholder="Search asset..."
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

      {/* EMPLOYEE HISTORY */}
      <div className="bg-white p-4 rounded-xl border mb-5">

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
              <th>Asset</th>
              <th>Type</th>
              <th>Status</th>
              <th>Assigned</th>
              <th>Returned</th>
            </tr>
          </thead>

          <tbody>
            {empHistory.map((h) => (
              <tr key={h._id} className="border-t">
                <td>{h.asset?.assetCode}</td>
                <td>{h.assetType}</td>
                <td>{h.status}</td>
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
      <div className="bg-white p-4 rounded-xl border">

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
              <th>Employee</th>
              <th>Type</th>
              <th>Status</th>
              <th>Assigned</th>
              <th>Returned</th>
            </tr>
          </thead>

          <tbody>
            {assetHistory.map((h) => (
              <tr key={h._id} className="border-t">
                <td>
                  {h.employee?.staffCode} - {h.employee?.name}
                </td>
                <td>{h.assetType}</td>
                <td>{h.status}</td>
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