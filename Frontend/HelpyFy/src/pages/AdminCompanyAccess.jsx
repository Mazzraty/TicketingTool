import { useEffect, useState } from "react";
import Select from "react-select";
import api from "../api/axios";
import toast from "react-hot-toast";
import {
  Building2,
  Trash2,
  ChevronDown,
  Eraser,
  X,
  UserCheck,
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

function Avatar({ name, size = 32 }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        backgroundColor: avatarColor(name),
      }}
    >
      {initials(name)}
    </span>
  );
}

function Lozenge({ className, children }) {
  return (
    <span
      className={`inline-block rounded-[3px] px-1.5 py-0.5 text-[11px] font-bold uppercase leading-4 tracking-wide ${className}`}
    >
      {children}
    </span>
  );
}

function Card({ title, subtitle, actions, children, footer, className = "" }) {
  return (
    <div className={`rounded-[3px] border border-[#DFE1E6] bg-white ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#DFE1E6] px-4 py-3">
          <div>
            <h2 className="text-base font-semibold text-[#172B4D]">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 text-sm text-[#5E6C84]">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-4">{children}</div>
      {footer && (
        <div className="flex justify-end gap-2 border-t border-[#DFE1E6] bg-[#FAFBFC] px-4 py-3">
          {footer}
        </div>
      )}
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-[#5E6C84]">
        {label}
        {required && <span className="ml-0.5 text-[#DE350B]">*</span>}
      </label>
      {children}
    </div>
  );
}

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

function InfoRow({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-[#5E6C84]">{label}</dt>
      <dd className="mt-1 text-sm text-[#172B4D]">{children}</dd>
    </div>
  );
}

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

export default function AdminCompanyAccess() {
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedRole, setSelectedRole] = useState("it_support");

  const [loading, setLoading] = useState(false);

  // UI-only state (new): which access row is awaiting revoke confirmation
  const [confirmRevoke, setConfirmRevoke] = useState(null);

  /* =========================
     LOAD EMPLOYEES
  ========================= */
  const loadEmployees = async () => {
    try {
      const res = await api.get("/superadmin/employees");

      const employeeOptions = res.data.employees.map((emp) => ({
        value: emp.userId,
        label: `${emp.name} (${emp.staffCode})`,
        employee: emp,
      }));

      setEmployees(employeeOptions);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load employees");
    }
  };

  /* =========================
     LOAD COMPANIES
  ========================= */
  const loadCompanies = async () => {
    try {
      const res = await api.get("/companies");
      setCompanies(res.data.companies || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load companies");
    }
  };

  /* =========================
     INITIAL LOAD
  ========================= */
  useEffect(() => {
    loadEmployees();
    loadCompanies();
  }, []);

  /* =========================
     ASSIGN ACCESS
  ========================= */
  const assignAccess = async () => {
    try {
      if (!selectedEmployee) {
        return toast.error("Select Employee");
      }

      if (!selectedEmployee.value) {
        return toast.error(
          "Selected employee does not have a user account"
        );
      }

      if (!selectedCompany) {
        return toast.error("Select Company");
      }

      setLoading(true);

      await api.post(
        `/superadmin/users/${selectedEmployee.value}/assign-company`,
        {
          companyId: selectedCompany,
          role: selectedRole,
        }
      );

      toast.success("Company access assigned successfully");

      setSelectedEmployee(null);
      setSelectedCompany("");
      setSelectedRole("it_support");

      await loadEmployees();
    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.message ||
        "Failed to assign access"
      );
    } finally {
      setLoading(false);
    }
  };

  const revokeAccess = async (companyId) => {
    try {
      if (!selectedEmployee?.value) {
        return toast.error("Select Employee");
      }

      await api.post(
        `/superadmin/users/${selectedEmployee.value}/revoke-company`,
        {
          companyId,
        }
      );

      toast.success("Access revoked successfully");

      await loadEmployees();
    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.message ||
        "Failed to revoke access"
      );
    }
  };

  const getRoleLabel = (role) => {
    const roleMap = {
      user: "User",
      company_admin: "Company Admin",
      it_support: "IT Support",
    };
    return roleMap[role] || role;
  };

  // Jira lozenge colours per role
  const getRoleColor = (role) => {
    const colorMap = {
      user: "bg-[#DEEBFF] text-[#0747A6]",
      company_admin: "bg-[#EAE6FF] text-[#403294]",
      it_support: "bg-[#FFF0B3] text-[#172B4D]",
    };
    return colorMap[role] || "bg-[#DFE1E6] text-[#42526E]";
  };

  /* ================= NEW (UI-only additions) ================= */

  // Clear the assign form without submitting (uses the existing setters)
  const clearForm = () => {
    setSelectedEmployee(null);
    setSelectedCompany("");
    setSelectedRole("it_support");
  };

  const companyAccessList =
    selectedEmployee?.employee?.companyAccess || [];
  const activeAccessCount = companyAccessList.filter((a) => a.isActive).length;
  const revokedAccessCount = companyAccessList.length - activeAccessCount;

  const selectedCompanyName = companies.find(
    (c) => c._id === selectedCompany
  )?.name;

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-[#172B4D]">
      <div className="mx-auto max-w-6xl px-6 py-6 lg:px-10">
        {/* BREADCRUMB */}
        {/* <nav className="mb-2 flex items-center gap-1.5 text-sm text-[#5E6C84]">
          <span>Admin</span>
          <span>/</span>
          <span>Users</span>
          <span>/</span>
          <span>Company Access</span>
        </nav> */}

        {/* HEADER */}
        <div className="mb-5">
          <h1 className="text-2xl font-medium text-[#172B4D]">
            Company Access Management
          </h1>
          <p className="mt-1 text-sm text-[#5E6C84]">
            Manage employee access to companies and assign roles
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* ASSIGNMENT FORM */}
          <div className="lg:col-span-2">
            <Card
              title="Assign company access"
              subtitle="Give an employee access to a company with a role"
              footer={
                <>
                  {/* NEW: clear form */}
                  <button
                    onClick={clearForm}
                    disabled={loading}
                    className={btnSubtle}
                  >
                    <Eraser size={14} />
                    Clear
                  </button>
                  <button
                    onClick={assignAccess}
                    disabled={loading || !selectedEmployee || !selectedCompany}
                    className={btnPrimary}
                  >
                    <UserCheck size={14} />
                    {loading ? "Assigning..." : "Assign Company Access"}
                  </button>
                </>
              }
            >
              <p className="mb-4 text-xs text-[#5E6C84]">
                Required fields are marked with an asterisk{" "}
                <span className="text-[#DE350B]">*</span>
              </p>

              <div className="space-y-4">
                {/* Employee Selection */}
                <Field label="Employee" required>
                  <Select
                    options={employees}
                    value={selectedEmployee}
                    onChange={setSelectedEmployee}
                    placeholder="Search by name or staff code..."
                    isSearchable
                    styles={selectStyles}
                  />
                </Field>

                {/* Company Selection */}
                <Field label="Company" required>
                  <SelectBox
                    value={selectedCompany}
                    onChange={(e) =>
                      setSelectedCompany(e.target.value)
                    }
                  >
                    <option value="">Choose a company...</option>

                    {companies.map((company) => (
                      <option
                        key={company._id}
                        value={company._id}
                      >
                        {company.name}
                      </option>
                    ))}
                  </SelectBox>
                </Field>

                {/* Role Selection */}
                <Field label="Role" required>
                  <SelectBox
                    value={selectedRole}
                    onChange={(e) =>
                      setSelectedRole(e.target.value)
                    }
                  >
                    <option value="user">User</option>
                    <option value="company_admin">Company Admin</option>
                    <option value="it_support">IT Support</option>
                  </SelectBox>
                </Field>
              </div>
            </Card>
          </div>

          {/* SUMMARY CARD */}
          <div className="lg:col-span-1">
            <Card title="Selection summary" className="lg:sticky lg:top-6">
              <dl className="space-y-4">
                <InfoRow label="Employee">
                  {selectedEmployee?.employee?.name ? (
                    <div className="flex items-center gap-2.5">
                      <Avatar name={selectedEmployee.employee.name} />
                      <div>
                        <p className="font-medium">
                          {tidy(selectedEmployee.employee.name)}
                        </p>
                        {selectedEmployee.employee.staffCode && (
                          <p className="text-xs text-[#5E6C84]">
                            Code: {selectedEmployee.employee.staffCode}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[#6B778C]">Not selected</span>
                  )}
                </InfoRow>

                <InfoRow label="Company">
                  {selectedCompanyName ? (
                    <span className="font-medium">{selectedCompanyName}</span>
                  ) : (
                    <span className="text-[#6B778C]">Not selected</span>
                  )}
                </InfoRow>

                <InfoRow label="Role">
                  <Lozenge className={getRoleColor(selectedRole)}>
                    {getRoleLabel(selectedRole)}
                  </Lozenge>
                </InfoRow>
              </dl>
            </Card>
          </div>
        </div>

        {/* EMPLOYEE DETAILS SECTION */}
        {selectedEmployee && (
          <Card
            title="Employee details"
            className="mt-4"
            actions={
              <div className="flex items-center gap-2">
                {/* NEW: counts */}
                <Lozenge className="bg-[#E3FCEF] text-[#006644]">
                  {activeAccessCount} active
                </Lozenge>
                <Lozenge className="bg-[#DFE1E6] text-[#42526E]">
                  {revokedAccessCount} revoked
                </Lozenge>
              </div>
            }
          >
            {/* Employee Info Grid */}
            <dl className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-3">
              <InfoRow label="Full name">
                <div className="flex items-center gap-2.5">
                  <Avatar name={selectedEmployee.employee.name} />
                  <span className="font-medium">
                    {tidy(selectedEmployee.employee.name)}
                  </span>
                </div>
              </InfoRow>

              <InfoRow label="Staff code">
                <span className="font-mono text-[13px]">
                  {selectedEmployee.employee.staffCode}
                </span>
              </InfoRow>

              <InfoRow label="User status">
                {selectedEmployee.value ? (
                  <Lozenge className="bg-[#E3FCEF] text-[#006644]">
                    User account linked
                  </Lozenge>
                ) : (
                  <Lozenge className="bg-[#FFEBE6] text-[#BF2600]">
                    No user account
                  </Lozenge>
                )}
              </InfoRow>

              <InfoRow label="Department">
                {tidy(selectedEmployee.employee.department) || "—"}
              </InfoRow>

              <InfoRow label="Designation">
                {tidy(selectedEmployee.employee.designation) || "—"}
              </InfoRow>
            </dl>

            {/* Company Access Section */}
            <h3 className="mb-2 text-sm font-semibold text-[#172B4D]">
              Company access
            </h3>

            {!selectedEmployee.employee.companyAccess ||
              selectedEmployee.employee.companyAccess.length === 0 ? (
              <div className="flex flex-col items-center gap-1 rounded-[3px] border border-dashed border-[#C1C7D0] bg-[#FAFBFC] py-10 text-center">
                <Building2 size={32} className="text-[#97A0AF]" />
                <p className="mt-1 text-base font-medium text-[#172B4D]">
                  No company access assigned
                </p>
                <p className="text-sm text-[#5E6C84]">
                  Use the form above to assign company access
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-[3px] border border-[#DFE1E6]">
                <table className="w-full min-w-[560px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b-2 border-[#DFE1E6] bg-[#FAFBFC] text-left">
                      <th className="px-4 py-2.5 text-xs font-semibold text-[#5E6C84]">
                        Company
                      </th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-[#5E6C84]">
                        Role
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
                    {selectedEmployee.employee.companyAccess.map(
                      (access, index) => (
                        <tr
                          key={index}
                          className="border-b border-[#DFE1E6] transition-colors last:border-b-0 hover:bg-[#F4F5F7]"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-8 w-8 items-center justify-center rounded-[3px] bg-[#DEEBFF] text-[#0052CC]">
                                <Building2 size={16} />
                              </span>
                              <span className="font-medium text-[#172B4D]">
                                {access.companyName}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <Lozenge className={getRoleColor(access.role)}>
                              {getRoleLabel(access.role)}
                            </Lozenge>
                          </td>

                          <td className="px-4 py-3">
                            {access.isActive ? (
                              <Lozenge className="bg-[#E3FCEF] text-[#006644]">
                                Active
                              </Lozenge>
                            ) : (
                              <Lozenge className="bg-[#FFEBE6] text-[#BF2600]">
                                Revoked
                              </Lozenge>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right">
                            {access.isActive && (
                              <button
                                onClick={() =>
                                  setConfirmRevoke({
                                    companyId: access.companyId,
                                    companyName: access.companyName,
                                  })
                                }
                                className={`${btnBase} bg-transparent text-[#BF2600] hover:bg-[#FFEBE6]`}
                                title="Revoke access"
                              >
                                <Trash2 size={14} />
                                Revoke
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* NEW: REVOKE CONFIRMATION (calls your existing revokeAccess) */}
      {confirmRevoke && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(9,30,66,0.54)] p-4 sm:pt-[15vh]">
          <div className="w-full max-w-md rounded-[3px] bg-white shadow-[0_8px_16px_-4px_rgba(9,30,66,0.25),0_0_1px_rgba(9,30,66,0.31)]">
            <div className="flex items-center justify-between px-6 pb-2 pt-5">
              <h2 className="text-xl font-medium text-[#172B4D]">
                Revoke access?
              </h2>
              <button
                onClick={() => setConfirmRevoke(null)}
                className="rounded-[3px] p-1 text-[#42526E] hover:bg-[rgba(9,30,66,0.08)]"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-6 py-3 text-sm text-[#42526E]">
              <span className="font-medium text-[#172B4D]">
                {tidy(selectedEmployee?.employee?.name)}
              </span>{" "}
              will lose access to{" "}
              <span className="font-medium text-[#172B4D]">
                {confirmRevoke.companyName}
              </span>
              .
            </div>

            <div className="flex justify-end gap-2 px-6 pb-5 pt-3">
              <button
                onClick={() => setConfirmRevoke(null)}
                className={btnSubtle}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  const id = confirmRevoke.companyId;
                  setConfirmRevoke(null);
                  await revokeAccess(id);
                }}
                className={btnDanger}
              >
                <Trash2 size={14} />
                Revoke access
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}