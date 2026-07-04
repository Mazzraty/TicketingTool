import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import Select from "react-select";
/* ================= UI HELPERS (styling only, no logic) ================= */
const Field = ({ label, className = "", children }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    <label className="text-xs font-medium text-gray-500 tracking-wide">
      {label}
    </label>
    {children}
  </div>
);

const inputClass =
  "border border-gray-200 bg-white p-2.5 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition";

const selectClass = inputClass + " appearance-none";

const Section = ({ id, icon, title, subtitle, children }) => {
  const isOpen = open === id;
  return (
    <div className="bg-white border border-gray-200 rounded-2xl mb-4 shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      <button
        onClick={() => setOpen(isOpen ? null : id)}
        className="w-full flex items-center justify-between px-5 py-4 group"
      >
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 text-base">
            {icon}
          </span>
          <div className="text-left">
            <p className="font-semibold text-gray-900 text-sm">{title}</p>
            {subtitle && (
              <p className="text-xs text-gray-400">{subtitle}</p>
            )}
          </div>
        </div>
        <span
          className={`w-7 h-7 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 text-sm transition-transform duration-200 ${isOpen ? "rotate-45 border-blue-300 text-blue-600" : ""
            }`}
        >
          +
        </span>
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
      >
        <div className="overflow-hidden">
          <div className="p-5 pt-1 bg-gray-50/60 border-t border-gray-100">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
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
  const user = JSON.parse(localStorage.getItem("user"));

  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");
  /* ================= LOAD EMPLOYEES ================= */
  const fetchEmployees = async () => {
    try {
      const res = await api.get("/employees");

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

  const loadCompanies = async () => {
    try {
      const res = await api.get("/companies");
      setCompanies(res.data.companies || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    loadCompanies();
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

      if (
        user?.role === "super_admin" &&
        !companyId
      ) {
        return toast.error("Select Company");
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
        companyId, // 🔥 send selected company
      });

      toast.success("Asset Added");

      resetForm();
      setCompanyId("");
    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.message ||
        err.response?.data?.msg ||
        "Error adding asset"
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
    <div className="p-6 md:p-8 bg-[#f4f6f9] min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="mb-5">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition shadow-sm text-sm font-semibold"
          >
            ← Back
          </button>
        </div>

        <div className="mb-7">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Asset Management
          </h1>
          <p className="text-sm text-gray-500">
            Laptop / Printer / HHT Management System
          </p>
        </div>

        {/* ================= ADD ASSET ================= */}
        <Section
          id="add"
          open={open}
          setOpen={setOpen}
          icon="📦"
          title="Add Asset"
        >
          <div className="grid md:grid-cols-3 gap-4 pt-4">
            {user?.role === "super_admin" && (
              <Field label="Company" className="md:col-span-3">
                <select
                  className={selectClass}
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                >
                  <option value="">Select Company</option>
                  {companies.map((company) => (
                    <option key={company._id} value={company._id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <Field label="Asset Code">
              <input
                className={inputClass}
                placeholder="e.g. AST-0042"
                value={assetCode}
                onChange={(e) => setAssetCode(e.target.value)}
              />
            </Field>

            <Field label="Type">
              <select
                className={selectClass}
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="">Select Type</option>
                <option value="Laptop">Laptop</option>
                <option value="Printer">Printer</option>
                <option value="HHT">HHT</option>
              </select>
            </Field>

            <Field label="Model">
              <input
                className={inputClass}
                placeholder="e.g. Dell Latitude 5420"
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
            </Field>

            <Field label="Serial Number">
              <input
                className={inputClass}
                placeholder="Serial Number"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
              />
            </Field>

            {(type === "Printer" || type === "HHT") && (
              <>
                <Field label="Route">
                  <input
                    className={inputClass}
                    placeholder="Route"
                    value={route}
                    onChange={(e) => setRoute(e.target.value)}
                  />
                </Field>

                <Field label="Salesman Code">
                  <input
                    className={inputClass}
                    placeholder="Salesman Code"
                    value={salesmanCode}
                    onChange={(e) => setSalesmanCode(e.target.value)}
                  />
                </Field>

                <Field label="Salesman Name">
                  <input
                    className={inputClass}
                    placeholder="Salesman Name"
                    value={salesmanName}
                    onChange={(e) => setSalesmanName(e.target.value)}
                  />
                </Field>

                <Field label="Supervisor">
                  <input
                    className={inputClass}
                    placeholder="Supervisor"
                    value={supervisor}
                    onChange={(e) => setSupervisor(e.target.value)}
                  />
                </Field>
              </>
            )}

            {type === "Printer" && (
              <Field label="SOTI">
                <input
                  className={inputClass}
                  placeholder="SOTI"
                  value={soti}
                  onChange={(e) => setSoti(e.target.value)}
                />
              </Field>
            )}

            {type === "HHT" && (
              <>
                <Field label="IMEI">
                  <input
                    className={inputClass}
                    placeholder="IMEI"
                    value={imei}
                    onChange={(e) => setImei(e.target.value)}
                  />
                </Field>

                <Field label="SIM Number">
                  <input
                    className={inputClass}
                    placeholder="SIM Number"
                    value={simNumber}
                    onChange={(e) => setSimNumber(e.target.value)}
                  />
                </Field>
              </>
            )}

            <Field label="Notes" className="md:col-span-3">
              <input
                className={inputClass}
                placeholder="Additional notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>

            <button
              onClick={addAsset}
              className="md:col-span-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-lg py-3 mt-1 transition shadow-sm shadow-blue-600/20"
            >
              Create Asset
            </button>
          </div>
        </Section>

        {/* ================= ASSIGN ================= */}
        <Section
          id="assign"
          open={open}
          setOpen={setOpen}
          icon="📦"
          title="Add Asset"
        >
          <div className="grid md:grid-cols-3 gap-4 pt-4">
            <Field label="Employee" className="md:col-span-2">
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
                  setSelectedEmployee(selected?.value || "")
                }
                placeholder="Search Employee..."
                className="text-sm"
                classNamePrefix="rs"
                isSearchable
                styles={{
                  control: (base, state) => ({
                    ...base,
                    borderRadius: "0.5rem",
                    borderColor: state.isFocused ? "#3b82f6" : "#e5e7eb",
                    boxShadow: state.isFocused
                      ? "0 0 0 3px rgba(59,130,246,0.15)"
                      : "none",
                    minHeight: "42px",
                    "&:hover": { borderColor: "#3b82f6" },
                  }),
                }}
              />
            </Field>

            <Field label="Asset Code">
              <input
                className={inputClass}
                placeholder="Asset Code"
                value={assetCode}
                onChange={(e) => setAssetCode(e.target.value)}
              />
            </Field>

            <button
              onClick={assign}
              className="md:col-span-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm rounded-lg py-3 mt-1 transition shadow-sm shadow-emerald-600/20"
            >
              Assign
            </button>
          </div>
        </Section>

        {/* ================= RETURN ================= */}
        <Section
          id="return"
          open={open}
          setOpen={setOpen}
          icon="↩️"
          title="Return Asset"
          subtitle="Mark an asset as returned to stock"
        >
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <div className="flex-1">
              <Field label="Asset Code">
                <input
                  className={inputClass}
                  placeholder="Asset Code"
                  value={assetCode}
                  onChange={(e) => setAssetCode(e.target.value)}
                />
              </Field>
            </div>

            <button
              onClick={returnAsset}
              className="bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold text-sm px-6 rounded-lg transition shadow-sm shadow-red-600/20 sm:mt-6 sm:h-[42px]"
            >
              Return
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
}
