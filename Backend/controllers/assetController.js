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

/* ================= DESIGN TOKENS (same as Tickets / Dashboard) ================= */
const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, 'Helvetica Neue', sans-serif";

const FIELD =
  "h-8 w-full rounded-[3px] border border-[#8590A2] bg-white px-2.5 text-sm text-[#172B4D] outline-none " +
  "placeholder:text-[#626F86] hover:bg-[#F7F8F9] focus:bg-white focus:ring-2 focus:ring-[#4C9AFF]";

const BTN =
  "inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-[3px] px-3 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[#4C9AFF] disabled:cursor-not-allowed disabled:opacity-60";
const BTN_PRIMARY = `${BTN} bg-[#0C66E4] text-white hover:bg-[#0055CC]`;
const BTN_SUBTLE = `${BTN} bg-[#091E420F] text-[#172B4D] hover:bg-[#091E4224]`;

const Field = ({ label, required, hint, className = "", children }) => (
  <div className={`flex flex-col ${className}`}>
    <label className="mb-1 text-xs font-semibold text-[#44546F]">
      {label}
      {required && <span className="ml-0.5 text-[#C9372C]">*</span>}
    </label>
    {children}
    {hint && <p className="mt-1 text-xs text-[#626F86]">{hint}</p>}
  </div>
);

// Native <select> with a consistent chevron
const SelectBox = ({ children, ...props }) => (
  <div className="relative">
    <select {...props} className={`${FIELD} cursor-pointer appearance-none truncate pr-8`}>
      {children}
    </select>
    <ChevronDown
      size={16}
      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#626F86]"
    />
  </div>
);

const GroupTitle = ({ children }) => (
  <h3 className="mb-3 text-sm font-semibold text-[#172B4D]">{children}</h3>
);

// react-select skinned to match the inputs above
const selectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: "32px",
    borderRadius: "3px",
    borderColor: "#8590A2",
    backgroundColor: "#FFFFFF",
    boxShadow: state.isFocused ? "0 0 0 2px #4C9AFF" : "none",
    "&:hover": { borderColor: "#8590A2", backgroundColor: state.isFocused ? "#FFFFFF" : "#F7F8F9" },
  }),
  valueContainer: (base) => ({ ...base, padding: "0 10px" }),
  placeholder: (base) => ({ ...base, color: "#626F86" }),
  singleValue: (base) => ({ ...base, color: "#172B4D" }),
  input: (base) => ({ ...base, color: "#172B4D", margin: 0, padding: 0 }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (base) => ({ ...base, color: "#626F86", padding: "0 8px" }),
  menu: (base) => ({
    ...base,
    borderRadius: "3px",
    boxShadow: "0 8px 12px #091E4226, 0 0 1px #091E424F",
    zIndex: 30,
  }),
  option: (base, state) => ({
    ...base,
    fontSize: "14px",
    color: state.isSelected ? "#0C66E4" : "#172B4D",
    backgroundColor: state.isSelected ? "#E9F2FF" : state.isFocused ? "#F7F8F9" : "#FFFFFF",
  }),
};

/* ================= ASSET PICKER (code + who is using it) ================= */
// Works out who currently holds an asset. Handles a populated employee
// object, a plain id/staffCode, or a flat name field on the asset.
const resolveAssetUser = (asset, employees = []) => {
  const raw =
    asset.employee || asset.assignedTo || asset.employeeId || asset.currentEmployee || null;

  let base = null;
  if (raw && typeof raw === "object" && raw.name) {
    base = { _id: raw._id, name: raw.name, staffCode: raw.staffCode || "" };
  } else if (raw) {
    const key = typeof raw === "string" ? raw : raw._id;
    const emp = employees.find((e) => e._id === key || e.staffCode === key);
    if (emp) base = { _id: emp._id, name: emp.name, staffCode: emp.staffCode || "" };
  } else if (asset.assignedToName || asset.employeeName) {
    base = { name: asset.assignedToName || asset.employeeName, staffCode: asset.staffCode || "" };
  }
  if (!base) return null;

  // pull department / designation from the employee list
  const full = employees.find(
    (e) => (base._id && e._id === base._id) || (base.staffCode && e.staffCode === base.staffCode)
  );
  return {
    name: base.name,
    staffCode: base.staffCode || full?.staffCode || "",
    department: full?.department || "",
    designation: full?.designation || "",
  };
};

const idOf = (v) => (v && typeof v === "object" ? String(v._id || "") : v ? String(v) : "");

const userLabel = (u) => (u ? `${u.name}${u.staffCode ? ` (${u.staffCode})` : ""}` : "");

