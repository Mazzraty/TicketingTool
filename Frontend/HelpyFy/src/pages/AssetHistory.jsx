import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function AssetHistoryPage() {
  const [employees, setEmployees] = useState([]);
  const [assets, setAssets] = useState([]);

  const [employeeId, setEmployeeId] = useState("");
  const [assetCode, setAssetCode] = useState("");

  const [empHistory, setEmpHistory] = useState([]);
  const [assetHistory, setAssetHistory] = useState([]);

  // ===============================
  // LOAD EMPLOYEES + ASSETS
  // ===============================
  useEffect(() => {
    const loadData = async () => {
      try {
        const [empRes, assetRes] = await Promise.all([
          api.get("/employees"),
          api.get("/assets"),
        ]);

        setEmployees(empRes.data);
        setAssets(assetRes.data);
      } catch (err) {
        toast.error("Failed to load employees/assets");
      }
    };

    loadData();
  }, []);

  // ===============================
  // AUTO SEARCH EMPLOYEE HISTORY
  // ===============================
  useEffect(() => {
    if (!employeeId) {
      setEmpHistory([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/assets/employee/${employeeId}`);
        setEmpHistory(res.data);
      } catch {
        toast.error("Employee history not found");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [employeeId]);

  // ===============================
  // AUTO SEARCH ASSET HISTORY
  // ===============================
  useEffect(() => {
    if (!assetCode) {
      setAssetHistory([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/assets/asset/${assetCode}`);
        setAssetHistory(res.data);
      } catch {
        toast.error("Asset history not found");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [assetCode]);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* HEADER */}
      <div className="mb-4 border-b pb-3">
        <h1 className="text-lg font-bold text-gray-800">
          Asset History Management
        </h1>
        <p className="text-xs text-gray-500">
          ERP System → Asset Tracking Module
        </p>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white border p-4 mb-4 flex gap-4 items-end">

        {/* EMPLOYEE DROPDOWN */}
        <div className="w-1/3">
          <label className="text-xs text-gray-500">Employee</label>
          <select
            className="w-full border p-2 text-sm"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
          >
            <option value="">Select Employee</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp.employeeId}>
                {emp.employeeId} - {emp.name}
              </option>
            ))}
          </select>
        </div>

        {/* ASSET DROPDOWN */}
        <div className="w-1/3">
          <label className="text-xs text-gray-500">Asset Code</label>
          <select
            className="w-full border p-2 text-sm"
            value={assetCode}
            onChange={(e) => setAssetCode(e.target.value)}
          >
            <option value="">Select Asset</option>
            {assets.map((asset) => (
              <option key={asset._id} value={asset.assetCode}>
                {asset.assetCode} - {asset.type}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* RESULTS GRID */}
      <div className="grid grid-cols-2 gap-4">

        {/* EMPLOYEE HISTORY */}
        <div className="bg-white border">
          <div className="bg-gray-200 px-3 py-2 text-sm font-semibold border-b">
            Employee History
          </div>

          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">Asset</th>
                <th className="border p-2 text-left">Status</th>
                <th className="border p-2 text-left">Assigned</th>
                <th className="border p-2 text-left">Returned</th>
              </tr>
            </thead>
            <tbody>
              {empHistory.map((h) => (
                <tr key={h._id}>
                  <td className="border p-2">{h.asset?.assetCode}</td>
                  <td className="border p-2">{h.status}</td>
                  <td className="border p-2">
                    {new Date(h.assignedDate).toLocaleString()}
                  </td>
                  <td className="border p-2">
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
        <div className="bg-white border">
          <div className="bg-gray-200 px-3 py-2 text-sm font-semibold border-b">
            Asset History
          </div>

          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">Employee</th>
                <th className="border p-2 text-left">Status</th>
                <th className="border p-2 text-left">Assigned</th>
                <th className="border p-2 text-left">Returned</th>
              </tr>
            </thead>
            <tbody>
              {assetHistory.map((h) => (
                <tr key={h._id}>
                  <td className="border p-2">{h.employee?.employeeId}</td>
                  <td className="border p-2">{h.status}</td>
                  <td className="border p-2">
                    {new Date(h.assignedDate).toLocaleString()}
                  </td>
                  <td className="border p-2">
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
    </div>
  );
}