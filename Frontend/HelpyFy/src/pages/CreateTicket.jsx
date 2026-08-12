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

const PRIORITY_BADGE_STYLE = {
  Critical: "bg-red-600 text-white",
  High: "bg-orange-500 text-white",
  Medium: "bg-yellow-500 text-white",
  Low: "bg-green-600 text-white",
};

const FormField = ({ label, name, error, required, children, hint, className = "" }) => (
  <div className={`space-y-1.5 ${className}`}>
    <label htmlFor={name} className="block text-xs font-semibold text-gray-900">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {children}
    {hint && !error && <p className="text-[11px] text-gray-500">{hint}</p>}
    {error && (
      <p className="text-[11px] text-red-600 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {error}
      </p>
    )}
  </div>
);

// Compact selector pill — replaces the old large description cards
const LevelPill = ({ option, selected, onClick, accent }) => (
  <button
    type="button"
    onClick={onClick}
    title={option.desc}
    className={`text-left px-2.5 py-2 rounded-md border transition ${
      selected
        ? `${accent} border-current`
        : "bg-white border-gray-200 hover:border-gray-300"
    }`}
  >
    <p className={`text-xs font-semibold leading-tight ${selected ? "" : "text-gray-900"}`}>
      {option.label}
    </p>
    <p className={`text-[10px] mt-0.5 leading-tight ${selected ? "opacity-90" : "text-gray-500"}`}>
      {option.desc}
    </p>
  </button>
);

