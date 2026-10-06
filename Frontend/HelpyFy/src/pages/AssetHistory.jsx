// pages/AssetHistoryPage.jsx

import { useEffect, useState, useMemo, useCallback, memo } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  ArrowLeft,
  Search,
  X,
  Download,
  Pencil,
  Check,
  ChevronDown,
  Inbox,
  Plug,
  Mouse,
  Briefcase,
  Keyboard,
  Headphones,
} from "lucide-react";

/* ===================================
   UI ONLY — Atlassian / Jira Service Management styling
   (no business logic lives in this section)
=================================== */
const inputCls =
  "h-9 w-full rounded-[3px] border-2 border-[#DFE1E6] bg-[#FAFBFC] px-2.5 text-sm text-[#172B4D] " +
  "placeholder:text-[#7A869A] transition-colors hover:bg-[#EBECF0] " +
  "focus:border-[#4C9AFF] focus:bg-white focus:outline-none";

const btnBase =
  "inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-[3px] px-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#4C9AFF] disabled:cursor-not-allowed disabled:opacity-50";
const btnPrimary = `${btnBase} bg-[#0052CC] text-white hover:bg-[#0065FF] active:bg-[#0747A6]`;
const btnDefault = `${btnBase} bg-[rgba(9,30,66,0.04)] text-[#42526E] hover:bg-[rgba(9,30,66,0.08)] active:bg-[#DEEBFF] active:text-[#0052CC]`;
const btnSubtle = `${btnBase} bg-transparent text-[#42526E] hover:bg-[rgba(9,30,66,0.08)]`;

const thCls = "px-4 py-2.5 text-left text-xs font-semibold text-[#5E6C84]";
const tdCls = "px-4 py-3 align-top text-[#42526E]";

const TYPE_TAG = {
  Laptop: "bg-[#DEEBFF] text-[#0747A6]",
  Mobile: "bg-[#E6FCFF] text-[#008DA6]",
  Printer: "bg-[#E3FCEF] text-[#006644]",
  HHT: "bg-[#EAE6FF] text-[#403294]",
};

const AVATAR_COLORS = [
  "#0052CC", "#00875A", "#5243AA", "#DE350B",
  "#FF8B00", "#00A3BF", "#6554C0", "#36B37E",
];

const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase() || "?";

const avatarColor = (name = "") => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

// Display only: "AHMED KAMAL" -> "Ahmed Kamal"
const tidy = (v) => {
  if (!v) return "";
  if (v !== v.toUpperCase()) return v;
  return v.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
};

function Avatar({ name }) {
  return (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
      style={{ backgroundColor: avatarColor(name) }}
    >
      {initials(name)}
    </span>
  );
}

function Lozenge({ tone, children }) {
  const tones = {
    success: "bg-[#E3FCEF] text-[#006644]",
    warning: "bg-[#FFF0B3] text-[#172B4D]",
    neutral: "bg-[#DFE1E6] text-[#42526E]",
  };
  return (
    <span
      className={`inline-block rounded-[3px] px-1.5 py-0.5 text-[11px] font-bold uppercase leading-4 tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function TypeTag({ type }) {
  if (!type) return <span className="text-[#97A0AF]">-</span>;
  return (
    <span
      className={`inline-block rounded-[3px] px-1.5 py-0.5 text-xs font-medium ${TYPE_TAG[type] || "bg-[#DFE1E6] text-[#42526E]"
        }`}
    >
      {type}
    </span>
  );
}

// NEW: accessories rendered as small tags with icons instead of emoji text
function AccessoryTags({ acc }) {
  const items = [
    [acc.charger, Plug, "Charger"],
    [acc.mouse, Mouse, "Mouse"],
    [acc.laptopBag, Briefcase, "Bag"],
    [acc.keyboard, Keyboard, "Keyboard"],
    [acc.headset, Headphones, "Headset"],
  ].filter(([on]) => on);

  if (items.length === 0) return <span className="text-[#97A0AF]">-</span>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(([, Icon, label]) => (
        <span
          key={label}
          className="inline-flex items-center gap-1 rounded-[3px] bg-[#F4F5F7] px-1.5 py-0.5 text-xs font-medium text-[#42526E]"
        >
          <Icon size={12} />
          {label}
        </span>
      ))}
    </div>
  );
}

// NEW: small "label  value" counter used in the table headers
function CountPill({ label, value, tone = "neutral" }) {
  const tones = {
    neutral: "bg-[#F4F5F7] text-[#42526E]",
    success: "bg-[#E3FCEF] text-[#006644]",
    warning: "bg-[#FFF0B3] text-[#172B4D]",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[3px] px-2 py-1 text-xs font-medium ${tones[tone]}`}
    >
      {label}
      <span className="font-bold">{value}</span>
    </span>
  );
}

