import { useEffect, useState } from "react";
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

/* ================= PRIORITY THEME (mirrors AdminTickets) ================= */
const PRIORITY_THEME = {
  Low: "bg-blue-50 text-blue-700 border border-blue-200",
  Medium: "bg-amber-50 text-amber-700 border border-amber-200",
  High: "bg-orange-50 text-orange-700 border border-orange-200",
  Critical: "bg-red-50 text-red-700 border border-red-200",
};

const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const DEPARTMENTS = ["IT", "HR", "Finance", "Operations"];

const todayStr = () => new Date().toISOString().split("T")[0];

const INITIAL_FORM = {
  title: "",
  description: "",
  priority: "Medium",
  department: "IT",
  assetId: "",
  incidentDate: todayStr(),
};

export default function CreateManualTicket() {
  const [assets, setAssets] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

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

    loadAssets();
  }, []);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post("/tickets/manual", form);
      toast.success("Manual ticket created");
      setForm(INITIAL_FORM);
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
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                        active
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