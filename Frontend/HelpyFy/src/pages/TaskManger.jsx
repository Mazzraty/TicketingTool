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

// Attachments on closing: pictures + Excel / CSV / PDF
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
          <Field label="Continuous (repeat)" hint="A new task is created automatically when this one is closed">
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
  const [daily, setDaily] = useState({ date: todayStr(), percentToday: "", note: "" });
  const [closing, setClosing] = useState({ delayJustification: "", note: "" });
  const [files, setFiles] = useState([]);
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
    if (daily.percentToday === "") return toast.error("Enter the % completed today");
    return run(async () => {
      await api.post(`/tasks/${id}/daily`, daily);
      setDaily({ date: todayStr(), percentToday: "", note: "" });
    }, "Daily update saved");
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
        const { data } = await api.post(`/tasks/${id}/close`, fd);
        if (data?.nextTask) {
          toast.success(`Next ${data.nextTask.recurrence} task created: ${data.nextTask.taskNumber || ""}`);
        }
        setFiles([]);
      },
      "Task closed"
    );
  };

  /* ----- attachments (before closing) ----- */
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

  /* ----- attachments (already saved on a closed task, Super Admin only) ----- */
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
            <dd>{task.recurrence && task.recurrence.toLowerCase() !== "none" ? task.recurrence : "One-time"}</dd>
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
            <span className="text-xs" style={{ color: T.muted }}>Accept before adding materials or updates.</span>
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
      <Section title="Daily updation">
        {editable && (
          <div className="grid grid-cols-1 sm:grid-cols-[160px_160px_1fr_auto] gap-3 items-end mb-4">
            <Field label="Date">
              <input type="date" className={inputCls} style={{ borderColor: T.border }} max={todayStr()}
                value={daily.date} onChange={(e) => setDaily((d) => ({ ...d, date: e.target.value }))} />
            </Field>
            <Field label="% completed today">
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
                {["Date", "% today", "Note", "By"].map((h) => (
                  <th key={h} className="py-2 px-1 text-xs font-semibold" style={{ color: T.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...task.dailyUpdates]
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((u) => (
                  <tr key={u._id} className="border-b last:border-0" style={{ borderColor: T.borderSoft }}>
                    <td className="py-2 px-1">{new Date(u.date).toLocaleDateString(undefined, { timeZone: "UTC" })}</td>
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
                <p className="text-xs font-semibold mb-1.5" style={{ color: T.muted }}>Attachments</p>
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
              label="Attachments (optional)"
              hint={`Pictures, Excel (.xlsx / .xls), CSV or PDF. Up to ${MAX_FILES} files, ${MAX_FILE_MB} MB each. You can add more or remove any before closing.`}
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
  }, [statusFilter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const closeDetail = useCallback(() => setOpenId(null), []);

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

        <div className="bg-white border rounded-[3px] overflow-x-auto" style={{ borderColor: T.border }}>
          <table className="w-full text-sm text-left min-w-[1040px]">
            <thead>
              <tr className="border-b" style={{ borderColor: T.border }}>
                {["Task No", "Task", "Assigned to", "Assigned time", "Deadline", "Action", "Progress", "Status"].map((h) => (
                  <th key={h} className="py-3 px-4 text-xs font-semibold" style={{ color: T.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="py-10 text-center" style={{ color: T.muted }}>Loading...</td></tr>
              ) : tasks.length === 0 ? (
                <tr><td colSpan={8} className="py-10 text-center" style={{ color: T.muted }}>No tasks found</td></tr>
              ) : (
                tasks.map((t) => {
                  const overdue = t.status !== "Completed" && new Date(t.deadline) < new Date();
                  const acc = accOf(t);
                  const repeats = t.recurrence && t.recurrence.toLowerCase() !== "none";
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
                      <td className="py-3 px-4"><ProgressBar value={t.progress} /></td>
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