function EmptyState({ title, hint }) {
  return (
    <div className="flex flex-col items-center gap-1 py-14 text-[#5E6C84]">
      <Inbox size={32} className="text-[#97A0AF]" />
      <p className="mt-1 text-base font-medium text-[#172B4D]">{title}</p>
      {hint && <p className="text-sm">{hint}</p>}
    </div>
  );
}

/* ===================================
   MOVED OUT of the main component + wrapped in memo().
   Previously this was declared inside AssetHistoryPage, so every
   keystroke in the date input (editDate state change) re-created
   this function from scratch, forcing React to remount the cell
   and re-render the ENTIRE page (including the employee/asset
   search dropdowns) on every keystroke.

   Now it's a stable component reference. memo() means it only
   re-renders when its own props (h, isEditing, editDate, onStart,
   onSave, onCancel, onChangeDate) actually change — not when
   unrelated state (like employeeSearch) changes.
=================================== */
const AssignedDateCell = memo(function AssignedDateCell({
  h,
  isEditing,
  editDate,
  onStart,
  onSave,
  onCancel,
  onChangeDate,
}) {
  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="date"
          className="h-8 rounded-[3px] border-2 border-[#4C9AFF] bg-white px-2 text-xs text-[#172B4D] focus:outline-none"
          value={editDate}
          onChange={(e) => onChangeDate(e.target.value)}
          autoFocus
        />
        <button
          onClick={() => onSave(h)}
          className={`${btnPrimary} !h-8 !px-2`}
          aria-label="Save date"
          title="Save"
        >
          <Check size={14} />
        </button>
        <button
          onClick={onCancel}
          className={`${btnSubtle} !h-8 !px-2`}
          aria-label="Cancel"
          title="Cancel"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      <span>
        {h.assignedDate
          ? new Date(h.assignedDate).toLocaleString()
          : "-"}
      </span>
      <button
        onClick={() => onStart(h)}
        className="inline-flex items-center gap-1 rounded-[3px] px-1.5 py-0.5 text-xs font-medium text-[#0052CC] opacity-0 transition hover:bg-[#DEEBFF] group-hover:opacity-100 focus:opacity-100"
      >
        <Pencil size={12} />
        Edit
      </button>
    </div>
  );
});

