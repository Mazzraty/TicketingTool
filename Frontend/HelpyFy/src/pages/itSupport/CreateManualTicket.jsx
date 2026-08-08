import { useEffect, useMemo, useRef, useState } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";

/* ================= ICONS (inline, no extra dependency) ================= */
const Icon = ({ children, className = "w-4 h-4" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {children}
  </svg>
);
const IconNote = (p) => <Icon {...p}><path d="M14 3v4a1 1 0 0 0 1 1h4" /><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" /><path d="M9 13h6M9 17h6" /></Icon>;
const IconLayers = (p) => <Icon {...p}><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5" /><path d="m3 17 9 5 9-5" /></Icon>;
const IconBuilding = (p) => <Icon {...p}><rect x="4" y="2" width="16" height="20" rx="1" /><path d="M9 22v-4h6v4M9 6h.01M15 6h.01M9 10h.01M15 10h.01M9 14h.01M15 14h.01" /></Icon>;
const IconTag = (p) => <Icon {...p}><path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.42 0l8.58-8.58a1 1 0 0 0 0-1.42L12 2Z" /><circle cx="7" cy="7" r="1.5" fill="currentColor" /></Icon>;
const IconCheck = (p) => <Icon {...p}><path d="M20 6 9 17l-5-5" /></Icon>;
const IconCalendar = (p) => <Icon {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Icon>;
const IconUser = (p) => <Icon {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></Icon>;
const IconSearch = (p) => <Icon {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Icon>;
const IconX = (p) => <Icon {...p}><path d="M18 6 6 18M6 6l12 12" /></Icon>;
const IconZap = (p) => <Icon {...p}><path d="M13 2 3 14h7l-1 8 11-14h-7l1-6Z" /></Icon>;

/* ================= PRIORITY THEME (mirrors AdminTickets) ================= */
const PRIORITY_THEME = {
  Low: "bg-blue-50 text-blue-700 border border-blue-200",
  Medium: "bg-amber-50 text-amber-700 border border-amber-200",
  High: "bg-orange-50 text-orange-700 border border-orange-200",
  Critical: "bg-red-50 text-red-700 border border-red-200",
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
  department: "IT",
  relatedTo: "",
  assetId: "",
  employeeId: "",
  incidentDate: todayStr(),
};

/* ================= Searchable Employee Select ================= */
function EmployeeSelect({ employees, value, onSelect }) {
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
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-between border border-slate-200 bg-white px-3.5 py-2.5 rounded-lg text-sm text-left hover:border-blue-300 transition"
        >
          <span className="flex flex-col">
            <span className="font-medium text-slate-800">{selected.name}</span>
            <span className="text-[11px] text-slate-400">
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
            className="text-slate-300 hover:text-slate-500 p-1"
          >
            <IconX className="w-3.5 h-3.5" />
          </span>
        </button>
      ) : (
        <div className="relative">
          <IconSearch className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            autoFocus={open}
            className="w-full border border-slate-200 bg-white pl-9 pr-3.5 py-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition placeholder:text-slate-400"
            placeholder="Search by name or staff code…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
          />
        </div>
      )}

      {open && (
        <div className="absolute z-10 mt-1.5 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-auto">
          {filtered.length === 0 ? (
            <div className="px-3.5 py-3 text-sm text-slate-400">No employees found</div>
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
                className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 transition flex flex-col border-b border-slate-50 last:border-b-0"
              >
                <span className="text-sm font-medium text-slate-800">{emp.name}</span>
                <span className="text-[11px] text-slate-400">
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

export default function CreateManualTicket() {
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  // ⚡ Auto-suggestion state for Related To
  const [relatedSuggested, setRelatedSuggested] = useState(null); // { value, matched } | null
  const [manualRelatedTo, setManualRelatedTo] = useState(false); // true once IT picks Related To themselves

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
        setAssets(res.data.assets || []);
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
        // unless they're a super_admin (who can see everyone).
        const scoped = isSuperAdmin
          ? all
          : all.filter((e) =>
            allowedCompanyIds.includes(normalizeCompanyId(e.companyId))
          );

        setEmployees(scoped);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load employees");
      }
    };

    loadAssets();
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleRelatedToChange = (e) => {
    setManualRelatedTo(true);
    handleChange("relatedTo")(e);
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

    if (!form.employeeId) {
      toast.error("Please select the employee this ticket is for");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/tickets/manual", form);
      toast.success("Manual ticket created");
      setForm(INITIAL_FORM);
      setRelatedSuggested(null);
      setManualRelatedTo(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="max-w-2xl mx-auto w-full p-6 md:p-8">

        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Create Manual Ticket</h1>
          <p className="text-sm text-slate-400 mt-0.5">Log a support request on behalf of a user</p>
        </div>

        {/* FORM CARD */}
        <form
          onSubmit={submitHandler}
          className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col gap-5"
        >
          {/* Employee (who this ticket is for) */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
              <IconUser className="w-3.5 h-3.5" /> Employee <span className="text-red-500">*</span>
            </label>
            <EmployeeSelect
              employees={employees}
              value={form.employeeId}
              onSelect={(id) => setForm((prev) => ({ ...prev, employeeId: id }))}
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Who this ticket is being raised for.
            </p>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
              <IconNote className="w-3.5 h-3.5" /> Issue title <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border border-slate-200 bg-white px-3.5 py-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition placeholder:text-slate-400"
              placeholder="e.g. Laptop won't connect to VPN"
              value={form.title}
              onChange={handleChange("title")}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
              <IconLayers className="w-3.5 h-3.5" /> Description <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full border border-slate-200 bg-white px-3.5 py-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition resize-none placeholder:text-slate-400"
              rows={4}
              placeholder="Describe the issue, steps to reproduce, and any relevant context."
              value={form.description}
              onChange={handleChange("description")}
              required
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              This is saved with the ticket so anyone can see what was reported.
            </p>
          </div>

          {/* Related To */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
              <IconTag className="w-3.5 h-3.5" /> Related to
            </label>
            <select
              className="w-full border border-slate-200 bg-white px-3.5 py-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
              value={form.relatedTo}
              onChange={handleRelatedToChange}
            >
              <option value="">Select what this relates to…</option>
              {RELATED_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            {relatedSuggested && !manualRelatedTo && (
              <div className="flex items-start gap-2 px-3 py-2 mt-2 rounded-lg bg-blue-50 border border-blue-100">
                <IconZap className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  Suggested from "<span className="italic">{relatedSuggested.matched}</span>" — feel free to adjust above
                </p>
              </div>
            )}
          </div>

          {/* Incident Date */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
              <IconCalendar className="w-3.5 h-3.5" /> Date incident occurred <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="w-full border border-slate-200 bg-white px-3.5 py-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
              value={form.incidentDate}
              onChange={handleChange("incidentDate")}
              max={todayStr()}
              required
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Defaults to today — change this if the issue happened earlier.
            </p>
          </div>

          {/* Asset */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
              <IconTag className="w-3.5 h-3.5" /> Asset
            </label>
            <select
              className="w-full border border-slate-200 bg-white px-3.5 py-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
              value={form.assetId}
              onChange={handleChange("assetId")}
            >
              <option value="">Select asset (optional)</option>
              {assets.map((asset) => (
                <option key={asset._id} value={asset._id}>
                  {asset.assetCode} - {asset.type}
                </option>
              ))}
            </select>
          </div>

          {/* Department + Priority side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
                <IconBuilding className="w-3.5 h-3.5" /> Department
              </label>
              <select
                className="w-full border border-slate-200 bg-white px-3.5 py-2.5 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
                value={form.department}
                onChange={handleChange("department")}
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">Priority</label>
              <div className="flex flex-wrap gap-2">
                {PRIORITIES.map((priority) => {
                  const active = form.priority === priority;
                  return (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, priority }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${active
                        ? PRIORITY_THEME[priority]
                        : "bg-slate-50 text-slate-400 border border-slate-200 hover:bg-slate-100"
                        }`}
                    >
                      {priority}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* SUBMIT */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 mt-1">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition disabled:opacity-60"
            >
              {submitting ? (
                "Creating…"
              ) : (
                <>
                  <IconCheck className="w-4 h-4" /> Create Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}