import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import {
  Search,
  Plus,
  Pencil,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Upload,
  Users,
  Building2,
  ShieldAlert,
} from "lucide-react";

/* ============================================================
   Design tokens (Atlassian / Jira Service Management palette)
   ============================================================ */
const T = {
  text: "text-[#172B4D]",
  subtle: "text-[#5E6C84]",
  border: "border-[#DFE1E6]",
};

const inputCls =
  "h-9 w-full rounded-[3px] border-2 border-[#DFE1E6] bg-[#FAFBFC] px-2.5 text-sm text-[#172B4D] " +
  "placeholder:text-[#7A869A] transition-colors hover:bg-[#EBECF0] " +
  "focus:border-[#4C9AFF] focus:bg-white focus:outline-none";

const btnBase =
  "inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-[3px] px-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#4C9AFF] disabled:cursor-not-allowed disabled:opacity-50";
const btnPrimary = `${btnBase} bg-[#0052CC] text-white hover:bg-[#0065FF] active:bg-[#0747A6]`;
const btnDefault = `${btnBase} bg-[rgba(9,30,66,0.04)] text-[#42526E] hover:bg-[rgba(9,30,66,0.08)] active:bg-[#DEEBFF] active:text-[#0052CC]`;
const btnSubtle = `${btnBase} bg-transparent text-[#42526E] hover:bg-[rgba(9,30,66,0.08)]`;

/* ============================================================
   Helpers
   ============================================================ */
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

// "RAO ASAD ALI" -> "Rao Asad Ali" (only when the value is fully upper-case)
const tidy = (v) => {
  if (!v) return "";
  if (v !== v.toUpperCase()) return v;
  return v.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
};

const daysUntil = (date) =>
  Math.floor((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));

const toDateInput = (d) => (d ? String(d).slice(0, 10) : "");

/* ============================================================
   Small presentational components
   ============================================================ */
