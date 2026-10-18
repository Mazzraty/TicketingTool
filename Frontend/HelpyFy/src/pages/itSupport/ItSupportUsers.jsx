import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import {
  Search,
  X,
  KeyRound,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Users,
  Building2,
  AlertTriangle,
} from "lucide-react";

/* =========================
   SETTINGS
========================= */
const PAGE_SIZE = 10;

// one grid shared by the header row and every user row
const ROW_GRID =
  "grid grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)_110px_minmax(0,1fr)_minmax(0,1fr)_150px] items-center gap-4 px-5";

/* =========================
   HELPERS
========================= */
const AVATAR_COLORS = [
  { bg: "#E9F2FF", text: "#0C4A9E" },
  { bg: "#DFF7E8", text: "#146C3E" },
  { bg: "#FFF3D6", text: "#7A4B00" },
  { bg: "#F3EEFF", text: "#5B37AF" },
  { bg: "#FFECEB", text: "#AE2A19" },
  { bg: "#E6F3F4", text: "#0B6E76" },
];

const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarColor = (seed = "") => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

// Titles like "ANAS MOHAMED" -> "Anas Mohamed" (display only)
const prettyName = (name = "") =>
  name === name.toUpperCase()
    ? name.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
    : name;

/* =========================
   SMALL UI PIECES
========================= */
const Button = ({
  variant = "primary",
  size = "sm",
  icon: Icon,
  children,
  onClick,
  disabled,
  className = "",
}) => {
  const baseStyles =
    "inline-flex items-center justify-center gap-1.5 rounded-[4px] font-medium transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed whitespace-nowrap";

  const sizes = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-3.5 py-2 text-sm",
  };

  const variants = {
    primary: "bg-[#0B6E76] text-white hover:bg-[#095A61] disabled:opacity-50",
    secondary:
      "bg-white text-[#172B4D] border border-[#C7CDD6] hover:bg-[#F1F3F5] disabled:opacity-50",
    ghost: "text-[#44546F] hover:bg-[#EEF0F3] disabled:opacity-50",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {children}
    </button>
  );
};

const Avatar = ({ name, email }) => {
  const color = getAvatarColor(email || name);
  return (
    <span
      className="inline-flex items-center justify-center w-8 h-8 rounded-full text-[11px] font-semibold shrink-0"
      style={{ background: color.bg, color: color.text }}
    >
      {getInitials(name)}
    </span>
  );
};

const Tag = ({ children }) => (
  <span className="inline-flex items-center rounded-[4px] bg-[#EEF0F3] px-2 py-0.5 text-[11px] font-semibold text-[#44546F] whitespace-nowrap">
    {children}
  </span>
);

