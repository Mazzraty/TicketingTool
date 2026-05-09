import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function AdminAssets() {
  const [assetCode, setAssetCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("");

  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");

  const [open, setOpen] = useState(null);

  // ================= LOAD EMPLOYEES =================
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

  // ================= ADD ASSET =================
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

  // ================= ASSIGN ASSET (FIXED) =================
  const assign = async () => {
    try {
      if (!selectedEmployee || !assetCode) {
        return toast.error("Select employee and asset code");
      }

      console.log("ASSIGN PAYLOAD:", {
        employeeId: selectedEmployee,
        assetCode,
      });

      await api.post("/assets/assign", {
        employeeId: selectedEmployee, // ✅ MUST BE _id
        assetCode,
      });

      toast.success("Asset Assigned Successfully");

      setAssetCode("");
      setSelectedEmployee("");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.msg || "Assignment Failed");
    }
  };

  // ================= RETURN ASSET =================
  const returnAsset = async () => {
    try {
      await api.post("/assets/return", { assetCode });

      toast.success("Asset Returned");

      setAssetCode("");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Return Failed");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Asset Management (SAP Style)
        </h1>
        <p className="text-sm text-gray-500">
          Manage assets, assign & return in real-time
        </p>
      </div>

      {/* ================= ADD ASSET ================= */}
      <div className="bg-white border rounded-lg shadow-sm mb-4">

        <button
          onClick={() => setOpen(open === "add" ? null : "add")}
          className="w-full flex justify-between px-5 py-3 font-semibold"
        >
          ➕ Add Asset
          <span>{open === "add" ? "−" : "+"}</span>
        </button>

        {open === "add" && (
          <div className="p-4 grid md:grid-cols-4 gap-3 border-t">

            <input
              className="border p-2 rounded"
              placeholder="Asset Code"
              value={assetCode}
              onChange={(e) => setAssetCode(e.target.value)}
            />

            <input
              className="border p-2 rounded"
              placeholder="Asset Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              className="border p-2 rounded"
              placeholder="Type"
              value={type}
              onChange={(e) => setType(e.target.value)}
            />

            <button
              onClick={addAsset}
              className="bg-blue-600 text-white rounded"
            >
              Create
            </button>

          </div>
        )}
      </div>

      {/* ================= ASSIGN ASSET ================= */}
      <div className="bg-white border rounded-lg shadow-sm mb-4">

        <button
          onClick={() => setOpen(open === "assign" ? null : "assign")}
          className="w-full flex justify-between px-5 py-3 font-semibold"
        >
          👤 Assign Asset
          <span>{open === "assign" ? "−" : "+"}</span>
        </button>

        {open === "assign" && (
          <div className="p-4 grid md:grid-cols-3 gap-3 border-t">

            {/* ✅ FIXED: USE _id */}
            <select
              className="border p-2 rounded"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              <option value="">Select Employee</option>

              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} ({emp.staffCode})
                </option>
              ))}
            </select>

            <input
              className="border p-2 rounded"
              placeholder="Asset Code"
              value={assetCode}
              onChange={(e) => setAssetCode(e.target.value)}
            />

            <button
              onClick={assign}
              className="bg-green-600 text-white rounded"
            >
              Assign
            </button>

          </div>
        )}
      </div>

      {/* ================= RETURN ================= */}
      <div className="bg-white border rounded-lg shadow-sm">

        <button
          onClick={() => setOpen(open === "return" ? null : "return")}
          className="w-full flex justify-between px-5 py-3 font-semibold"
        >
          🔄 Return Asset
          <span>{open === "return" ? "−" : "+"}</span>
        </button>

        {open === "return" && (
          <div className="p-4 flex gap-3 border-t">

            <input
              className="flex-1 border p-2 rounded"
              placeholder="Asset Code"
              value={assetCode}
              onChange={(e) => setAssetCode(e.target.value)}
            />

            <button
              onClick={returnAsset}
              className="bg-red-600 text-white px-4 rounded"
            >
              Return
            </button>

          </div>
        )}
      </div>

    </div>
  );
}