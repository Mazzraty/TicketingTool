import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import {
  Search,
  Pencil,
  Trash2,
  X,
  ChevronDown,
  Download,
  SlidersHorizontal,
  RotateCcw,
  Building2,
  Package,
  Laptop,
  Smartphone,
  Printer,
  Tablet,
  Inbox,
} from "lucide-react";

/* ============================================================
   UI ONLY — Atlassian / Jira Service Management styling
   (no business logic lives in this section)
   ============================================================ */
const inputCls =
  "h-9 w-full rounded-[3px] border-2 border-[#DFE1E6] bg-[#FAFBFC] px-2.5 text-sm text-[#172B4D] " +
  "placeholder:text-[#7A869A] transition-colors hover:bg-[#EBECF0] " +
  "focus:border-[#4C9AFF] focus:bg-white focus:outline-none";

const btnBase =
  "inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-[3px] px-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#4C9AFF] disabled:cursor-not-allowed disabled:opacity-50";
const btnPrimary = `${btnBase} bg-[#0052CC] text-white hover:bg-[#0065FF] active:bg-[#0747A6]`;
const btnDefault = `${btnBase} bg-[rgba(9,30,66,0.04)] text-[#42526E] hover:bg-[rgba(9,30,66,0.08)] active:bg-[#DEEBFF] active:text-[#0052CC]`;
const btnSubtle = `${btnBase} bg-transparent text-[#42526E] hover:bg-[rgba(9,30,66,0.08)]`;

const STATUS_LABELS = {
  All: "All",
  available: "Available",
  assigned: "Assigned",
  damaged: "Damaged",
  printer_for_service: "for Service",
  under_service: "Under Service",
};

// Jira lozenge palette
const STATUS_LOZENGE = {
  available: "bg-[#E3FCEF] text-[#006644]",
  assigned: "bg-[#DEEBFF] text-[#0747A6]",
  damaged: "bg-[#FFEBE6] text-[#BF2600]",
  printer_for_service: "bg-[#FFF0B3] text-[#172B4D]",
  under_service: "bg-[#EAE6FF] text-[#403294]",
};

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

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="flex items-center gap-3 rounded-[3px] border border-[#DFE1E6] bg-white px-4 py-3">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[3px]"
        style={{ backgroundColor: `${accent}1A`, color: accent }}
      >
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold text-[#5E6C84]">{label}</p>
        <p className="text-2xl font-medium leading-7 text-[#172B4D]">{value}</p>
      </div>
    </div>
  );
}

function Field({ label, className = "", children }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-semibold text-[#5E6C84]">
        {label}
      </label>
      {children}
    </div>
  );
}

function SelectBox({ className = "", children, ...props }) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`${inputCls} cursor-pointer appearance-none truncate pr-8 ${className}`}
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

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`h-8 rounded-[3px] px-3 text-sm font-medium transition-colors ${
        active
          ? "bg-[#172B4D] text-white"
          : "bg-[rgba(9,30,66,0.04)] text-[#42526E] hover:bg-[rgba(9,30,66,0.08)]"
      }`}
    >
      {children}
    </button>
  );
}

