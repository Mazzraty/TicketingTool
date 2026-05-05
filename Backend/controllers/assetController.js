import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function AdminAssets() {
  const [assetCode, setAssetCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("");

  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");

  const [empHistory, setEmpHistory] = useState([]);
  const [assetHistory, setAssetHistory] = useState([]);

  // =========================
  // LOAD EMPLOYEES
  // =========================
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await api.get("/employees");
        setEmployees(res.data);
      } catch (err) {
        toast.error("Failed to load employees");
      }
    };

    fetchEmployees();
  }, []);

  // =========================
  // ADD ASSET
  // =========================
  const addAsset = async () => {
    try {
      await api.post("/assets", {
        assetCode,
        name,
        type,
      });

      toast.success("Asset Added");

      setAssetCode("");
      setName("");
      setType("");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Error adding asset");
    }
  };

  // =========================
  // ASSIGN ASSET
  // =========================
  const assign = async () => {
    try {
      await api.post("/assets/assign", {
        employeeId: selectedEmployee,
        assetCode,
      });

      toast.success("Asset Assigned");

      loadEmpHistory();
      loadAssetHistory();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Assign failed");
    }
  };

  // =========================
  // RETURN ASSET
  // =========================
  const returnAsset = async () => {
    try {
      await api.post("/assets/return", { assetCode });

      toast.success("Asset Returned");

      loadEmpHistory();
      loadAssetHistory();
    } catch (err) {
      toast.error(err.response?.data?.msg || "Return failed");
    }
  };

  // =========================
  // EMPLOYEE HISTORY
  // =========================
  const loadEmpHistory = async () => {
    if (!selectedEmployee) {
      toast.error("Select employee");
      return;
    }

    try {
      const res = await api.get(
        `/assets/employee/${selectedEmployee}`
      );
      setEmpHistory(res.data);
    } catch (err) {
      toast.error("No employee history");
    }
  };

  // =========================
  // ASSET HISTORY
  // =========================
  const loadAssetHistory = async () => {
    if (!assetCode) {
      toast.error("Enter asset code");
      return;
    }

    try {
      const res = await api.get(`/assets/asset/${assetCode}`);
      setAssetHistory(res.data);
    } catch (err) {
      toast.error("No asset history");
    }
  };

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">

      <h1 className="text-3xl font-bold text-gray-800">
        Asset Management System
      </h1>

      {/* ===================== */}
      {/* GRID */}
      {/* ===================== */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* ADD ASSET */}
        <div className="bg-white p-6 rounded-2xl shadow space-y-4">
          <h2 className="text-xl font-semibold">➕ Add Asset</h2>

          <input
            className="w-full border p-3 rounded-xl"
            placeholder="Asset Code"
            value={assetCode}
            onChange={(e) => setAssetCode(e.target.value)}
          />

          <input
            className="w-full border p-3 rounded-xl"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="w-full border p-3 rounded-xl"
            placeholder="Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          />

          <button
            onClick={addAsset}
            className="w-full bg-blue-600 text-white p-3 rounded-xl"
          >
            Add Asset
          </button>
        </div>

        {/* ASSIGN */}
        <div className="bg-white p-6 rounded-2xl shadow space-y-4">
          <h2 className="text-xl font-semibold">🔥 Assign Asset</h2>

          <select
            className="w-full border p-3 rounded-xl"
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
          >
            <option value="">Select Employee</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp.employeeId}>
                {emp.name} ({emp.employeeId})
              </option>
            ))}
          </select>

          <input
            className="w-full border p-3 rounded-xl"
            placeholder="Asset Code"
            value={assetCode}
            onChange={(e) => setAssetCode(e.target.value)}
          />

          <button
            onClick={assign}
            className="w-full bg-green-600 text-white p-3 rounded-xl"
          >
            Assign
          </button>
        </div>

        {/* RETURN */}
        <div className="bg-white p-6 rounded-2xl shadow md:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">🔄 Return Asset</h2>

          <div className="flex gap-3">
            <input
              className="flex-1 border p-3 rounded-xl"
              placeholder="Asset Code"
              value={assetCode}
              onChange={(e) => setAssetCode(e.target.value)}
            />

            <button
              onClick={returnAsset}
              className="bg-red-600 text-white px-6 rounded-xl"
            >
              Return
            </button>
          </div>
        </div>
      </div>

      {/* ===================== */}
      {/* HISTORY SECTION */}
      {/* ===================== */}
      <div className="grid md:grid-cols-2 gap-6 mt-10">

        {/* EMP HISTORY */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-3">
            👨 Employee History
          </h2>

          <button
            onClick={loadEmpHistory}
            className="bg-blue-600 text-white px-4 py-2 rounded mb-3"
          >
            Load History
          </button>

          <div className="space-y-3">
            {empHistory.map((h) => (
              <div key={h._id} className="border p-3 rounded">
                <p><b>Asset:</b> {h.asset?.assetCode}</p>
                <p><b>Status:</b> {h.status}</p>
                <p>
                  <b>From:</b>{" "}
                  {new Date(h.assignedDate).toLocaleString()}
                </p>
                <p>
                  <b>To:</b>{" "}
                  {h.returnedDate
                    ? new Date(h.returnedDate).toLocaleString()
                    : "Active"}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ASSET HISTORY */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <h2 className="text-xl font-semibold mb-3">
            💻 Asset History
          </h2>

          <button
            onClick={loadAssetHistory}
            className="bg-green-600 text-white px-4 py-2 rounded mb-3"
          >
            Load History
          </button>

          <div className="space-y-3">
            {assetHistory.map((h) => (
              <div key={h._id} className="border p-3 rounded">
                <p><b>Employee:</b> {h.employee?.employeeId}</p>
                <p><b>Status:</b> {h.status}</p>
                <p>
                  <b>From:</b>{" "}
                  {new Date(h.assignedDate).toLocaleString()}
                </p>
                <p>
                  <b>To:</b>{" "}
                  {h.returnedDate
                    ? new Date(h.returnedDate).toLocaleString()
                    : "Active"}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}