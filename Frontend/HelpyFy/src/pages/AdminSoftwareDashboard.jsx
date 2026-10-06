// pages/AdminSoftwareDashboard.jsx

import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../auth/AuthContext";
import {
  ArrowLeft,
  Plus,
  Search,
  Building2,
  Layers,
  CheckCircle2,
  XCircle,
  RefreshCcw,
  Pencil,
  Trash2,
  X,
  PackageSearch,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";

/* ================= UI HELPERS (styling only, no logic) ================= */
// Atlassian / Jira Service Management styling
const inputCls =
  "h-9 w-full rounded-[3px] border-2 border-[#DFE1E6] bg-[#FAFBFC] px-2.5 text-sm text-[#172B4D] " +
  "placeholder:text-[#7A869A] transition-colors hover:bg-[#EBECF0] " +
  "focus:border-[#4C9AFF] focus:bg-white focus:outline-none";

const btnBase =
  "inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-[3px] px-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#4C9AFF] disabled:cursor-not-allowed disabled:opacity-50";
const btnPrimary = `${btnBase} bg-[#0052CC] text-white hover:bg-[#0065FF] active:bg-[#0747A6]`;
const btnDanger = `${btnBase} bg-[#DE350B] text-white hover:bg-[#FF5630] active:bg-[#BF2600]`;
const btnSubtle = `${btnBase} bg-transparent text-[#42526E] hover:bg-[rgba(9,30,66,0.08)]`;

// Jira lozenge palette
const STATUS_STYLES = {
  Active: "bg-[#E3FCEF] text-[#006644]",
  Expired: "bg-[#FFEBE6] text-[#BF2600]",
  Renewed: "bg-[#DEEBFF] text-[#0747A6]",
};

const EMPTY_FORM = {
  serviceName: "",
  vendor: "",
  companyId: "",
  durationMonths: "",
  amount: "",
  purchaseDate: "",
  expiryDate: "",
  status: "Active",
};

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";
}

function Field({ label, required, className = "", children }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs font-semibold text-[#5E6C84]">
        {label}
        {required && <span className="ml-0.5 text-[#DE350B]">*</span>}
      </label>
      {children}
    </div>
  );
}

// Native <select> with a consistent chevron
function SelectBox({ children, className = "", ...props }) {
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

// Modal shell: header + body. Pass onSubmit to render the body as a <form>.
function ModalShell({ title, subtitle, onClose, onSubmit, children }) {
  const Body = onSubmit ? "form" : "div";
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(9,30,66,0.54)] p-4 sm:pt-[8vh]">
      <div className="w-full max-w-2xl rounded-[3px] bg-white shadow-[0_8px_16px_-4px_rgba(9,30,66,0.25),0_0_1px_rgba(9,30,66,0.31)]">
        <div className="flex items-start justify-between px-6 pb-2 pt-5">
          <div>
            <h2 className="text-xl font-medium text-[#172B4D]">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 text-sm text-[#5E6C84]">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-[3px] p-1 text-[#42526E] hover:bg-[rgba(9,30,66,0.08)]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <Body onSubmit={onSubmit}>{children}</Body>
      </div>
    </div>
  );
}

const thCls = "px-4 py-2.5 text-left text-xs font-semibold text-[#5E6C84]";

