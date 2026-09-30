import { useState, useEffect } from "react";
import api from "../api/axios.js";
import toast from "react-hot-toast";
import {
  AlertCircle,
  FileText,
  Upload,
  Zap,
  X,
  CheckCircle,
  Circle,
  Sliders,
  Sparkles,
  Loader2,
  Send,
  ChevronsUp,
  ChevronUp,
  ChevronDown,
  Minus,
} from "lucide-react";

/* ======================================================
   STATIC OPTIONS
====================================================== */
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
   This just pre-fills the two questions; the requester
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

/* ======================================================
   ⚡ AUTO-SUGGEST "RELATED TO" FROM TEXT
   More specific items (HHT Printer, HHT) are checked before
   their broader cousins (Printer, Hardware) so a phrase like
   "HHT printer not scanning" doesn't fall through to "Printer".
====================================================== */
const RELATED_KEYWORD_RULES = [
  {
    value: "HHT Printer",
    keywords: ["hht printer", "handheld printer", "mobile printer", "portable printer"],
  },
  {
    value: "HHT",
    keywords: ["hht", "handheld device", "handheld terminal", "scanner gun", "barcode scanner", "barcode device"],
  },
  {
    value: "ERP",
    keywords: ["erp", "sap", "tally", "oracle erp", "accounting software", "erp module", "erp login"],
  },
  {
    value: "Syncwise",
    keywords: ["syncwise"],
  },
  {
    value: "Email",
    keywords: ["email", "e-mail", "outlook", "gmail", "mailbox", "mail server", "mail not working"],
  },
  {
    value: "Printer",
    keywords: ["printer", "printout", "print job", "toner", "cartridge", "scanner", "print not working"],
  },
  {
    value: "Network",
    keywords: ["network", "wifi", "wi-fi", "internet", "vpn", "lan", "ethernet", "router", "connectivity"],
  },
  {
    value: "Laptop/Desktop",
    keywords: ["laptop", "desktop", "computer", "cpu not", "monitor", "screen flickering", "pc not"],
  },
  {
    value: "Software",
    keywords: ["software", "application", "app crash", "install", "software update", "license", "activation"],
  },
  {
    value: "Hardware",
    keywords: ["hardware", "mouse", "keyboard", "cable request", "device", "battery", "charger"],
  },
];

const detectRelatedTo = (text) => {
  const lower = text.toLowerCase();
  for (const rule of RELATED_KEYWORD_RULES) {
    const match = rule.keywords.find((kw) => lower.includes(kw));
    if (match) return { value: rule.value, matched: match };
  }
  return null;
};

/* ======================================================
   DESIGN TOKENS (shared with MyTickets)
====================================================== */
const PRIORITY_META = {
  Critical: { color: "#C9372C", bg: "#FFECEB", text: "#AE2A19", Icon: ChevronsUp },
  High: { color: "#D9601B", bg: "#FFF0E0", text: "#9C4A0B", Icon: ChevronUp },
  Medium: { color: "#B7791F", bg: "#FFF3D6", text: "#7A4B00", Icon: Minus },
  Low: { color: "#22A06B", bg: "#DFF7E8", text: "#146C3E", Icon: ChevronDown },
};

const PRIORITY_LEVELS = ["Low", "Medium", "High", "Critical"];

const inputBase =
  "w-full px-3 py-2 text-sm text-[#172B4D] bg-white border rounded-[4px] placeholder-[#8590A2] transition outline-none focus:ring-2 focus:ring-[#0B6E76]/30 focus:border-[#0B6E76]";
const inputOk = "border-[#C7CDD6] hover:bg-[#F7F8F9] focus:bg-white";
const inputErr = "border-[#E2483D] bg-[#FFF5F4] focus:ring-[#E2483D]/20 focus:border-[#E2483D]";

