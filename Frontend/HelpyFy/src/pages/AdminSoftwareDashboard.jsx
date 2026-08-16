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
  Calendar,
  CalendarClock,
  Banknote,
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
  AlertTriangle,
} from "lucide-react";

const STATUS_STYLES = {
  Active: {
    pill: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
    dot: "bg-emerald-500",
  },
  Expired: {
    pill: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
    dot: "bg-rose-500",
  },
  Renewed: {
    pill: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
    dot: "bg-sky-500",
  },
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
    {
      label: "Total vendors",
      value: kpi.total,
      icon: Layers,
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
      valueColor: "text-slate-900",
    },
    {
      label: "Active",
      value: kpi.active,
      icon: CheckCircle2,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      valueColor: "text-emerald-700",
    },
    {
      label: "Expired",
      value: kpi.expired,
      icon: XCircle,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-600",
      valueColor: "text-rose-700",
    },
    {
      label: "Renewed",
      value: kpi.renewed,
      icon: RefreshCcw,
      iconBg: "bg-sky-50",
      iconColor: "text-sky-600",
      valueColor: "text-sky-700",
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* ================= BACK NAVIGATION ================= */}
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 mb-5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 transition text-sm font-medium shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* HEADER */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-6 py-5 flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              Vendor Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Software & license management
            </p>
          </div>

          <button
            onClick={() => setAddModal(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 active:bg-indigo-800 transition text-sm font-semibold shadow-sm shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            Add vendor
          </button>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {kpiCards.map(({ label, value, icon: Icon, iconBg, iconColor, valueColor }) => (
            <div
              key={label}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-start justify-between"
            >
              <div>
                <p className="text-slate-500 text-sm font-medium">{label}</p>
                <h2 className={`text-3xl font-semibold mt-2 tracking-tight ${valueColor}`}>
                  {value}
                </h2>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
            </div>
          ))}
        </div>

        {/* TOOLBAR */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="relative w-full sm:w-[340px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              className="w-full border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition"
              placeholder="Search by service, vendor, or status"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {["All", "Active", "Expired", "Renewed"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium border transition ${
                  statusFilter === s
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* COMPANY FILTER — super_admin only */}
          {user?.role === "super_admin" && (
            <div className="flex items-center gap-2 sm:ml-auto">
              <Building2 className="w-4 h-4 text-slate-400 hidden sm:block" />
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2.5 bg-white text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition"
              >
                <option value="All">All companies</option>
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                    Service
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                    Company
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                    Duration
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                    Amount
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                    Start date
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                    End date
                  </th>
                  <th className="text-left px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-right px-5 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-3.5 bg-slate-100 rounded animate-pulse w-full max-w-[120px]" />
                        </td>
                      ))}
                    </tr>
                  ))}

                {!isLoading && paginated.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-16">
                      <div className="flex flex-col items-center justify-center text-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-1">
                          <PackageSearch className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-slate-700 font-medium">No vendors found</p>
                        <p className="text-slate-400 text-sm max-w-xs">
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
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-semibold shrink-0">
                              {initials(s.vendor)}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">
                                {s.serviceName}
                              </p>
                              <p className="text-xs text-slate-400">{s.vendor}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-xs font-medium">
                            <Building2 className="w-3.5 h-3.5" />
                            {s.companyId?.name || "—"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {s.durationMonths} months
                        </td>

                        <td className="px-5 py-4 text-slate-900 font-medium">
                          QAR {s.amount}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {s.purchaseDate
                            ? new Date(s.purchaseDate).toLocaleDateString()
                            : "—"}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {s.expiryDate
                            ? new Date(s.expiryDate).toLocaleDateString()
                            : "—"}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle.pill}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                            {s.status}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEdit(s)}
                              title="Edit vendor"
                              className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setDeleteTarget(s)}
                              title="Delete vendor"
                              className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                            >
                              <Trash2 className="w-4 h-4" />
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
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                Showing{" "}
                <span className="font-medium text-slate-600">
                  {(page - 1) * limit + 1}–{Math.min(page * limit, filtered.length)}
                </span>{" "}
                of <span className="font-medium text-slate-600">{filtered.length}</span>
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-slate-500 px-2 font-medium">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ADD MODAL */}
      {addModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Add vendor</h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  Register a new software license or subscription
                </p>
              </div>
              <button
                onClick={() => setAddModal(false)}
                className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-6 grid grid-cols-2 gap-4">
              <Field label="Service name" required className="col-span-2 sm:col-span-1">
                <input
                  className="input-field"
                  placeholder="e.g. Kaspersky"
                  value={form.serviceName}
                  onChange={(e) => setForm({ ...form, serviceName: e.target.value })}
                  required
                />
              </Field>

              <Field label="Vendor name" required className="col-span-2 sm:col-span-1">
                <input
                  className="input-field"
                  placeholder="e.g. Aruba"
                  value={form.vendor}
                  onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                  required
                />
              </Field>

              {user?.role === "super_admin" && (
                <Field label="Company" required className="col-span-2">
                  <select
                    className="input-field"
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
                  </select>
                </Field>
              )}

              <Field label="Duration (months)" className="col-span-2 sm:col-span-1">
                <input
                  type="number"
                  className="input-field"
                  placeholder="12"
                  value={form.durationMonths}
                  onChange={(e) => setForm({ ...form, durationMonths: e.target.value })}
                />
              </Field>

              <Field label="Amount (QAR)" className="col-span-2 sm:col-span-1">
                <input
                  type="number"
                  className="input-field"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </Field>

              <Field label="Purchase date" className="col-span-2 sm:col-span-1">
                <input
                  type="date"
                  className="input-field"
                  value={form.purchaseDate}
                  onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                />
              </Field>

              <Field label="Expiry date" className="col-span-2 sm:col-span-1">
                <input
                  type="date"
                  className="input-field"
                  value={form.expiryDate}
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                />
              </Field>

              <Field label="Status" className="col-span-2">
                <select
                  className="input-field"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option>Active</option>
                  <option>Expired</option>
                  <option>Renewed</option>
                </select>
              </Field>

              <div className="col-span-2 flex justify-end gap-3 mt-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModal(false)}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition text-sm font-semibold shadow-sm shadow-indigo-200"
                >
                  Save vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModal && editData && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Edit vendor</h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  Update license details for {editData.serviceName}
                </p>
              </div>
              <button
                onClick={() => setEditModal(false)}
                className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-6 grid grid-cols-2 gap-4">
              <Field label="Service name" className="col-span-2 sm:col-span-1">
                <input
                  className="input-field"
                  value={editData.serviceName}
                  onChange={(e) =>
                    setEditData({ ...editData, serviceName: e.target.value })
                  }
                />
              </Field>

              <Field label="Vendor name" className="col-span-2 sm:col-span-1">
                <input
                  className="input-field"
                  value={editData.vendor}
                  onChange={(e) => setEditData({ ...editData, vendor: e.target.value })}
                />
              </Field>

              <Field label="Duration (months)" className="col-span-2 sm:col-span-1">
                <input
                  type="number"
                  className="input-field"
                  value={editData.durationMonths}
                  onChange={(e) =>
                    setEditData({ ...editData, durationMonths: e.target.value })
                  }
                />
              </Field>

              <Field label="Amount (QAR)" className="col-span-2 sm:col-span-1">
                <input
                  type="number"
                  className="input-field"
                  value={editData.amount}
                  onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                />
              </Field>

              <Field label="Purchase date" className="col-span-2 sm:col-span-1">
                <input
                  type="date"
                  className="input-field"
                  value={editData.purchaseDate || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, purchaseDate: e.target.value })
                  }
                />
              </Field>

              <Field label="Expiry date" className="col-span-2 sm:col-span-1">
                <input
                  type="date"
                  className="input-field"
                  value={editData.expiryDate || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, expiryDate: e.target.value })
                  }
                />
              </Field>

              <Field label="Status" className="col-span-2">
                <select
                  className="input-field"
                  value={editData.status}
                  onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                >
                  <option>Active</option>
                  <option>Expired</option>
                  <option>Renewed</option>
                </select>
              </Field>
            </div>

            <div className="flex justify-end gap-3 px-6 pb-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => setEditModal(false)}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition text-sm font-semibold shadow-sm shadow-indigo-200"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden p-6">
            <div className="w-11 h-11 rounded-full bg-rose-50 flex items-center justify-center mb-4">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <h3 className="text-base font-semibold text-slate-900">
              Delete this vendor?
            </h3>
            <p className="text-sm text-slate-500 mt-1.5">
              This will permanently remove{" "}
              <span className="font-medium text-slate-700">
                {deleteTarget.serviceName}
              </span>{" "}
              ({deleteTarget.vendor}). This action can't be undone.
            </p>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="bg-rose-600 text-white px-4 py-2.5 rounded-lg hover:bg-rose-700 transition text-sm font-semibold shadow-sm shadow-rose-200 disabled:opacity-60"
              >
                {isDeleting ? "Deleting…" : "Delete vendor"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .input-field {
          width: 100%;
          border: 1px solid rgb(226 232 240);
          border-radius: 0.5rem;
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          background: white;
          transition: box-shadow 0.15s, border-color 0.15s;
        }
        .input-field:focus {
          outline: none;
          border-color: rgb(129 140 248);
          box-shadow: 0 0 0 3px rgb(199 210 254 / 0.5);
        }
      `}</style>
    </div>
  );
}

function Field({ label, required, className = "", children }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-slate-500 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
    </div>
  );
}