export default function AssetStoreFiori() {
  const [assets, setAssets] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [companyFilter, setCompanyFilter] = useState("All"); // super_admin scoping
  const [companies, setCompanies] = useState([]);
  // EDIT
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  // ================= USER INFO =================
  const user = JSON.parse(localStorage.getItem("user"));
  const isSuperAdmin = user?.role === "super_admin";

  /* ================= LOAD ================= */
  const loadAssets = async (companyId = companyFilter) => {
    try {
      const res = await api.get("/assets", {
        params: {
          limit: 1000,
          ...(isSuperAdmin && companyId && companyId !== "All"
            ? { companyId }
            : {}),
        },
      });

      console.log("ASSET RESPONSE:", res.data);

      setAssets(
        Array.isArray(res.data.assets)
          ? res.data.assets
          : []
      );
    } catch (err) {
      console.error(err);

      toast.error("Failed to load assets");

      setAssets([]);
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
    if (isSuperAdmin) {
      loadCompanies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch assets whenever the super-admin company filter changes
  useEffect(() => {
    loadAssets(companyFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyFilter]);

  /* ================= FILTER ================= */
  const filtered = Array.isArray(assets)
    ? assets.filter((a) => {
      const type = a.type?.toLowerCase();
      const selectedFilter = filter?.toLowerCase();

      const matchType =
        selectedFilter === "all" || type === selectedFilter;

      const matchStatus =
        statusFilter === "All" ||
        a.status?.toLowerCase() === statusFilter.toLowerCase();

      const text = search.toLowerCase();

      const matchSearch =
        a.assetCode?.toLowerCase().includes(text) ||
        a.model?.toLowerCase().includes(text) ||
        a.serialNumber?.toLowerCase().includes(text) ||
        a.salesmanName?.toLowerCase().includes(text) ||
        a.salesmanCode?.toLowerCase().includes(text);

      return matchType && matchStatus && matchSearch;
    })
    : [];

  /* ================= KPI ================= */
  const total = assets.length;

  const laptop = assets.filter(
    (a) => a.type === "Laptop"
  ).length;
  const mobile = assets.filter(
    (a) => a.type === "Mobile"
  ).length;
  const printer = assets.filter(
    (a) => a.type === "Printer"
  ).length;

  const hht = assets.filter(
    (a) => a.type === "HHT"
  ).length;

  /* ================= TABLE CONTROL ================= */
  const showHHTFields = filter === "HHT";

  /* ================= CURRENT USER ================= */
  const getCurrentUser = (asset) => {
    if (asset.employee?.name) {
      return asset.employee.name;
    }

    if (asset.employee?.employeeName) {
      return asset.employee.employeeName;
    }

    if (asset.assignedTo?.name) {
      return asset.assignedTo.name;
    }

    if (asset.assignedTo?.employeeName) {
      return asset.assignedTo.employeeName;
    }

    if (asset.user?.name) {
      return asset.user.name;
    }

    if (asset.salesmanName) {
      return asset.salesmanName;
    }

    return "Not Assigned";
  };

  /* ================= EDIT ================= */
  const openEdit = (asset) => {
    const updatedAsset = { ...asset };

    if (updatedAsset.type === "Laptop") {
      updatedAsset.accessories = {
        charger: updatedAsset.accessories?.charger ?? true,
        mouse: updatedAsset.accessories?.mouse ?? true,
        laptopBag: updatedAsset.accessories?.laptopBag ?? true,
        keyboard: updatedAsset.accessories?.keyboard ?? false,
        headset: updatedAsset.accessories?.headset ?? false,
      };
    }

    setSelected(updatedAsset);
    setEditOpen(true);
  };

  /* ================= UPDATE ================= */
  const updateAsset = async () => {
    try {
      await api.put(
        `/assets/${selected._id}`,
        selected
      );

      toast.success("Asset Updated");

      setEditOpen(false);

      loadAssets();
    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.msg ||
        "Update failed"
      );
    }
  };

  /* ================= DELETE ================= */
  const deleteAsset = async (id) => {
    const confirmDelete = window.confirm(
      "Delete this asset?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/assets/${id}`);

      toast.success("Asset Deleted");

      loadAssets();
    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.msg ||
        "Delete failed"
      );
    }
  };
  const exportToExcel = () => {
    const exportData = filtered.map((a) => ({
      AssetCode: a.assetCode,
      Type: a.type,
      Model: a.model,
      SerialNumber: a.serialNumber,
      CurrentUser: getCurrentUser(a),
      Status:
        {
          available: "Available",
          assigned: "Assigned",
          damaged: "Damaged",
          printer_for_service: "for Service",
          under_service: "Under Service",
        }[a.status] || a.status,

      SalesmanName: a.salesmanName || "",
      SalesmanCode: a.salesmanCode || "",
      Route: a.route || "",
      Supervisor: a.supervisor || "",
      IMEI: a.imei || "",
      SIMNumber: a.simNumber || "",
      Notes: a.notes || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Assets"
    );

    XLSX.writeFile(
      workbook,
      `Assets_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  /* ================= UI HELPERS (styling only, no logic) ================= */
  const tab = (label, href, active = false) => (
    <button
      key={label}
      onClick={() => (window.location.href = href)}
      className={`-mb-[2px] whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "border-[#0052CC] text-[#0052CC]"
          : "border-transparent text-[#42526E] hover:bg-[rgba(9,30,66,0.08)] hover:text-[#172B4D]"
      }`}
    >
      {label}
    </button>
  );

  const columnCount = 6;

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-[#172B4D]">
      <div className="mx-auto max-w-[1400px] px-6 py-6 lg:px-10">

        {/* BREADCRUMB + HEADER */}
        <nav className="mb-2 flex items-center gap-1.5 text-sm text-[#5E6C84]">
          <span>Admin</span>
          <span>/</span>
          <span>Asset Management</span>
        </nav>

        <div className="mb-4">
          <h1 className="text-2xl font-medium text-[#172B4D]">Asset Details</h1>
          <p className="mt-1 text-sm text-[#5E6C84]">
            Asset Management Dashboard
          </p>
        </div>

        {/* ================= TABS NAVIGATION ================= */}
        <div className="sticky top-0 z-40 -mx-6 mb-5 flex gap-1 overflow-x-auto border-b-2 border-[#DFE1E6] bg-[#F4F5F7] px-6 lg:-mx-10 lg:px-10">
          {tab("Assets Assign", "/admin/assets", true)}
          {tab("Asset History", "/admin/assets/history")}
          {tab("Upload Printer", "/admin/assets/upload-printer")}
          {tab("Upload Laptop", "/admin/assets/upload-laptop")}
          {tab("Upload HHT", "/admin/assets/upload-hht")}
        </div>

        {/* KPI */}
        <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <StatCard label="Total assets" value={total} icon={Package} accent="#42526E" />
          <StatCard label="Laptops" value={laptop} icon={Laptop} accent="#0052CC" />
          <StatCard label="Mobiles" value={mobile} icon={Smartphone} accent="#00A3BF" />
          <StatCard label="Printers" value={printer} icon={Printer} accent="#00875A" />
          <StatCard label="HHT devices" value={hht} icon={Tablet} accent="#5243AA" />
        </div>

        {/* ================= TABLE CARD ================= */}
        <div className="rounded-[3px] border border-[#DFE1E6] bg-white">

          {/* TOOLBAR */}
          <div className="flex flex-wrap items-center gap-2 border-b border-[#DFE1E6] p-3">
            <div className="relative w-full sm:w-80">
              <Search
                size={16}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B778C]"
              />
              <input
                className={`${inputCls} pl-8`}
                placeholder="Search asset / serial / salesman..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* COMPANY FILTER — super_admin only */}
            {isSuperAdmin && (
              <div className="relative w-full sm:w-60">
                <Building2
                  size={15}
                  className="pointer-events-none absolute left-2.5 top-1/2 z-10 -translate-y-1/2 text-[#6B778C]"
                />
                <SelectBox
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className="pl-8"
                >
                  <option value="All">All companies</option>
                  {companies.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </SelectBox>
              </div>
            )}

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={
                  showFilters
                    ? `${btnBase} bg-[#DEEBFF] text-[#0052CC] hover:bg-[#B3D4FF]`
                    : btnDefault
                }
              >
                <SlidersHorizontal size={14} />
                {showFilters ? "Hide Filters" : "Show Filters"}
              </button>

              <button onClick={exportToExcel} className={btnDefault}>
                <Download size={14} />
                Export Excel
              </button>

              <button
                onClick={() => {
                  setSearch("");
                  setFilter("All");
                  setStatusFilter("All");
                  setCompanyFilter("All");
                }}
                className={btnSubtle}
              >
                <RotateCcw size={14} />
                Reset Filters
              </button>
            </div>
          </div>

          {/* EXPANDABLE FILTER AREA */}
          <div
            className={`grid transition-all duration-300 ease-in-out ${showFilters ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
          >
            <div className="overflow-hidden">
              <div className="space-y-4 border-b border-[#DFE1E6] bg-[#FAFBFC] px-4 py-4">

                {/* TYPE FILTER */}
                <div>
                  <p className="mb-2 text-xs font-semibold text-[#5E6C84]">Type</p>
                  <div className="flex flex-wrap gap-2">
                    {["All", "Laptop", "Mobile", "Printer", "HHT"].map((t) => (
                      <FilterChip
                        key={t}
                        active={filter === t}
                        onClick={() => setFilter(t)}
                      >
                        {t}
                      </FilterChip>
                    ))}
                  </div>
                </div>

                {/* STATUS FILTER */}
                <div>
                  <p className="mb-2 text-xs font-semibold text-[#5E6C84]">Status</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "All",
                      "available",
                      "assigned",
                      "damaged",
                      "printer_for_service",
                      "under_service",
                    ].map((s) => (
                      <FilterChip
                        key={s}
                        active={statusFilter === s}
                        onClick={() => setStatusFilter(s)}
                      >
                        {STATUS_LABELS[s]}
                      </FilterChip>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-[#DFE1E6] text-left">
                  <th className="px-4 py-2.5 text-xs font-semibold text-[#5E6C84]">
                    Asset code
                  </th>

                  <th className="px-4 py-2.5 text-xs font-semibold text-[#5E6C84]">
                    Type
                  </th>

                  {!showHHTFields && (
                    <>
                      <th className="px-4 py-2.5 text-xs font-semibold text-[#5E6C84]">
                        Model
                      </th>

                      <th className="px-4 py-2.5 text-xs font-semibold text-[#5E6C84]">
                        Serial
                      </th>
                    </>
                  )}

                  {showHHTFields && (
                    <>
                      <th className="px-4 py-2.5 text-xs font-semibold text-[#5E6C84]">
                        Salesman
                      </th>

                      <th className="px-4 py-2.5 text-xs font-semibold text-[#5E6C84]">
                        Route
                      </th>
                    </>
                  )}

                  <th className="px-4 py-2.5 text-xs font-semibold text-[#5E6C84]">
                    Current user
                  </th>

                  <th className="px-4 py-2.5 text-xs font-semibold text-[#5E6C84]">
                    Status
                  </th>

                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-[#5E6C84]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={columnCount + 1} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-1 text-[#5E6C84]">
                        <Inbox size={32} className="text-[#97A0AF]" />
                        <p className="mt-1 text-base font-medium text-[#172B4D]">
                          No assets found
                        </p>
                        <p className="text-sm">Try adjusting your search or filters.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((a) => {
                    const currentUser = getCurrentUser(a);
                    const assigned = currentUser !== "Not Assigned";

                    return (
                      <tr
                        key={a._id}
                        className="border-b border-[#DFE1E6] transition-colors hover:bg-[#F4F5F7]"
                      >
                        <td className="px-4 py-2.5 font-medium text-[#0052CC]">
                          {a.assetCode}
                        </td>

                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-block rounded-[3px] px-1.5 py-0.5 text-xs font-medium ${TYPE_TAG[a.type] || "bg-[#DFE1E6] text-[#42526E]"
                              }`}
                          >
                            {a.type}
                          </span>
                        </td>

                        {!showHHTFields && (
                          <>
                            <td className="px-4 py-2.5 text-[#42526E]">
                              {a.model || "-"}
                            </td>

                            <td className="px-4 py-2.5 font-mono text-[13px] text-[#42526E]">
                              {a.serialNumber || "-"}
                            </td>
                          </>
                        )}

                        {showHHTFields && (
                          <>
                            <td className="px-4 py-2.5 text-[#42526E]">
                              {a.salesmanName || "-"}
                            </td>

                            <td className="px-4 py-2.5 text-[#42526E]">
                              {a.route || "-"}
                            </td>
                          </>
                        )}

                        <td className="px-4 py-2.5">
                          {assigned ? (
                            <div className="flex items-center gap-2">
                              <Avatar name={currentUser} />
                              <span className="font-medium text-[#172B4D]">
                                {tidy(currentUser)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[#6B778C]">Not Assigned</span>
                          )}
                        </td>

                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-block rounded-[3px] px-1.5 py-0.5 text-[11px] font-bold uppercase leading-4 tracking-wide ${STATUS_LOZENGE[a.status] || "bg-[#DFE1E6] text-[#42526E]"
                              }`}
                          >
                            {STATUS_LABELS[a.status] || a.status}
                          </span>
                        </td>

                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(a)}
                              className={`${btnSubtle} text-[#0052CC]`}
                            >
                              <Pencil size={14} />
                              Edit
                            </button>

                            <button
                              onClick={() => deleteAsset(a._id)}
                              className={`${btnBase} bg-transparent text-[#BF2600] hover:bg-[#FFEBE6]`}
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="border-t border-[#DFE1E6] px-4 py-3 text-sm text-[#5E6C84]">
              Showing{" "}
              <span className="font-medium text-[#172B4D]">{filtered.length}</span>{" "}
              of <span className="font-medium text-[#172B4D]">{total}</span> assets
            </div>
          )}
        </div>

        {/* ================= EDIT MODAL ================= */}
        {editOpen && selected && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(9,30,66,0.54)] p-4 sm:pt-[6vh]">
            <div className="flex max-h-[88vh] w-full max-w-2xl flex-col rounded-[3px] bg-white shadow-[0_8px_16px_-4px_rgba(9,30,66,0.25),0_0_1px_rgba(9,30,66,0.31)]">
              {/* HEADER */}
              <div className="flex shrink-0 items-start justify-between px-6 pb-2 pt-5">
                <div>
                  <h2 className="text-xl font-medium text-[#172B4D]">
                    Edit asset
                  </h2>
                  <p className="mt-0.5 text-sm text-[#5E6C84]">
                    Update asset information
                  </p>
                </div>

                <button
                  onClick={() => setEditOpen(false)}
                  className="rounded-[3px] p-1 text-[#42526E] hover:bg-[rgba(9,30,66,0.08)]"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* BODY */}
              <div className="overflow-y-auto px-6 py-3">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                  <Field label="Asset code">
                    <input
                      className={inputCls}
                      value={selected.assetCode || ""}
                      onChange={(e) =>
                        setSelected({
                          ...selected,
                          assetCode: e.target.value,
                        })
                      }
                    />
                  </Field>

                  <Field label="Type">
                    <SelectBox
                      value={selected.type || ""}
                      onChange={(e) =>
                        setSelected({
                          ...selected,
                          type: e.target.value,
                        })
                      }
                    >
                      <option value="Laptop">Laptop</option>
                      <option value="Mobile">Mobile</option>
                      <option value="Printer">Printer</option>
                      <option value="HHT">HHT</option>
                    </SelectBox>
                  </Field>

                  {(selected.type === "Laptop" ||
                    selected.type === "Mobile" ||
                    selected.type === "Printer") && (
                      <>
                        <Field label="Model">
                          <input
                            className={inputCls}
                            value={selected.model || ""}
                            onChange={(e) =>
                              setSelected({
                                ...selected,
                                model: e.target.value,
                              })
                            }
                          />
                        </Field>

                        <Field label="Serial number">
                          <input
                            className={inputCls}
                            value={selected.serialNumber || ""}
                            onChange={(e) =>
                              setSelected({
                                ...selected,
                                serialNumber: e.target.value,
                              })
                            }
                          />
                        </Field>
                      </>
                    )}

                  {selected.type === "Printer" && (
                    <>
                      <Field label="Route">
                        <input
                          className={inputCls}
                          value={selected.route || ""}
                          onChange={(e) =>
                            setSelected({
                              ...selected,
                              route: e.target.value,
                            })
                          }
                        />
                      </Field>

                      <Field label="Supervisor">
                        <input
                          className={inputCls}
                          value={selected.supervisor || ""}
                          onChange={(e) =>
                            setSelected({
                              ...selected,
                              supervisor: e.target.value,
                            })
                          }
                        />
                      </Field>

                      <Field label="Salesman code">
                        <input
                          className={inputCls}
                          value={selected.salesmanCode || ""}
                          onChange={(e) =>
                            setSelected({
                              ...selected,
                              salesmanCode: e.target.value,
                            })
                          }
                        />
                      </Field>

                      <Field label="Salesman name">
                        <input
                          className={inputCls}
                          value={selected.salesmanName || ""}
                          onChange={(e) =>
                            setSelected({
                              ...selected,
                              salesmanName: e.target.value,
                            })
                          }
                        />
                      </Field>
                    </>
                  )}

                  {selected.type === "HHT" && (
                    <>
                      <Field label="Salesman name">
                        <input
                          className={inputCls}
                          value={selected.salesmanName || ""}
                          onChange={(e) =>
                            setSelected({
                              ...selected,
                              salesmanName: e.target.value,
                            })
                          }
                        />
                      </Field>

                      <Field label="Route">
                        <input
                          className={inputCls}
                          value={selected.route || ""}
                          onChange={(e) =>
                            setSelected({
                              ...selected,
                              route: e.target.value,
                            })
                          }
                        />
                      </Field>

                      <Field label="IMEI">
                        <input
                          className={inputCls}
                          value={selected.imei || ""}
                          onChange={(e) =>
                            setSelected({
                              ...selected,
                              imei: e.target.value,
                            })
                          }
                        />
                      </Field>

                      <Field label="SIM number">
                        <input
                          className={inputCls}
                          value={selected.simNumber || ""}
                          onChange={(e) =>
                            setSelected({
                              ...selected,
                              simNumber: e.target.value,
                            })
                          }
                        />
                      </Field>
                    </>
                  )}

                  <Field label="Status" className="md:col-span-2">
                    <SelectBox
                      value={selected.status || ""}
                      onChange={(e) =>
                        setSelected({
                          ...selected,
                          status: e.target.value,
                        })
                      }
                    >
                      <option value="available">Available</option>
                      <option value="assigned">Assigned</option>
                      <option value="damaged">Damaged</option>
                      <option value="printer_for_service">
                        For Service
                      </option>
                      <option value="under_service">Under Service</option>
                    </SelectBox>
                  </Field>

                  {selected?.type === "Laptop" && (
                    <div className="md:col-span-2">
                      <label className="mb-2 block text-xs font-semibold text-[#5E6C84]">
                        Accessories
                      </label>

                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {[
                          ["charger", "Charger"],
                          ["mouse", "Mouse"],
                          ["laptopBag", "Laptop Bag"],
                          ["keyboard", "Keyboard"],
                          ["headset", "Headset"],
                        ].map(([key, label]) => (
                          <label
                            key={key}
                            className="flex cursor-pointer items-center gap-2 rounded-[3px] border-2 border-[#DFE1E6] bg-[#FAFBFC] px-3 py-2 text-sm text-[#172B4D] transition-colors hover:bg-[#EBECF0]"
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-[#0052CC]"
                              checked={selected?.accessories?.[key] || false}
                              onChange={(e) =>
                                setSelected({
                                  ...selected,
                                  accessories: {
                                    ...selected.accessories,
                                    [key]: e.target.checked,
                                  },
                                })
                              }
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <Field label="Notes" className="md:col-span-2">
                    <textarea
                      rows="4"
                      className="w-full rounded-[3px] border-2 border-[#DFE1E6] bg-[#FAFBFC] px-2.5 py-2 text-sm text-[#172B4D] transition-colors hover:bg-[#EBECF0] focus:border-[#4C9AFF] focus:bg-white focus:outline-none"
                      value={selected.notes || ""}
                      onChange={(e) =>
                        setSelected({
                          ...selected,
                          notes: e.target.value,
                        })
                      }
                    />
                  </Field>
                </div>
              </div>

              {/* FOOTER */}
              <div className="flex shrink-0 justify-end gap-2 px-6 pb-5 pt-3">
                <button
                  onClick={() => setEditOpen(false)}
                  className={btnSubtle}
                >
                  Cancel
                </button>

                <button onClick={updateAsset} className={btnPrimary}>
                  Save changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}