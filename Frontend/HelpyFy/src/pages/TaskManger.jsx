// pages/TaskManagement.jsx
import { useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useAuth } from "../auth/AuthContext";

/* ================= CONSTANTS ================= */
const T = {
  text: "#172B4D",
  muted: "#626F86",
  border: "#DCDFE4",
  borderSoft: "#EBECF0",
  canvas: "#F7F8F9",
  brand: "#0C66E4",
  good: "#1F845A",
  bad: "#C9372C",
};

const SOURCES = ["IT", "Store", "New Purchase"];
const UOMS = ["Nos", "Pcs", "Set", "Box", "Roll", "Meter", "Kg", "Ltr"];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const RECURRENCES = ["None", "Daily", "Weekly", "Monthly", "Quarterly", "Yearly"];

// Attachments: pictures + Excel / CSV / PDF
const MAX_FILES = 5;
const MAX_FILE_MB = 10;
const ACCEPT_FILES = "image/*,.xlsx,.xls,.csv,.pdf";
const ALLOWED_EXT = /\.(png|jpe?g|gif|webp|bmp|xlsx|xls|csv|pdf)$/i;
const isImageName = (n = "") => /\.(png|jpe?g|gif|webp|bmp)$/i.test(n);
const fileExt = (n = "") => (n.split(".").pop() || "").toUpperCase();

const STATUS_STYLE = {
  Assigned: ["#DEEBFF", "#0747A6"],
  "In Progress": ["#FFF0B3", "#7F5F01"],
  Completed: ["#DCFFF1", "#216E4E"],
};

const ACCEPT_STYLE = {
  Pending: ["#FFF0B3", "#7F5F01"],
  Accepted: ["#DCFFF1", "#216E4E"],
  Rejected: ["#FFEDEB", "#AE2E24"],
};

// Uploaded files are served from the server root, not from /api
const FILE_BASE = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");

const inputCls =
  "h-9 w-full rounded-[3px] border bg-white text-sm px-2 outline-none focus:ring-2 focus:ring-[#4C9AFF] disabled:bg-[#F7F8F9] disabled:text-[#626F86]";
const textareaCls =
  "w-full rounded-[3px] border bg-white text-sm p-2 outline-none focus:ring-2 focus:ring-[#4C9AFF] disabled:bg-[#F7F8F9]";
const btnPrimary =
  "h-9 px-4 rounded-[3px] text-sm font-medium text-white disabled:opacity-50";
const btnGhost =
  "h-9 px-4 rounded-[3px] border text-sm font-medium bg-white hover:bg-[#F7F8F9] disabled:opacity-50";

const todayStr = () => new Date().toISOString().split("T")[0];
const fmt = (d) => (d ? new Date(d).toLocaleString() : "—");
const errMsg = (e) => e?.response?.data?.message || "Something went wrong";
// Company-wise task number, e.g. "AQC-TSK-2026-000001" (older tasks have none)
const taskLabel = (t) => t?.taskNumber || "";
// Value for <input type="datetime-local"> in the user's local time
const toLocalInput = (d) => {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 16);
};
// Older tasks have no acceptance field - treat them as accepted
const accOf = (t) => t?.acceptance?.status || "Accepted";
const isRepeating = (t) => !!t?.recurrence && t.recurrence.toLowerCase() !== "none";

/* ================= UPDATE PERIOD (follows the task's repeat type) ================= */
// Daily -> date | Weekly -> week | Monthly -> month | Quarterly -> quarter | Yearly -> year
const PERIOD = {
  None: { title: "Daily updation", col: "Date", field: "Date", pct: "% completed today" },
  Daily: { title: "Daily updation", col: "Date", field: "Date", pct: "% completed today" },
  Weekly: { title: "Weekly updation", col: "Week", field: "Week", pct: "% completed this week" },
  Monthly: { title: "Monthly updation", col: "Month", field: "Month", pct: "% completed this month" },
  Quarterly: { title: "Quarterly updation", col: "Quarter", field: "Quarter", pct: "% completed this quarter" },
  Yearly: { title: "Yearly updation", col: "Year", field: "Year", pct: "% completed this year" },
};

// "today" / "this week" ... used in the update-status badges
const UPDATE_WORD = {
  None: "today", Daily: "today", Weekly: "this week",
  Monthly: "this month", Quarterly: "this quarter", Yearly: "this year",
};

const pad2 = (n) => String(n).padStart(2, "0");

