import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import Select from "react-select";
import {
  ArrowLeft,
  ChevronDown,
  Package,
  UserCheck,
  RotateCcw,
} from "lucide-react";

/* ================= UI HELPERS (styling only, no logic) ================= */
// Atlassian / Jira Service Management styling
const inputClass =
  "h-9 w-full rounded-[3px] border-2 border-[#DFE1E6] bg-[#FAFBFC] px-2.5 text-sm text-[#172B4D] " +
  "placeholder:text-[#7A869A] transition-colors hover:bg-[#EBECF0] " +
  "focus:border-[#4C9AFF] focus:bg-white focus:outline-none";

const btnBase =
  "inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-[3px] px-4 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#4C9AFF] disabled:cursor-not-allowed disabled:opacity-50";
const btnPrimary = `${btnBase} bg-[#0052CC] text-white hover:bg-[#0065FF] active:bg-[#0747A6]`;
const btnSubtle = `${btnBase} bg-transparent text-[#42526E] hover:bg-[rgba(9,30,66,0.08)]`;

const Field = ({ label, required, className = "", children }) => (
  <div className={`flex flex-col ${className}`}>
    <label className="mb-1 text-xs font-semibold text-[#5E6C84]">
      {label}
      {required && <span className="ml-0.5 text-[#DE350B]">*</span>}
    </label>
    {children}
  </div>
);

// Native <select> with a consistent chevron
const SelectBox = ({ children, ...props }) => (
  <div className="relative">
    <select
      {...props}
      className={`${inputClass} cursor-pointer appearance-none truncate pr-8`}
    >
      {children}
    </select>
    <ChevronDown
      size={16}
      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B778C]"
    />
  </div>
);

const Section = ({ id, icon: Icon, title, subtitle, children, open, setOpen }) => {
  const isOpen = open === id;
  return (
    <div className="mb-3 overflow-hidden rounded-[3px] border border-[#DFE1E6] bg-white">
      <button
        onClick={() => setOpen(isOpen ? null : id)}
        aria-expanded={isOpen}
        className={`flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-[#F4F5F7] ${
          isOpen ? "bg-[#F4F5F7]" : ""
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-[3px] ${
              isOpen ? "bg-[#0052CC] text-white" : "bg-[#DEEBFF] text-[#0052CC]"
            }`}
          >
            <Icon size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#172B4D]">{title}</p>
            {subtitle && <p className="text-xs text-[#5E6C84]">{subtitle}</p>}
          </div>
        </div>
        <ChevronDown
          size={18}
          className={`text-[#42526E] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-[#DFE1E6] p-5">{children}</div>
        </div>
      </div>
    </div>
  );
};

// react-select skinned to match the Atlassian inputs
const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "36px",
    borderRadius: "3px",
    borderWidth: "2px",
    borderColor: state.isFocused ? "#4C9AFF" : "#DFE1E6",
    backgroundColor: state.isFocused ? "#FFFFFF" : "#FAFBFC",
    boxShadow: "none",
    "&:hover": {
      borderColor: state.isFocused ? "#4C9AFF" : "#DFE1E6",
      backgroundColor: state.isFocused ? "#FFFFFF" : "#EBECF0",
    },
  }),
  valueContainer: (base) => ({ ...base, padding: "0 10px" }),
  placeholder: (base) => ({ ...base, color: "#7A869A" }),
  singleValue: (base) => ({ ...base, color: "#172B4D" }),
  input: (base) => ({ ...base, color: "#172B4D" }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base) => ({ ...base, color: "#6B778C", padding: "0 8px" }),
  menu: (base) => ({
    ...base,
    borderRadius: "3px",
    boxShadow:
      "0 4px 8px -2px rgba(9,30,66,0.25), 0 0 1px rgba(9,30,66,0.31)",
    zIndex: 30,
  }),
  option: (base, state) => ({
    ...base,
    fontSize: "14px",
    color: state.isSelected ? "#0052CC" : "#172B4D",
    backgroundColor: state.isSelected
      ? "#DEEBFF"
      : state.isFocused
      ? "#F4F5F7"
      : "#FFFFFF",
  }),
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
    <div className="min-h-screen bg-[#F4F5F7] text-[#172B4D]">
      <div className="mx-auto max-w-5xl px-6 py-6 lg:px-10">
        {/* BREADCRUMB + BACK */}
        <div className="mb-2 flex items-center justify-between">
          <nav className="flex items-center gap-1.5 text-sm text-[#5E6C84]">
            <span>Admin</span>
            <span>/</span>
            <span>Assets</span>
          </nav>

          <button
            onClick={() => window.history.back()}
            className={`${btnSubtle} h-8 px-3`}
          >
            <ArrowLeft size={14} />
            Back
          </button>
        </div>

        <div className="mb-5">
          <h1 className="text-2xl font-medium text-[#172B4D]">
            Asset Management
          </h1>
          <p className="mt-1 text-sm text-[#5E6C84]">
            Laptop / Printer / HHT / Mobile Management System
          </p>
        </div>

        {/* ================= ADD ASSET ================= */}
        <Section
          id="add"
          open={open}
          setOpen={setOpen}
          icon={Package}
          title="Add Asset"
          subtitle="Register a new asset in the system"
        >
          <p className="mb-4 text-xs text-[#5E6C84]">
            Required fields are marked with an asterisk{" "}
            <span className="text-[#DE350B]">*</span>
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            {user?.role === "super_admin" && (
              <Field label="Company" required className="md:col-span-3">
                <SelectBox
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                >
                  <option value="">Select Company</option>
                  {companies.map((company) => (
                    <option key={company._id} value={company._id}>
                      {company.name}
                    </option>
                  ))}
                </SelectBox>
              </Field>
            )}

            <Field label="Asset Code" required>
              <input
                className={inputClass}
                placeholder="e.g. AST-0042"
                value={assetCode}
                onChange={(e) => setAssetCode(e.target.value)}
              />
            </Field>

            <Field label="Type" required>
              <SelectBox
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="">Select Type</option>
                <option value="Laptop">Laptop</option>
                <option value="Desktop">Desktop</option>
                <option value="Mobile">Mobile</option>
                <option value="Printer">Printer</option>
                <option value="HHT">HHT</option>
              </SelectBox>
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

            <div className="flex justify-end md:col-span-3">
              <button onClick={addAsset} className={btnPrimary}>
                Create asset
              </button>
            </div>
          </div>
        </Section>

        {/* ================= ASSIGN ================= */}
        <Section
          id="assign"
          open={open}
          setOpen={setOpen}
          icon={UserCheck}
          title="Assign Asset"
          subtitle="Assign an asset to an employee"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Employee" required className="md:col-span-2">
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
                styles={selectStyles}
              />
            </Field>

            <Field label="Asset Code" required>
              <input
                className={inputClass}
                placeholder="Asset Code"
                value={assetCode}
                onChange={(e) => setAssetCode(e.target.value)}
              />
            </Field>

            <div className="flex justify-end md:col-span-3">
              <button onClick={assign} className={btnPrimary}>
                Assign
              </button>
            </div>
          </div>
        </Section>

        {/* ================= RETURN ================= */}
        <Section
          id="return"
          open={open}
          setOpen={setOpen}
          icon={RotateCcw}
          title="Return Asset"
          subtitle="Mark an asset as returned to stock"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Field label="Asset Code" required>
                <input
                  className={inputClass}
                  placeholder="Asset Code"
                  value={assetCode}
                  onChange={(e) => setAssetCode(e.target.value)}
                />
              </Field>
            </div>

            <button onClick={returnAsset} className={btnPrimary}>
              Return
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
}