/* ======================================================
   SMALL UI PIECES
====================================================== */
const PriorityLozenge = ({ level }) => {
  const meta = PRIORITY_META[level];
  if (!meta) return null;
  const Icon = meta.Icon;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-[4px] px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap"
      style={{ background: meta.bg, color: meta.text }}
    >
      <Icon className="w-3.5 h-3.5" strokeWidth={2.5} style={{ color: meta.color }} />
      {level}
    </span>
  );
};

const Section = ({ title, description, action, children }) => (
  <section className="bg-white border border-[#DFE1E6] rounded-lg overflow-hidden">
    <div className="flex items-start justify-between gap-4 px-5 py-3.5 bg-[#F7F8F9] border-b border-[#DFE1E6]">
      <div>
        <h2 className="text-sm font-semibold text-[#172B4D]">{title}</h2>
        {description && <p className="mt-0.5 text-xs text-[#626F86]">{description}</p>}
      </div>
      {action}
    </div>
    <div className="p-5 space-y-5">{children}</div>
  </section>
);

const FormField = ({ label, name, error, required, children, hint, counter }) => (
  <div className="space-y-1.5">
    <div className="flex items-end justify-between gap-3">
      <label htmlFor={name} className="block text-sm font-semibold text-[#172B4D]">
        {label}
        {required && <span className="text-[#C9372C] ml-0.5">*</span>}
      </label>
      {counter && <span className="text-xs text-[#8590A2]">{counter}</span>}
    </div>
    {children}
    {hint && !error && <p className="text-xs text-[#626F86]">{hint}</p>}
    {error && (
      <p className="text-xs text-[#AE2A19] flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {error}
      </p>
    )}
  </div>
);