function AssetSelect({ assets, employees, value, onChange, placeholder, disabled }) {
  const options = assets.map((a) => {
    const user = resolveAssetUser(a, employees);
    return {
      value: a.assetCode,
      // plain-text label drives the search (code, type, user name, staff code)
      label: `${a.assetCode} ${a.type || ""} ${a.model || ""} ${a.serialNumber || ""} ${user?.name || ""} ${user?.staffCode || ""} ${user?.department || ""}`,
      asset: a,
      user,
    };
  });
  const selected = options.find((o) => o.value === value) || null;

  return (
    <Select
      options={options}
      value={selected}
      onChange={(o) => onChange(o?.value || "")}
      placeholder={placeholder}
      isSearchable
      isClearable
      isDisabled={disabled}
      openMenuOnFocus
      menuPlacement="auto"
      classNamePrefix="rs"
      className="text-sm"
      noOptionsMessage={() => "No assets found"}
      styles={{
        ...selectStyles,
        menuList: (base) => ({ ...base, maxHeight: 340 }),
      }}
      formatOptionLabel={(o, { context }) =>
        context === "value" ? (
          <span>
            <span className="font-medium">{o.asset.assetCode}</span>
            <span className="ml-2 text-xs text-[#626F86]">{o.asset.type}</span>
          </span>
        ) : (
          <div className="flex items-start justify-between gap-4 py-0.5">
            <div className="min-w-0">
              <p className="font-medium text-[#172B4D]">{o.asset.assetCode}</p>
              <p className="truncate text-xs text-[#626F86]">
                {o.asset.type}{o.asset.model ? ` · ${o.asset.model}` : ""}
              </p>
            </div>
            {o.user ? (
              <div className="min-w-0 text-right">
                <p className="truncate text-sm text-[#172B4D]">{o.user.name}</p>
                <p className="truncate text-xs text-[#626F86]">
                  {o.user.staffCode}
                  {o.user.department ? ` · ${o.user.department}` : ""}
                </p>
              </div>
            ) : (
              <span className="mt-0.5 inline-flex h-5 items-center rounded-[3px] bg-[#DCFFF1] px-1.5 text-[11px] font-bold uppercase tracking-wide text-[#216E4E]">
                Available
              </span>
            )}
          </div>
        )
      }
    />
  );
}

const DetailItem = ({ label, value }) => (
  <div className="min-w-0">
    <dt className="text-xs font-semibold text-[#626F86]">{label}</dt>
    <dd className="truncate text-sm text-[#172B4D]">{value || "—"}</dd>
  </div>
);