function Lozenge({ tone, children }) {
  const tones = {
    success: "bg-[#E3FCEF] text-[#006644]",
    warning: "bg-[#FFF0B3] text-[#172B4D]",
    danger: "bg-[#FFEBE6] text-[#BF2600]",
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

function VisaBadge({ expiryDate }) {
  if (!expiryDate) return <span className="text-[#97A0AF]">—</span>;
  const d = daysUntil(expiryDate);
  if (d < 0) return <Lozenge tone="danger">Expired</Lozenge>;
  if (d < 30) return <Lozenge tone="warning">Expiring soon</Lozenge>;
  return <Lozenge tone="success">Active</Lozenge>;
}

function Avatar({ name }) {
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
      style={{ backgroundColor: avatarColor(name) }}
    >
      {initials(name)}
    </span>
  );
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

function Modal({ title, onClose, children, footer, wide }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(9,30,66,0.54)] p-4 sm:pt-[8vh]"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`w-full ${wide ? "max-w-xl" : "max-w-md"} rounded-[3px] bg-white shadow-[0_8px_16px_-4px_rgba(9,30,66,0.25),0_0_1px_rgba(9,30,66,0.31)]`}
      >
        <div className="flex items-center justify-between px-6 pb-2 pt-5">
          <h2 className="text-xl font-medium text-[#172B4D]">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-[3px] p-1 text-[#42526E] hover:bg-[rgba(9,30,66,0.08)]"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-3">{children}</div>
        <div className="flex justify-end gap-2 px-6 pb-5 pt-3">{footer}</div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="flex items-center gap-4 rounded-[3px] border border-[#DFE1E6] bg-white px-4 py-3">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-[3px]"
        style={{ backgroundColor: `${accent}1A`, color: accent }}
      >
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs font-semibold text-[#5E6C84]">{label}</p>
        <p className="text-2xl font-medium leading-7 text-[#172B4D]">{value}</p>
      </div>
    </div>
  );
}

/* ============================================================
   Page
   ============================================================ */
const EMPTY_EMPLOYEE = {
  staffCode: "",
  name: "",
  department: "",
  designation: "",
  visaNo: "",
  visaExpiryDate: "",
  companyId: "",
};

export default function AdminEmployeeMaster() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("All"); // super_admin scoping

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [newEmployee, setNewEmployee] = useState(EMPTY_EMPLOYEE);

  // ================= USER INFO =================
  const user = JSON.parse(localStorage.getItem("user"));
  const isSuperAdmin = user?.role === "super_admin";

  // ================= LOAD EMPLOYEES & COMPANIES =================
  const loadEmployees = async (companyId = companyFilter) => {
    try {
      setLoading(true);
      const res = await api.get("/employees", {
        params:
          isSuperAdmin && companyId && companyId !== "All" ? { companyId } : {},
      });
      setEmployees(res.data);
    } catch {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
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
    if (isSuperAdmin) loadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch employees whenever the super-admin company filter changes
  useEffect(() => {
    loadEmployees(companyFilter);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyFilter]);

  // ================= ADD EMPLOYEE =================
  const addEmployee = async () => {
    try {
      if (!newEmployee.staffCode || !newEmployee.name) {
        return toast.error("Staff Code & Name required");
      }
      if (isSuperAdmin && !newEmployee.companyId) {
        return toast.error("Please select a company");
      }

      await api.post("/employees", newEmployee);
      toast.success("Employee Added Successfully");

      setNewEmployee(EMPTY_EMPLOYEE);
      setShowAddForm(false);
      loadEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add employee");
    }
  };

  // ================= EDIT SAVE =================
  const saveEdit = async (id) => {
    try {
      await api.put(`/employees/${id}`, editForm);
      toast.success("Employee Updated");
      setEditId(null);
      loadEmployees();
    } catch {
      toast.error("Update failed");
    }
  };

  // ================= SEARCH (company scoping is server-side) =================
  const filteredEmployees = useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter(
      (e) =>
        e.staffCode?.toLowerCase().includes(q) ||
        e.name?.toLowerCase().includes(q) ||
        e.department?.toLowerCase().includes(q)
    );
  }, [employees, search]);

  // ================= PAGINATION =================
  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / pageSize));
  const paginated = filteredEmployees.slice(
    (page - 1) * pageSize,
    page * pageSize
  );
  const from = filteredEmployees.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, filteredEmployees.length);

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)
  );

  // ================= STATS =================
  const departmentCount = new Set(
    employees.map((e) => e.department).filter(Boolean)
  ).size;
  const visaAttention = employees.filter(
    (e) => e.visaExpiryDate && daysUntil(e.visaExpiryDate) < 30
  ).length;

  const pageBtn = (active) =>
    `flex h-8 min-w-[32px] items-center justify-center rounded-[3px] px-2 text-sm font-medium transition-colors ${
      active
        ? "bg-[#DEEBFF] text-[#0052CC]"
        : "text-[#42526E] hover:bg-[rgba(9,30,66,0.08)]"
    }`;

  return (
    <div className="min-h-screen bg-[#F4F5F7] font-sans text-[#172B4D]">
      <div className="mx-auto max-w-[1400px] px-6 py-6 lg:px-10">
        {/* BREADCRUMB + TITLE */}
        <nav className="mb-2 flex items-center gap-1.5 text-sm text-[#5E6C84]">
          <button
            onClick={() => window.history.back()}
            className="hover:text-[#0052CC] hover:underline"
          >
            Admin
          </button>
          <span>/</span>
          <span>Employee Master</span>
        </nav>

        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-medium text-[#172B4D]">
              Employee Master
            </h1>
            <p className="mt-1 text-sm text-[#5E6C84]">
              Manage and organize your workforce
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => (window.location.href = "/admin/assets/upload-excel")}
              className={btnDefault}
            >
              <Upload size={14} />
              Upload bulk
            </button>
            <button onClick={() => setShowAddForm(true)} className={btnPrimary}>
              <Plus size={14} />
              Create employee
            </button>
          </div>
        </div>

        {/* STATS */}
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            label="Total employees"
            value={employees.length}
            icon={Users}
            accent="#0052CC"
          />
          <StatCard
            label="Departments"
            value={departmentCount}
            icon={Building2}
            accent="#5243AA"
          />
          <StatCard
            label="Visa expired / expiring"
            value={visaAttention}
            icon={ShieldAlert}
            accent="#DE350B"
          />
        </div>

        {/* TABLE CARD */}
        <div className="rounded-[3px] border border-[#DFE1E6] bg-white">
          {/* TOOLBAR */}
          <div className="flex flex-wrap items-center gap-2 border-b border-[#DFE1E6] p-3">
            <div className="relative w-full sm:w-80">
              <Search
                size={16}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B778C]"
              />
              <input
                placeholder="Search by staff code, name or department"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className={`${inputCls} pl-8`}
              />
            </div>

            {isSuperAdmin && (
              <div className="relative w-full sm:w-60">
                <Building2
                  size={15}
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B778C]"
                />
                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  className={`${inputCls} cursor-pointer appearance-none truncate pl-8 pr-8`}
                >
                  <option value="All">All companies</option>
                  {companies.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B778C]"
                />
              </div>
            )}

            {(search || companyFilter !== "All") && (
              <button
                onClick={() => {
                  setSearch("");
                  setCompanyFilter("All");
                }}
                className={btnSubtle}
              >
                Clear filters
              </button>
            )}
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-[#DFE1E6] text-left">
                  {[
                    "Employee",
                    "Staff code",
                    "Company",
                    "Department",
                    "Designation",
                    "Visa status",
                    "",
                  ].map((h, i) => (
                    <th
                      key={i}
                      className="px-4 py-2.5 text-xs font-semibold text-[#5E6C84]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#DFE1E6]">
                      <td colSpan={7} className="px-4 py-3">
                        <div className="h-6 animate-pulse rounded-[3px] bg-[#F4F5F7]" />
                      </td>
                    </tr>
                  ))
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <p className="text-base font-medium text-[#172B4D]">
                        No employees found
                      </p>
                      <p className="mt-1 text-sm text-[#5E6C84]">
                        Try adjusting your search or filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginated.map((emp) => (
                    <tr
                      key={emp._id}
                      className="group border-b border-[#DFE1E6] transition-colors hover:bg-[#F4F5F7]"
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={emp.name} />
                          <span className="font-medium text-[#172B4D]">
                            {tidy(emp.name)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[13px] text-[#42526E]">
                        {emp.staffCode}
                      </td>
                      <td className="px-4 py-2.5 text-[#42526E]">
                        {emp.company?.name || emp.companyName || emp.company || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-[#42526E]">
                        {tidy(emp.department) || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-[#42526E]">
                        {tidy(emp.designation) || "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <VisaBadge expiryDate={emp.visaExpiryDate} />
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() => {
                            setEditId(emp._id);
                            setEditForm({
                              ...emp,
                              visaExpiryDate: toDateInput(emp.visaExpiryDate),
                            });
                          }}
                          className={btnSubtle}
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#DFE1E6] px-4 py-3">
            <p className="text-sm text-[#5E6C84]">
              Showing <span className="font-medium text-[#172B4D]">{from}–{to}</span> of{" "}
              <span className="font-medium text-[#172B4D]">
                {filteredEmployees.length}
              </span>
            </p>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className={`${pageBtn(false)} disabled:cursor-not-allowed disabled:opacity-40`}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>

              {pageNumbers.map((p, i) => (
                <div key={p} className="flex items-center gap-1">
                  {i > 0 && pageNumbers[i - 1] !== p - 1 && (
                    <span className="px-1 text-[#6B778C]">…</span>
                  )}
                  <button onClick={() => setPage(p)} className={pageBtn(page === p)}>
                    {p}
                  </button>
                </div>
              ))}

              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className={`${pageBtn(false)} disabled:cursor-not-allowed disabled:opacity-40`}
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ADD EMPLOYEE MODAL */}
      {showAddForm && (
        <Modal
          wide
          title="Create employee"
          onClose={() => setShowAddForm(false)}
          footer={
            <>
              <button onClick={() => setShowAddForm(false)} className={btnSubtle}>
                Cancel
              </button>
              <button onClick={addEmployee} className={btnPrimary}>
                Create
              </button>
            </>
          }
        >
          <p className="mb-4 text-xs text-[#5E6C84]">
            Required fields are marked with an asterisk <span className="text-[#DE350B]">*</span>
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {isSuperAdmin && (
              <Field label="Company" required className="md:col-span-2">
                <div className="relative">
                  <select
                    value={newEmployee.companyId}
                    onChange={(e) =>
                      setNewEmployee({ ...newEmployee, companyId: e.target.value })
                    }
                    className={`${inputCls} cursor-pointer appearance-none pr-8`}
                  >
                    <option value="">Select a company</option>
                    {companies.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B778C]"
                  />
                </div>
              </Field>
            )}

            <Field label="Staff code" required>
              <input
                className={inputCls}
                placeholder="Enter staff code"
                value={newEmployee.staffCode}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, staffCode: e.target.value })
                }
              />
            </Field>

            <Field label="Name" required>
              <input
                className={inputCls}
                placeholder="Enter full name"
                value={newEmployee.name}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, name: e.target.value })
                }
              />
            </Field>

            <Field label="Department">
              <input
                className={inputCls}
                placeholder="Enter department"
                value={newEmployee.department}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, department: e.target.value })
                }
              />
            </Field>

            <Field label="Designation">
              <input
                className={inputCls}
                placeholder="Enter designation"
                value={newEmployee.designation}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, designation: e.target.value })
                }
              />
            </Field>

            <Field label="Visa no">
              <input
                className={inputCls}
                placeholder="Enter visa number"
                value={newEmployee.visaNo}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, visaNo: e.target.value })
                }
              />
            </Field>

            <Field label="Visa expiry date">
              <input
                type="date"
                className={inputCls}
                value={newEmployee.visaExpiryDate}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, visaExpiryDate: e.target.value })
                }
              />
            </Field>
          </div>
        </Modal>
      )}

      {/* EDIT MODAL */}
      {editId && (
        <Modal
          wide
          title="Edit employee"
          onClose={() => setEditId(null)}
          footer={
            <>
              <button onClick={() => setEditId(null)} className={btnSubtle}>
                Cancel
              </button>
              <button onClick={() => saveEdit(editId)} className={btnPrimary}>
                Save changes
              </button>
            </>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Staff code">
              <input
                className={inputCls}
                value={editForm.staffCode || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, staffCode: e.target.value })
                }
              />
            </Field>

            <Field label="Name">
              <input
                className={inputCls}
                value={editForm.name || ""}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </Field>

            <Field label="Department">
              <input
                className={inputCls}
                value={editForm.department || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, department: e.target.value })
                }
              />
            </Field>

            <Field label="Designation">
              <input
                className={inputCls}
                value={editForm.designation || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, designation: e.target.value })
                }
              />
            </Field>

            <Field label="Visa no">
              <input
                className={inputCls}
                value={editForm.visaNo || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, visaNo: e.target.value })
                }
              />
            </Field>

            <Field label="Visa expiry date">
              <input
                type="date"
                className={inputCls}
                value={editForm.visaExpiryDate || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, visaExpiryDate: e.target.value })
                }
              />
            </Field>
          </div>
        </Modal>
      )}
    </div>
  );
}