// Radio-style option used for both Impact and Urgency
const LevelOption = ({ option, selected, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={`text-left p-3 rounded-[4px] border transition cursor-pointer ${selected
        ? "border-[#0B6E76] bg-[#E6F3F4] ring-1 ring-[#0B6E76]"
        : "border-[#C7CDD6] bg-white hover:bg-[#F7F8F9]"
      }`}
  >
    <div className="flex items-start gap-2.5">
      <span
        className={`mt-0.5 shrink-0 w-4 h-4 rounded-full border flex items-center justify-center ${selected ? "border-[#0B6E76]" : "border-[#8590A2]"
          }`}
      >
        {selected && <span className="w-2 h-2 rounded-full bg-[#0B6E76]" />}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#172B4D]">{option.label}</p>
        <p className="mt-0.5 text-xs text-[#626F86] leading-relaxed">{option.desc}</p>
      </div>
    </div>
  </button>
);

const InfoNote = ({ children }) => (
  <div className="flex items-start gap-2 px-3 py-2 rounded-[4px] bg-[#E9F2FF] border border-[#CFE1FD]">
    <Zap className="w-3.5 h-3.5 text-[#0C4A9E] mt-0.5 shrink-0" />
    <p className="text-xs text-[#0C4A9E] leading-relaxed">{children}</p>
  </div>
);

const SummaryRow = ({ label, children }) => (
  <div className="flex items-start justify-between gap-4 py-2 border-b border-[#EBECF0] last:border-b-0">
    <dt className="text-xs font-semibold text-[#626F86] shrink-0">{label}</dt>
    <dd className="text-sm text-[#172B4D] text-right break-words min-w-0">{children}</dd>
  </div>
);

/* ======================================================
   PAGE
====================================================== */
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

  // ⚡ Auto-suggestion state
  const [autoSuggested, setAutoSuggested] = useState(null); // { impact, urgency, matched } | null
  const [manualImpactUrgency, setManualImpactUrgency] = useState(false); // true once user picks impact/urgency themselves
  const [overridePriority, setOverridePriority] = useState(false); // true when user wants to bypass the matrix entirely

  const [relatedSuggested, setRelatedSuggested] = useState(null); // { value, matched } | null
  const [manualRelatedTo, setManualRelatedTo] = useState(false); // true once user picks Related To themselves

  // 🤖 AI recommendation state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null); // { category, priority, suggestedSolution, confidence } | null
  const [aiSimilarTickets, setAiSimilarTickets] = useState([]); // [{ title, status, resolutionNote }]
  const [aiApplied, setAiApplied] = useState(false);
  const [aiError, setAiError] = useState("");

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

  // Same idea, but for Related To — separate rule set since it maps to a
  // single dropdown value rather than an impact/urgency pair.
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

  // Clear any stale AI suggestion if the requester substantially edits
  // title/description after already getting a recommendation.
  useEffect(() => {
    if (aiSuggestion) {
      setAiSuggestion(null);
      setAiSimilarTickets([]);
      setAiApplied(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.title, form.description]);

  const setImpact = (value) => {
    setManualImpactUrgency(true);
    setForm((prev) => ({ ...prev, impact: value }));
    if (errors.impact) setErrors((p) => ({ ...p, impact: undefined }));
  };

  const setUrgency = (value) => {
    setManualImpactUrgency(true);
    setForm((prev) => ({ ...prev, urgency: value }));
    if (errors.urgency) setErrors((p) => ({ ...p, urgency: undefined }));
  };

  const setPriorityManually = (level) => {
    setForm((prev) => ({ ...prev, priority: level }));
    if (errors.priority) setErrors((p) => ({ ...p, priority: undefined }));
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

  // 🤖 Ask the backend AI endpoint for category/priority/solution suggestions
  const handleAskAI = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Add a title and description first");
      return;
    }

    setAiLoading(true);
    setAiError("");
    setAiSuggestion(null);
    setAiSimilarTickets([]);
    setAiApplied(false);

    try {
      const res = await api.post("/ai/ticket-recommendation", {
        title: form.title,
        description: form.description,
        relatedTo: form.relatedTo || undefined,
      });

      setAiSuggestion(res.data.recommendation);
      setAiSimilarTickets(res.data.similarTickets || []);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        "Couldn't get an AI suggestion right now. Please try again.";
      setAiError(msg);
      toast.error(msg);
    } finally {
      setAiLoading(false);
    }
  };

  // Applies the AI's category + priority to the form.
  // Priority is applied via manual override since it didn't come from the
  // impact/urgency matrix — the requester can still switch back to
  // auto-calculation any time.
  const applyAiSuggestion = () => {
    if (!aiSuggestion) return;

    setManualRelatedTo(true);
    setOverridePriority(true);

    setForm((prev) => ({
      ...prev,
      relatedTo: aiSuggestion.category || prev.relatedTo,
      priority: aiSuggestion.priority || prev.priority,
    }));

    setAiApplied(true);
    toast.success("AI suggestion applied");
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
      data.append("relatedTo", form.relatedTo);
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
        setAiSuggestion(null);
        setAiSimilarTickets([]);
        setAiApplied(false);
        setAiError("");
      } else {
        toast.error("Ticket creation failed");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  /* ================= DERIVED ================= */
  const checklist = [
    { label: "Title (at least 5 characters)", ok: form.title.trim().length >= 5 },
    { label: "Description", ok: !!form.description.trim() },
    { label: "Impact and urgency", ok: !!form.priority },
    { label: "Department", ok: !!form.department },
    { label: "Related to", ok: !!form.relatedTo },
  ];
  const doneCount = checklist.filter((c) => c.ok).length;
  const isReady = doneCount === checklist.length;

  const aiCanRun = !aiLoading && form.title.trim() && form.description.trim();

  return (
    <div
      className="min-h-screen bg-[#F4F5F7]"
      style={{ fontFamily: "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* Font import — remove if you already load these via index.html */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
      `}</style>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* PAGE HEADER */}
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl font-semibold text-[#172B4D] tracking-tight">
              New ticket
            </h1>
            <p className="mt-0.5 text-sm text-[#626F86]">
              Describe the problem and it will be routed to IT support
            </p>
          </div>

          <button
            type="submit"
            form="create-ticket-form"
            disabled={loading}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-[4px] bg-[#0B6E76] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#095A61] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {loading ? "Submitting..." : "Submit ticket"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
          {/* ================= FORM ================= */}
          <form id="create-ticket-form" onSubmit={handleSubmit} className="space-y-5">
            {/* 1. ISSUE */}
            <Section title="Issue details" description="What is going wrong?">
              <FormField
                label="Title"
                name="title"
                error={errors.title}
                required
                counter={`${form.title.length}/100`}
              >
                <input
                  id="title"
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  maxLength="100"
                  placeholder="e.g., Email access not working"
                  className={`${inputBase} ${errors.title ? inputErr : inputOk}`}
                />
              </FormField>

              <FormField
                label="Description"
                name="description"
                error={errors.description}
                required
                counter={`${form.description.length}/1000`}
                hint="What happened, when it started, and what you've already tried"
              >
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  maxLength="1000"
                  rows={5}
                  placeholder="Describe the issue..."
                  className={`${inputBase} resize-none ${errors.description ? inputErr : inputOk}`}
                />
              </FormField>

              {/* 🤖 AI SUGGESTION */}
              <div className="rounded-[4px] border border-[#DDD6F5] bg-[#F8F7FF]">
                <div className="flex items-center justify-between gap-3 flex-wrap px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-[4px] bg-[#E9E4FB]">
                      <Sparkles className="w-4 h-4 text-[#5B37AF]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#172B4D]">AI suggestion</p>
                      <p className="text-xs text-[#626F86]">
                        Suggests a category, priority and fix from similar past tickets
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAskAI}
                    disabled={!aiCanRun}
                    className={`inline-flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-xs font-medium transition-colors ${aiCanRun
                        ? "bg-[#5B37AF] text-white hover:bg-[#4A2C93] cursor-pointer"
                        : "bg-[#EEF0F3] text-[#8590A2] cursor-not-allowed"
                      }`}
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Ask AI
                      </>
                    )}
                  </button>
                </div>

                {aiError && (
                  <div className="mx-4 mb-4 flex items-start gap-2 px-3 py-2 rounded-[4px] bg-[#FFECEB] border border-[#FFD5D2]">
                    <AlertCircle className="w-3.5 h-3.5 text-[#AE2A19] mt-0.5 shrink-0" />
                    <p className="text-xs text-[#AE2A19]">{aiError}</p>
                  </div>
                )}

                {aiSuggestion && (
                  <div className="mx-4 mb-4 border border-[#DDD6F5] rounded-[4px] bg-white p-4 space-y-3.5">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#626F86]">Category</span>
                        <span className="rounded-[4px] px-2 py-0.5 text-[11px] font-semibold bg-[#E9F2FF] text-[#0C4A9E]">
                          {aiSuggestion.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#626F86]">Priority</span>
                        <PriorityLozenge level={aiSuggestion.priority} />
                      </div>

                      {aiSuggestion.confidence && (
                        <span className="ml-auto text-xs text-[#8590A2]">
                          {aiSuggestion.confidence} confidence
                        </span>
                      )}
                    </div>

                    {aiSuggestion.suggestedSolution && (
                      <div>
                        <p className="text-xs font-semibold text-[#626F86] mb-1">
                          Suggested next step
                        </p>
                        <p className="text-sm text-[#172B4D] leading-relaxed">
                          {aiSuggestion.suggestedSolution}
                        </p>
                      </div>
                    )}

                    {aiSimilarTickets.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-[#626F86] mb-1.5">
                          How similar tickets were resolved
                        </p>
                        <ul className="space-y-2">
                          {aiSimilarTickets.map((t, idx) => (
                            <li
                              key={idx}
                              className="px-3 py-2 bg-[#F7F8F9] rounded-[4px] border border-[#EBECF0]"
                            >
                              <p className="text-xs font-semibold text-[#172B4D] truncate">
                                {t.title}
                              </p>
                              <p className="text-xs text-[#626F86] mt-0.5 leading-relaxed">
                                {t.resolutionNote
                                  ? t.resolutionNote
                                  : "No resolution notes recorded for this ticket."}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-0.5">
                      <button
                        type="button"
                        onClick={applyAiSuggestion}
                        disabled={aiApplied}
                        className={`inline-flex items-center gap-1.5 rounded-[4px] px-3 py-1.5 text-xs font-medium transition-colors ${aiApplied
                            ? "bg-[#DFF7E8] text-[#146C3E] cursor-default"
                            : "bg-[#5B37AF] text-white hover:bg-[#4A2C93] cursor-pointer"
                          }`}
                      >
                        {aiApplied ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            Applied
                          </>
                        ) : (
                          "Apply category and priority"
                        )}
                      </button>
                      <p className="text-xs text-[#8590A2]">You can still change these below</p>
                    </div>
                  </div>
                )}
              </div>
            </Section>

            {/* 2. PRIORITY */}
            <Section
              title="Priority"
              description={
                overridePriority
                  ? "Set manually"
                  : "Calculated from impact and urgency"
              }
              action={
                <button
                  type="button"
                  onClick={() => setOverridePriority((v) => !v)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#0B6E76] hover:underline cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  {overridePriority ? "Use auto-calculation" : "Set priority manually"}
                </button>
              }
            >
              {autoSuggested && !manualImpactUrgency && !overridePriority && (
                <InfoNote>
                  Suggested from "<span className="italic">{autoSuggested.matched}</span>" in your
                  description. Change it below if it doesn't fit.
                </InfoNote>
              )}

              {!overridePriority ? (
                <>
                  <FormField label="Impact" name="impact" error={errors.impact} required
                    hint="Who is affected?">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      {IMPACT_LEVELS.map((opt) => (
                        <LevelOption
                          key={opt.value}
                          option={opt}
                          selected={form.impact === opt.value}
                          onClick={() => setImpact(opt.value)}
                        />
                      ))}
                    </div>
                  </FormField>

                  <FormField label="Urgency" name="urgency" error={errors.urgency} required
                    hint="How soon does it need fixing?">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      {URGENCY_LEVELS.map((opt) => (
                        <LevelOption
                          key={opt.value}
                          option={opt}
                          selected={form.urgency === opt.value}
                          onClick={() => setUrgency(opt.value)}
                        />
                      ))}
                    </div>
                  </FormField>

                  {/* RESULT + MATRIX */}
                  <div className="flex flex-col md:flex-row md:items-center gap-4 rounded-[4px] border border-[#DFE1E6] bg-[#F7F8F9] p-4">
                    <div className="md:w-40 shrink-0">
                      <p className="text-xs font-semibold text-[#626F86] mb-1.5">
                        Calculated priority
                      </p>
                      {form.priority ? (
                        <PriorityLozenge level={form.priority} />
                      ) : (
                        <span className="text-xs text-[#8590A2]">
                          Answer impact and urgency
                        </span>
                      )}
                    </div>

                    {/* mini matrix: rows = impact (high → low), cols = urgency (low → high) */}
                    <div className="flex-1 min-w-0">
                      <div className="grid grid-cols-[72px_repeat(3,minmax(0,1fr))] gap-1 text-[11px]">
                        <span />
                        {["Low", "Medium", "High"].map((u) => (
                          <span key={u} className="text-center font-semibold text-[#626F86]">
                            {u}
                          </span>
                        ))}
                        {["High", "Medium", "Low"].map((imp) => (
                          <div key={imp} className="contents">
                            <span className="self-center font-semibold text-[#626F86]">
                              {imp}
                            </span>
                            {["Low", "Medium", "High"].map((urg) => {
                              const level = PRIORITY_MATRIX[imp][urg];
                              const meta = PRIORITY_META[level];
                              const active = form.impact === imp && form.urgency === urg;
                              return (
                                <span
                                  key={urg}
                                  className={`text-center rounded-[3px] py-1 font-medium ${active ? "ring-2 ring-offset-1" : "opacity-60"
                                    }`}
                                  style={{
                                    background: meta.bg,
                                    color: meta.text,
                                    "--tw-ring-color": meta.color,
                                  }}
                                >
                                  {level}
                                </span>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                      <p className="mt-1.5 text-[11px] text-[#8590A2]">
                        Rows: impact · Columns: urgency
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <FormField label="Priority level" name="priority" error={errors.priority} required>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    {PRIORITY_LEVELS.map((level) => {
                      const meta = PRIORITY_META[level];
                      const Icon = meta.Icon;
                      const selected = form.priority === level;
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setPriorityManually(level)}
                          aria-pressed={selected}
                          className={`inline-flex items-center justify-center gap-1.5 rounded-[4px] border px-3 py-2.5 text-sm font-semibold transition cursor-pointer ${selected ? "ring-1" : "bg-white hover:bg-[#F7F8F9]"
                            }`}
                          style={
                            selected
                              ? {
                                background: meta.bg,
                                color: meta.text,
                                borderColor: meta.color,
                                "--tw-ring-color": meta.color,
                              }
                              : { borderColor: "#C7CDD6", color: "#172B4D" }
                          }
                        >
                          <Icon
                            className="w-4 h-4"
                            strokeWidth={2.5}
                            style={{ color: meta.color }}
                          />
                          {level}
                        </button>
                      );
                    })}
                  </div>
                </FormField>
              )}
            </Section>

            {/* 3. CLASSIFICATION */}
            <Section title="Classification" description="Helps us route the ticket to the right person">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                    className={`${inputBase} ${errors.department ? inputErr : inputOk}`}
                  >
                    <option value="">Select a department...</option>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField
                  label="Related to"
                  name="relatedTo"
                  error={errors.relatedTo}
                  required
                  hint="What is this issue related to?"
                >
                  <select
                    id="relatedTo"
                    name="relatedTo"
                    value={form.relatedTo}
                    onChange={handleRelatedToChange}
                    required
                    className={`${inputBase} ${errors.relatedTo ? inputErr : inputOk}`}
                  >
                    <option value="" disabled>
                      Select what this relates to...
                    </option>
                    {RELATED_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              {relatedSuggested && !manualRelatedTo && (
                <InfoNote>
                  "Related to" suggested from "<span className="italic">{relatedSuggested.matched}</span>"
                  in your description. Change it above if it doesn't fit.
                </InfoNote>
              )}
            </Section>

            {/* 4. ATTACHMENTS */}
            <Section title="Attachments" description="Screenshots or documents help us understand the issue">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`rounded-[4px] border border-dashed p-6 text-center transition ${dragActive
                    ? "border-[#0B6E76] bg-[#E6F3F4]"
                    : "border-[#C7CDD6] bg-[#F7F8F9] hover:bg-[#F1F3F5]"
                  }`}
              >
                <input
                  type="file"
                  multiple
                  id="fileUpload"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <label htmlFor="fileUpload" className="cursor-pointer block">
                  <Upload className="w-5 h-5 mx-auto text-[#626F86]" />
                  <p className="mt-2 text-sm font-medium text-[#172B4D]">
                    Drag files here or{" "}
                    <span className="text-[#0B6E76] hover:underline">browse</span>
                  </p>
                  <p className="mt-1 text-xs text-[#626F86]">
                    PDF, PNG, JPG, GIF, ZIP · up to 10 MB each
                  </p>
                </label>
              </div>

              {files.length > 0 && (
                <div className="rounded-[4px] border border-[#DFE1E6] divide-y divide-[#EBECF0]">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-3 px-3 py-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="w-4 h-4 text-[#8590A2] shrink-0" />
                        <p className="text-sm text-[#172B4D] truncate">{file.name}</p>
                        <span className="text-xs text-[#8590A2] shrink-0">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="p-1 text-[#8590A2] hover:text-[#AE2A19] hover:bg-[#FFECEB] rounded-[4px] transition shrink-0 cursor-pointer"
                        aria-label={`Remove ${file.name}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* SUBMIT */}
            <div className="flex items-center justify-between gap-4 pt-1">
              <p className="text-xs text-[#626F86]">
                {isReady
                  ? "All required fields are filled in"
                  : `${checklist.length - doneCount} required item${checklist.length - doneCount !== 1 ? "s" : ""
                  } left`}
              </p>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-[4px] bg-[#0B6E76] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#095A61] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit ticket
                  </>
                )}
              </button>
            </div>
          </form>

          {/* ================= SUMMARY SIDEBAR ================= */}
          <aside className="lg:sticky lg:top-6 space-y-4">
            <div className="bg-white border border-[#DFE1E6] rounded-lg overflow-hidden">
              <div className="px-5 py-3.5 bg-[#F7F8F9] border-b border-[#DFE1E6]">
                <h3 className="text-sm font-semibold text-[#172B4D]">Ticket summary</h3>
                <p className="mt-0.5 text-xs text-[#626F86]">Updates as you type</p>
              </div>

              <div className="px-5 py-4">
                <p
                  className={`text-base font-semibold leading-snug line-clamp-2 ${form.title ? "text-[#172B4D]" : "text-[#8590A2]"
                    }`}
                >
                  {form.title || "No title yet"}
                </p>
                <p
                  className={`mt-1.5 text-sm leading-relaxed line-clamp-3 ${form.description ? "text-[#44546F]" : "text-[#8590A2]"
                    }`}
                >
                  {form.description || "No description yet"}
                </p>

                <dl className="mt-4 border-t border-[#EBECF0]">
                  <SummaryRow label="Priority">
                    {form.priority ? (
                      <span className="inline-flex flex-col items-end gap-0.5">
                        <PriorityLozenge level={form.priority} />
                        <span className="text-[11px] text-[#8590A2]">
                          {aiApplied
                            ? "from AI suggestion"
                            : overridePriority
                              ? "set manually"
                              : "from impact × urgency"}
                        </span>
                      </span>
                    ) : (
                      <span className="text-[#8590A2]">Not set</span>
                    )}
                  </SummaryRow>

                  {!overridePriority && (
                    <>
                      <SummaryRow label="Impact">
                        {form.impact || <span className="text-[#8590A2]">-</span>}
                      </SummaryRow>
                      <SummaryRow label="Urgency">
                        {form.urgency || <span className="text-[#8590A2]">-</span>}
                      </SummaryRow>
                    </>
                  )}

                  <SummaryRow label="Department">
                    {form.department || <span className="text-[#8590A2]">Not selected</span>}
                  </SummaryRow>
                  <SummaryRow label="Related to">
                    {form.relatedTo || <span className="text-[#8590A2]">Not selected</span>}
                  </SummaryRow>
                  <SummaryRow label="Attachments">
                    {files.length > 0 ? (
                      `${files.length} file${files.length !== 1 ? "s" : ""}`
                    ) : (
                      <span className="text-[#8590A2]">None</span>
                    )}
                  </SummaryRow>
                </dl>
              </div>
            </div>

            {/* READINESS CHECKLIST */}
            <div className="bg-white border border-[#DFE1E6] rounded-lg p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#172B4D]">Before you submit</h3>
                <span className="text-xs font-medium text-[#626F86]">
                  {doneCount}/{checklist.length}
                </span>
              </div>

              <div className="mt-2.5 h-1.5 rounded-full bg-[#EEF0F3] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${isReady ? "bg-[#22A06B]" : "bg-[#0B6E76]"
                    }`}
                  style={{ width: `${(doneCount / checklist.length) * 100}%` }}
                />
              </div>

              <ul className="mt-3.5 space-y-2">
                {checklist.map((item) => (
                  <li key={item.label} className="flex items-center gap-2 text-sm">
                    {item.ok ? (
                      <CheckCircle className="w-4 h-4 text-[#22A06B] shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-[#C7CDD6] shrink-0" />
                    )}
                    <span className={item.ok ? "text-[#172B4D]" : "text-[#626F86]"}>
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}