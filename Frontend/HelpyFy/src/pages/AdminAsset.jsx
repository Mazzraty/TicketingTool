import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function AdminAssets() {
  const [employeeId, setEmployeeId] = useState("");
  const [assetCode, setAssetCode] = useState("");

  const [empHistory, setEmpHistory] = useState([]);
  const [assetHistory, setAssetHistory] = useState([]);

  // 🔥 ASSIGN ASSET
  const assign = async () => {
    try {
      await api.post("/assets/assign", {
        employeeId,
        assetCode,
      });
      toast.success("Asset Assigned");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Assign Failed");
    }
  };

  // 🔥 RETURN ASSET
  const returnAsset = async () => {
    try {
      await api.post("/assets/return", {
        assetCode,
      });
      toast.success("Asset Returned");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Return Failed");
    }
  };

  // 🔥 EMPLOYEE HISTORY
  const loadEmployeeHistory = async () => {
    try {
      const res = await api.get(`/assets/employee/${employeeId}`);
      setEmpHistory(res.data);
    } catch (err) {
      toast.error("Employee not found");
    }
  };

  // 🔥 ASSET HISTORY
  const loadAssetHistory = async () => {
    try {
      const res = await api.get(`/assets/asset/${assetCode}`);
      setAssetHistory(res.data);
    } catch (err) {
      toast.error("Asset not found");
    }
  };

  return (
    <div className="p-6 space-y-8">

      <h1 className="text-2xl font-bold">Asset Management</h1>

      {/* ASSIGN */}
      <div className="p-4 bg-white shadow rounded">
        <h2 className="font-semibold mb-2">Assign Asset</h2>

        <input
          className="border p-2 mr-2"
          placeholder="Employee ID"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
        />

        <input
          className="border p-2 mr-2"
          placeholder="Asset Code"
          value={assetCode}
          onChange={(e) => setAssetCode(e.target.value)}
        />

        <button onClick={assign} className="bg-blue-600 text-white px-4 py-2">
          Assign
        </button>
      </div>

      {/* RETURN */}
      <div className="p-4 bg-white shadow rounded">
        <h2 className="font-semibold mb-2">Return Asset</h2>

        <input
          className="border p-2 mr-2"
          placeholder="Asset Code"
          value={assetCode}
          onChange={(e) => setAssetCode(e.target.value)}
        />

        <button
          onClick={returnAsset}
          className="bg-red-600 text-white px-4 py-2"
        >
          Return
        </button>
      </div>

      {/* EMPLOYEE HISTORY */}
      <div className="p-4 bg-white shadow rounded">
        <h2 className="font-semibold mb-2">Employee History</h2>

        <input
          className="border p-2 mr-2"
          placeholder="Employee ID"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
        />

        <button
          onClick={loadEmployeeHistory}
          className="bg-green-600 text-white px-4 py-2"
        >
          Load
        </button>

        <div className="mt-4">
          {empHistory.map((h) => (
            <div key={h._id} className="border p-2 mb-2">
              <p>Asset: {h.asset?.assetCode}</p>
              <p>Status: {h.status}</p>
              <p>
                From: {new Date(h.assignedDate).toLocaleString()}
              </p>
              <p>
                To:{" "}
                {h.returnedDate
                  ? new Date(h.returnedDate).toLocaleString()
                  : "Active"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ASSET HISTORY */}
      <div className="p-4 bg-white shadow rounded">
        <h2 className="font-semibold mb-2">Asset History</h2>

        <input
          className="border p-2 mr-2"
          placeholder="Asset Code"
          value={assetCode}
          onChange={(e) => setAssetCode(e.target.value)}
        />

        <button
          onClick={loadAssetHistory}
          className="bg-purple-600 text-white px-4 py-2"
        >
          Load
        </button>

        <div className="mt-4">
          {assetHistory.map((h) => (
            <div key={h._id} className="border p-2 mb-2">
              <p>Employee: {h.employee?.employeeId}</p>
              <p>Status: {h.status}</p>
              <p>
                From: {new Date(h.assignedDate).toLocaleString()}
              </p>
              <p>
                To:{" "}
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