function AssetDetailsCard({ asset, user }) {
  return (
    <div className="rounded-[3px] border border-[#DCDFE4] bg-[#F7F8F9]">
      <div className="grid gap-4 p-3 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#44546F]">Asset</p>
          <dl className="grid grid-cols-2 gap-3">
            <DetailItem label="Asset code" value={asset.assetCode} />
            <DetailItem label="Type" value={asset.type} />
            <DetailItem label="Model" value={asset.model} />
            <DetailItem label="Serial no." value={asset.serialNumber} />
          </dl>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#44546F]">
            Currently used by
          </p>
          {user ? (
            <dl className="grid grid-cols-2 gap-3">
              <DetailItem label="Name" value={user.name} />
              <DetailItem label="Staff code" value={user.staffCode} />
              <DetailItem label="Department" value={user.department} />
              <DetailItem label="Designation" value={user.designation} />
              {asset.assignedDate && (
                <DetailItem
                  label="Assigned on"
                  value={new Date(asset.assignedDate).toLocaleDateString(undefined, {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                />
              )}
            </dl>
          ) : (
            <p className="text-sm text-[#216E4E]">Not assigned — available</p>
          )}
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { id: "add", label: "Add asset", icon: Package },
  { id: "assign", label: "Assign asset", icon: UserCheck },
  { id: "return", label: "Return asset", icon: RotateCcw },
];

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

  // Tabs replace the old accordion; "add" is open by default
  const [open, setOpen] = useState("add");
  const user = JSON.parse(localStorage.getItem("user"));

  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState("");

  const [allAssets, setAllAssets] = useState([]);

  // Company picked on the Assign / Return tabs (super admin only)
  const [scopeCompanyId, setScopeCompanyId] = useState("");

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

  const loadAssets = async () => {
    try {
      const res = await api.get("/assets?limit=1000");
      setAllAssets(res.data.assets || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load assets");
    }
  };

  useEffect(() => {
    fetchEmployees();
    loadCompanies();
    loadAssets();
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
        companyId, // send selected company
      });

      toast.success("Asset Added");
      loadAssets();

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

      if (user?.role === "super_admin" && !scopeCompanyId) {
        return toast.error("Select Company");
      }

      await api.post("/assets/assign", {
        employeeId: selectedEmployee,
        assetCode,
        companyId: scopeCompanyId || undefined,
      });

      toast.success("Asset Assigned");
      loadAssets();

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

      if (user?.role === "super_admin" && !scopeCompanyId) {
        return toast.error("Select Company");
      }

      await api.post("/assets/return", {
        assetCode,
        companyId: scopeCompanyId || undefined,
      });

      toast.success("Asset Returned");
      loadAssets();

      setAssetCode("");
    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.msg || "Return Failed"
      );
    }
  };

  // Assign: only free assets. Return: any asset with an active assignment.
  const isSuperAdmin = user?.role === "super_admin";
  const inScope = (item) =>
    !isSuperAdmin || (scopeCompanyId && idOf(item.companyId) === scopeCompanyId);
  const scopedEmployees = employees.filter(inScope);
  const assignableAssets = allAssets.filter((a) => inScope(a) && a.status === "available");
  const returnableAssets = allAssets.filter((a) => inScope(a) && a.employee);
  const pickerDisabled = isSuperAdmin && !scopeCompanyId;

  const handleScopeCompanyChange = (e) => {
    setScopeCompanyId(e.target.value);
    setAssetCode("");
    setSelectedEmployee("");
  };
  const returnSelected = allAssets.find((a) => a.assetCode === assetCode);
  const assignSelected = allAssets.find((a) => a.assetCode === assetCode && inScope(a));
  const returnSelectedUser = returnSelected ? resolveAssetUser(returnSelected, employees) : null;

  const showDeviceFields = type === "Printer" || type === "HHT";

  return (
    <div className="min-h-screen bg-[#F7F8F9] text-[#172B4D]" style={{ fontFamily: FONT_STACK }}>
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-10">

        {/* BREADCRUMB + BACK */}
        <div className="mb-2 flex items-center justify-between">
          <nav className="text-xs text-[#626F86]">
            Admin <span className="mx-1">/</span> Assets
          </nav>
          <button onClick={() => window.history.back()} className={BTN_SUBTLE}>
            <ArrowLeft size={14} /> Back
          </button>
        </div>

        {/* TITLE */}
        <div className="mb-4">
          <h1 className="text-2xl font-medium">Asset Management</h1>
          <p className="mt-1 text-sm text-[#626F86]">
            Laptop / Printer / HHT / Mobile Management System
          </p>
        </div>

        {/* MAIN CARD */}
        <section className="rounded-[3px] border border-[#DCDFE4] bg-white">

          {/* TABS */}
          <div role="tablist" className="flex overflow-x-auto border-b border-[#DCDFE4] px-2">
            {TABS.map(({ id, label, icon: Icon }) => {
              const active = open === id;
              return (
                <button
                  key={id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setOpen(id)}
                  className={`-mb-px inline-flex h-11 items-center gap-2 whitespace-nowrap border-b-2 px-4 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#4C9AFF] ${
                    active
                      ? "border-[#0C66E4] text-[#0C66E4]"
                      : "border-transparent text-[#44546F] hover:bg-[#091E420F] hover:text-[#172B4D]"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              );
            })}
          </div>

          {/* ================= ADD ASSET ================= */}
          {open === "add" && (
            <>
              <div className="p-5">
                <p className="mb-5 text-xs text-[#626F86]">
                  Register a new asset in the system. Required fields are marked with an asterisk{" "}
                  <span className="text-[#C9372C]">*</span>
                </p>

                <div className="flex flex-col gap-6">
                  {/* Basic details */}
                  <div>
                    <GroupTitle>Basic details</GroupTitle>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {user?.role === "super_admin" && (
                        <Field label="Company" required className="sm:col-span-2 lg:col-span-3">
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
                          className={FIELD}
                          placeholder="e.g. AST-0042"
                          value={assetCode}
                          onChange={(e) => setAssetCode(e.target.value)}
                        />
                      </Field>

                      <Field label="Type" required>
                        <SelectBox value={type} onChange={(e) => setType(e.target.value)}>
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
                          className={FIELD}
                          placeholder="e.g. Dell Latitude 5420"
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                        />
                      </Field>

                      <Field label="Serial Number">
                        <input
                          className={FIELD}
                          placeholder="Serial Number"
                          value={serialNumber}
                          onChange={(e) => setSerialNumber(e.target.value)}
                        />
                      </Field>
                    </div>
                  </div>

                  {/* Printer / HHT details */}
                  {(showDeviceFields || type === "Printer" || type === "HHT") && (
                    <div className="border-t border-[#EBECF0] pt-5">
                      <GroupTitle>{type} details</GroupTitle>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {showDeviceFields && (
                          <>
                            <Field label="Route">
                              <input
                                className={FIELD}
                                placeholder="Route"
                                value={route}
                                onChange={(e) => setRoute(e.target.value)}
                              />
                            </Field>

                            <Field label="Salesman Code">
                              <input
                                className={FIELD}
                                placeholder="Salesman Code"
                                value={salesmanCode}
                                onChange={(e) => setSalesmanCode(e.target.value)}
                              />
                            </Field>

                            <Field label="Salesman Name">
                              <input
                                className={FIELD}
                                placeholder="Salesman Name"
                                value={salesmanName}
                                onChange={(e) => setSalesmanName(e.target.value)}
                              />
                            </Field>

                            <Field label="Supervisor">
                              <input
                                className={FIELD}
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
                              className={FIELD}
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
                                className={FIELD}
                                placeholder="IMEI"
                                value={imei}
                                onChange={(e) => setImei(e.target.value)}
                              />
                            </Field>

                            <Field label="SIM Number">
                              <input
                                className={FIELD}
                                placeholder="SIM Number"
                                value={simNumber}
                                onChange={(e) => setSimNumber(e.target.value)}
                              />
                            </Field>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  <div className="border-t border-[#EBECF0] pt-5">
                    <GroupTitle>Additional information</GroupTitle>
                    <Field label="Notes">
                      <input
                        className={FIELD}
                        placeholder="Additional notes (optional)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </Field>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-[#DCDFE4] bg-[#F7F8F9] px-5 py-3">
                <button onClick={resetForm} className={BTN_SUBTLE}>Clear</button>
                <button onClick={addAsset} className={BTN_PRIMARY}>Create asset</button>
              </div>
            </>
          )}

          {/* ================= ASSIGN ================= */}
          {open === "assign" && (
            <>
              <div className="p-5">
                <p className="mb-5 text-xs text-[#626F86]">
                  Assign an asset to an employee. Required fields are marked with an asterisk{" "}
                  <span className="text-[#C9372C]">*</span>
                </p>

                <div className="grid max-w-3xl gap-4 md:grid-cols-3">
                  {isSuperAdmin && (
                    <Field label="Company" required className="md:col-span-3">
                      <SelectBox value={scopeCompanyId} onChange={handleScopeCompanyChange}>
                        <option value="">Select Company</option>
                        {companies.map((company) => (
                          <option key={company._id} value={company._id}>
                            {company.name}
                          </option>
                        ))}
                      </SelectBox>
                    </Field>
                  )}

                  <Field label="Employee" required className="md:col-span-2">
                    <Select
                      options={scopedEmployees.map((e) => ({
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
                      placeholder={pickerDisabled ? "Select a company first" : "Search Employee..."}
                      isDisabled={pickerDisabled}
                      className="text-sm"
                      classNamePrefix="rs"
                      isSearchable
                      styles={selectStyles}
                    />
                  </Field>

                  <Field label="Asset Code" required hint="Available assets only.">
                    <AssetSelect
                      assets={assignableAssets}
                      employees={employees}
                      value={assetCode}
                      onChange={setAssetCode}
                      placeholder={pickerDisabled ? "Select a company first" : "Search by code, model or serial..."}
                      disabled={pickerDisabled}
                    />
                  </Field>
                  {assignSelected && (
                    <div className="md:col-span-3">
                      <AssetDetailsCard asset={assignSelected} user={null} />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-[#DCDFE4] bg-[#F7F8F9] px-5 py-3">
                <button onClick={assign} className={BTN_PRIMARY}>Assign</button>
              </div>
            </>
          )}

          {/* ================= RETURN ================= */}
          {open === "return" && (
            <>
              <div className="p-5">
                <p className="mb-5 text-xs text-[#626F86]">
                  Mark an asset as returned to stock. Required fields are marked with an asterisk{" "}
                  <span className="text-[#C9372C]">*</span>
                </p>

                <div className="max-w-xl">
                  {isSuperAdmin && (
                    <Field label="Company" required className="mb-4">
                      <SelectBox value={scopeCompanyId} onChange={handleScopeCompanyChange}>
                        <option value="">Select Company</option>
                        {companies.map((company) => (
                          <option key={company._id} value={company._id}>
                            {company.name}
                          </option>
                        ))}
                      </SelectBox>
                    </Field>
                  )}

                  <Field label="Asset Code" required hint="Assets currently in use. Search by code or user.">
                    <AssetSelect
                      assets={returnableAssets}
                      employees={employees}
                      value={assetCode}
                      onChange={setAssetCode}
                      placeholder={pickerDisabled ? "Select a company first" : "Search by code, model, user or staff code..."}
                      disabled={pickerDisabled}
                    />
                  </Field>

                  {returnSelected && (
                    <div className="mt-3">
                      <AssetDetailsCard asset={returnSelected} user={returnSelectedUser} />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-[#DCDFE4] bg-[#F7F8F9] px-5 py-3">
                <button onClick={returnAsset} className={BTN_PRIMARY}>Return</button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}