const inputCls = (hasError) =>
  `w-full px-3 py-2 text-sm border rounded-md font-medium placeholder-gray-400 transition focus:outline-none focus:ring-2 ${
    hasError
      ? "border-red-300 focus:ring-red-200 bg-red-50"
      : "border-gray-200 focus:ring-blue-200 focus:border-blue-400"
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
        return form.priority === level ? "bg-red-600 text-white" : "bg-red-50 text-red-700 border-red-200";
      case "High":
        return form.priority === level ? "bg-orange-600 text-white" : "bg-orange-50 text-orange-700 border-orange-200";
      case "Medium":
        return form.priority === level ? "bg-yellow-600 text-white" : "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "Low":
        return form.priority === level ? "bg-green-600 text-white" : "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  const isReady = form.title && form.description && form.department && form.relatedTo && form.priority;

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <Zap className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">Create Support Ticket</h1>
            <p className="text-xs text-gray-600">Submit a detailed request to get faster resolution</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden max-w-7xl w-full mx-auto px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
          {/* MAIN FORM */}
          <form onSubmit={handleSubmit} className="lg:col-span-2 flex flex-col h-full min-h-0">
            <div className="space-y-3 overflow-y-auto pr-1 flex-1 min-h-0">
              {/* TITLE + DEPARTMENT ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <p className="text-[11px] text-blue-600 flex items-center gap-1">
                    <Zap className="w-3 h-3 shrink-0" />
                    Suggested from "{relatedSuggested.matched}"
                  </p>
                )}
              </FormField>

              {/* PRIORITY */}
              <div className="space-y-2.5 p-3 rounded-lg border border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-900">Priority</p>
                  <button
                    type="button"
                    onClick={() => setOverridePriority((v) => !v)}
                    className="flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700"
                  >
                    <Sliders className="w-3 h-3" />
                    {overridePriority ? "Use auto-calculation" : "Set manually"}
                  </button>
                </div>

                {autoSuggested && !manualImpactUrgency && !overridePriority && (
                  <p className="text-[11px] text-blue-600 flex items-center gap-1">
                    <Zap className="w-3 h-3 shrink-0" />
                    Suggested from "{autoSuggested.matched}"
                  </p>
                )}

                {!overridePriority ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Impact" name="impact" error={errors.impact} required>
                        <div className="grid grid-cols-1 gap-1.5">
                          {IMPACT_LEVELS.map((opt) => (
                            <LevelPill
                              key={opt.value}
                              option={opt}
                              selected={form.impact === opt.value}
                              onClick={() => setImpact(opt.value)}
                              accent="bg-blue-50 text-blue-800 border-blue-300"
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
                              accent="bg-purple-50 text-purple-800 border-purple-300"
                            />
                          ))}
                        </div>
                      </FormField>
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="text-[11px] font-medium text-gray-500">Calculated priority:</span>
                      {form.priority ? (
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${PRIORITY_BADGE_STYLE[form.priority]}`}>
                          {form.priority}
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-400">Select impact & urgency</span>
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
                          className={`px-3 py-2 rounded-md border-2 font-semibold text-xs transition ${getPriorityBg(level)} ${
                            form.priority === level ? "border-current" : "border-gray-200 hover:border-gray-300"
                          }`}
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
                  className={`border-2 border-dashed rounded-lg px-4 py-3 flex items-center justify-between gap-3 transition ${
                    dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 hover:border-gray-400"
                  }`}
                >
                  <input type="file" multiple id="fileUpload" className="hidden" onChange={handleFileChange} />
                  <label htmlFor="fileUpload" className="cursor-pointer flex items-center gap-2 min-w-0">
                    <div className="p-1.5 bg-blue-100 rounded-md shrink-0">
                      <Upload className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-xs text-gray-700">
                      <span className="text-blue-600 font-medium hover:underline">Click to browse</span> or drag files here
                    </span>
                  </label>
                  <span className="text-[10px] text-gray-500 shrink-0">PDF, PNG, JPG, ZIP · 10 MB max</span>
                </div>

                {files.length > 0 && (
                  <div className="space-y-1 mt-1.5 max-h-24 overflow-y-auto">
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FileText className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <p className="text-xs font-medium text-gray-900 truncate">{file.name}</p>
                          <p className="text-[10px] text-gray-500 shrink-0">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="p-0.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition flex-shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </FormField>
            </div>

            {/* SUBMIT BUTTON — pinned to bottom, always visible */}
            <div className="pt-3 flex-shrink-0">
              <button
                type="submit"
                disabled={loading}
                className={`w-full px-6 py-2.5 rounded-lg font-semibold text-sm text-white transition flex items-center justify-center gap-2 ${
                  loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-95"
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
            <div className="h-full bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
              <div className="px-4 py-2.5 bg-blue-50 border-b border-gray-200 flex-shrink-0">
                <h3 className="text-sm font-semibold text-gray-900">Preview</h3>
                <p className="text-[11px] text-gray-600">How your ticket will appear</p>
              </div>

              <div className="p-4 space-y-3 overflow-y-auto flex-1 min-h-0">
                <div>
                  <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-1">Title</p>
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                    {form.title || "(No title yet)"}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-1">Description</p>
                  <p className="text-xs text-gray-700 line-clamp-3 leading-relaxed">
                    {form.description || "(No description yet)"}
                  </p>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-gray-200">
                  {!overridePriority && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-0.5">Impact</p>
                        <p className="text-xs font-medium text-gray-900">{form.impact || "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-0.5">Urgency</p>
                        <p className="text-xs font-medium text-gray-900">{form.urgency || "—"}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-1">Priority</p>
                    {form.priority ? (
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${PRIORITY_BADGE_STYLE[form.priority]}`}>
                        {form.priority}
                      </span>
                    ) : (
                      <span className="text-[11px] text-gray-400">Not yet determined</span>
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-0.5">Department</p>
                    <p className="text-xs font-medium text-gray-900">{form.department || "(Not selected)"}</p>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-0.5">Related To</p>
                    <p className="text-xs font-medium text-gray-900">{form.relatedTo || "(Not selected)"}</p>
                  </div>

                  {files.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wide mb-1">Attachments</p>
                      <div className="space-y-0.5">
                        {files.map((file, index) => (
                          <div key={index} className="flex items-center gap-1.5 text-xs text-gray-600">
                            <FileText className="w-3 h-3 shrink-0" />
                            <span className="truncate">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-4 py-2.5 border-t border-gray-200 text-center flex-shrink-0">
                {isReady ? (
                  <p className="text-xs text-green-600 font-medium flex items-center justify-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Ready to submit
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">Fill in required fields</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}