// "YYYY-Www" for the week that contains the given date (ISO week)
const isoWeekValue = (d = new Date()) => {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dow = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dow);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((t - yearStart) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${pad2(week)}`;
};

// "YYYY-Www" -> "YYYY-MM-DD" (Monday of that week)
const weekToMonday = (v) => {
  const [y, w] = v.split("-W").map(Number);
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const dow = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - dow + 1 + (w - 1) * 7);
  return monday.toISOString().split("T")[0];
};

const currentQuarterValue = () => {
  const n = new Date();
  return `${n.getFullYear()}-Q${Math.floor(n.getMonth() / 3) + 1}`;
};

// current quarter + the 7 before it, newest first
const quarterOptions = () => {
  const n = new Date();
  let y = n.getFullYear();
  let q = Math.floor(n.getMonth() / 3) + 1;
  const out = [];
  for (let i = 0; i < 8; i++) {
    out.push({ value: `${y}-Q${q}`, label: `Q${q} ${y}` });
    q--;
    if (q === 0) { q = 4; y--; }
  }
  return out;
};

// current year + the 4 before it
const yearOptions = () => {
  const y = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => String(y - i));
};

// Default value of the period input (the current period)
const defaultPeriodValue = (rec) => {
  const n = new Date();
  if (rec === "Weekly") return isoWeekValue(n);
  if (rec === "Monthly") return `${n.getFullYear()}-${pad2(n.getMonth() + 1)}`;
  if (rec === "Quarterly") return currentQuarterValue();
  if (rec === "Yearly") return String(n.getFullYear());
  return todayStr();
};

// Input value -> "YYYY-MM-DD" sent to the server (the server snaps it to the period start)
const toPeriodDate = (rec, v) => {
  if (rec === "Weekly") return weekToMonday(v);
  if (rec === "Monthly") return `${v}-01`;
  if (rec === "Quarterly") {
    const [y, q] = v.split("-Q");
    return `${y}-${pad2((Number(q) - 1) * 3 + 1)}-01`;
  }
  if (rec === "Yearly") return `${v}-01-01`;
  return v;
};

// Stored period start (UTC) -> readable label for the table
const fmtPeriod = (d, rec) => {
  const x = new Date(d);
  const utc = { timeZone: "UTC" };
  if (rec === "Weekly")
    return `Week of ${x.toLocaleDateString(undefined, { ...utc, day: "numeric", month: "short", year: "numeric" })}`;
  if (rec === "Monthly") return x.toLocaleDateString(undefined, { ...utc, month: "long", year: "numeric" });
  if (rec === "Quarterly") return `Q${Math.floor(x.getUTCMonth() / 3) + 1} ${x.getUTCFullYear()}`;
  if (rec === "Yearly") return String(x.getUTCFullYear());
  return x.toLocaleDateString(undefined, utc);
};

// Shows ONLY the input that matches the task's repeat type
const PeriodPicker = ({ rec, value, onChange }) => {
  const st = { borderColor: T.border };
  const set = (e) => onChange(e.target.value);

  if (rec === "Weekly")
    return <input type="week" className={inputCls} style={st} max={defaultPeriodValue("Weekly")} value={value} onChange={set} />;
  if (rec === "Monthly")
    return <input type="month" className={inputCls} style={st} max={defaultPeriodValue("Monthly")} value={value} onChange={set} />;
  if (rec === "Quarterly")
    return (
      <select className={inputCls} style={st} value={value} onChange={set}>
        {quarterOptions().map((q) => <option key={q.value} value={q.value}>{q.label}</option>)}
      </select>
    );
  if (rec === "Yearly")
    return (
      <select className={inputCls} style={st} value={value} onChange={set}>
        {yearOptions().map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
    );
  return <input type="date" className={inputCls} style={st} max={todayStr()} value={value} onChange={set} />;
};

/* ================= SMALL PIECES ================= */
const Badge = ({ label, colors }) => {
  const [bg, fg] = colors || ["#DFE1E6", "#42526E"];
  return (
    <span
      className="inline-flex items-center px-1.5 h-5 rounded-[3px] text-[11px] font-bold uppercase tracking-wide whitespace-nowrap"
      style={{ backgroundColor: bg, color: fg }}
    >
      {label}
    </span>
  );
};

const Field = ({ label, children, hint }) => (
  <label className="block">
    <span className="block text-xs font-semibold mb-1" style={{ color: T.muted }}>{label}</span>
    {children}
    {hint && <span className="block text-[11px] mt-1" style={{ color: T.muted }}>{hint}</span>}
  </label>
);

const Section = ({ title, children, aside }) => (
  <section className="border rounded-[3px] bg-white" style={{ borderColor: T.border }}>
    <header className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: T.borderSoft }}>
      <h3 className="text-sm font-semibold">{title}</h3>
      {aside}
    </header>
    <div className="p-4">{children}</div>
  </section>
);

const Modal = ({ title, onClose, children, wide }) => (
  <div className="fixed inset-0 z-50 bg-black/40 overflow-y-auto p-4" onMouseDown={onClose}>
    <div
      className={`mx-auto bg-[#F7F8F9] rounded-[3px] shadow-xl ${wide ? "max-w-4xl" : "max-w-xl"}`}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <header className="flex items-center justify-between px-5 py-3 border-b bg-white rounded-t-[3px]" style={{ borderColor: T.border }}>
        <h2 className="text-base font-semibold">{title}</h2>
        <button onClick={onClose} aria-label="Close" className="text-xl leading-none px-2" style={{ color: T.muted }}>×</button>
      </header>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  </div>
);

const ProgressBar = ({ value }) => (
  <div className="flex items-center gap-2 min-w-[110px]">
    <div className="h-1.5 flex-1 rounded-full overflow-hidden" style={{ backgroundColor: T.borderSoft }}>
      <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: value === 100 ? T.good : T.brand }} />
    </div>
    <span className="text-xs w-9 text-right" style={{ color: T.muted }}>{value}%</span>
  </div>
);

// Small red × button used on thumbnails / file chips
const RemoveBtn = ({ onClick, label }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    title={label}
    className="absolute -top-2 -right-2 h-5 w-5 rounded-full text-white text-xs leading-none flex items-center justify-center shadow focus:outline-none focus:ring-2 focus:ring-[#4C9AFF]"
    style={{ backgroundColor: T.bad }}
  >
    ×
  </button>
);

