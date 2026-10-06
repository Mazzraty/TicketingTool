import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { Search, X, Zap, Check, ChevronDown } from "lucide-react";

/* ================= UI HELPERS (styling only, no logic) ================= */
// Atlassian / Jira Service Management styling
const inputCls =
  "h-9 w-full rounded-[3px] border-2 border-[#DFE1E6] bg-[#FAFBFC] px-2.5 text-sm text-[#172B4D] " +
  "placeholder:text-[#7A869A] transition-colors hover:bg-[#EBECF0] " +
  "focus:border-[#4C9AFF] focus:bg-white focus:outline-none " +
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#FAFBFC]";

const btnBase =
  "inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-[3px] px-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#4C9AFF] disabled:cursor-not-allowed disabled:opacity-50";
const btnPrimary = `${btnBase} bg-[#0052CC] text-white hover:bg-[#0065FF] active:bg-[#0747A6]`;
const btnSubtle = `${btnBase} bg-transparent text-[#42526E] hover:bg-[rgba(9,30,66,0.08)]`;

function Field({ label, required, hint, className = "", children }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-semibold text-[#5E6C84]">
        {label}
        {required && <span className="ml-0.5 text-[#DE350B]">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-[#6B778C]">{hint}</p>}
    </div>
  );
}

// Native <select> with a consistent chevron
function SelectBox({ children, ...props }) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`${inputCls} cursor-pointer appearance-none truncate pr-8`}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B778C]"
      />
    </div>
  );
}

/* ================= PRIORITY THEME (mirrors AdminTickets) ================= */
const PRIORITY_THEME = {
  Low: "bg-[#DEEBFF] text-[#0747A6]",
  Medium: "bg-[#FFF0B3] text-[#172B4D]",
  High: "bg-[#FFE2BD] text-[#974F0C]",
  Critical: "bg-[#FFEBE6] text-[#BF2600]",
};

const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const DEPARTMENTS = [
  "SR. MANAGEMENT",
  "COW FARM",
  "AGRICULTURE FARM",
  "FINANCE",
  "SALES AND MARKETING",
  "PRODUCTION",
  "FACILITY MAINTENANCE",
  "OTHER FACILITIES",
  "PROCUREMENT",
  "WAREHOUSE AND LOGISTICS",
  "QUALITY",
  "HR & ADMIN",
  "REAL ESTATE",
  "SUPPORT SERVICE",
  "IT DEPARTMENT",
  "FERTILIZER FACTORY",
  "DEMAND PLANNING",
  "GOAT FARM",
  "FARMING",
  "FINANCE AND ADMIN",
  "OPERATIONS",
];

const RELATED_OPTIONS = [
  "Laptop/Desktop",
  "ERP",
  "Email",
  "HHT",
  "HHT Printer",
  "Syncwise",
  "Printer",
  "Network",
  "Software",
  "Hardware",
  "Others",
];

/* ================= AUTO-SUGGEST "RELATED TO" FROM TEXT =================
   Same rule set as the portal ticket form — more specific items (HHT
   Printer, HHT) are checked before their broader cousins (Printer,
   Hardware) so a phrase like "HHT printer not scanning" doesn't fall
   through to "Printer". This only pre-fills the dropdown; IT support can
   always change it before submitting. */
const RELATED_KEYWORD_RULES = [
  {
    value: "HHT Printer",
    keywords: ["hht printer", "handheld printer", "mobile printer", "portable printer"],
  },
  {
    value: "HHT",
    keywords: ["hht", "handheld device", "handheld terminal", "scanner gun", "barcode scanner", "barcode device"],
  },
  {
    value: "ERP",
    keywords: ["erp", "sap", "tally", "oracle erp", "accounting software", "erp module", "erp login"],
  },
  {
    value: "Syncwise",
    keywords: ["syncwise"],
  },
  {
    value: "Email",
    keywords: ["email", "e-mail", "outlook", "gmail", "mailbox", "mail server", "mail not working"],
  },
  {
    value: "Printer",
    keywords: ["printer", "printout", "print job", "toner", "cartridge", "scanner", "print not working"],
  },
  {
    value: "Network",
    keywords: ["network", "wifi", "wi-fi", "internet", "vpn", "lan", "ethernet", "router", "connectivity"],
  },
  {
    value: "Laptop/Desktop",
    keywords: ["laptop", "desktop", "computer", "cpu not", "monitor", "screen flickering", "pc not"],
  },
  {
    value: "Software",
    keywords: ["software", "application", "app crash", "install", "software update", "license", "activation"],
  },
  {
    value: "Hardware",
    keywords: ["hardware", "mouse", "keyboard", "cable request", "device", "battery", "charger"],
  },
];