/* =========================
   PAGE
========================= */
export default function ITSupportUsers() {
  const [users, setUsers] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState(null);

  // search + pagination
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // reset password flow
  const [resetTarget, setResetTarget] = useState(null);
  const [customPassword, setCustomPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [tempPassword, setTempPassword] = useState(null);
  const [copied, setCopied] = useState(false);

  /* ================= LOAD ================= */
  const loadUsers = async () => {
    try {
      const me = await api.get("/auth/me");

      setMyId(me.data._id);

      const access = me.data.companyAccess?.find(
        (c) => c.role === "it_support" && c.isActive
      );

      if (!access) {
        toast.error("No company assigned");
        return;
      }

      setCompany(access);

      const companyId = access.companyId?._id || access.companyId;

      const res = await api.get(`/users/company/${companyId}`);

      setUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Debounce the search box
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim().toLowerCase());
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  /* ================= FILTER + PAGINATE ================= */
  const filtered = useMemo(() => {
    if (!search) return users;
    return users.filter((u) =>
      [u.name, u.email, u.staffCode, u.department, u.position]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(search))
    );
  }, [users, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageUsers = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, filtered.length);

  const getPageNumbers = () => {
    const maxButtons = 5;
    const pages = [];
    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    let start = Math.max(1, safePage - 2);
    let end = Math.min(totalPages, start + maxButtons - 1);
    if (end - start < maxButtons - 1) start = Math.max(1, end - maxButtons + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };
  const pageNumbers = getPageNumbers();

  const pageBtn =
    "w-8 h-8 rounded-[4px] text-sm font-medium transition-colors cursor-pointer";

  /* ================= RESET PASSWORD ================= */
  const openReset = (user) => {
    setResetTarget(user);
    setCustomPassword("");
  };

  const closeReset = () => {
    if (resetting) return;
    setResetTarget(null);
    setCustomPassword("");
  };

  const closeResult = () => {
    setTempPassword(null);
    setResetTarget(null);
    setCopied(false);
  };

  const confirmReset = async () => {
    if (!resetTarget || resetting) return;

    const pwd = customPassword.trim();
    if (pwd && pwd.length < 8) {
      return toast.error("Password must be at least 8 characters");
    }

    setResetting(true);
    try {
      const res = await api.put(
        `/auth/users/${resetTarget._id}/reset-password`,
        pwd ? { newPassword: pwd } : {}
      );

      setTempPassword(res.data.tempPassword);
      setCopied(false);
      toast.success("Password reset successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
      setResetTarget(null);
    } finally {
      setResetting(false);
      setCustomPassword("");
    }
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy. Select the password and copy it manually.");
    }
  };

  // IT support can only reset regular users (not themselves, not admins).
  // If the API doesn't return `role`, the button shows and the backend decides.
  const canReset = (user) =>
    String(user._id) !== String(myId) && (!user.role || user.role === "user");

  /* ================= RENDER ================= */
  return (
    <div
      className="min-h-screen bg-[#F4F5F7]"
      style={{ fontFamily: "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* Font import — remove if you already load these via index.html */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
      `}</style>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* PAGE HEADER */}
        <div className="mb-5">
          <h1 className="text-2xl font-semibold text-[#172B4D] tracking-tight">
            Company users
          </h1>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-[#626F86]">
            <Building2 className="w-3.5 h-3.5" />
            {company?.companyName || "-"}
          </p>
        </div>

        {/* LIST CARD */}
        <div className="bg-white border border-[#DFE1E6] rounded-lg overflow-hidden">
          {/* TOOLBAR */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-5 py-3.5 border-b border-[#DFE1E6]">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8590A2]" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name, email, staff code, department"
                className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-[#C7CDD6] rounded-[4px] hover:bg-[#F7F8F9] focus:bg-white focus:ring-2 focus:ring-[#0B6E76]/30 focus:border-[#0B6E76] outline-none transition"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8590A2] hover:text-[#172B4D] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-[#626F86]">
              <Users className="w-4 h-4" />
              <span>
                <span className="font-semibold text-[#172B4D]">
                  {filtered.length}
                </span>{" "}
                {search ? `of ${users.length} ` : ""}
                {filtered.length === 1 ? "user" : "users"}
              </span>
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <div className="min-w-[960px]">
              {/* column headers */}
              <div
                className={`${ROW_GRID} py-2.5 bg-[#F7F8F9] border-b border-[#DFE1E6] text-xs font-semibold text-[#626F86]`}
              >
                <span>Name</span>
                <span>Email</span>
                <span>Staff code</span>
                <span>Department</span>
                <span>Position</span>
                <span className="text-right">Actions</span>
              </div>

              {/* loading */}
              {loading &&
                [1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className={`${ROW_GRID} py-4 border-b border-[#EBECF0]`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#EEF0F3] animate-pulse" />
                      <div className="h-3 w-28 rounded bg-[#EEF0F3] animate-pulse" />
                    </div>
                    <div className="h-3 w-44 rounded bg-[#EEF0F3] animate-pulse" />
                    <div className="h-3 w-14 rounded bg-[#EEF0F3] animate-pulse" />
                    <div className="h-5 w-16 rounded bg-[#EEF0F3] animate-pulse" />
                    <div className="h-5 w-20 rounded bg-[#EEF0F3] animate-pulse" />
                    <div />
                  </div>
                ))}

              {/* empty */}
              {!loading && filtered.length === 0 && (
                <div className="py-16 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#EEF0F3] mb-3">
                    <Users className="w-5 h-5 text-[#8590A2]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#172B4D]">
                    {search ? "No users match your search" : "No users found"}
                  </h3>
                  <p className="mt-1 text-sm text-[#626F86]">
                    {search
                      ? "Try a different name, email or staff code"
                      : "Users linked to this company will show up here"}
                  </p>
                  {search && (
                    <div className="mt-5">
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={() => setSearchInput("")}
                      >
                        Clear search
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* rows */}
              {!loading &&
                pageUsers.map((user) => (
                  <div
                    key={user._id}
                    className={`${ROW_GRID} py-3 border-b border-[#EBECF0] hover:bg-[#F7F8F9] transition-colors`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={user.name} email={user.email} />
                      <span className="text-sm font-semibold text-[#172B4D] truncate">
                        {prettyName(user.name)}
                      </span>
                    </div>

                    <span className="text-sm text-[#44546F] truncate">
                      {user.email}
                    </span>

                    <span
                      className="text-[13px] text-[#0B6E76] font-medium"
                      style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      {user.staffCode || "-"}
                    </span>

                    <div className="min-w-0">
                      <Tag>{user.department || "-"}</Tag>
                    </div>

                    <span className="text-sm text-[#44546F] truncate">
                      {user.position || "-"}
                    </span>

                    <div className="flex justify-end">
                      {canReset(user) ? (
                        <Button
                          variant="secondary"
                          icon={KeyRound}
                          onClick={() => openReset(user)}
                        >
                          Reset password
                        </Button>
                      ) : (
                        <span className="text-[#C7CDD6] text-sm">-</span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* FOOTER / PAGINATION */}
          {!loading && filtered.length > 0 && (
            <div className="px-5 py-3 bg-white flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-[#626F86]">
                Showing{" "}
                <span className="font-semibold text-[#172B4D]">
                  {rangeStart}–{rangeEnd}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-[#172B4D]">
                  {filtered.length}
                </span>{" "}
                users
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="secondary"
                    icon={ChevronLeft}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                  >
                    Previous
                  </Button>

                  {pageNumbers[0] > 1 && (
                    <>
                      <button
                        onClick={() => setPage(1)}
                        className={`${pageBtn} text-[#44546F] hover:bg-[#EEF0F3]`}
                      >
                        1
                      </button>
                      {pageNumbers[0] > 2 && (
                        <span className="px-1 text-[#8590A2] text-sm">…</span>
                      )}
                    </>
                  )}

                  {pageNumbers.map((n) => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`${pageBtn} ${
                        safePage === n
                          ? "bg-[#0B6E76] text-white"
                          : "text-[#44546F] hover:bg-[#EEF0F3]"
                      }`}
                    >
                      {n}
                    </button>
                  ))}

                  {pageNumbers[pageNumbers.length - 1] < totalPages && (
                    <>
                      {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                        <span className="px-1 text-[#8590A2] text-sm">…</span>
                      )}
                      <button
                        onClick={() => setPage(totalPages)}
                        className={`${pageBtn} text-[#44546F] hover:bg-[#EEF0F3]`}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}

                  <Button
                    variant="secondary"
                    icon={ChevronRight}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ================= CONFIRM MODAL ================= */}
      {resetTarget && !tempPassword && (
        <div className="fixed inset-0 bg-[#091E42]/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md border border-[#DFE1E6]">
            <div className="border-b border-[#DFE1E6] px-6 py-4 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={resetTarget.name} email={resetTarget.email} />
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-[#172B4D] leading-tight">
                    Reset password
                  </h2>
                  <p className="text-sm text-[#626F86] truncate">
                    {prettyName(resetTarget.name)} · {resetTarget.email}
                  </p>
                </div>
              </div>
              <button
                onClick={closeReset}
                className="text-[#626F86] hover:text-[#172B4D] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-[#44546F] leading-relaxed">
                A temporary password will be created and emailed to the user.
                They will be asked to choose a new password the next time they
                log in.
              </p>

              <div>
                <label className="block text-sm font-semibold text-[#172B4D] mb-1.5">
                  Custom password{" "}
                  <span className="font-normal text-[#626F86]">(optional)</span>
                </label>
                <input
                  type="text"
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  placeholder="Leave empty to generate one"
                  className="w-full px-3 py-2 text-sm border border-[#C7CDD6] rounded-[4px] focus:ring-2 focus:ring-[#0B6E76]/30 focus:border-[#0B6E76] outline-none transition"
                />
                <p className="mt-1 text-xs text-[#626F86]">At least 8 characters.</p>
              </div>
            </div>

            <div className="border-t border-[#DFE1E6] px-6 py-4 flex gap-2 justify-end bg-[#F7F8F9] rounded-b-lg">
              <Button variant="ghost" size="md" onClick={closeReset} disabled={resetting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                icon={KeyRound}
                onClick={confirmReset}
                disabled={resetting}
              >
                {resetting ? "Resetting..." : "Reset password"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ================= RESULT MODAL (shown once) ================= */}
      {tempPassword && (
        <div className="fixed inset-0 bg-[#091E42]/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md border border-[#DFE1E6]">
            <div className="border-b border-[#DFE1E6] px-6 py-4 flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#DFF7E8]">
                <Check className="w-4 h-4 text-[#146C3E]" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-[#172B4D] leading-tight">
                  Password reset
                </h2>
                <p className="text-sm text-[#626F86]">
                  {prettyName(resetTarget?.name || "")}
                </p>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <p className="text-sm font-semibold text-[#172B4D]">
                Temporary password
              </p>

              <div className="flex items-center gap-2">
                <code
                  className="flex-1 px-3 py-2 text-sm bg-[#F4F5F7] border border-[#DFE1E6] rounded-[4px] break-all select-all text-[#172B4D]"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {tempPassword}
                </code>
                <Button
                  variant="secondary"
                  size="md"
                  icon={copied ? Check : Copy}
                  onClick={copyPassword}
                >
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>

              <div className="flex items-start gap-2.5 bg-[#FFF3D6] border border-[#F5DFA8] rounded-[4px] px-3.5 py-3">
                <AlertTriangle className="w-4 h-4 text-[#7A4B00] shrink-0 mt-0.5" />
                <p className="text-sm text-[#7A4B00] leading-relaxed">
                  This is shown only once and cannot be viewed again after you
                  close this window. The user has also been emailed and must
                  change it on next login.
                </p>
              </div>
            </div>

            <div className="border-t border-[#DFE1E6] px-6 py-4 flex justify-end bg-[#F7F8F9] rounded-b-lg">
              <Button variant="primary" size="md" onClick={closeResult}>
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}