// Picture thumbnail with an optional remove (×) button
const PhotoThumb = ({ src, alt, size = "h-20 w-20", onRemove, removeLabel = "Remove photo", href }) => {
  const img = (
    <img src={src} alt={alt} className={`${size} object-cover rounded-[3px] border`} style={{ borderColor: T.border }} />
  );
  return (
    <div className="relative">
      {href ? <a href={href} target="_blank" rel="noreferrer">{img}</a> : img}
      {onRemove && <RemoveBtn onClick={onRemove} label={removeLabel} />}
    </div>
  );
};

// Chip for non-image files (Excel, CSV, PDF) with an optional remove (×) button
const FileChip = ({ name, href, onRemove, removeLabel = "Remove file" }) => {
  const body = (
    <div
      className="h-20 w-44 rounded-[3px] border bg-white flex items-center gap-2 px-2 hover:bg-[#F7F8F9]"
      style={{ borderColor: T.border }}
    >
      <span
        className="h-9 w-9 shrink-0 rounded-[3px] flex items-center justify-center text-[10px] font-bold"
        style={{ backgroundColor: "#DCFFF1", color: "#216E4E" }}
      >
        {fileExt(name)}
      </span>
      <span className="text-xs break-all line-clamp-3" title={name}>{name}</span>
    </div>
  );
  return (
    <div className="relative">
      {href ? <a href={href} target="_blank" rel="noreferrer">{body}</a> : body}
      {onRemove && <RemoveBtn onClick={onRemove} label={removeLabel} />}
    </div>
  );
};

