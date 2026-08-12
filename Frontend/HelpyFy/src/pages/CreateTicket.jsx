import { useState, useEffect } from "react";
import api from "../api/axios.js";
import toast from "react-hot-toast";
import {
  AlertCircle,
  FileText,
  Upload,
  Zap,
  ArrowRight,
  X,
  CheckCircle,
  Sliders,
} from "lucide-react";

const DEPARTMENTS = [
   "SR. MANAGEMENT",
  "COW FARM",
  "AGRICULTURE FARM",
  "FINANCE",
  "SALES AND MARKETING",
  "PRODUCTION",
  "FACILITY MAINTENANCE",
  "OTHER FACILITIES",
  "PROCUREMENT",
  "WAREHOUSE AND LOGISTICS",
  "QUALITY",
  "HR & ADMIN",
  "REAL ESTATE",
  "SUPPORT SERVICE",
  "IT DEPARTMENT",
  "FERTILIZER FACTORY",
  "DEMAND PLANNING",
  "GOAT FARM",
  "FARMING",
  "FINANCE AND ADMIN",
  "OPERATIONS",
];

const RELATED_OPTIONS = [
  "Laptop/Desktop",
  "ERP",
  "Email",
  "HHT",
  "HHT Printer",
  "Syncwise",
  "Printer",
  "Network",
  "Software",
  "Hardware",
  "Others",
];

const IMPACT_LEVELS = [
  { value: "Low", label: "Just me", desc: "Only I'm affected" },
  { value: "Medium", label: "A team / dept", desc: "A group is affected" },
  { value: "High", label: "Whole company", desc: "Core system / entire org" },
];

const URGENCY_LEVELS = [
  { value: "Low", label: "Can wait", desc: "No deadline" },
  { value: "Medium", label: "Needed soon", desc: "Workaround exists" },
  { value: "High", label: "Blocking now", desc: "Work has stopped" },
];

// Rows = Impact, Columns = Urgency
const PRIORITY_MATRIX = {
  High: { High: "Critical", Medium: "High", Low: "Medium" },
  Medium: { High: "High", Medium: "Medium", Low: "Low" },
  Low: { High: "Medium", Medium: "Low", Low: "Low" },
};

const computePriority = (impact, urgency) => {
  if (!impact || !urgency) return null;
  return PRIORITY_MATRIX[impact]?.[urgency] || null;
};

/* ======================================================
   ⚡ AUTO-SUGGEST IMPACT & URGENCY FROM TEXT
   Checked most-severe first — first keyword match wins.
====================================================== */
const KEYWORD_RULES = [
  {
    impact: "High",
    urgency: "High",
    keywords: [
      "server down", "server is down", "network down", "system down",
      "production down", "production line down", "erp down", "database down",
      "meeting link", "video call not working", "cannot join meeting",
      "can't join meeting", "zoom not working", "teams not working",
      "outage", "data loss", "security breach", "virus", "ransomware",
      "hacked", "all systems down", "website down",
    ],
  },
  {
    impact: "Medium",
    urgency: "High",
    keywords: [
      "email not working", "email down", "vpn not working", "wifi not working",
      "wi-fi not working", "internet not working", "internet down",
      "application crash", "app crash", "payment failed", "login not working",
      "cannot login", "can't login", "account locked", "password locked",
      "software crash", "attendance not working",
    ],
  },
  {
    impact: "Medium",
    urgency: "Medium",
    keywords: [
      "printer", "printer not working", "printer problem", "scanner",
      "slow computer", "slow laptop", "software installation", "install software",
      "software update", "email slow", "wifi slow", "screen flickering",
      "projector", "phone not working",
    ],
  },
  {
    impact: "Low",
    urgency: "Low",
    keywords: [
      "mouse", "keyboard", "monitor stand", "stationery", "general query",
      "how to", "request access", "new user setup", "toner", "cartridge",
      "cable request",
    ],
  },
];

const detectImpactUrgency = (text) => {
  const lower = text.toLowerCase();
  for (const rule of KEYWORD_RULES) {
    const match = rule.keywords.find((kw) => lower.includes(kw));
    if (match) return { impact: rule.impact, urgency: rule.urgency, matched: match };
  }
  return null;
};

