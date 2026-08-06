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

/* ======================================================
   ⚡ IMPACT × URGENCY → PRIORITY  (ServiceNow / Jira style)

   Instead of picking "Critical" directly, the requester (or
   the auto-detector below) answers two simpler questions:

   IMPACT  = how many people/systems are affected?
   URGENCY = how time-sensitive is it?

   The matrix below turns that combination into one of your
   four existing priority levels (Low/Medium/High/Critical).
====================================================== */
const IMPACT_LEVELS = [
  {
    value: "Low",
    label: "Just me",
    desc: "Only I'm affected, everyone else is fine",
  },
  {
    value: "Medium",
    label: "A team / department",
    desc: "A group of people or one department is affected",
  },
  {
    value: "High",
    label: "Whole company / critical system",
    desc: "Multiple departments, a core system, or the entire org is affected",
  },
];

const URGENCY_LEVELS = [
  {
    value: "Low",
    label: "Can wait",
    desc: "No deadline — routine work continues fine",
  },
  {
    value: "Medium",
    label: "Needed soon",
    desc: "Causing inconvenience, but there's a workaround for now",
  },
  {
    value: "High",
    label: "Blocking right now",
    desc: "Work has stopped completely — time-critical",
  },
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
   This just pre-fills the two dropdowns above; the requester
   (or IT) can always change them before the priority is set.
====================================================== */
const KEYWORD_RULES = [
  {
    impact: "High",
    urgency: "High",
    keywords: [
      "server down",
      "server is down",
      "network down",
      "system down",
      "production down",
      "production line down",
      "erp down",
      "database down",
      "meeting link",
      "video call not working",
      "cannot join meeting",
      "can't join meeting",
      "zoom not working",
      "teams not working",
      "outage",
      "data loss",
      "security breach",
      "virus",
      "ransomware",
      "hacked",
      "all systems down",
      "website down",
    ],
  },
  {
    impact: "Medium",
    urgency: "High",
    keywords: [
      "email not working",
      "email down",
      "vpn not working",
      "wifi not working",
      "wi-fi not working",
      "internet not working",
      "internet down",
      "application crash",
      "app crash",
      "payment failed",
      "login not working",
      "cannot login",
      "can't login",
      "account locked",
      "password locked",
      "software crash",
      "attendance not working",
    ],
  },
  {
    impact: "Medium",
    urgency: "Medium",
    keywords: [
      "printer",
      "printer not working",
      "printer problem",
      "scanner",
      "slow computer",
      "slow laptop",
      "software installation",
      "install software",
      "software update",
      "email slow",
      "wifi slow",
      "screen flickering",
      "projector",
      "phone not working",
    ],
  },
  {
    impact: "Low",
    urgency: "Low",
    keywords: [
      "mouse",
      "keyboard",
      "monitor stand",
      "stationery",
      "general query",
      "how to",
      "request access",
      "new user setup",
      "toner",
      "cartridge",
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

const PRIORITY_BADGE_STYLE = {
  Critical: "bg-red-600 text-white",
  High: "bg-orange-500 text-white",
  Medium: "bg-yellow-500 text-white",
  Low: "bg-green-600 text-white",
};

const FormField = ({ label, name, error, required, children, hint }) => (
  <div className="space-y-2">
    <label htmlFor={name} className="block text-sm font-semibold text-gray-900">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
    {hint && !error && (
      <p className="text-xs text-gray-500">{hint}</p>
    )}
    {error && (
      <p className="text-xs text-red-600 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {error}
      </p>
    )}
  </div>
);

// A single Impact/Urgency option card
const LevelCard = ({ option, selected, onClick, accent }) => (
  <button
    type="button"
    onClick={onClick}
    className={`text-left px-4 py-3 rounded-lg border-2 transition ${
      selected
        ? `${accent} border-current shadow-sm`
        : "bg-white border-gray-200 hover:border-gray-300"
    }`}
  >
    <p className={`text-sm font-semibold ${selected ? "" : "text-gray-900"}`}>
      {option.label}
    </p>
    <p className={`text-xs mt-0.5 ${selected ? "opacity-90" : "text-gray-500"}`}>
      {option.desc}
    </p>
  </button>
);

export default function CreateTicket() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    department: "",
    impact: "",
    urgency: "",
    priority: "",
  });

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState({});

  // ⚡ Auto-suggestion state
  const [autoSuggested, setAutoSuggested] = useState(null); // { impact, urgency, matched } | null
  const [manualImpactUrgency, setManualImpactUrgency] = useState(false); // true once user picks impact/urgency themselves
  const [overridePriority, setOverridePriority] = useState(false); // true when user wants to bypass the matrix entirely

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

  // Re-scan title + description on every keystroke, pre-fill Impact/Urgency
  // unless the requester has already chosen them manually.
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

  // Recompute priority from the matrix whenever Impact/Urgency change,
  // unless the requester has switched on manual override.
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
    } else if (form.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    if (!form.department.trim()) {
      newErrors.department = "Department is required";
    }

    if (!overridePriority) {
      if (!form.impact) newErrors.impact = "Select how many people/systems are affected";
      if (!form.urgency) newErrors.urgency = "Select how time-sensitive this is";
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
      data.append("priority", form.priority);
      // Impact/Urgency are sent too in case the backend is later extended
      // to store them — harmless extra fields otherwise.
      data.append("impact", form.impact);
      data.append("urgency", form.urgency);

      files.forEach((f) => data.append("files", f));

      const res = await api.post("/tickets", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
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
          impact: "",
          urgency: "",
          priority: "",
        });

        setFiles([]);
        setErrors({});
        setAutoSuggested(null);
        setManualImpactUrgency(false);
        setOverridePriority(false);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Create Support Ticket
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Submit a detailed request to get faster resolution
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* MAIN FORM */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* TITLE FIELD */}
              <FormField
                label="Ticket Title"
                name="title"
                error={errors.title}
                required
                hint="Be concise and descriptive (5-100 characters)"
              >
                <input
                  id="title"
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  maxLength="100"
                  placeholder="e.g., Email access not working"
                  className={`w-full px-4 py-3 border rounded-lg font-medium placeholder-gray-400 transition focus:outline-none focus:ring-2 ${errors.title
                    ? "border-red-300 focus:ring-red-200 bg-red-50"
                    : "border-gray-200 focus:ring-blue-200 focus:border-blue-400"
                    }`}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span></span>
                  <span>{form.title.length}/100</span>
                </div>
              </FormField>

              {/* DESCRIPTION FIELD */}
              <FormField
                label="Description"
                name="description"
                error={errors.description}
                required
                hint="Provide detailed information about the issue (10-1000 characters)"
              >
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  maxLength="1000"
                  rows={5}
                  placeholder="Describe what happened, when it started, and what you've already tried..."
                  className={`w-full px-4 py-3 border rounded-lg placeholder-gray-400 transition focus:outline-none focus:ring-2 resize-none ${errors.description
                    ? "border-red-300 focus:ring-red-200 bg-red-50"
                    : "border-gray-200 focus:ring-blue-200 focus:border-blue-400"
                    }`}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span></span>
                  <span>{form.description.length}/1000</span>
                </div>
              </FormField>

              {/* IMPACT × URGENCY → PRIORITY */}
              <div className="space-y-4 p-5 rounded-xl border border-gray-200 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Priority (auto-calculated)</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Answer the two questions below — priority is worked out for you
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOverridePriority((v) => !v)}
                    className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    {overridePriority ? "Use auto-calculation" : "Set priority manually"}
                  </button>
                </div>

                {autoSuggested && !manualImpactUrgency && !overridePriority && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100">
                    <Zap className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                      Suggested from "<span className="italic">{autoSuggested.matched}</span>" — feel free to adjust below
                    </p>
                  </div>
                )}

                {!overridePriority ? (
                  <>
                    {/* IMPACT */}
                    <FormField label="Impact" name="impact" error={errors.impact} required>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {IMPACT_LEVELS.map((opt) => (
                          <LevelCard
                            key={opt.value}
                            option={opt}
                            selected={form.impact === opt.value}
                            onClick={() => setImpact(opt.value)}
                            accent="bg-blue-50 text-blue-800 border-blue-300"
                          />
                        ))}
                      </div>
                    </FormField>

                    {/* URGENCY */}
                    <FormField label="Urgency" name="urgency" error={errors.urgency} required>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {URGENCY_LEVELS.map((opt) => (
                          <LevelCard
                            key={opt.value}
                            option={opt}
                            selected={form.urgency === opt.value}
                            onClick={() => setUrgency(opt.value)}
                            accent="bg-purple-50 text-purple-800 border-purple-300"
                          />
                        ))}
                      </div>
                    </FormField>

                    {/* RESULT */}
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-xs font-medium text-gray-500">Calculated priority:</span>
                      {form.priority ? (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${PRIORITY_BADGE_STYLE[form.priority]}`}>
                          {form.priority}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Select impact & urgency above</span>
                      )}
                    </div>
                  </>
                ) : (
                  <FormField label="Priority Level" name="priority" error={errors.priority} required>
                    <div className="grid grid-cols-4 gap-3">
                      {["Low", "Medium", "High", "Critical"].map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setPriorityManually(level)}
                          className={`px-4 py-3 rounded-lg border-2 font-semibold text-sm transition ${getPriorityBg(
                            level
                          )} ${form.priority === level
                            ? "border-current shadow-md"
                            : "border-gray-200 hover:border-gray-300"
                            }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </FormField>
                )}
              </div>

              {/* DEPARTMENT FIELD */}
              <FormField
                label="Department"
                name="department"
                error={errors.department}
                required
                hint="Which department does this issue affect?"
              >
                <select
                  id="department"
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg font-medium placeholder-gray-400 transition focus:outline-none focus:ring-2 ${errors.department
                    ? "border-red-300 focus:ring-red-200 bg-red-50"
                    : "border-gray-200 focus:ring-blue-200 focus:border-blue-400"
                    }`}
                >
                  <option value="">Select a department...</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </FormField>

              {/* FILE UPLOAD */}
              <FormField
                label="Attachments"
                hint="Screenshots or documents help us understand the issue better"
              >
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition ${dragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 bg-gray-50 hover:border-gray-400"
                    }`}
                >
                  <input
                    type="file"
                    multiple
                    id="fileUpload"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  <label htmlFor="fileUpload" className="cursor-pointer">
                    <div className="flex justify-center mb-3">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Upload className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <p className="font-semibold text-gray-900">
                      Drag and drop files here
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      or{" "}
                      <span className="text-blue-600 font-medium hover:underline">
                        click to browse
                      </span>
                    </p>
                  </label>

                  <p className="text-xs text-gray-500 mt-3">
                    Supported formats: PDF, PNG, JPG, GIF, ZIP (max 10 MB each)
                  </p>
                </div>

                {/* FILE LIST */}
                {files.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <p className="text-sm font-medium text-gray-900">
                        {files.length} file{files.length !== 1 ? "s" : ""} attached
                      </p>
                    </div>
                    {files.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </FormField>

              {/* SUBMIT BUTTON */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full px-6 py-3 rounded-lg font-semibold text-white transition flex items-center justify-center gap-2 ${loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 active:scale-95"
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
          </div>

          {/* LIVE PREVIEW SIDEBAR */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-blue-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Preview</h3>
                <p className="text-xs text-gray-600 mt-1">
                  How your ticket will appear
                </p>
              </div>

              <div className="p-6 space-y-4">
                {/* Title Preview */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    Title
                  </p>
                  <p className="text-base font-semibold text-gray-900 line-clamp-2">
                    {form.title || "(No title yet)"}
                  </p>
                </div>

                {/* Description Preview */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    Description
                  </p>
                  <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
                    {form.description || "(No description yet)"}
                  </p>
                </div>

                {/* Metadata */}
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  {/* Impact / Urgency */}
                  {!overridePriority && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                          Impact
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {form.impact || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                          Urgency
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {form.urgency || "—"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Priority */}
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                      Priority
                    </p>
                    {form.priority ? (
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${PRIORITY_BADGE_STYLE[form.priority]}`}
                      >
                        {form.priority}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Not yet determined</span>
                    )}
                    {!overridePriority && form.priority && (
                      <span className="ml-2 text-[10px] text-blue-500 font-medium">
                        from impact × urgency
                      </span>
                    )}
                  </div>

                  {/* Department */}
                  <div>
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                      Department
                    </p>
                    <p className="text-sm font-medium text-gray-900">
                      {form.department || "(Not selected)"}
                    </p>
                  </div>

                  {/* Files */}
                  {files.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                        Attachments
                      </p>
                      <div className="space-y-1">
                        {files.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 text-sm text-gray-600"
                          >
                            <FileText className="w-3 h-3" />
                            <span className="truncate">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Status */}
                <div className="pt-4 border-t border-gray-200 text-center">
                  {form.title && form.description && form.department && form.priority ? (
                    <p className="text-xs text-green-600 font-medium flex items-center justify-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Ready to submit
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Fill in required fields
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