const detectRelatedTo = (text) => {
  const lower = text.toLowerCase();
  for (const rule of RELATED_KEYWORD_RULES) {
    const match = rule.keywords.find((kw) => lower.includes(kw));
    if (match) return { value: rule.value, matched: match };
  }
  return null;
};

const todayStr = () => new Date().toISOString().split("T")[0];

const INITIAL_FORM = {
  title: "",
  description: "",
  priority: "Medium",
  department: "",
  relatedTo: "",
  assetId: "",
  employeeId: "",
  // NEW: optional name for a requester who is outside the company
  // (not in the employee list). Empty string for normal employee tickets.
  externalName: "",
  companyId: "",
  incidentDate: todayStr(),
};

const findMatchingDepartment = (raw) => {
  if (!raw) return "";
  const upper = raw.trim().toUpperCase();
  const exact = DEPARTMENTS.find((d) => d === upper);
  if (exact) return exact;
  // Loose match either direction, e.g. employee.department "IT" should
  // still match the dropdown's "IT DEPARTMENT".
  const loose = DEPARTMENTS.find((d) => d.includes(upper) || upper.includes(d));
  return loose || raw;
};

// Mirrors AdminEmployeeMaster's normalizeCompanyId helper
const normalizeCompanyId = (value) => {
  if (!value) return null;
  if (typeof value === "object") {
    if (value._id && typeof value._id.toString === "function") {
      return value._id.toString();
    }
    if (typeof value.toString === "function") {
      return value.toString();
    }
    return null;
  }
  if (typeof value.toString === "function") {
    return value.toString();
  }
  return value;
};