/* ================= ATTACHMENTS (IT support saves anytime; super admin views) ================= */
function AttachmentsSection({ task, canUpload, isSuperAdmin, myId, busy, run }) {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  // Preview URLs only for images; freed when the list changes / modal closes
  useEffect(() => {
    const urls = files.map((f) => (f.type.startsWith("image/") ? URL.createObjectURL(f) : null));
    setPreviews(urls);
    return () => urls.forEach((u) => u && URL.revokeObjectURL(u));
  }, [files]);

  const saved = task.attachments || [];
  const fileKey = (f) => `${f.name}-${f.size}-${f.lastModified}`;

  const onPick = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = ""; // lets the same file be picked again after removing it

    setFiles((current) => {
      const next = [...current];
      for (const f of picked) {
        if (!ALLOWED_EXT.test(f.name)) { toast.error(`${f.name}: file type not allowed`); continue; }
        if (f.size > MAX_FILE_MB * 1024 * 1024) { toast.error(`${f.name}: max ${MAX_FILE_MB} MB`); continue; }
        if (next.some((x) => fileKey(x) === fileKey(f))) continue;
        if (next.length >= MAX_FILES) { toast.error(`Max ${MAX_FILES} files at a time`); break; }
        next.push(f);
      }
      return next;
    });
  };

  const removePicked = (index) => setFiles((c) => c.filter((_, i) => i !== index));

  const upload = () => {
    if (!files.length) return toast.error("Select at least one file");
    const fd = new FormData();
    files.forEach((f) => fd.append("files", f)); // field name "files" (matches the backend route)
    return run(async () => {
      await api.post(`/tasks/${task._id}/files`, fd);
      setFiles([]);
    }, "Files saved");
  };

  const canDelete = (a) =>
    isSuperAdmin || (canUpload && String(a.uploadedBy?._id || a.uploadedBy) === myId);

  const del = (a) => {
    if (!window.confirm("Delete this file permanently?")) return;
    return run(() => api.delete(`/tasks/${task._id}/files`, { data: { path: a.path } }), "File deleted");
  };

  return (
    <Section title={`Attachments${saved.length ? ` (${saved.length})` : ""}`}>
      {canUpload && (
        <div className="mb-4 space-y-3">
          <Field
            label="Add files"
            hint={`Pictures, Excel, CSV or PDF. Up to ${MAX_FILES} files per upload, ${MAX_FILE_MB} MB each.`}
          >
            <input type="file" accept={ACCEPT_FILES} multiple onChange={onPick} disabled={busy} className="block text-sm disabled:opacity-50" />
          </Field>

          {files.length > 0 && (
            <>
              <div className="flex flex-wrap gap-3">
                {files.map((f, i) =>
                  previews[i] ? (
                    <PhotoThumb key={fileKey(f)} src={previews[i]} alt={f.name}
                      onRemove={() => removePicked(i)} removeLabel={`Remove ${f.name}`} />
                  ) : (
                    <FileChip key={fileKey(f)} name={f.name}
                      onRemove={() => removePicked(i)} removeLabel={`Remove ${f.name}`} />
                  )
                )}
              </div>
              <div className="flex gap-2">
                <button type="button" className={btnPrimary} style={{ backgroundColor: T.brand }} onClick={upload} disabled={busy}>
                  Save {files.length} file{files.length > 1 ? "s" : ""}
                </button>
                <button type="button" className={btnGhost} style={{ borderColor: T.border }} onClick={() => setFiles([])} disabled={busy}>
                  Clear
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {saved.length === 0 ? (
        <p className="text-sm text-center py-3" style={{ color: T.muted }}>No files saved</p>
      ) : (
        <div className="flex flex-wrap gap-4">
          {saved.map((a) => {
            const name = a.originalName || decodeURIComponent(a.path.split("/").pop() || "");
            const url = `${FILE_BASE}${a.path}`;
            const remove = canDelete(a) && !busy ? () => del(a) : undefined;
            return (
              <div key={a.path} className="space-y-1">
                {isImageName(name) ? (
                  <PhotoThumb src={url} href={url} alt={name} size="h-24 w-24" onRemove={remove} removeLabel="Delete file" />
                ) : (
                  <FileChip name={name} href={url} onRemove={remove} removeLabel="Delete file" />
                )}
                <p className="text-[11px]" style={{ color: T.muted }}>
                  {a.uploadedBy?.name || "—"} · {fmt(a.uploadedAt)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}

/* ================= CREATE TASK (super_admin) ================= */
function CreateTaskModal({ onClose, onCreated }) {
  const [companies, setCompanies] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    companyId: "",
    assignedTo: "",
    priority: "Medium",
    deadline: "",
    recurrence: "None",
  });

  useEffect(() => {
    api.get("/companies").then((r) => setCompanies(r.data.companies || [])).catch(() => {});
    api.get("/tasks/assignees").then((r) => setAssignees(r.data || [])).catch(() => toast.error("Failed to load IT support users"));
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error("Title is required");
    if (!form.companyId) return toast.error("Select a company");
    if (!form.assignedTo) return toast.error("Select who to assign the task to");
    if (!form.deadline) return toast.error("Set a deadline");

    setSaving(true);
    try {
      await api.post("/tasks", { ...form, deadline: new Date(form.deadline).toISOString() });
      toast.success("Task assigned");
      onCreated();
      onClose();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Assign new task" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Title *">
          <input className={inputCls} style={{ borderColor: T.border }} value={form.title} onChange={set("title")} maxLength={200} />
        </Field>
        <Field label="Description">
          <textarea className={textareaCls} style={{ borderColor: T.border }} rows={3} value={form.description} onChange={set("description")} maxLength={2000} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Company *">
            <select className={inputCls} style={{ borderColor: T.border }} value={form.companyId} onChange={set("companyId")}>
              <option value="">Select company</option>
              {companies.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Assigned to *">
            <select className={inputCls} style={{ borderColor: T.border }} value={form.assignedTo} onChange={set("assignedTo")}>
              <option value="">Select IT support</option>
              {assignees.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select className={inputCls} style={{ borderColor: T.border }} value={form.priority} onChange={set("priority")}>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Deadline *">
            <input type="datetime-local" className={inputCls} style={{ borderColor: T.border }} value={form.deadline} onChange={set("deadline")} />
          </Field>
          <Field
            label="Continuous (repeat)"
            hint="A new task is assigned automatically every day / week / month etc., even if the previous one is still open"
          >
            <select className={inputCls} style={{ borderColor: T.border }} value={form.recurrence} onChange={set("recurrence")}>
              {RECURRENCES.map((r) => (
                <option key={r} value={r}>{r === "None" ? "One-time" : r}</option>
              ))}
            </select>
          </Field>
        </div>

        <p className="text-xs" style={{ color: T.muted }}>Assigned time is recorded automatically when you save.</p>

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className={btnGhost} style={{ borderColor: T.border }} onClick={onClose}>Cancel</button>
          <button type="submit" className={btnPrimary} style={{ backgroundColor: T.brand }} disabled={saving}>
            {saving ? "Saving..." : "Assign task"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ================= TASK DETAIL ================= */
function TaskDetail({ id, user, onClose, onChanged }) {
  const [task, setTask] = useState(null);
  const [materials, setMaterials] = useState([]);
  // value "" = current period (the picker shows the default for the task's repeat type)
  const [daily, setDaily] = useState({ value: "", percentToday: "", note: "" });
  const [closing, setClosing] = useState({ delayJustification: "", note: "" });
  const [files, setFiles] = useState([]); // files chosen at closing time
  const [previews, setPreviews] = useState([]); // object URLs for images, null for other files
  const [busy, setBusy] = useState(false);

  // Preview URLs only for images; freed when the list changes / modal closes
  useEffect(() => {
    const urls = files.map((f) => (f.type.startsWith("image/") ? URL.createObjectURL(f) : null));
    setPreviews(urls);
    return () => urls.forEach((u) => u && URL.revokeObjectURL(u));
  }, [files]);

  const load = useCallback(async () => {
    const { data } = await api.get(`/tasks/${id}`);
    setTask(data);
    setMaterials(
      (data.materials || []).map((m) => ({
        serialNo: m.serialNo || "",
        item: m.item,
        qty: m.qty,
        uom: m.uom || "Nos", // older rows saved before UOM existed
        collectedFrom: m.collectedFrom,
        consumedAt: toLocalInput(m.consumedAt || m.date || new Date()), // older rows only had `date`
      }))
    );
  }, [id]);

  useEffect(() => {
    load().catch((e) => { toast.error(errMsg(e)); onClose(); });
  }, [load, onClose]);

  if (!task) return <Modal title="Loading..." onClose={onClose} wide><p className="text-sm">Loading task...</p></Modal>;

  const myId = String(user?.id || user?._id);
  const acc = accOf(task);
  const isAssignee = String(task.assignedTo?._id) === myId;
  const isSuperAdmin = user?.role === "super_admin";
  const isOwner = isAssignee || isSuperAdmin;
  const closed = task.status === "Completed";
  const editable = isOwner && !closed && acc === "Accepted";
  const isLate = !closed && new Date() > new Date(task.deadline);

  // Update period follows the repeat type: Daily -> day, Weekly -> week, Monthly -> month ...
  const rec = isRepeating(task) ? task.recurrence : "None";
  const P = PERIOD[rec] || PERIOD.None;
  const periodValue = daily.value || defaultPeriodValue(rec);

  const run = async (fn, okMsg) => {
    setBusy(true);
    try {
      await fn();
      toast.success(okMsg);
      await load();
      onChanged();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  /* ----- accept / reject ----- */
  const respond = (decision) => {
    let reason = "";
    if (decision === "Rejected") {
      reason = (window.prompt("Reason for rejecting this task?") || "").trim();
      if (!reason) return toast.error("A reason is required to reject");
    }
    return run(
      () => api.post(`/tasks/${id}/respond`, { decision, reason }),
      decision === "Accepted" ? "Task accepted" : "Task rejected"
    );
  };

  /* ----- stop repeating (super admin) ----- */
  const stopRepeat = () => {
    if (!window.confirm("Stop repeating this task? No new tasks will be created automatically.")) return;
    return run(() => api.post(`/tasks/${id}/stop-repeat`), "Repeat stopped");
  };

  /* ----- materials ----- */
  const setRow = (i, k, v) => setMaterials((rows) => rows.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));
  const addRow = () =>
    setMaterials((rows) => [
      ...rows,
      { serialNo: "", item: "", qty: 1, uom: "Nos", collectedFrom: "IT", consumedAt: toLocalInput(new Date()) },
    ]);
  const removeRow = (i) => setMaterials((rows) => rows.filter((_, idx) => idx !== i));
  const saveMaterials = () => {
    if (materials.some((m) => m.item.trim() && !m.serialNo.trim()))
      return toast.error("Serial number is required for every row");
    if (materials.some((m) => m.item.trim() && !m.consumedAt))
      return toast.error("Consumed date & time is required for every row");
    return run(
      () =>
        api.put(`/tasks/${id}/materials`, {
          materials: materials.map((m) => ({ ...m, consumedAt: new Date(m.consumedAt).toISOString() })),
        }),
      "Materials saved"
    );
  };

  /* ----- daily update ----- */
  const addDaily = () => {
    if (daily.percentToday === "") return toast.error(`Enter the ${P.pct.toLowerCase()}`);
    return run(async () => {
      await api.post(`/tasks/${id}/daily`, {
        date: toPeriodDate(rec, periodValue),
        percentToday: daily.percentToday,
        note: daily.note,
      });
      setDaily({ value: "", percentToday: "", note: "" });
    }, `${P.title.replace(" updation", "")} update saved`);
  };

  /* ----- close ----- */
  const closeTask = () => {
    if (isLate && !closing.delayJustification.trim()) {
      return toast.error("Deadline has passed - add a delay justification");
    }
    if (!window.confirm("Close this task? This cannot be undone.")) return;

    const fd = new FormData();
    fd.append("delayJustification", closing.delayJustification);
    fd.append("note", closing.note);
    files.forEach((f) => fd.append("photos", f)); // field name stays "photos" (matches the backend)
    return run(
      async () => {
        // Repeat tasks are created automatically by the server scheduler, not here
        await api.post(`/tasks/${id}/close`, fd);
        setFiles([]);
      },
      "Task closed"
    );
  };

  /* ----- attachments chosen at closing time ----- */
  // Adds to the current selection (does not replace it); skips duplicates, wrong types and oversize files
  const onPickFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = ""; // lets the same file be picked again after removing it

    setFiles((current) => {
      const next = [...current];
      let tooBig = 0;
      let overLimit = false;

      for (const f of picked) {
        if (!ALLOWED_EXT.test(f.name)) { toast.error(`${f.name}: file type not allowed`); continue; }
        if (f.size > MAX_FILE_MB * 1024 * 1024) { tooBig++; continue; }
        if (next.some((x) => x.name === f.name && x.size === f.size && x.lastModified === f.lastModified)) continue;
        if (next.length >= MAX_FILES) { overLimit = true; continue; }
        next.push(f);
      }

      if (tooBig) toast.error(`${tooBig} file(s) skipped - max ${MAX_FILE_MB} MB each`);
      if (overLimit) toast.error(`Max ${MAX_FILES} files`);
      return next;
    });
  };

  const removeFile = (index) => setFiles((current) => current.filter((_, i) => i !== index));
  const clearFiles = () => setFiles([]);

  /* ----- files already saved on a closed task (Super Admin only) ----- */
  const deleteSavedFile = (path) => {
    if (!window.confirm("Delete this file permanently?")) return;
    return run(
      () => api.delete(`/tasks/${id}/photos`, { data: { path } }),
      "File deleted"
    );
  };

  return (
    <Modal title={taskLabel(task) ? `${taskLabel(task)} - ${task.title}` : task.title} onClose={onClose} wide>
      {/* ASSIGNMENT */}
      <Section title="Assignment" aside={<Badge label={task.status} colors={STATUS_STYLE[task.status]} />}>
        {task.description && <p className="text-sm mb-3 whitespace-pre-wrap">{task.description}</p>}
        <dl className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
          <div><dt className="text-xs font-semibold" style={{ color: T.muted }}>Assigned to</dt><dd>{task.assignedTo?.name || "—"}</dd></div>
          <div><dt className="text-xs font-semibold" style={{ color: T.muted }}>Assigned time</dt><dd>{fmt(task.assignedAt)}</dd></div>
          <div>
            <dt className="text-xs font-semibold" style={{ color: T.muted }}>Deadline</dt>
            <dd style={{ color: isLate ? T.bad : T.text }}>{fmt(task.deadline)}{isLate && " (overdue)"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold" style={{ color: T.muted }}>Repeat</dt>
            <dd>
              {isRepeating(task) ? task.recurrence : "One-time"}
              {isRepeating(task) && task.nextRunAt && (
                <span className="block text-[11px]" style={{ color: T.muted }}>Next: {fmt(task.nextRunAt)}</span>
              )}
              {isSuperAdmin && isRepeating(task) && task.nextRunAt && (
                <button
                  type="button"
                  onClick={stopRepeat}
                  disabled={busy}
                  className="block text-[11px] hover:underline disabled:opacity-50"
                  style={{ color: T.bad }}
                >
                  Stop repeating
                </button>
              )}
            </dd>
          </div>
          <div><dt className="text-xs font-semibold" style={{ color: T.muted }}>Progress</dt><dd><ProgressBar value={task.progress} /></dd></div>
        </dl>
      </Section>

      {/* ACCEPTANCE */}
      <Section title="Acceptance" aside={<Badge label={acc} colors={ACCEPT_STYLE[acc]} />}>
        {acc === "Pending" && isAssignee && !closed ? (
          <div className="flex flex-wrap items-center gap-2">
            <button className={btnPrimary} style={{ backgroundColor: T.good }} disabled={busy} onClick={() => respond("Accepted")}>
              Accept
            </button>
            <button className={btnGhost} style={{ borderColor: T.border, color: T.bad }} disabled={busy} onClick={() => respond("Rejected")}>
              Reject
            </button>
            <span className="text-xs" style={{ color: T.muted }}>Accept before adding materials, files or updates.</span>
          </div>
        ) : (
          <p className="text-sm">
            {acc === "Pending"
              ? "Waiting for the assignee to accept."
              : `${acc} on ${fmt(task.acceptance?.respondedAt)}`}
            {task.acceptance?.reason && <span style={{ color: T.muted }}> - {task.acceptance.reason}</span>}
          </p>
        )}
      </Section>

      {/* MATERIAL CONSUMED */}
      <Section
        title="Material consumed"
        aside={editable && (
          <div className="flex gap-2">
            <button className={btnGhost + " !h-8 !px-3"} style={{ borderColor: T.border }} onClick={addRow} disabled={busy}>+ Add row</button>
            <button className={btnPrimary + " !h-8 !px-3"} style={{ backgroundColor: T.brand }} onClick={saveMaterials} disabled={busy}>Save</button>
          </div>
        )}
      >
        {materials.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: T.muted }}>No material recorded</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[800px]">
              <thead>
                <tr className="border-b" style={{ borderColor: T.border }}>
                  {["SN", "Item", "Serial No", "Qty", "UOM", "Collected from", "Consumed time", ""].map((h) => (
                    <th key={h} className="py-2 px-1 text-xs font-semibold" style={{ color: T.muted }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {materials.map((m, i) => (
                  <tr key={i} className="border-b last:border-0" style={{ borderColor: T.borderSoft }}>
                    <td className="py-2 px-1 w-10">{i + 1}</td>
                    <td className="py-2 px-1">
                      <input className={inputCls} style={{ borderColor: T.border }} value={m.item} disabled={!editable}
                        onChange={(e) => setRow(i, "item", e.target.value)} />
                    </td>
                    <td className="py-2 px-1 w-28">
                      <input className={inputCls} style={{ borderColor: T.border }} value={m.serialNo} disabled={!editable}
                        onChange={(e) => setRow(i, "serialNo", e.target.value)} />
                    </td>
                    <td className="py-2 px-1 w-20">
                      <input type="number" min={1} className={inputCls} style={{ borderColor: T.border }} value={m.qty} disabled={!editable}
                        onChange={(e) => setRow(i, "qty", e.target.value)} />
                    </td>
                    <td className="py-2 px-1 w-24">
                      <select className={inputCls} style={{ borderColor: T.border }} value={m.uom} disabled={!editable}
                        onChange={(e) => setRow(i, "uom", e.target.value)}>
                        {UOMS.map((u) => <option key={u}>{u}</option>)}
                      </select>
                    </td>
                    <td className="py-2 px-1 w-32">
                      <select className={inputCls} style={{ borderColor: T.border }} value={m.collectedFrom} disabled={!editable}
                        onChange={(e) => setRow(i, "collectedFrom", e.target.value)}>
                        {SOURCES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="py-2 px-1 w-48">
                      <input type="datetime-local" className={inputCls} style={{ borderColor: T.border }} value={m.consumedAt} disabled={!editable}
                        onChange={(e) => setRow(i, "consumedAt", e.target.value)} />
                    </td>
                    <td className="py-2 px-1 w-8">
                      {editable && <button onClick={() => removeRow(i)} aria-label="Remove row" className="text-lg" style={{ color: T.bad }}>×</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* DAILY UPDATION */}
      <Section title={P.title}>
        {editable && (
          <div className="grid grid-cols-1 sm:grid-cols-[190px_190px_1fr_auto] gap-3 items-end mb-4">
            <Field label={P.field}>
              <PeriodPicker rec={rec} value={periodValue}
                onChange={(v) => setDaily((d) => ({ ...d, value: v }))} />
            </Field>
            <Field label={P.pct}>
              <input type="number" min={0} max={100} className={inputCls} style={{ borderColor: T.border }}
                value={daily.percentToday} onChange={(e) => setDaily((d) => ({ ...d, percentToday: e.target.value }))} />
            </Field>
            <Field label="Note">
              <input className={inputCls} style={{ borderColor: T.border }} maxLength={1000}
                value={daily.note} onChange={(e) => setDaily((d) => ({ ...d, note: e.target.value }))} />
            </Field>
            <button className={btnPrimary} style={{ backgroundColor: T.brand }} onClick={addDaily} disabled={busy}>Add update</button>
          </div>
        )}

        {task.dailyUpdates?.length ? (
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b" style={{ borderColor: T.border }}>
                {[P.col, "% done", "Note", "By"].map((h) => (
                  <th key={h} className="py-2 px-1 text-xs font-semibold" style={{ color: T.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...task.dailyUpdates]
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((u) => (
                  <tr key={u._id} className="border-b last:border-0" style={{ borderColor: T.borderSoft }}>
                    <td className="py-2 px-1">{fmtPeriod(u.date, rec)}</td>
                    <td className="py-2 px-1 font-medium">{u.percentToday}%</td>
                    <td className="py-2 px-1">{u.note || "—"}</td>
                    <td className="py-2 px-1" style={{ color: T.muted }}>{u.updatedBy?.name || "—"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-center py-3" style={{ color: T.muted }}>No daily updates yet</p>
        )}
      </Section>

      {/* ATTACHMENTS */}
      <AttachmentsSection
        task={task}
        canUpload={editable}
        isSuperAdmin={isSuperAdmin}
        myId={myId}
        busy={busy}
        run={run}
      />

      {/* CLOSING DETAILS */}
      <Section title="Closing details">
        {closed ? (
          <div className="space-y-3 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                label={task.closing?.completedOnTime ? "Completed on time" : "Completed late"}
                colors={task.closing?.completedOnTime ? STATUS_STYLE.Completed : ["#FFEDEB", "#AE2E24"]}
              />
              <span style={{ color: T.muted }}>Closed {fmt(task.closing?.completedAt)}</span>
            </div>
            {!task.closing?.completedOnTime && (
              <div>
                <p className="text-xs font-semibold" style={{ color: T.muted }}>Delay justification</p>
                <p className="whitespace-pre-wrap">{task.closing?.delayJustification}</p>
              </div>
            )}
            {task.closing?.note && (
              <div>
                <p className="text-xs font-semibold" style={{ color: T.muted }}>Note</p>
                <p className="whitespace-pre-wrap">{task.closing.note}</p>
              </div>
            )}
            {task.closing?.photos?.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-1.5" style={{ color: T.muted }}>Closing attachments</p>
                <div className="flex flex-wrap gap-3">
                  {task.closing.photos.map((p) => {
                    const name = decodeURIComponent(p.split("/").pop() || "");
                    const url = `${FILE_BASE}${p}`;
                    const remove = isSuperAdmin && !busy ? () => deleteSavedFile(p) : undefined;
                    return isImageName(name) ? (
                      <PhotoThumb key={p} src={url} href={url} alt="Attachment" size="h-24 w-24"
                        onRemove={remove} removeLabel="Delete file" />
                    ) : (
                      <FileChip key={p} name={name} href={url} onRemove={remove} removeLabel="Delete file" />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : editable ? (
          <div className="space-y-4">
            <p className="text-sm">
              Completed on time:{" "}
              <b style={{ color: isLate ? T.bad : T.good }}>{isLate ? "No - deadline passed" : "Yes"}</b>
              <span className="text-xs ml-2" style={{ color: T.muted }}>(decided automatically when you close)</span>
            </p>

            {isLate && (
              <Field label="Delay justification *">
                <textarea className={textareaCls} style={{ borderColor: T.border }} rows={3} maxLength={2000}
                  value={closing.delayJustification}
                  onChange={(e) => setClosing((c) => ({ ...c, delayJustification: e.target.value }))} />
              </Field>
            )}

            <Field
              label="Closing attachments (optional)"
              hint={`Pictures, Excel (.xlsx / .xls), CSV or PDF. Up to ${MAX_FILES} files, ${MAX_FILE_MB} MB each. You can add more or remove any before closing. Files saved in the Attachments section above are kept as well.`}
            >
              <input
                type="file"
                accept={ACCEPT_FILES}
                multiple
                onChange={onPickFiles}
                disabled={files.length >= MAX_FILES}
                className="block text-sm disabled:opacity-50"
              />
            </Field>

            {files.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs" style={{ color: T.muted }}>{files.length} of {MAX_FILES} selected</p>
                  <button type="button" onClick={clearFiles} className="text-xs hover:underline" style={{ color: T.bad }}>
                    Remove all
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {files.map((f, i) => {
                    const key = `${f.name}-${f.size}-${f.lastModified}`;
                    return previews[i] ? (
                      <PhotoThumb key={key} src={previews[i]} alt={f.name}
                        onRemove={() => removeFile(i)} removeLabel={`Remove ${f.name}`} />
                    ) : (
                      <FileChip key={key} name={f.name}
                        onRemove={() => removeFile(i)} removeLabel={`Remove ${f.name}`} />
                    );
                  })}
                </div>
              </div>
            )}

            <Field label="Note">
              <textarea className={textareaCls} style={{ borderColor: T.border }} rows={3} maxLength={2000}
                value={closing.note} onChange={(e) => setClosing((c) => ({ ...c, note: e.target.value }))} />
            </Field>

            <div className="flex justify-end">
              <button className={btnPrimary} style={{ backgroundColor: T.good }} onClick={closeTask} disabled={busy}>
                Close task
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm" style={{ color: T.muted }}>
            {acc !== "Accepted"
              ? "Accept the task before closing it."
              : "Only the assigned IT support user can close this task."}
          </p>
        )}
      </Section>
    </Modal>
  );
}

/* ================= PAGE ================= */
export default function TaskManagement() {
  const { user } = useAuth();
  const isSuper = user?.role === "super_admin";

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [updStatus, setUpdStatus] = useState(null); // super admin: who has updated this period

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/tasks", { params: statusFilter ? { status: statusFilter } : {} });
      setTasks(data);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }

    // Has each open task been updated for the current period (today / week / month ...)?
    if (isSuper) {
      try {
        const { data } = await api.get("/tasks/update-status");
        setUpdStatus(data);
      } catch (e) {
        console.error("UPDATE STATUS ERROR:", e?.response?.status, e?.response?.data || e);
        toast.error(`Update status failed (${e?.response?.status || "no response"}): ${errMsg(e)}`, { id: "upd-status" });
        setUpdStatus(null);
      }
    }
  }, [statusFilter, isSuper]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const closeDetail = useCallback(() => setOpenId(null), []);

  const COLS = [
    "Task No", "Task", "Assigned to", "Assigned time", "Deadline", "Action", "Files", "Progress",
    ...(isSuper ? ["Update"] : []),
    "Status",
  ];
  const updMap = Object.fromEntries((updStatus?.items || []).map((i) => [i._id, i]));

  return (
    <div className="min-h-screen" style={{ backgroundColor: T.canvas, color: T.text }}>
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-6">
        <nav className="text-xs mb-2" style={{ color: T.muted }}>Service desk <span className="mx-1">/</span> Tasks</nav>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-medium">{isSuper ? "IT support tasks" : "My tasks"}</h1>
            <p className="text-sm mt-1" style={{ color: T.muted }}>
              {isSuper ? "Assign work and track progress" : "Tasks assigned to you"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select aria-label="Status" className={inputCls + " !w-40"} style={{ borderColor: T.border }}
              value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              <option>Assigned</option>
              <option>In Progress</option>
              <option>Completed</option>
            </select>
            {isSuper && (
              <button className={btnPrimary} style={{ backgroundColor: T.brand }} onClick={() => setShowCreate(true)}>
                + Assign task
              </button>
            )}
          </div>
        </div>

        {isSuper && updStatus && updStatus.total > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 bg-white border rounded-[3px] px-4 py-2.5 text-sm"
            style={{ borderColor: T.border }}>
            <span className="font-semibold">Updates</span>
            <span><b style={{ color: T.good }}>{updStatus.updated}</b> updated</span>
            <span><b style={{ color: updStatus.pending ? T.bad : T.good }}>{updStatus.pending}</b> not updated yet</span>
            <span className="text-xs" style={{ color: T.muted }}>
              Daily tasks = today · Weekly = this week · Monthly = this month
            </span>
          </div>
        )}

        <div className="bg-white border rounded-[3px] overflow-x-auto" style={{ borderColor: T.border }}>
          <table className="w-full text-sm text-left min-w-[1250px]">
            <thead>
              <tr className="border-b" style={{ borderColor: T.border }}>
                {COLS.map((h) => (
                  <th key={h} className="py-3 px-4 text-xs font-semibold" style={{ color: T.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={COLS.length} className="py-10 text-center" style={{ color: T.muted }}>Loading...</td></tr>
              ) : tasks.length === 0 ? (
                <tr><td colSpan={COLS.length} className="py-10 text-center" style={{ color: T.muted }}>No tasks found</td></tr>
              ) : (
                tasks.map((t) => {
                  const overdue = t.status !== "Completed" && new Date(t.deadline) < new Date();
                  const acc = accOf(t);
                  const repeats = isRepeating(t);
                  const fileCount = (t.attachments?.length || 0) + (t.closing?.photos?.length || 0);
                  return (
                    <tr key={t._id} onClick={() => setOpenId(t._id)}
                      className="border-b last:border-0 cursor-pointer hover:bg-[#F7F8F9]" style={{ borderColor: T.borderSoft }}>
                      <td className="py-3 px-4 font-semibold whitespace-nowrap" style={{ color: T.brand }}>{taskLabel(t) || "—"}</td>
                      <td className="py-3 px-4 font-medium">
                        {t.title}
                        {repeats && (
                          <span className="block text-[11px] font-normal" style={{ color: T.muted }}>↻ {t.recurrence}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">{t.assignedTo?.name || "—"}</td>
                      <td className="py-3 px-4">{fmt(t.assignedAt)}</td>
                      <td className="py-3 px-4" style={{ color: overdue ? T.bad : T.text }}>
                        {fmt(t.deadline)}{overdue && <span className="ml-1 text-xs font-semibold">OVERDUE</span>}
                      </td>
                      <td className="py-3 px-4">
                        <Badge label={acc} colors={ACCEPT_STYLE[acc]} />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap" style={{ color: fileCount ? T.text : T.muted }}>
                        {fileCount ? `📎 ${fileCount}` : "—"}
                      </td>
                      <td className="py-3 px-4"><ProgressBar value={t.progress} /></td>
                      {isSuper && (
                        <td className="py-3 px-4 whitespace-nowrap">
                          {(() => {
                            const u = updMap[t._id];
                            if (!u) return <span style={{ color: T.muted }}>—</span>;
                            const word = UPDATE_WORD[u.recurrence] || "today";
                            return u.updatedThisPeriod ? (
                              <Badge label={`Done ${word} · ${u.percentThisPeriod}%`} colors={["#DCFFF1", "#216E4E"]} />
                            ) : (
                              <Badge label={`Not updated ${word}`} colors={["#FFEDEB", "#AE2E24"]} />
                            );
                          })()}
                        </td>
                      )}
                      <td className="py-3 px-4"><Badge label={t.status} colors={STATUS_STYLE[t.status]} /></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && <CreateTaskModal onClose={() => setShowCreate(false)} onCreated={fetchTasks} />}
      {openId && <TaskDetail id={openId} user={user} onClose={closeDetail} onChanged={fetchTasks} />}
    </div>
  );
}