import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import Select from "react-select";

export default function AdminAssets() {
  const [assetCode, setAssetCode] = useState("");
  const [type, setType] = useState("");

  const [model, setModel] = useState("");
  const [serialNumber, setSerialNumber] = useState("");

  const [route, setRoute] = useState("");
  const [salesmanCode, setSalesmanCode] = useState("");
  const [salesmanName, setSalesmanName] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [soti, setSoti] = useState("");

  const [imei, setImei] = useState("");
  const [simNumber, setSimNumber] = useState("");
  const [notes, setNotes] = useState("");

  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");

  const [open, setOpen] = useState(null);

  /* ================= LOAD EMPLOYEES ================= */
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await api.get("/employees");

        console.log("Employees Loaded:", res.data.length);

        setEmployees(
          Array.isArray(res.data)
            ? res.data
            : res.data.employees || []
        );
      } catch (err) {
        console.error(err);
        toast.error("Failed to load employees");
      }
    };

    fetchEmployees();
  }, []);

  /* ================= RESET ================= */
  const resetForm = () => {
    setAssetCode("");
    setType("");

    setModel("");
    setSerialNumber("");

    setRoute("");
    setSalesmanCode("");
    setSalesmanName("");
    setSupervisor("");
    setSoti("");

    setImei("");
    setSimNumber("");
    setNotes("");
  };

  /* ================= ADD ASSET ================= */
  const addAsset = async () => {
    try {
      if (!assetCode || !type) {
        return toast.error("Asset Code & Type required");
      }

      await api.post("/assets", {
        assetCode,
        type,
        model,
        serialNumber,
        route,
        salesmanCode,
        salesmanName,
        supervisor,
        soti,
        imei,
        simNumber,
        notes,
      });

      toast.success("Asset Added");
      resetForm();
    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.msg || "Error adding asset"
      );
    }
  };

  /* ================= ASSIGN ================= */
  const assign = async () => {
    try {
      if (!selectedEmployee || !assetCode) {
        return toast.error(
          "Select employee & asset code"
        );
      }

      await api.post("/assets/assign", {
        employeeId: selectedEmployee,
        assetCode,
      });

      toast.success("Asset Assigned");

      setAssetCode("");
      setSelectedEmployee("");
    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.msg ||
        "Assignment Failed"
      );
    }
  };

  /* ================= RETURN ================= */
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
      <div className="mb-4">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition shadow-sm text-sm font-semibold"
        >
          ← Back
        </button>
      </div>
      <h1 className="text-2xl font-bold mb-1">
        Asset Management
      </h1>

      <p className="text-sm text-gray-500 mb-6">
        Laptop / Printer / HHT Management System
      </p>

      {/* ================= ADD ASSET ================= */}
      <div className="bg-white border rounded-xl mb-4">
        <button
          onClick={() =>
            setOpen(open === "add" ? null : "add")
          }
          className="w-full flex justify-between px-5 py-4 font-semibold"
        >
          Add Asset
          <span>{open === "add" ? "−" : "+"}</span>
        </button>

        {open === "add" && (
          <div className="p-5 grid md:grid-cols-3 gap-3 bg-gray-50">

            <input
              className="border p-2 rounded"
              placeholder="Asset Code"
              value={assetCode}
              onChange={(e) =>
                setAssetCode(e.target.value)
              }
            />

            <select
              className="border p-2 rounded"
              value={type}
              onChange={(e) =>
                setType(e.target.value)
              }
            >
              <option value="">Select Type</option>
              <option value="Laptop">Laptop</option>
              <option value="Printer">Printer</option>
              <option value="HHT">HHT</option>
            </select>

            <input
              className="border p-2 rounded"
              placeholder="Model"
              value={model}
              onChange={(e) =>
                setModel(e.target.value)
              }
            />

            <input
              className="border p-2 rounded"
              placeholder="Serial Number"
              value={serialNumber}
              onChange={(e) =>
                setSerialNumber(e.target.value)
              }
            />

            {(type === "Printer" ||
              type === "HHT") && (
                <>
                  <input
                    className="border p-2 rounded"
                    placeholder="Route"
                    value={route}
                    onChange={(e) =>
                      setRoute(e.target.value)
                    }
                  />

                  <input
                    className="border p-2 rounded"
                    placeholder="Salesman Code"
                    value={salesmanCode}
                    onChange={(e) =>
                      setSalesmanCode(e.target.value)
                    }
                  />

                  <input
                    className="border p-2 rounded"
                    placeholder="Salesman Name"
                    value={salesmanName}
                    onChange={(e) =>
                      setSalesmanName(e.target.value)
                    }
                  />

                  <input
                    className="border p-2 rounded"
                    placeholder="Supervisor"
                    value={supervisor}
                    onChange={(e) =>
                      setSupervisor(e.target.value)
                    }
                  />
                </>
              )}

            {type === "Printer" && (
              <input
                className="border p-2 rounded"
                placeholder="SOTI"
                value={soti}
                onChange={(e) =>
                  setSoti(e.target.value)
                }
              />
            )}

            {type === "HHT" && (
              <>
                <input
                  className="border p-2 rounded"
                  placeholder="IMEI"
                  value={imei}
                  onChange={(e) =>
                    setImei(e.target.value)
                  }
                />

                <input
                  className="border p-2 rounded"
                  placeholder="SIM Number"
                  value={simNumber}
                  onChange={(e) =>
                    setSimNumber(e.target.value)
                  }
                />
              </>
            )}

            <input
              className="border p-2 rounded md:col-span-3"
              placeholder="Notes"
              value={notes}
              onChange={(e) =>
                setNotes(e.target.value)
              }
            />

            <button
              onClick={addAsset}
              className="bg-blue-600 text-white rounded p-2 md:col-span-3"
            >
              Create Asset
            </button>
          </div>
        )}
      </div>

      {/* ================= ASSIGN ================= */}
      <div className="bg-white border rounded-xl mb-4">
        <button
          onClick={() =>
            setOpen(open === "assign" ? null : "assign")
          }
          className="w-full flex justify-between px-5 py-4 font-semibold"
        >
          Assign Asset
          <span>{open === "assign" ? "−" : "+"}</span>
        </button>

        {open === "assign" && (
          <div className="p-5 grid md:grid-cols-3 gap-3 bg-gray-50">

            {/* 🔥 SEARCHABLE EMPLOYEE DROPDOWN */}
            <div className="md:col-span-2">
              <Select
                options={employees.map((e) => ({
                  value: e.staffCode,
                  label: `${e.name} (${e.staffCode})`,
                }))}

                value={
                  selectedEmployee
                    ? {
                      value: selectedEmployee,
                      label: selectedEmployee,
                    }
                    : null
                }

                onChange={(selected) =>
                  setSelectedEmployee(
                    selected?.value || ""
                  )
                }

                placeholder="Search Employee..."
                className="text-sm"
                isSearchable
              />
            </div>

            <input
              className="border p-2 rounded"
              placeholder="Asset Code"
              value={assetCode}
              onChange={(e) =>
                setAssetCode(e.target.value)
              }
            />

            <button
              onClick={assign}
              className="bg-green-600 text-white rounded p-2 md:col-span-3"
            >
              Assign
            </button>
          </div>
        )}
      </div>

      {/* ================= RETURN ================= */}
      <div className="bg-white border rounded-xl">
        <button
          onClick={() =>
            setOpen(open === "return"
              ? null
              : "return")
          }
          className="w-full flex justify-between px-5 py-4 font-semibold"
        >
          Return Asset
          <span>{open === "return" ? "−" : "+"}</span>
        </button>

        {open === "return" && (
          <div className="p-5 flex gap-3 bg-gray-50">

            <input
              className="flex-1 border p-2 rounded"
              placeholder="Asset Code"
              value={assetCode}
              onChange={(e) =>
                setAssetCode(e.target.value)
              }
            />

            <button
              onClick={returnAsset}
              className="bg-red-600 text-white px-5 rounded"
            >
              Return
            </button>
          </div>
        )}
      </div>
    </div>
  );
}