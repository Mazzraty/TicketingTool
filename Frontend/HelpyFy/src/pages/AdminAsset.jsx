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

  const returnAsset = async () => {
    try {
      await api.post("/assets/return", { assetCode });
      toast.success("Asset Returned");
    } catch (err) {
      toast.error(err.response?.data?.msg || "Error");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      {/* HEADER (LEFT ALIGNED) */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Asset Management
        </h1>
        <p className="text-sm text-gray-500">
          Quick access asset operations
        </p>
      </div>

      {/* FULL WIDTH LAYOUT */}
      <div className="space-y-4 w-full">

        {/* ADD ASSET */}
        <div className="bg-white border rounded-lg shadow-sm">

          <button
            onClick={() => setOpen(open === "add" ? null : "add")}
            className="w-full flex justify-between items-center px-5 py-3 text-left font-semibold text-gray-700 hover:bg-gray-50"
          >
            <span>➕ Add Asset</span>
            <span>{open === "add" ? "−" : "+"}</span>
          </button>

          {open === "add" && (
            <div className="p-4 border-t grid md:grid-cols-4 gap-3">

              <input
                className="border rounded-md p-2 text-sm"
                placeholder="Asset Code"
                value={assetCode}
                onChange={(e) => setAssetCode(e.target.value)}
              />

              <input
                className="border rounded-md p-2 text-sm"
                placeholder="Asset Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <input
                className="border rounded-md p-2 text-sm"
                placeholder="Type"
                value={type}
                onChange={(e) => setType(e.target.value)}
              />

              <button
                onClick={addAsset}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-md py-2 text-sm"
              >
                Create
              </button>

            </div>
          )}
        </div>

        {/* ASSIGN */}
        <div className="bg-white border rounded-lg shadow-sm">

          <button
            onClick={() => setOpen(open === "assign" ? null : "assign")}
            className="w-full flex justify-between items-center px-5 py-3 text-left font-semibold text-gray-700 hover:bg-gray-50"
          >
            <span>👤 Assign Asset</span>
            <span>{open === "assign" ? "−" : "+"}</span>
          </button>

          {open === "assign" && (
            <div className="p-4 border-t grid md:grid-cols-3 gap-3">

              <select
                className="border rounded-md p-2 text-sm"
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp.employeeId}>
                    {emp.name}
                  </option>
                ))}
              </select>

              <input
                className="border rounded-md p-2 text-sm"
                placeholder="Asset Code"
                value={assetCode}
                onChange={(e) => setAssetCode(e.target.value)}
              />

              <button
                onClick={assign}
                className="bg-green-600 hover:bg-green-700 text-white rounded-md py-2 text-sm"
              >
                Assign
              </button>

            </div>
          )}
        </div>

        {/* RETURN */}
        <div className="bg-white border rounded-lg shadow-sm">

          <button
            onClick={() => setOpen(open === "return" ? null : "return")}
            className="w-full flex justify-between items-center px-5 py-3 text-left font-semibold text-gray-700 hover:bg-gray-50"
          >
            <span>🔄 Return Asset</span>
            <span>{open === "return" ? "−" : "+"}</span>
          </button>

          {open === "return" && (
            <div className="p-4 border-t flex gap-3">

              <input
                className="flex-1 border rounded-md p-2 text-sm"
                placeholder="Asset Code"
                value={assetCode}
                onChange={(e) => setAssetCode(e.target.value)}
              />

              <button
                onClick={returnAsset}
                className="bg-red-600 hover:bg-red-700 text-white rounded-md px-4 text-sm"
              >
                Return
              </button>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}