/* ======================================================
   ⚡ AUTO-SUGGEST "RELATED TO" FROM TEXT
====================================================== */
const RELATED_KEYWORD_RULES = [
  { value: "HHT Printer", keywords: ["hht printer", "handheld printer", "mobile printer", "portable printer"] },
  { value: "HHT", keywords: ["hht", "handheld device", "handheld terminal", "scanner gun", "barcode scanner", "barcode device"] },
  { value: "ERP", keywords: ["erp", "sap", "tally", "oracle erp", "accounting software", "erp module", "erp login"] },
  { value: "Syncwise", keywords: ["syncwise"] },
  { value: "Email", keywords: ["email", "e-mail", "outlook", "gmail", "mailbox", "mail server", "mail not working"] },
  { value: "Printer", keywords: ["printer", "printout", "print job", "toner", "cartridge", "scanner", "print not working"] },
  { value: "Network", keywords: ["network", "wifi", "wi-fi", "internet", "vpn", "lan", "ethernet", "router", "connectivity"] },
  { value: "Laptop/Desktop", keywords: ["laptop", "desktop", "computer", "cpu not", "monitor", "screen flickering", "pc not"] },
  { value: "Software", keywords: ["software", "application", "app crash", "install", "software update", "license", "activation"] },
  { value: "Hardware", keywords: ["hardware", "mouse", "keyboard", "cable request", "device", "battery", "charger"] },
];

const detectRelatedTo = (text) => {
  const lower = text.toLowerCase();
  for (const rule of RELATED_KEYWORD_RULES) {
    const match = rule.keywords.find((kw) => lower.includes(kw));
    if (match) return { value: rule.value, matched: match };
  }
  return null;
};

// Bold gradient chips for the priority badge
const PRIORITY_BADGE_STYLE = {
  Critical: "bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-sm shadow-rose-200",
  High: "bg-gradient-to-r from-orange-400 to-amber-500 text-white shadow-sm shadow-orange-200",
  Medium: "bg-gradient-to-r from-amber-300 to-yellow-400 text-amber-950 shadow-sm shadow-amber-100",
  Low: "bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-sm shadow-emerald-200",
};

const FormField = ({ label, name, error, required, children, hint, className = "" }) => (
  <div className={`space-y-1.5 ${className}`}>
    <label htmlFor={name} className="block text-xs font-bold text-slate-800 tracking-wide">
      {label}
      {required && <span className="text-fuchsia-500 ml-0.5">*</span>}
    </label>
    {children}
    {hint && !error && <p className="text-[11px] text-slate-400">{hint}</p>}
    {error && (
      <p className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {error}
      </p>
    )}
  </div>
);

// Compact selector pill, colored per axis
const LevelPill = ({ option, selected, onClick, palette }) => (
  <button
    type="button"
    onClick={onClick}
    title={option.desc}
    className={`text-left px-3 py-2 rounded-xl border-2 transition-all ${
      selected
        ? `${palette.bg} ${palette.border} shadow-md ${palette.shadow}`
        : "bg-white border-slate-100 hover:border-slate-200"
    }`}
  >
    <p className={`text-xs font-bold leading-tight ${selected ? palette.text : "text-slate-800"}`}>
      {option.label}
    </p>
    <p className={`text-[10px] mt-0.5 leading-tight ${selected ? `${palette.text} opacity-80` : "text-slate-400"}`}>
      {option.desc}
    </p>
  </button>
);

const IMPACT_PALETTE = {
  bg: "bg-gradient-to-br from-indigo-500 to-violet-600",
  border: "border-transparent",
  text: "text-white",
  shadow: "shadow-indigo-200",
};

const URGENCY_PALETTE = {
  bg: "bg-gradient-to-br from-fuchsia-500 to-pink-600",
  border: "border-transparent",
  text: "text-white",
  shadow: "shadow-fuchsia-200",
};

const inputCls = (hasError) =>
  `w-full px-3.5 py-2.5 text-sm border-2 rounded-xl font-medium placeholder-slate-400 bg-white transition focus:outline-none ${
    hasError
      ? "border-rose-300 focus:border-rose-400 bg-rose-50"
      : "border-slate-100 focus:border-indigo-400"
  }`;