/* ===================================
   NEW: renders vendor/repair details for a "repair" record row.
   Kept as its own small component purely for readability — it has
   no internal state so it doesn't need memo().
=================================== */
function VendorDetailsCell({ h }) {
  const v = h.vendorDetails || {};

  return (
    <div className="text-xs leading-relaxed">
      <div className="font-semibold text-[#172B4D]">
        {v.vendorName || "-"}
      </div>

      {v.complaintDescription && (
        <div className="text-[#5E6C84]">
          {v.complaintDescription}
        </div>
      )}

      {(v.cost || v.cost === 0) && (
        <div className="text-[#5E6C84]">
          Cost: {v.cost}
        </div>
      )}

      {v.receiptUrl && (
        <a
          href={v.receiptUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[#0052CC] hover:underline"
        >
          Receipt
        </a>
      )}

      {h.ticketNumber && (
        <div className="mt-1 text-[#6B778C]">
          Ticket: {h.ticketNumber}
        </div>
      )}
    </div>
  );
}

export default function AssetHistoryPage() {
  const [employees, setEmployees] = useState([]);
  const [assets, setAssets] = useState([]);

  const [employeeId, setEmployeeId] = useState("");
  const [assetCode, setAssetCode] = useState("");

  const [employeeSearch, setEmployeeSearch] =
    useState("");

  const [assetSearch, setAssetSearch] =
    useState("");

  const [showEmployeeDropdown, setShowEmployeeDropdown] =
    useState(false);

  const [showAssetDropdown, setShowAssetDropdown] =
    useState(false);

  const [assetType, setAssetType] =
    useState("All");

  const [empHistory, setEmpHistory] =
    useState([]);

  const [assetHistory, setAssetHistory] =
    useState([]);

  const [loadingEmp, setLoadingEmp] =
    useState(false);

  const [loadingAsset, setLoadingAsset] =
    useState(false);

  // inline "assigned date" edit state (shared by both tables)
  const [editingId, setEditingId] = useState(null);
  const [editDate, setEditDate] = useState("");

  /* ===================================
     FILTERED EMPLOYEES
  =================================== */
  const filteredEmployees = useMemo(
    () =>
      employees.filter((emp) =>
        `${emp.staffCode} ${emp.name}`
          .toLowerCase()
          .includes(employeeSearch.toLowerCase())
      ),
    [employees, employeeSearch]
  );

  /* ===================================
     FILTERED ASSETS
  =================================== */
  const filteredAssets = useMemo(
    () =>
      assets.filter((asset) =>
        `${asset.assetCode} ${asset.type}`
          .toLowerCase()
          .includes(assetSearch.toLowerCase())
      ),
    [assets, assetSearch]
  );

  const getAccessories = (h) => {
    return h.accessories || h.asset?.accessories || {};
  };

  /* ===================================
     FIX: Convert a Date/ISO string to a
     "YYYY-MM-DD" value using LOCAL time,
     not UTC. `toISOString()` shifts the
     date backward/forward across midnight
     depending on the browser's timezone
     offset from UTC — which is what was
     causing the date picker to show the
     wrong day.
  =================================== */
  const toLocalDateInputValue = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  /* ===================================
     LOAD EMPLOYEES + ASSETS
  =================================== */
  useEffect(() => {
    const loadData = async () => {
      try {
        const [empRes, assetRes] =
          await Promise.all([
            api.get("/employees"),
            api.get("/assets?limit=1000"),
          ]);

        console.log(
          "EMPLOYEES =>",
          empRes.data
        );

        console.log(
          "ASSETS =>",
          assetRes.data
        );

        setEmployees(
          Array.isArray(empRes.data)
            ? empRes.data
            : empRes.data?.employees || []
        );

        setAssets(
          Array.isArray(assetRes.data)
            ? assetRes.data
            : Array.isArray(
              assetRes.data?.assets
            )
              ? assetRes.data.assets
              : []
        );
      } catch (err) {
        console.error(err);
        toast.error("Failed to load data");
      }
    };

    loadData();
  }, []);

  /* ===================================
     EMPLOYEE HISTORY
  =================================== */
  useEffect(() => {
    if (!employeeId) {
      setEmpHistory([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoadingEmp(true);

        const res = await api.get(
          `/assets/employee/${employeeId}?type=${assetType}`
        );

        setEmpHistory(
          Array.isArray(res.data)
            ? res.data
            : []
        );
      } catch (err) {
        console.error(err);
        toast.error(
          "Employee history not found"
        );
      } finally {
        setLoadingEmp(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [employeeId, assetType]);

  /* ===================================
     ASSET HISTORY
     NOTE: the backend now returns a merged list of
     "assignment" and "repair" (vendor) records for this
     asset, each tagged with `recordType`. No frontend
     change needed here — just render both kinds below.
  =================================== */
  useEffect(() => {
    if (!assetCode) {
      setAssetHistory([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoadingAsset(true);

        const res = await api.get(
          `/assets/asset/${assetCode}?type=${assetType}`
        );

        setAssetHistory(
          Array.isArray(res.data)
            ? res.data
            : []
        );
      } catch (err) {
        console.error(err);
        toast.error(
          "Asset history not found"
        );
      } finally {
        setLoadingAsset(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [assetCode, assetType]);

  /* ===================================
     STATUS BADGE
     UPDATED: repair records get their own badge instead of
     falling through to Active/Returned logic (repair rows have
     no `returnedDate` in the assignment sense).
  =================================== */
  const statusBadge = (h) => {
    if (h.recordType === "repair") {
      return <Lozenge tone="warning">Sent for Repair</Lozenge>;
    }

    if (!h.returnedDate) {
      return <Lozenge tone="success">Active</Lozenge>;
    }

    return <Lozenge tone="neutral">Returned</Lozenge>;
  };

  /* ===================================
     EDIT ASSIGNED DATE
     h._id here is the AssetAssignment _id (both empHistory and
     assetHistory rows come from AssetAssignment documents), so this
     hits PUT /assets/assignments/:id/date directly.

     NOTE: repair rows in assetHistory carry a Ticket _id, not an
     AssetAssignment _id, so this must never be invoked for them —
     the render logic below only wires AssignedDateCell up for
     recordType !== "repair".
  =================================== */
  // FIX: wrapped in useCallback so these keep the same function
  // reference across renders. This matters because AssignedDateCell
  // is wrapped in memo() — if these were plain functions, they'd be
  // recreated every render and memo() would never skip a re-render.
  const startEditDate = useCallback((h) => {
    setEditingId(h._id);
    setEditDate(
      h.assignedDate
        ? toLocalDateInputValue(h.assignedDate) // FIX: was toISOString().slice(0,10)
        : ""
    );
  }, []);

  const cancelEditDate = useCallback(() => {
    setEditingId(null);
    setEditDate("");
  }, []);

  const saveEditDate = useCallback(
    async (h) => {
      if (!editDate) {
        return toast.error("Please pick a date");
      }

      try {
        await api.put(`/assets/assignments/${h._id}/date`, {
          // FIX: send with a fixed local-noon time component so that
          // when the backend does `new Date("YYYY-MM-DD...")`, the
          // UTC conversion can never roll the date to the previous
          // or next calendar day, no matter what timezone the DB
          // server is running in.
          assignedDate: `${editDate}T12:00:00`,
        });

        toast.success("Assigned date updated");

        setEmpHistory((prev) =>
          prev.map((row) =>
            row._id === h._id
              ? { ...row, assignedDate: `${editDate}T12:00:00` }
              : row
          )
        );

        setAssetHistory((prev) =>
          prev.map((row) =>
            row._id === h._id
              ? { ...row, assignedDate: `${editDate}T12:00:00` }
              : row
          )
        );

        setEditingId(null);
        setEditDate("");
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.msg || "Failed to update date");
      }
    },
    [editDate]
  );

  const handleChangeEditDate = useCallback((val) => {
    setEditDate(val);
  }, []);

  /* ===================================
     EXPORT EMP PDF
     (unchanged — employee history has no repair rows)
  =================================== */
  const exportEmpPDF = () => {
    const doc = new jsPDF();

    doc.text("Employee Asset History", 14, 10);

    const body = empHistory.map((h) => {
      const acc = h.accessories || h.asset?.accessories || {};

      const accessoriesText =
        h.assetType?.toLowerCase() === "laptop"
          ? [
            acc.charger && "Charger",
            acc.mouse && "Mouse",
            acc.laptopBag && "Laptop Bag",
            acc.keyboard && "Keyboard",
            acc.headset && "Headset",
          ]
            .filter(Boolean)
            .join(", ")
          : "-";

      return [
        h.asset?.assetCode || "-",
        h.assetType || "-",
        h.assignedDate
          ? new Date(h.assignedDate).toLocaleString()
          : "-",
        accessoriesText,
        h.returnedDate
          ? new Date(h.returnedDate).toLocaleString()
          : "Active",
      ];
    });

    autoTable(doc, {
      head: [["Asset", "Type", "Assigned", "Accessories", "Returned"]],
      body,
    });

    doc.save("employee-history.pdf");
  };

  /* ===================================
     EXPORT ASSET PDF
     UPDATED: repair rows now print vendor name / cost / complaint
     in the "Accessories" column position instead of "-", and
     "Assigned" prints "-" for repair rows since they have none.
  =================================== */
  const exportAssetPDF = () => {
    const doc = new jsPDF();

    doc.text("Asset History", 14, 10);

    autoTable(doc, {
      head: [
        [
          "Employee",
          "Type",
          "Status",
          "Assigned",
          "Returned",
          "Details",
        ],
      ],

      body: assetHistory.map((h) => {
        if (h.recordType === "repair") {
          const v = h.vendorDetails || {};
          const details = [
            v.vendorName && `Vendor: ${v.vendorName}`,
            v.complaintDescription,
            (v.cost || v.cost === 0) && `Cost: ${v.cost}`,
          ]
            .filter(Boolean)
            .join(" | ") || "-";

          return [
            "-",
            h.assetType || "-",
            "Sent for Repair",
            "-",
            // FIX: date-only, not toLocaleString(). Repair date comes from
            // a plain date picker with no time component — rendering it
            // with a time showed the UTC-midnight artifact as a stray
            // early-morning timestamp (e.g. "8/11/2026, 3:00:00 AM").
            h.returnedDate
              ? new Date(h.returnedDate).toLocaleDateString()
              : "-",
            details,
          ];
        }

        return [
          `${h.employee?.staffCode || "-"} - ${h.employee?.name || "-"
          }`,

          h.assetType || "-",

          h.status || "-",

          h.assignedDate
            ? new Date(
              h.assignedDate
            ).toLocaleString()
            : "-",

          h.returnedDate
            ? new Date(
              h.returnedDate
            ).toLocaleString()
            : "Active",

          "-",
        ];
      }),
    });

    doc.save("asset-history.pdf");
  };

  /* ===================================
     UI-ONLY DERIVED VALUES (new summary counters)
  =================================== */
  const empActive = empHistory.filter((h) => !h.returnedDate).length;
  const empReturned = empHistory.length - empActive;

  const assetRepairs = assetHistory.filter(
    (h) => h.recordType === "repair"
  ).length;
  const assetActive = assetHistory.filter(
    (h) => h.recordType !== "repair" && !h.returnedDate
  ).length;
  const assetReturned = assetHistory.length - assetRepairs - assetActive;

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-[#172B4D]">
      <div className="mx-auto max-w-[1400px] px-6 py-6 lg:px-10">
        {/* ================= BREADCRUMB + BACK ================= */}
        <div className="mb-2 flex items-center justify-between">
          <nav className="flex items-center gap-1.5 text-sm text-[#5E6C84]">
            <span>Admin</span>
            <span>/</span>
            <span>Assets</span>
            <span>/</span>
            <span>Asset History</span>
          </nav>

          <button
            onClick={() => window.history.back()}
            className={btnSubtle}
          >
            <ArrowLeft size={14} />
            Back
          </button>
        </div>

        {/* HEADER */}
        <div className="mb-5">
          <h1 className="text-2xl font-medium text-[#172B4D]">
            Asset History
          </h1>

          <p className="mt-1 text-sm text-[#5E6C84]">
            Track employee & asset assignment history
          </p>
        </div>

        {/* FILTERS */}
        <div className="mb-5 rounded-[3px] border border-[#DFE1E6] bg-white p-4">

          <div className="grid gap-4 md:grid-cols-3">

            {/* EMPLOYEE SEARCH */}
            <div className="relative">

              <label className="mb-1 block text-xs font-semibold text-[#5E6C84]">
                Search employee
              </label>

              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B778C]"
                />
                <input
                  type="text"
                  className={`${inputCls} pl-8`}
                  placeholder="Search by staff code or employee..."
                  value={employeeSearch}
                  onChange={(e) => {
                    setEmployeeSearch(
                      e.target.value
                    );

                    setShowEmployeeDropdown(
                      true
                    );
                  }}
                  onFocus={() =>
                    setShowEmployeeDropdown(
                      true
                    )
                  }
                />
              </div>

              {/* DROPDOWN */}
              {showEmployeeDropdown &&
                employeeSearch &&
                filteredEmployees.length >
                0 && (
                  <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-[3px] border border-[#DFE1E6] bg-white shadow-[0_4px_8px_-2px_rgba(9,30,66,0.25),0_0_1px_rgba(9,30,66,0.31)]">

                    {filteredEmployees.map(
                      (emp) => (
                        <div
                          key={emp._id}
                          onClick={() => {
                            setEmployeeId(
                              emp._id
                            );

                            setEmployeeSearch(
                              `${emp.staffCode} - ${emp.name}`
                            );

                            setShowEmployeeDropdown(
                              false
                            );
                          }}
                          className="flex cursor-pointer items-center gap-2.5 border-b border-[#F4F5F7] px-3 py-2 last:border-0 hover:bg-[#F4F5F7]"
                        >
                          <Avatar name={emp.name} />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium text-[#172B4D]">
                              {tidy(emp.name)}
                            </div>

                            <div className="text-xs text-[#5E6C84]">
                              {
                                emp.staffCode
                              }
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}

              {/* SELECTED */}
              {employeeId && (
                <div className="mt-2 flex items-center justify-between gap-2 rounded-[3px] bg-[#DEEBFF] px-2.5 py-1.5 text-xs text-[#0747A6]">
                  <span className="truncate">
                    Selected:{" "}
                    <span className="font-semibold">{employeeSearch}</span>
                  </span>
                  {/* NEW: clear selection */}
                  <button
                    onClick={() => {
                      setEmployeeId("");
                      setEmployeeSearch("");
                      setShowEmployeeDropdown(false);
                    }}
                    className="rounded-[3px] p-0.5 hover:bg-[#B3D4FF]"
                    aria-label="Clear employee"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* ASSET SEARCH */}
            <div className="relative">

              <label className="mb-1 block text-xs font-semibold text-[#5E6C84]">
                Search asset
              </label>

              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B778C]"
                />
                <input
                  type="text"
                  className={`${inputCls} pl-8`}
                  placeholder="Search by asset code..."
                  value={assetSearch}
                  onChange={(e) => {
                    setAssetSearch(
                      e.target.value
                    );

                    setShowAssetDropdown(
                      true
                    );
                  }}
                  onFocus={() =>
                    setShowAssetDropdown(
                      true
                    )
                  }
                />
              </div>

              {/* DROPDOWN */}
              {showAssetDropdown &&
                assetSearch &&
                filteredAssets.length >
                0 && (
                  <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-[3px] border border-[#DFE1E6] bg-white shadow-[0_4px_8px_-2px_rgba(9,30,66,0.25),0_0_1px_rgba(9,30,66,0.31)]">

                    {filteredAssets.map(
                      (asset) => (
                        <div
                          key={asset._id}
                          onClick={() => {
                            setAssetCode(
                              asset.assetCode
                            );

                            setAssetSearch(
                              `${asset.assetCode} - ${asset.type}`
                            );

                            setShowAssetDropdown(
                              false
                            );
                          }}
                          className="flex cursor-pointer items-center justify-between gap-2 border-b border-[#F4F5F7] px-3 py-2 last:border-0 hover:bg-[#F4F5F7]"
                        >
                          <div className="text-sm font-medium text-[#0052CC]">
                            {
                              asset.assetCode
                            }
                          </div>

                          <TypeTag type={asset.type} />
                        </div>
                      )
                    )}
                  </div>
                )}

              {/* SELECTED */}
              {assetCode && (
                <div className="mt-2 flex items-center justify-between gap-2 rounded-[3px] bg-[#E3FCEF] px-2.5 py-1.5 text-xs text-[#006644]">
                  <span className="truncate">
                    Selected:{" "}
                    <span className="font-semibold">{assetSearch}</span>
                  </span>
                  {/* NEW: clear selection */}
                  <button
                    onClick={() => {
                      setAssetCode("");
                      setAssetSearch("");
                      setShowAssetDropdown(false);
                    }}
                    className="rounded-[3px] p-0.5 hover:bg-[#ABF5D1]"
                    aria-label="Clear asset"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* TYPE */}
            <div>

              <label className="mb-1 block text-xs font-semibold text-[#5E6C84]">
                Asset type
              </label>

              <div className="relative">
                <select
                  className={`${inputCls} cursor-pointer appearance-none pr-8`}
                  value={assetType}
                  onChange={(e) =>
                    setAssetType(
                      e.target.value
                    )
                  }
                >
                  <option value="All">
                    All
                  </option>

                  <option value="Laptop">
                    Laptop
                  </option>

                  <option value="Printer">
                    Printer
                  </option>

                  <option value="HHT">
                    HHT
                  </option>
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B778C]"
                />
              </div>

            </div>

          </div>
        </div>

        {/* EMPLOYEE HISTORY */}
        <div className="mb-5 rounded-[3px] border border-[#DFE1E6] bg-white">

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DFE1E6] p-4">

            <div>
              <h2 className="text-base font-semibold text-[#172B4D]">
                Employee History
              </h2>

              <p className="mt-0.5 text-sm text-[#5E6C84]">
                Assignment records by employee
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {employeeId && !loadingEmp && (
                <>
                  <CountPill label="Total" value={empHistory.length} />
                  <CountPill label="Active" value={empActive} tone="success" />
                  <CountPill label="Returned" value={empReturned} />
                </>
              )}

              <button
                onClick={exportEmpPDF}
                disabled={empHistory.length === 0}
                className={btnDefault}
              >
                <Download size={14} />
                Export PDF
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">

            <table className="w-full min-w-[860px] border-collapse text-sm">

              <thead>
                <tr className="border-b-2 border-[#DFE1E6]">
                  <th className={thCls}>
                    Asset
                  </th>

                  <th className={thCls}>
                    Type
                  </th>

                  <th className={thCls}>
                    Status
                  </th>

                  <th className={thCls}>
                    Assigned
                  </th>

                  <th className={thCls}>
                    Returned
                  </th>
                  <th className={thCls}>
                    Accessories
                  </th>
                </tr>
              </thead>

              <tbody>

                {loadingEmp ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-3">
                      <div className="h-6 animate-pulse rounded-[3px] bg-[#F4F5F7]" />
                    </td>
                  </tr>
                ) : empHistory.length ===
                  0 ? (
                  <tr>
                    <td colSpan="6">
                      <EmptyState
                        title={
                          employeeId
                            ? "No employee history found"
                            : "No employee selected"
                        }
                        hint={
                          employeeId
                            ? "This employee has no matching assignment records."
                            : "Search and select an employee to see their assets."
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  empHistory.map((h) => (
                    <tr
                      key={h._id}
                      className="border-b border-[#DFE1E6] transition-colors hover:bg-[#F4F5F7]"
                    >
                      <td className={`${tdCls} font-medium text-[#0052CC]`}>
                        {h.asset
                          ?.assetCode ||
                          "-"}
                      </td>

                      <td className={tdCls}>
                        <TypeTag type={h.assetType} />
                      </td>

                      <td className={tdCls}>
                        {statusBadge(h)}
                      </td>

                      {/* inline-editable assigned date */}
                      <td className={tdCls}>
                        <AssignedDateCell
                          h={h}
                          isEditing={editingId === h._id}
                          editDate={editDate}
                          onStart={startEditDate}
                          onSave={saveEditDate}
                          onCancel={cancelEditDate}
                          onChangeDate={handleChangeEditDate}
                        />
                      </td>

                      <td className={tdCls}>
                        {h.returnedDate
                          ? new Date(
                            h.returnedDate
                          ).toLocaleString()
                          : "Active"}
                      </td>
                      <td className={tdCls}>
                        {h.assetType?.toLowerCase() === "laptop" ? (
                          <AccessoryTags acc={getAccessories(h)} />
                        ) : (
                          <span className="text-[#97A0AF]">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}

              </tbody>

            </table>

          </div>
        </div>

        {/* ASSET HISTORY */}
        <div className="rounded-[3px] border border-[#DFE1E6] bg-white">

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DFE1E6] p-4">

            <div>
              <h2 className="text-base font-semibold text-[#172B4D]">
                Asset History
              </h2>

              <p className="mt-0.5 text-sm text-[#5E6C84]">
                Assignment & repair records for this asset
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {assetCode && !loadingAsset && (
                <>
                  <CountPill label="Total" value={assetHistory.length} />
                  <CountPill label="Active" value={assetActive} tone="success" />
                  <CountPill label="Returned" value={assetReturned} />
                  <CountPill label="Repairs" value={assetRepairs} tone="warning" />
                </>
              )}

              <button
                onClick={exportAssetPDF}
                disabled={assetHistory.length === 0}
                className={btnDefault}
              >
                <Download size={14} />
                Export PDF
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-sm">

              <thead>
                <tr className="border-b-2 border-[#DFE1E6]">
                  <th className={thCls}>
                    Employee
                  </th>

                  <th className={thCls}>
                    Type
                  </th>

                  <th className={thCls}>
                    Status
                  </th>

                  <th className={thCls}>
                    Assigned
                  </th>

                  <th className={thCls}>
                    Returned
                  </th>
                  <th className={thCls}>
                    Accessories / Vendor
                  </th>
                </tr>
              </thead>

              <tbody>

                {loadingAsset ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-3">
                      <div className="h-6 animate-pulse rounded-[3px] bg-[#F4F5F7]" />
                    </td>
                  </tr>
                ) : assetHistory.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <EmptyState
                        title={
                          assetCode
                            ? "No asset history found"
                            : "No asset selected"
                        }
                        hint={
                          assetCode
                            ? "This asset has no matching assignment or repair records."
                            : "Search and select an asset to see its history."
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  assetHistory.map((h) => {
                    const isRepair = h.recordType === "repair";

                    return (
                      <tr
                        key={h._id}
                        className={`border-b border-[#DFE1E6] transition-colors hover:bg-[#F4F5F7] ${isRepair ? "bg-[#FFFAE6]" : ""
                          }`}
                      >
                        <td className={tdCls}>
                          {isRepair ? (
                            <span className="text-[#97A0AF]">-</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Avatar name={h.employee?.name || "-"} />
                              <div>
                                <div className="font-medium text-[#172B4D]">
                                  {tidy(h.employee?.name) || "-"}
                                </div>
                                <div className="text-xs text-[#5E6C84]">
                                  {h.employee?.staffCode || "-"}
                                </div>
                              </div>
                            </div>
                          )}
                        </td>

                        <td className={tdCls}>
                          <TypeTag type={h.assetType} />
                        </td>

                        <td className={tdCls}>
                          {statusBadge(h)}
                        </td>

                        {/* inline-editable assigned date — repair
                            rows have no AssetAssignment _id, so they
                            never get the editable cell */}
                        <td className={tdCls}>
                          {isRepair ? (
                            <span className="text-xs text-[#97A0AF]">
                              -
                            </span>
                          ) : (
                            <AssignedDateCell
                              h={h}
                              isEditing={editingId === h._id}
                              editDate={editDate}
                              onStart={startEditDate}
                              onSave={saveEditDate}
                              onCancel={cancelEditDate}
                              onChangeDate={handleChangeEditDate}
                            />
                          )}
                        </td>

                        <td className={tdCls}>
                          {h.returnedDate
                            ? isRepair
                              // FIX: repair rows carry a date-only value
                              // (from the vendor-repair date picker), so
                              // show date-only here too — toLocaleString()
                              // was surfacing the UTC-midnight artifact as
                              // a stray "3:00:00 AM"-style timestamp.
                              ? new Date(h.returnedDate).toLocaleDateString()
                              : new Date(h.returnedDate).toLocaleString()
                            : isRepair
                              ? "-"
                              : "Active"}
                        </td>

                        <td className={tdCls}>
                          {isRepair ? (
                            <VendorDetailsCell h={h} />
                          ) : h.assetType?.toLowerCase() === "laptop" ? (
                            <AccessoryTags acc={getAccessories(h)} />
                          ) : (
                            <span className="text-[#97A0AF]">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}

              </tbody>

            </table>
          </div>

        </div>

      </div>
    </div>
  );
}