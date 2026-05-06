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

  // 🔥 LOAD EMPLOYEES
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

  // ➕ ADD ASSET
  const addAsset = async () => {
    try {
      await api.post("/assets", { assetCode, name, type });
      toast.success("Asset Added");

      setAssetCode("");
      setName("");
      setType("");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Error");
    }
  };

  // 🔥 ASSIGN
  const assign = async () => {
    try {
      await api.post("/assets/assign", {
        employeeId: selectedEmployee,
        assetCode
      });

      toast.success("Asset Assigned");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Error");
    }
  };

  // 🔄 RETURN
  const returnAsset = async () => {
    try {
      await api.post("/assets/return", { assetCode });
      toast.success("Asset Returned");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Error");
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">

      {/* HEADER */}
      <h1 className="text-3xl font-bold text-gray-800">
        Asset Management System
      </h1>

      {/* GRID */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* ➕ ADD ASSET CARD */}
        <div className="bg-white rounded-2xl shadow p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">
            ➕ Add New Asset
          </h2>

          <input
            className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-400 outline-none"
            placeholder="Asset Code (e.g. LAP001)"
            value={assetCode}
            onChange={(e) => setAssetCode(e.target.value)}
          />

          <input
            className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-400 outline-none"
            placeholder="Asset Name (Dell Laptop)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-blue-400 outline-none"
            placeholder="Type (Laptop/Desktop)"
            value={type}
            onChange={(e) => setType(e.target.value)}
          />

          <button
            onClick={addAsset}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition"
          >
            Add Asset
          </button>
        </div>

        {/* 🔥 ASSIGN CARD */}
        <div className="bg-white rounded-2xl shadow p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-700">
            🔥 Assign Asset
          </h2>

          {/* Employee Dropdown */}
          <select
            className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-green-400 outline-none"
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
            className="w-full border rounded-xl p-3 focus:ring-2 focus:ring-green-400 outline-none"
            placeholder="Asset Code"
            value={assetCode}
            onChange={(e) => setAssetCode(e.target.value)}
          />

          <button
            onClick={assign}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition"
          >
            Assign Asset
          </button>
        </div>

        {/* 🔄 RETURN CARD */}
        <div className="bg-white rounded-2xl shadow p-6 space-y-4 md:col-span-2">
          <h2 className="text-xl font-semibold text-gray-700">
            🔄 Return Asset
          </h2>

          <div className="flex gap-3">
            <input
              className="flex-1 border rounded-xl p-3 focus:ring-2 focus:ring-red-400 outline-none"
              placeholder="Asset Code"
              value={assetCode}
              onChange={(e) => setAssetCode(e.target.value)}
            />

            <button
              onClick={returnAsset}
              className="bg-red-600 hover:bg-red-700 text-white px-6 rounded-xl font-semibold"
            >
              Return
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}