export default function CreateTicket() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    department: "",
    relatedTo: "",
    impact: "",
    urgency: "",
    priority: "",
  });

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState({});

  const [autoSuggested, setAutoSuggested] = useState(null);
  const [manualImpactUrgency, setManualImpactUrgency] = useState(false);
  const [overridePriority, setOverridePriority] = useState(false);

  const [relatedSuggested, setRelatedSuggested] = useState(null);
  const [manualRelatedTo, setManualRelatedTo] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (errors[name]) {
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  useEffect(() => {
    const combined = `${form.title} ${form.description}`.trim();

    if (!combined) {
      setAutoSuggested(null);
      return;
    }

    const result = detectImpactUrgency(combined);
    setAutoSuggested(result);

    if (result && !manualImpactUrgency) {
      setForm((prev) =>
        prev.impact === result.impact && prev.urgency === result.urgency
          ? prev
          : { ...prev, impact: result.impact, urgency: result.urgency }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.title, form.description]);

  useEffect(() => {
    const combined = `${form.title} ${form.description}`.trim();

    if (!combined) {
      setRelatedSuggested(null);
      return;
    }

    const result = detectRelatedTo(combined);
    setRelatedSuggested(result);

    if (result && !manualRelatedTo) {
      setForm((prev) =>
        prev.relatedTo === result.value ? prev : { ...prev, relatedTo: result.value }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.title, form.description]);

  useEffect(() => {
    if (overridePriority) return;
    const computed = computePriority(form.impact, form.urgency);
    if (computed && computed !== form.priority) {
      setForm((prev) => ({ ...prev, priority: computed }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.impact, form.urgency, overridePriority]);

  const setImpact = (value) => {
    setManualImpactUrgency(true);
    setForm((prev) => ({ ...prev, impact: value }));
  };

  const setUrgency = (value) => {
    setManualImpactUrgency(true);
    setForm((prev) => ({ ...prev, urgency: value }));
  };

  const setPriorityManually = (level) => {
    setForm((prev) => ({ ...prev, priority: level }));
  };

  const handleRelatedToChange = (e) => {
    setManualRelatedTo(true);
    handleChange(e);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = [...e.dataTransfer.files];
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleFileChange = (e) => {
    const selectedFiles = [...e.target.files];
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.title.trim()) {
      newErrors.title = "Ticket title is required";
    } else if (form.title.length < 5) {
      newErrors.title = "Title must be at least 5 characters";
    }

    if (!form.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!form.department.trim()) {
      newErrors.department = "Department is required";
    }

    if (!form.relatedTo.trim()) {
      newErrors.relatedTo = "Please select what this ticket relates to";
    }

    if (!overridePriority) {
      if (!form.impact) newErrors.impact = "Select impact";
      if (!form.urgency) newErrors.urgency = "Select urgency";
    } else if (!form.priority) {
      newErrors.priority = "Select a priority level";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors above");
      return;
    }

    try {
      setLoading(true);

      const data = new FormData();
      data.append("title", form.title);
      data.append("description", form.description);
      data.append("department", form.department);
      data.append("relatedTo", form.relatedTo);
      data.append("priority", form.priority);
      data.append("impact", form.impact);
      data.append("urgency", form.urgency);

      files.forEach((f) => data.append("files", f));

      const res = await api.post("/tickets", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        toast.success(res.data.message || "Ticket created successfully!");

        if (res.data.emailStatus === "failed") {
          toast.error("Ticket created but email notification failed");
        }

        setForm({
          title: "",
          description: "",
          department: "",
          relatedTo: "",
          impact: "",
          urgency: "",
          priority: "",
        });

        setFiles([]);
        setErrors({});
        setAutoSuggested(null);
        setManualImpactUrgency(false);
        setOverridePriority(false);
        setRelatedSuggested(null);
        setManualRelatedTo(false);
      } else {
        toast.error("Ticket creation failed");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBg = (level) => {
    switch (level) {
      case "Critical":
        return form.priority === level
          ? "bg-gradient-to-r from-rose-500 to-red-600 text-white border-transparent shadow-md shadow-rose-200"
          : "bg-rose-50 text-rose-700 border-rose-100";
      case "High":
        return form.priority === level
          ? "bg-gradient-to-r from-orange-400 to-amber-500 text-white border-transparent shadow-md shadow-orange-200"
          : "bg-orange-50 text-orange-700 border-orange-100";
      case "Medium":
        return form.priority === level
          ? "bg-gradient-to-r from-amber-300 to-yellow-400 text-amber-950 border-transparent shadow-md shadow-amber-100"
          : "bg-yellow-50 text-yellow-700 border-yellow-100";
      case "Low":
        return form.priority === level
          ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-white border-transparent shadow-md shadow-emerald-200"
          : "bg-emerald-50 text-emerald-700 border-emerald-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  const isReady = form.title && form.description && form.department && form.relatedTo && form.priority;

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      {/* HEADER — bold gradient band */}
      <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center gap-3">
          <div className="p-2 bg-white/15 backdrop-blur rounded-xl ring-1 ring-white/20">
            <Zap className="w-4 h-4 text-white" fill="currentColor" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-white leading-tight tracking-tight">
              Create Support Ticket
            </h1>
            <p className="text-xs text-indigo-100">Submit a detailed request to get faster resolution</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden max-w-7xl w-full mx-auto px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* MAIN FORM */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 flex flex-col h-full min-h-0">
            <div className="space-y-3.5 overflow-y-auto pr-1 flex-1 min-h-0">
              {/* TITLE + DEPARTMENT ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <FormField label="Ticket Title" name="title" error={errors.title} required>
                  <input
                    id="title"
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    maxLength="100"
                    placeholder="e.g., Email access not working"
                    className={inputCls(errors.title)}
                  />
                </FormField>

                <FormField label="Department" name="department" error={errors.department} required>
                  <select
                    id="department"
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    className={inputCls(errors.department)}
                  >
                    <option value="">Select a department...</option>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </FormField>
              </div>

              {/* DESCRIPTION */}
              <FormField label="Description" name="description" error={errors.description} required>
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  maxLength="1000"
                  rows={3}
                  placeholder="Describe what happened, when it started, and what you've already tried..."
                  className={`${inputCls(errors.description)} resize-none`}
                />
              </FormField>

              {/* RELATED TO */}
              <FormField label="Related To" name="relatedTo" error={errors.relatedTo} required>
                <select
                  id="relatedTo"
                  name="relatedTo"
                  value={form.relatedTo}
                  onChange={handleRelatedToChange}
                  required
                  className={inputCls(errors.relatedTo)}
                >
                  <option value="" disabled>Select what this relates to...</option>
                  {RELATED_OPTIONS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                {relatedSuggested && !manualRelatedTo && (
                  <p className="text-[11px] text-fuchsia-600 font-semibold flex items-center gap-1">
                    <Zap className="w-3 h-3 shrink-0" />
                    Suggested from "{relatedSuggested.matched}"
                  </p>
                )}
              </FormField>

              {/* PRIORITY */}
              <div className="space-y-2.5 p-3.5 rounded-2xl border-2 border-slate-100 bg-white shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-800">Priority</p>
                  <button
                    type="button"
                    onClick={() => setOverridePriority((v) => !v)}
                    className="flex items-center gap-1 text-[11px] font-bold text-fuchsia-600 hover:text-fuchsia-700"
                  >
                    <Sliders className="w-3 h-3" />
                    {overridePriority ? "Use auto-calculation" : "Set manually"}
                  </button>
                </div>

                {autoSuggested && !manualImpactUrgency && !overridePriority && (
                  <p className="text-[11px] text-fuchsia-600 font-semibold flex items-center gap-1">
                    <Zap className="w-3 h-3 shrink-0" />
                    Suggested from "{autoSuggested.matched}"
                  </p>
                )}

                {!overridePriority ? (
                  <>
                    <div className="grid grid-cols-2 gap-3.5">
                      <FormField label="Impact" name="impact" error={errors.impact} required>
                        <div className="grid grid-cols-1 gap-1.5">
                          {IMPACT_LEVELS.map((opt) => (
                            <LevelPill
                              key={opt.value}
                              option={opt}
                              selected={form.impact === opt.value}
                              onClick={() => setImpact(opt.value)}
                              palette={IMPACT_PALETTE}
                            />
                          ))}
                        </div>
                      </FormField>

                      <FormField label="Urgency" name="urgency" error={errors.urgency} required>
                        <div className="grid grid-cols-1 gap-1.5">
                          {URGENCY_LEVELS.map((opt) => (
                            <LevelPill
                              key={opt.value}
                              option={opt}
                              selected={form.urgency === opt.value}
                              onClick={() => setUrgency(opt.value)}
                              palette={URGENCY_PALETTE}
                            />
                          ))}
                        </div>
                      </FormField>
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="text-[11px] font-bold text-slate-400">Calculated priority:</span>
                      {form.priority ? (
                        <span className={`px-3 py-0.5 rounded-full text-[11px] font-bold ${PRIORITY_BADGE_STYLE[form.priority]}`}>
                          {form.priority}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-300">Select impact & urgency</span>
                      )}
                    </div>
                  </>
                ) : (
                  <FormField label="Priority Level" name="priority" error={errors.priority} required>
                    <div className="grid grid-cols-4 gap-2">
                      {["Low", "Medium", "High", "Critical"].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setPriorityManually(level)}
                          className={`px-3 py-2 rounded-xl border-2 font-bold text-xs transition ${getPriorityBg(level)}`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </FormField>
                )}
              </div>

              {/* FILE UPLOAD */}
              <FormField label="Attachments" hint="Screenshots or documents help us understand the issue">
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl px-4 py-3 flex items-center justify-between gap-3 transition ${
                    dragActive
                      ? "border-fuchsia-400 bg-fuchsia-50"
                      : "border-slate-200 bg-slate-50 hover:border-indigo-300"
                  }`}
                >
                  <input type="file" multiple id="fileUpload" className="hidden" onChange={handleFileChange} />
                  <label htmlFor="fileUpload" className="cursor-pointer flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-fuchsia-500 rounded-lg shrink-0">
                      <Upload className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs text-slate-600">
                      <span className="text-fuchsia-600 font-bold hover:underline">Click to browse</span> or drag files here
                    </span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium shrink-0">PDF, PNG, JPG, ZIP · 10 MB max</span>
                </div>

                {files.length > 0 && (
                  <div className="space-y-1 mt-1.5 max-h-24 overflow-y-auto">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 border-2 border-slate-100 rounded-lg"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FileText className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                          <p className="text-xs font-semibold text-slate-800 truncate">{file.name}</p>
                          <p className="text-[10px] text-slate-400 shrink-0">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="p-0.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition flex-shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </FormField>
            </div>

            {/* SUBMIT BUTTON — pinned, bold gradient */}
            <div className="pt-3.5 flex-shrink-0">
              <button
                type="submit"
                disabled={loading}
                className={`w-full px-6 py-3 rounded-2xl font-bold text-sm text-white transition flex items-center justify-center gap-2 ${
                  loading
                    ? "bg-slate-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 hover:brightness-110 active:scale-[0.98] shadow-lg shadow-violet-200"
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Ticket
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* LIVE PREVIEW SIDEBAR */}
          <div className="lg:col-span-1 min-h-0">
            <div className="h-full bg-white rounded-2xl border-2 border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="px-4 py-3 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 flex-shrink-0">
                <h3 className="text-sm font-extrabold text-white">Preview</h3>
                <p className="text-[11px] text-indigo-100">How your ticket will appear</p>
              </div>

              <div className="p-4 space-y-3 overflow-y-auto flex-1 min-h-0">
                <div>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide mb-1">Title</p>
                  <p className="text-sm font-bold text-slate-900 line-clamp-2">
                    {form.title || "(No title yet)"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide mb-1">Description</p>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {form.description || "(No description yet)"}
                  </p>
                </div>

                <div className="space-y-2.5 pt-3 border-t-2 border-slate-50">
                  {!overridePriority && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide mb-0.5">Impact</p>
                        <p className="text-xs font-bold text-slate-800">{form.impact || "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide mb-0.5">Urgency</p>
                        <p className="text-xs font-bold text-slate-800">{form.urgency || "—"}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide mb-1">Priority</p>
                    {form.priority ? (
                      <span className={`inline-block px-3 py-0.5 rounded-full text-[11px] font-bold ${PRIORITY_BADGE_STYLE[form.priority]}`}>
                        {form.priority}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-300">Not yet determined</span>
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide mb-0.5">Department</p>
                    <p className="text-xs font-bold text-slate-800">{form.department || "(Not selected)"}</p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide mb-0.5">Related To</p>
                    <p className="text-xs font-bold text-slate-800">{form.relatedTo || "(Not selected)"}</p>
                  </div>

                  {files.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide mb-1">Attachments</p>
                      <div className="space-y-0.5">
                        {files.map((file, index) => (
                          <div key={index} className="flex items-center gap-1.5 text-xs text-slate-600">
                            <FileText className="w-3 h-3 shrink-0 text-indigo-400" />
                            <span className="truncate">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-4 py-3 border-t-2 border-slate-50 text-center flex-shrink-0">
                {isReady ? (
                  <p className="text-xs text-white font-bold flex items-center justify-center gap-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full py-1.5 px-3">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Ready to submit
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 font-medium">Fill in required fields</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}