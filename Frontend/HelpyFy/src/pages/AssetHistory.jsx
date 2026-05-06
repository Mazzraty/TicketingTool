import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function AssetHistoryPage() {
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState("");

  const [assetCode, setAssetCode] = useState("");

  const [empHistory, setEmpHistory] = useState([]);
  const [assetHistory, setAssetHistory] = useState([]);

  // ======================
  // LOAD EMPLOYEES
  // ======================
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/employees");
        setEmployees(res.data);
      } catch {
        toast.error("Failed to load employees");
      }
    };
    load();
  }, []);

  // ======================
  // EMP HISTORY
  // ======================
  const loadEmployeeHistory = async () => {
    try {
      const res = await api.get(`/assets/employee/${employeeId}`);
      setEmpHistory(res.data);
    } catch {
      toast.error("No history found");
    }
  };

  // ======================
  // ASSET HISTORY
  // ======================
  const loadAssetHistory = async () => {
    try {
      const res = await api.get(`/assets/asset/${assetCode}`);
      setAssetHistory(res.data);
    } catch {
      toast.error("No asset history found");
    }
  };

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">

      <h1 className="text-3xl font-bold">
        Asset History Dashboard
      </h1>

      {/* ================= EMPLOYEE HISTORY ================= */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-xl font-semibold mb-3">
          👨 Employee History
        </h2>

        <select
          className="border p-3 rounded w-full mb-3"
          onChange={(e) => setEmployeeId(e.target.value)}
        >
          <option value="">Select Employee</option>
          {employees.map((emp) => (
            <option key={emp._id} value={emp.employeeId}>
              {emp.name} ({emp.employeeId})
            </option>
          ))}
        </select>

        <button
          onClick={loadEmployeeHistory}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Load Employee History
        </button>

        <div className="mt-4 space-y-3">
          {empHistory.map((h) => (
            <div key={h._id} className="border p-3 rounded">
              <p><b>Asset:</b> {h.asset?.assetCode}</p>
              <p><b>Status:</b> {h.status}</p>
              <p><b>Assigned:</b> {new Date(h.assignedDate).toLocaleString()}</p>
              <p>
                <b>Returned:</b>{" "}
                {h.returnedDate
                  ? new Date(h.returnedDate).toLocaleString()
                  : "Active"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ================= ASSET HISTORY ================= */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-xl font-semibold mb-3">
          💻 Asset History
        </h2>

        <input
          className="border p-3 rounded w-full mb-3"
          placeholder="Enter Asset Code"
          value={assetCode}
          onChange={(e) => setAssetCode(e.target.value)}
        />

        <button
          onClick={loadAssetHistory}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Load Asset History
        </button>

        <div className="mt-4 space-y-3">
          {assetHistory.map((h) => (
            <div key={h._id} className="border p-3 rounded">
              <p><b>Employee:</b> {h.employee?.employeeId}</p>
              <p><b>Status:</b> {h.status}</p>
              <p><b>Assigned:</b> {new Date(h.assignedDate).toLocaleString()}</p>
              <p>
                <b>Returned:</b>{" "}
                {h.returnedDate
                  ? new Date(h.returnedDate).toLocaleString()
                  : "Active"}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}