export default function AdminSoftwareDashboard() {
  const [softwares, setSoftwares] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [companyFilter, setCompanyFilter] = useState("All"); // super_admin scoping
  const [page, setPage] = useState(1);

  const limit = 8;

  const [addModal, setAddModal] = useState(false);

  const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { user } = useAuth();

  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);

  /* =========================
     LOAD COMPANIES (once)
  ========================= */
  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const res = await api.get("/companies");
      setCompanies(res.data.companies || []);
    } catch (err) {
      console.error(err);
    }
  };

  /* =========================
     FETCH SOFTWARES
     Refetches whenever the super-admin company filter changes
  ========================= */
  useEffect(() => {
    fetchSoftwares(companyFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyFilter]);

  const fetchSoftwares = async (companyId = companyFilter) => {
    try {
      setIsLoading(true);
      const res = await api.get("/software", {
        params:
          user?.role === "super_admin" && companyId && companyId !== "All"
            ? { companyId }
            : {},
      });
      setSoftwares(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load vendors");
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================
     ADD SOFTWARE
  ========================= */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        serviceName: form.serviceName,
        vendor: form.vendor,
        companyId: form.companyId,
        durationMonths: Number(form.durationMonths) || 0,
        amount: Number(form.amount) || 0,
        purchaseDate: form.purchaseDate || null,
        expiryDate: form.expiryDate || null,
        status: form.status,
      };

      await api.post("/software", payload);

      toast.success("Vendor added successfully");

      setForm(EMPTY_FORM);
      setAddModal(false);
      fetchSoftwares();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to add vendor");
    }
  };

  /* =========================
     DELETE SOFTWARE
  ========================= */
  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      await api.delete(`/software/${deleteTarget._id}`);
      toast.success("Vendor deleted successfully");
      setDeleteTarget(null);
      fetchSoftwares();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete vendor");
    } finally {
      setIsDeleting(false);
    }
  };

  /* =========================
     OPEN EDIT
  ========================= */
  const openEdit = (item) => {
    setEditData({
      ...item,
      purchaseDate: item.purchaseDate ? item.purchaseDate.split("T")[0] : "",
      expiryDate: item.expiryDate ? item.expiryDate.split("T")[0] : "",
    });

    setEditModal(true);
  };

  /* =========================
     UPDATE SOFTWARE
  ========================= */
  const handleUpdate = async () => {
    try {
      const payload = {
        ...editData,
        durationMonths: Number(editData.durationMonths) || 0,
        amount: Number(editData.amount) || 0,
      };

      await api.put(`/software/${editData._id}`, payload);

      toast.success("Vendor updated successfully");

      setEditModal(false);
      setEditData(null);
      fetchSoftwares();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to update vendor");
    }
  };

  /* =========================
     FILTER (client-side: search + status only;
     company scoping now happens server-side)
  ========================= */
  const filtered = useMemo(() => {
    return softwares.filter((s) => {
      const matchesSearch = `${s.serviceName} ${s.vendor} ${s.status}`
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "All" || s.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [softwares, search, statusFilter]);

  /* =========================
     PAGINATION
  ========================= */
  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, companyFilter]);

  const paginated = useMemo(() => {
    const start = (page - 1) * limit;
    return filtered.slice(start, start + limit);
  }, [filtered, page]);

  /* =========================
     KPI
  ========================= */
  const kpi = useMemo(() => {
    return {
      total: softwares.length,
      active: softwares.filter((s) => s.status === "Active").length,
      expired: softwares.filter((s) => s.status === "Expired").length,
      renewed: softwares.filter((s) => s.status === "Renewed").length,
    };
  }, [softwares]);

  const kpiCards = [
    { label: "Total vendors", value: kpi.total, icon: Layers, accent: "#42526E" },
    { label: "Active", value: kpi.active, icon: CheckCircle2, accent: "#00875A" },
    { label: "Expired", value: kpi.expired, icon: XCircle, accent: "#DE350B" },
    { label: "Renewed", value: kpi.renewed, icon: RefreshCcw, accent: "#0052CC" },
  ];

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-[#172B4D]">
      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-10">
        {/* ================= BREADCRUMB + BACK ================= */}
        <div className="mb-2 flex items-center justify-between">
          <nav className="flex items-center gap-1.5 text-sm text-[#5E6C84]">
           
            <span>Vendor Dashboard</span>
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
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-medium text-[#172B4D]">
              Vendor Dashboard
            </h1>
            <p className="mt-1 text-sm text-[#5E6C84]">
              Software & license management
            </p>
          </div>

          <button
            onClick={() => setAddModal(true)}
            className={btnPrimary}
          >
            <Plus size={14} />
            Add vendor
          </button>
        </div>

        {/* KPI */}
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpiCards.map(({ label, value, icon, accent }) => (
            <StatCard
              key={label}
              label={label}
              value={value}
              icon={icon}
              accent={accent}
            />
          ))}
        </div>

        {/* TABLE CARD */}
        <div className="rounded-[3px] border border-[#DFE1E6] bg-white">
          {/* TOOLBAR */}
          <div className="flex flex-col gap-3 border-b border-[#DFE1E6] p-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-80">
              <Search
                size={16}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B778C]"
              />
              <input
                className={`${inputCls} pl-8`}
                placeholder="Search by service, vendor, or status"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {["All", "Active", "Expired", "Renewed"].map((s) => (
                <FilterChip
                  key={s}
                  active={statusFilter === s}
                  onClick={() => setStatusFilter(s)}
                >
                  {s}
                </FilterChip>
              ))}
            </div>

            {/* COMPANY FILTER — super_admin only */}
            {user?.role === "super_admin" && (
              <div className="relative w-full sm:ml-auto sm:w-60">
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
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-[#DFE1E6]">
                  <th className={thCls}>Service</th>
                  <th className={thCls}>Company</th>
                  <th className={thCls}>Duration</th>
                  <th className={thCls}>Amount</th>
                  <th className={thCls}>Start date</th>
                  <th className={thCls}>End date</th>
                  <th className={thCls}>Status</th>
                  <th className={`${thCls} text-right`}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#DFE1E6]">
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="px-4 py-3.5">
                          <div className="h-4 w-full max-w-[120px] animate-pulse rounded-[3px] bg-[#F4F5F7]" />
                        </td>
                      ))}
                    </tr>
                  ))}

                {!isLoading && paginated.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-16">
                      <div className="flex flex-col items-center justify-center gap-1 text-center text-[#5E6C84]">
                        <PackageSearch size={32} className="text-[#97A0AF]" />
                        <p className="mt-1 text-base font-medium text-[#172B4D]">
                          No vendors found
                        </p>
                        <p className="max-w-xs text-sm">
                          Try adjusting your search or filters, or add a new vendor to get started.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  paginated.map((s) => {
                    const statusStyle =
                      STATUS_STYLES[s.status] || STATUS_STYLES.Active;

                    return (
                      <tr
                        key={s._id}
                        className="border-b border-[#DFE1E6] transition-colors hover:bg-[#F4F5F7]"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[3px] bg-[#DEEBFF] text-xs font-semibold text-[#0052CC]">
                              {initials(s.vendor)}
                            </div>
                            <div>
                              <p className="font-medium text-[#0052CC]">
                                {s.serviceName}
                              </p>
                              <p className="text-xs text-[#5E6C84]">{s.vendor}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-[#42526E]">
                          <span className="inline-flex items-center gap-1.5">
                            <Building2 size={14} className="text-[#6B778C]" />
                            {s.companyId?.name || "—"}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-[#42526E]">
                          {s.durationMonths} months
                        </td>

                        <td className="px-4 py-3 font-medium text-[#172B4D]">
                          QAR {s.amount}
                        </td>

                        <td className="px-4 py-3 text-[#42526E]">
                          {s.purchaseDate
                            ? new Date(s.purchaseDate).toLocaleDateString()
                            : "—"}
                        </td>

                        <td className="px-4 py-3 text-[#42526E]">
                          {s.expiryDate
                            ? new Date(s.expiryDate).toLocaleDateString()
                            : "—"}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-block rounded-[3px] px-1.5 py-0.5 text-[11px] font-bold uppercase leading-4 tracking-wide ${statusStyle}`}
                          >
                            {s.status}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEdit(s)}
                              title="Edit vendor"
                              aria-label="Edit vendor"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-[3px] text-[#42526E] transition-colors hover:bg-[#DEEBFF] hover:text-[#0052CC]"
                            >
                              <Pencil size={15} />
                            </button>

                            <button
                              onClick={() => setDeleteTarget(s)}
                              title="Delete vendor"
                              aria-label="Delete vendor"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-[3px] text-[#42526E] transition-colors hover:bg-[#FFEBE6] hover:text-[#BF2600]"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {!isLoading && filtered.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#DFE1E6] px-4 py-3">
              <p className="text-sm text-[#5E6C84]">
                Showing{" "}
                <span className="font-medium text-[#172B4D]">
                  {(page - 1) * limit + 1}–{Math.min(page * limit, filtered.length)}
                </span>{" "}
                of <span className="font-medium text-[#172B4D]">{filtered.length}</span>
              </p>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-8 min-w-[32px] items-center justify-center rounded-[3px] px-2 text-[#42526E] transition-colors hover:bg-[rgba(9,30,66,0.08)] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="rounded-[3px] bg-[#DEEBFF] px-3 py-1.5 text-sm font-medium text-[#0052CC]">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex h-8 min-w-[32px] items-center justify-center rounded-[3px] px-2 text-[#42526E] transition-colors hover:bg-[rgba(9,30,66,0.08)] disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ADD MODAL */}
      {addModal && (
        <ModalShell
          title="Add vendor"
          subtitle="Register a new software license or subscription"
          onClose={() => setAddModal(false)}
          onSubmit={handleSubmit}
        >
          <div className="grid grid-cols-2 gap-4 px-6 py-3">
            <p className="col-span-2 text-xs text-[#5E6C84]">
              Required fields are marked with an asterisk{" "}
              <span className="text-[#DE350B]">*</span>
            </p>

            <Field label="Service name" required className="col-span-2 sm:col-span-1">
              <input
                className={inputCls}
                placeholder="e.g. Kaspersky"
                value={form.serviceName}
                onChange={(e) => setForm({ ...form, serviceName: e.target.value })}
                required
              />
            </Field>

            <Field label="Vendor name" required className="col-span-2 sm:col-span-1">
              <input
                className={inputCls}
                placeholder="e.g. Aruba"
                value={form.vendor}
                onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                required
              />
            </Field>

            {user?.role === "super_admin" && (
              <Field label="Company" required className="col-span-2">
                <SelectBox
                  value={form.companyId}
                  onChange={(e) => setForm({ ...form, companyId: e.target.value })}
                  required
                >
                  <option value="">Select company</option>
                  {companies.map((company) => (
                    <option key={company._id} value={company._id}>
                      {company.name}
                    </option>
                  ))}
                </SelectBox>
              </Field>
            )}

            <Field label="Duration (months)" className="col-span-2 sm:col-span-1">
              <input
                type="number"
                className={inputCls}
                placeholder="12"
                value={form.durationMonths}
                onChange={(e) => setForm({ ...form, durationMonths: e.target.value })}
              />
            </Field>

            <Field label="Amount (QAR)" className="col-span-2 sm:col-span-1">
              <input
                type="number"
                className={inputCls}
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </Field>

            <Field label="Purchase date" className="col-span-2 sm:col-span-1">
              <input
                type="date"
                className={inputCls}
                value={form.purchaseDate}
                onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
              />
            </Field>

            <Field label="Expiry date" className="col-span-2 sm:col-span-1">
              <input
                type="date"
                className={inputCls}
                value={form.expiryDate}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
              />
            </Field>

            <Field label="Status" className="col-span-2">
              <SelectBox
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option>Active</option>
                <option>Expired</option>
                <option>Renewed</option>
              </SelectBox>
            </Field>
          </div>

          <div className="flex justify-end gap-2 px-6 pb-5 pt-3">
            <button
              type="button"
              onClick={() => setAddModal(false)}
              className={btnSubtle}
            >
              Cancel
            </button>
            <button type="submit" className={btnPrimary}>
              Save vendor
            </button>
          </div>
        </ModalShell>
      )}

      {/* EDIT MODAL */}
      {editModal && editData && (
        <ModalShell
          title="Edit vendor"
          subtitle={`Update license details for ${editData.serviceName}`}
          onClose={() => setEditModal(false)}
        >
          <div className="grid grid-cols-2 gap-4 px-6 py-3">
            <Field label="Service name" className="col-span-2 sm:col-span-1">
              <input
                className={inputCls}
                value={editData.serviceName}
                onChange={(e) =>
                  setEditData({ ...editData, serviceName: e.target.value })
                }
              />
            </Field>

            <Field label="Vendor name" className="col-span-2 sm:col-span-1">
              <input
                className={inputCls}
                value={editData.vendor}
                onChange={(e) => setEditData({ ...editData, vendor: e.target.value })}
              />
            </Field>

            <Field label="Duration (months)" className="col-span-2 sm:col-span-1">
              <input
                type="number"
                className={inputCls}
                value={editData.durationMonths}
                onChange={(e) =>
                  setEditData({ ...editData, durationMonths: e.target.value })
                }
              />
            </Field>

            <Field label="Amount (QAR)" className="col-span-2 sm:col-span-1">
              <input
                type="number"
                className={inputCls}
                value={editData.amount}
                onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
              />
            </Field>

            <Field label="Purchase date" className="col-span-2 sm:col-span-1">
              <input
                type="date"
                className={inputCls}
                value={editData.purchaseDate || ""}
                onChange={(e) =>
                  setEditData({ ...editData, purchaseDate: e.target.value })
                }
              />
            </Field>

            <Field label="Expiry date" className="col-span-2 sm:col-span-1">
              <input
                type="date"
                className={inputCls}
                value={editData.expiryDate || ""}
                onChange={(e) =>
                  setEditData({ ...editData, expiryDate: e.target.value })
                }
              />
            </Field>

            <Field label="Status" className="col-span-2">
              <SelectBox
                value={editData.status}
                onChange={(e) => setEditData({ ...editData, status: e.target.value })}
              >
                <option>Active</option>
                <option>Expired</option>
                <option>Renewed</option>
              </SelectBox>
            </Field>
          </div>

          <div className="flex justify-end gap-2 px-6 pb-5 pt-3">
            <button
              onClick={() => setEditModal(false)}
              className={btnSubtle}
            >
              Cancel
            </button>
            <button onClick={handleUpdate} className={btnPrimary}>
              Save changes
            </button>
          </div>
        </ModalShell>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(9,30,66,0.54)] p-4 sm:pt-[15vh]">
          <div className="w-full max-w-md rounded-[3px] bg-white shadow-[0_8px_16px_-4px_rgba(9,30,66,0.25),0_0_1px_rgba(9,30,66,0.31)]">
            <div className="flex items-center gap-2.5 px-6 pb-2 pt-5">
              <AlertTriangle size={22} className="shrink-0 text-[#DE350B]" />
              <h3 className="text-xl font-medium text-[#172B4D]">
                Delete this vendor?
              </h3>
            </div>

            <p className="px-6 py-3 text-sm text-[#42526E]">
              This will permanently remove{" "}
              <span className="font-medium text-[#172B4D]">
                {deleteTarget.serviceName}
              </span>{" "}
              ({deleteTarget.vendor}). This action can't be undone.
            </p>

            <div className="flex justify-end gap-2 px-6 pb-5 pt-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className={btnSubtle}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className={btnDanger}
              >
                {isDeleting ? "Deleting…" : "Delete vendor"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}