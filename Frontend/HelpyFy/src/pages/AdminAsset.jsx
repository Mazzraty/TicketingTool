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
        console.error(err);
        toast.error("Failed to load employees");
      }
    };

    fetchEmployees();

  }, []);

  // ================= ADD ASSET =================
  const addAsset = async () => {
    try {

      if (!assetCode || !name) {
        return toast.error("Asset code and name required");
      }

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
      console.error(err);

      toast.error(
        err.response?.data?.msg || "Error adding asset"
      );
    }
  };

  // ================= ASSIGN ASSET =================
  const assign = async () => {
    try {

      if (!selectedEmployee || !assetCode) {
        return toast.error(
          "Select employee and asset code"
        );
      }

      console.log("ASSIGN PAYLOAD:", {
        employeeId: selectedEmployee,
        assetCode,
      });

      await api.post("/assets/assign", {
        employeeId: selectedEmployee,
        assetCode,
      });

      toast.success("Asset Assigned Successfully");

      setAssetCode("");
      setSelectedEmployee("");

    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.msg || "Assignment Failed"
      );
    }
  };

  // ================= RETURN ASSET =================
  const returnAsset = async () => {
    try {

      if (!assetCode) {
        return toast.error("Enter asset code");
      }

      await api.post("/assets/return", {
        assetCode,
      });

      toast.success("Asset Returned");

      setAssetCode("");

    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.msg || "Return Failed"
      );
    }
  };

  return (
    <div className="p-6 bg-[#f4f6f9] min-h-screen">

      {/* HEADER */}
      <div className="mb-6">

        <h1 className="text-2xl font-bold text-gray-800">
          Asset Management
        </h1>

        <p className="text-sm text-gray-500">
          Manage assets, assign & return in real-time
        </p>

      </div>

      {/* ================= ADD ASSET ================= */}
      <div className="bg-white border rounded-xl shadow-sm mb-4 overflow-hidden">

        <button
          onClick={() =>
            setOpen(open === "add" ? null : "add")
          }
          className="w-full flex justify-between items-center px-5 py-4 font-semibold bg-white hover:bg-gray-50"
        >
          <span>➕ Add Asset</span>

          <span className="text-xl">
            {open === "add" ? "−" : "+"}
          </span>
        </button>

        {open === "add" && (
          <div className="p-5 grid md:grid-cols-4 gap-3 border-t bg-gray-50">

            <input
              className="border rounded-lg p-2"
              placeholder="Asset Code"
              value={assetCode}
              onChange={(e) =>
                setAssetCode(e.target.value)
              }
            />

            <input
              className="border rounded-lg p-2"
              placeholder="Asset Name"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
            />

            <input
              className="border rounded-lg p-2"
              placeholder="Type"
              value={type}
              onChange={(e) =>
                setType(e.target.value)
              }
            />

            <button
              onClick={addAsset}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              Create Asset
            </button>

          </div>
        )}

      </div>

      {/* ================= ASSIGN ASSET ================= */}
      <div className="bg-white border rounded-xl shadow-sm mb-4 overflow-hidden">

        <button
          onClick={() =>
            setOpen(open === "assign" ? null : "assign")
          }
          className="w-full flex justify-between items-center px-5 py-4 font-semibold bg-white hover:bg-gray-50"
        >
          <span>👤 Assign Asset</span>

          <span className="text-xl">
            {open === "assign" ? "−" : "+"}
          </span>
        </button>

        {open === "assign" && (
          <div className="p-5 grid md:grid-cols-3 gap-3 border-t bg-gray-50">

            {/* EMPLOYEE */}
            <select
              className="border rounded-lg p-2"
              value={selectedEmployee}
              onChange={(e) =>
                setSelectedEmployee(e.target.value)
              }
            >
              <option value="">
                Select Employee
              </option>

              {employees.map((emp) => (
                <option
                  key={emp._id}
                  value={emp.staffCode}
                >
                  {emp.name} ({emp.staffCode})
                </option>
              ))}
            </select>

            {/* ASSET CODE */}
            <input
              className="border rounded-lg p-2"
              placeholder="Asset Code"
              value={assetCode}
              onChange={(e) =>
                setAssetCode(e.target.value)
              }
            />

            {/* BUTTON */}
            <button
              onClick={assign}
              className="bg-green-600 hover:bg-green-700 text-white rounded-lg"
            >
              Assign Asset
            </button>

          </div>
        )}

      </div>

      {/* ================= RETURN ASSET ================= */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">

        <button
          onClick={() =>
            setOpen(open === "return" ? null : "return")
          }
          className="w-full flex justify-between items-center px-5 py-4 font-semibold bg-white hover:bg-gray-50"
        >
          <span>🔄 Return Asset</span>

          <span className="text-xl">
            {open === "return" ? "−" : "+"}
          </span>
        </button>

        {open === "return" && (
          <div className="p-5 flex gap-3 border-t bg-gray-50">

            <input
              className="flex-1 border rounded-lg p-2"
              placeholder="Asset Code"
              value={assetCode}
              onChange={(e) =>
                setAssetCode(e.target.value)
              }
            />

            <button
              onClick={returnAsset}
              className="bg-red-600 hover:bg-red-700 text-white px-5 rounded-lg"
            >
              Return
            </button>

          </div>
        )}

      </div>

    </div>
  );
}