/* ================= Searchable Employee Select ================= */
function EmployeeSelect({ employees, value, onSelect, disabled, placeholder }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef(null);

  const selected = employees.find((e) => e._id === value) || null;

  const filtered = useMemo(() => {
    if (!query.trim()) return employees.slice(0, 50);
    const q = query.toLowerCase();
    return employees
      .filter(
        (e) =>
          e.name?.toLowerCase().includes(q) ||
          e.staffCode?.toLowerCase().includes(q) ||
          e.department?.toLowerCase().includes(q)
      )
      .slice(0, 50);
  }, [employees, query]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      {selected && !open ? (
        <button
          type="button"
          onClick={() => !disabled && setOpen(true)}
          disabled={disabled}
          className="flex min-h-[40px] w-full items-center justify-between rounded-[3px] border-2 border-[#DFE1E6] bg-[#FAFBFC] px-2.5 py-1 text-left text-sm transition-colors hover:bg-[#EBECF0] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex flex-col">
            <span className="font-medium text-[#172B4D]">{selected.name}</span>
            <span className="text-[11px] text-[#5E6C84]">
              {selected.staffCode}
              {selected.department ? ` · ${selected.department}` : ""}
            </span>
          </span>
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect("");
            }}
            className="rounded-[3px] p-1 text-[#6B778C] hover:bg-[rgba(9,30,66,0.08)] hover:text-[#172B4D]"
            aria-label="Clear employee"
          >
            <X size={14} />
          </span>
        </button>
      ) : (
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B778C]"
          />
          <input
            autoFocus={open}
            disabled={disabled}
            className={`${inputCls} pl-8`}
            placeholder={placeholder || "Search by name or staff code…"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => !disabled && setOpen(true)}
          />
        </div>
      )}

      {open && !disabled && (
        <div className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-[3px] border border-[#DFE1E6] bg-white shadow-[0_4px_8px_-2px_rgba(9,30,66,0.25),0_0_1px_rgba(9,30,66,0.31)]">
          {filtered.length === 0 ? (
            <div className="px-3 py-3 text-sm text-[#6B778C]">No employees found</div>
          ) : (
            filtered.map((emp) => (
              <button
                type="button"
                key={emp._id}
                onClick={() => {
                  onSelect(emp._id);
                  setQuery("");
                  setOpen(false);
                }}
                className="flex w-full flex-col border-b border-[#F4F5F7] px-3 py-2 text-left transition-colors last:border-b-0 hover:bg-[#F4F5F7]"
              >
                <span className="text-sm font-medium text-[#172B4D]">{emp.name}</span>
                <span className="text-[11px] text-[#5E6C84]">
                  {emp.staffCode}
                  {emp.department ? ` · ${emp.department}` : ""}
                  {emp.designation ? ` · ${emp.designation}` : ""}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function CreateManualTicket() {
  // Full, unscoped lists (loaded once)
  const [allAssets, setAllAssets] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  // ⚡ Auto-suggestion state for Related To
  const [relatedSuggested, setRelatedSuggested] = useState(null); // { value, matched } | null
  const [manualRelatedTo, setManualRelatedTo] = useState(false); // true once IT picks Related To themselves

  // Auto-fill Department from the selected employee's own department,
  // unless IT support has picked one manually.
  const [manualDepartment, setManualDepartment] = useState(false);

  // NEW: true when the requester is someone outside the company
  // (identified by a typed name instead of an employee record)
  const [isExternal, setIsExternal] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const isSuperAdmin = user?.role === "super_admin";
  const allowedCompanyIds = [
    ...(user?.companyId ? [normalizeCompanyId(user.companyId)] : []),
    ...(user?.companyAccess || [])
      .map((c) => normalizeCompanyId(c?.companyId))
      .filter(Boolean),
  ];

  useEffect(() => {
    const loadAssets = async () => {
      try {
        const res = await api.get("/assets?limit=1000");
        setAllAssets(res.data.assets || []);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load assets");
      }
    };

    const loadEmployees = async () => {
      try {
        const res = await api.get("/employees");
        // NOTE: /employees returns a plain array (see AdminEmployeeMaster),
        // not { employees: [...] } like /assets does.
        const all = Array.isArray(res.data) ? res.data : res.data.employees || [];

        // Scope to the current user's company, same as AdminEmployeeMaster,
        // unless they're a super_admin (who can see everyone, then narrows
        // down further once they pick a company below).
        const scoped = isSuperAdmin
          ? all
          : all.filter((e) =>
            allowedCompanyIds.includes(normalizeCompanyId(e.companyId))
          );

        setAllEmployees(scoped);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load employees");
      }
    };

    const loadCompanies = async () => {
      if (!isSuperAdmin) return;
      try {
        // Adjust this path/response-shape to match your existing companies
        // endpoint if it differs (e.g. it may already be used elsewhere,
        // such as an Admin Company Access page).
        const res = await api.get("/companies");
        const list = Array.isArray(res.data) ? res.data : res.data.companies || [];
        setCompanies(list);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load companies");
      }
    };

    loadAssets();
    loadEmployees();
    loadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Employees/assets narrowed to the selected company. Only super admins
  // need this narrowing — regular IT support is already scoped server-side
  // via allowedCompanyIds above, and has no company picker.
  const employees = useMemo(() => {
    if (!isSuperAdmin || !form.companyId) return allEmployees;
    return allEmployees.filter(
      (e) => normalizeCompanyId(e.companyId) === form.companyId
    );
  }, [allEmployees, isSuperAdmin, form.companyId]);

  const assets = useMemo(() => {
    if (!isSuperAdmin || !form.companyId) return allAssets;
    return allAssets.filter(
      (a) => normalizeCompanyId(a.companyId) === form.companyId
    );
  }, [allAssets, isSuperAdmin, form.companyId]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleRelatedToChange = (e) => {
    setManualRelatedTo(true);
    handleChange("relatedTo")(e);
  };

  const handleDepartmentChange = (e) => {
    setManualDepartment(true);
    handleChange("department")(e);
  };

  // NEW: switch between "employee" and "outside company" requester.
  // Only one of employeeId / externalName is ever filled at a time.
  const handleExternalToggle = (e) => {
    const checked = e.target.checked;
    setIsExternal(checked);
    setForm((prev) =>
      checked
        ? { ...prev, employeeId: "" }
        : { ...prev, externalName: "" }
    );
  };

  // Switching company (super admin only) resets everything company-scoped
  // that was picked under the previous company, so stale employee/asset/
  // department selections can't leak across companies.
  const handleCompanyChange = (e) => {
    const companyId = e.target.value;
    setForm((prev) => ({
      ...INITIAL_FORM,
      companyId,
      incidentDate: prev.incidentDate,
      externalName: prev.externalName, // keep a typed outside-company name
    }));
    setManualDepartment(false);
    setManualRelatedTo(false);
    setRelatedSuggested(null);
  };

  // Re-scan title + description on every keystroke, pre-fill Related To
  // unless IT support has already chosen it manually.
  useEffect(() => {
    const combined = `${form.title} ${form.description}`.trim();

    if (!combined) {
      setRelatedSuggested(null);
      return;
    }

    const result = detectRelatedTo(combined);
    setRelatedSuggested(result);

    if (result && !manualRelatedTo) {
      setForm((prev) =>
        prev.relatedTo === result.value ? prev : { ...prev, relatedTo: result.value }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.title, form.description]);

  const submitHandler = async (e) => {
    e.preventDefault();

    if (isSuperAdmin && !form.companyId) {
      toast.error("Please select a company");
      return;
    }

    // NEW: an outside-company requester is identified by name instead of employee
    if (isExternal) {
      if (!form.externalName.trim()) {
        toast.error("Please enter the requester's name");
        return;
      }
    } else if (!form.employeeId) {
      toast.error("Please select the employee this ticket is for");
      return;
    }

    if (!form.department) {
      toast.error("Please select a department");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/tickets/manual", form);
      toast.success("Manual ticket created");
      setForm(INITIAL_FORM);
      setRelatedSuggested(null);
      setManualRelatedTo(false);
      setManualDepartment(false);
      setIsExternal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  const employeePickerDisabled = isSuperAdmin && !form.companyId;

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-[#172B4D]">
      <div className="mx-auto w-full max-w-2xl px-6 py-6">

        {/* BREADCRUMB */}
        <nav className="mb-2 flex items-center gap-1.5 text-sm text-[#5E6C84]">
          <span>Admin</span>
          <span>/</span>
          <span>Tickets</span>
          <span>/</span>
          <span>Create Ticket</span>
        </nav>

        {/* HEADER */}
        <div className="mb-5">
          <h1 className="text-2xl font-medium text-[#172B4D]">Create Manual Ticket</h1>
          <p className="mt-1 text-sm text-[#5E6C84]">
            Log a support request on behalf of a user
          </p>
        </div>

        {/* FORM CARD */}
        <form
          onSubmit={submitHandler}
          className="rounded-[3px] border border-[#DFE1E6] bg-white"
        >
          <div className="flex flex-col gap-5 p-5">
            <p className="text-xs text-[#5E6C84]">
              Required fields are marked with an asterisk{" "}
              <span className="text-[#DE350B]">*</span>
            </p>

            {/* Company (super admin only) */}
            {isSuperAdmin && (
              <Field
                label="Company"
                required
                hint="Employees and assets below are scoped to this company."
              >
                <SelectBox
                  value={form.companyId}
                  onChange={handleCompanyChange}
                  required
                >
                  <option value="">Select company…</option>
                  {companies.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </SelectBox>
              </Field>
            )}

            {/* Requester: employee OR outside-company name */}
            <Field
              label={isExternal ? "Requester name" : "Employee"}
              required
              hint={
                isExternal
                  ? "For someone who isn't in the employee list. Department is still required."
                  : employeePickerDisabled
                    ? "Choose a company above to load its employees."
                    : "Who this ticket is being raised for."
              }
            >
              {isExternal ? (
                <input
                  className={inputCls}
                  placeholder="Full name of the person (outside company)"
                  value={form.externalName}
                  onChange={handleChange("externalName")}
                />
              ) : (
                <EmployeeSelect
                  employees={employees}
                  value={form.employeeId}
                  disabled={employeePickerDisabled}
                  placeholder={
                    employeePickerDisabled
                      ? "Select a company first"
                      : "Search by name or staff code…"
                  }
                  onSelect={(id) => {
                    const emp = employees.find((e) => e._id === id);
                    setForm((prev) => ({
                      ...prev,
                      employeeId: id,
                      department:
                        emp && !manualDepartment
                          ? findMatchingDepartment(emp.department)
                          : prev.department,
                    }));
                  }}
                />
              )}

              {/* NEW: outside-company toggle */}
              <label className="mt-2.5 flex cursor-pointer items-center gap-2 text-sm text-[#172B4D]">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#0052CC]"
                  checked={isExternal}
                  onChange={handleExternalToggle}
                />
                Requester is outside the company (not an employee)
              </label>
            </Field>

            {/* Title */}
            <Field label="Issue title" required>
              <input
                className={inputCls}
                placeholder="e.g. Laptop won't connect to VPN"
                value={form.title}
                onChange={handleChange("title")}
                required
              />
            </Field>

            {/* Description */}
            <Field
              label="Description"
              required
              hint="This is saved with the ticket so anyone can see what was reported."
            >
              <textarea
                className="w-full resize-none rounded-[3px] border-2 border-[#DFE1E6] bg-[#FAFBFC] px-2.5 py-2 text-sm text-[#172B4D] placeholder:text-[#7A869A] transition-colors hover:bg-[#EBECF0] focus:border-[#4C9AFF] focus:bg-white focus:outline-none"
                rows={4}
                placeholder="Describe the issue, steps to reproduce, and any relevant context."
                value={form.description}
                onChange={handleChange("description")}
                required
              />
            </Field>

            {/* Related To */}
            <Field label="Related to">
              <SelectBox
                value={form.relatedTo}
                onChange={handleRelatedToChange}
              >
                <option value="">Select what this relates to…</option>
                {RELATED_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </SelectBox>

              {relatedSuggested && !manualRelatedTo && (
                <div className="mt-2 flex items-start gap-2 rounded-[3px] bg-[#DEEBFF] px-3 py-2">
                  <Zap size={14} className="mt-0.5 shrink-0 text-[#0052CC]" />
                  <p className="text-xs leading-relaxed text-[#0747A6]">
                    Suggested from "<span className="italic">{relatedSuggested.matched}</span>" — feel free to adjust above
                  </p>
                </div>
              )}
            </Field>

            {/* Incident Date */}
            <Field
              label="Date incident occurred"
              required
              hint="Defaults to today — change this if the issue happened earlier."
            >
              <input
                type="date"
                className={inputCls}
                value={form.incidentDate}
                onChange={handleChange("incidentDate")}
                max={todayStr()}
                required
              />
            </Field>

            {/* Asset */}
            <Field label="Asset">
              <SelectBox
                value={form.assetId}
                onChange={handleChange("assetId")}
                disabled={employeePickerDisabled}
              >
                <option value="">
                  {employeePickerDisabled ? "Select a company first" : "Select asset (optional)"}
                </option>
                {assets.map((asset) => (
                  <option key={asset._id} value={asset._id}>
                    {asset.assetCode} - {asset.type}
                  </option>
                ))}
              </SelectBox>
            </Field>

            {/* Department + Priority side by side */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field
                label="Department"
                required
                hint={
                  form.employeeId && !manualDepartment && form.department
                    ? "Auto-filled from the selected employee's department"
                    : undefined
                }
              >
                <SelectBox
                  value={form.department}
                  onChange={handleDepartmentChange}
                  required
                >
                  <option value="" disabled>Select department…</option>
                  {!DEPARTMENTS.includes(form.department) && form.department && (
                    <option value={form.department}>{form.department}</option>
                  )}
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </SelectBox>
              </Field>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#5E6C84]">
                  Priority
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRIORITIES.map((priority) => {
                    const active = form.priority === priority;
                    return (
                      <button
                        key={priority}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, priority }))}
                        className={`h-8 rounded-[3px] px-3 text-sm font-medium transition-colors ${active
                          ? `${PRIORITY_THEME[priority]} ring-2 ring-inset ring-[#4C9AFF]`
                          : "bg-[rgba(9,30,66,0.04)] text-[#42526E] hover:bg-[rgba(9,30,66,0.08)]"
                          }`}
                      >
                        {priority}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* SUBMIT */}
          <div className="flex justify-end gap-2 border-t border-[#DFE1E6] bg-[#FAFBFC] px-5 py-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              disabled={submitting}
              className={btnSubtle}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={btnPrimary}
            >
              {submitting ? (
                "Creating…"
              ) : (
                <>
                  <Check size={14} /> Create Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}