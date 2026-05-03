import { useState } from "react";
import api from "../api/axios.js";
import toast from "react-hot-toast";

export default function CreateTicket() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "Low",
    department: "",
  });

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const setPriority = (level) => {
    setForm({ ...form, priority: level });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.description) {
      toast.error("Title and description are required");
      return;
    }

    try {
      setLoading(true);

      const data = new FormData();
      Object.keys(form).forEach((k) => data.append(k, form[k]));
      files.forEach((f) => data.append("files", f));

      const token = localStorage.getItem("token");

      await api.post("/tickets", data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Ticket submitted successfully");

      setForm({
        title: "",
        description: "",
        priority: "Low",
        department: "",
      });

      setFiles([]);

    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  const priorityStyle = (level) => {
    switch (level) {
      case "Low":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Medium":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "High":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "Critical":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">

      {/* TOP HEADER (REAL SAAS STYLE) */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <h1 className="text-lg font-semibold text-gray-900">
            Create Support Ticket
          </h1>
          <p className="text-sm text-gray-500">
            Submit a request to IT support team
          </p>
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* FORM PANEL */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm">

          <div className="px-6 py-5 border-b">
            <h2 className="text-sm font-semibold text-gray-800">
              Ticket Information
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Fill in required details
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            {/* TITLE */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Title
              </label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter issue title"
                className="w-full mt-2 px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white"
              />
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Description
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="5"
                placeholder="Describe the issue clearly..."
                className="w-full mt-2 px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white"
              />
            </div>

            {/* PRIORITY */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Priority Level
              </label>

              <div className="flex gap-2 mt-3 flex-wrap">
                {["Low", "Medium", "High", "Critical"].map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setPriority(level)}
                    className={`px-3 py-1.5 text-xs rounded-md border transition ${
                      form.priority === level
                        ? priorityStyle(level)
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* DEPARTMENT */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Department
              </label>
              <input
                name="department"
                value={form.department}
                onChange={handleChange}
                placeholder="Finance,HR,Sales,etc."
                className="w-full mt-2 px-4 py-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 focus:bg-white"
              />
            </div>

            {/* ATTACHMENTS */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Attachments
              </label>
              <input
                type="file"
                multiple
                onChange={(e) => setFiles([...e.target.files])}
                className="w-full mt-2 text-sm border border-gray-200 rounded-lg bg-gray-50 p-2"
              />
            </div>

            {/* ACTION */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-2 py-3 rounded-lg text-sm font-medium text-white transition ${
                loading
                  ? "bg-gray-400"
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-sm"
              }`}
            >
              {loading ? "Submitting..." : "Submit Ticket"}
            </button>

          </form>
        </div>

        {/* PREVIEW PANEL (INSPECTOR STYLE) */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">

          <div className="px-6 py-5 border-b">
            <h3 className="text-sm font-semibold text-gray-800">
              Live Preview
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Ticket preview panel
            </p>
          </div>

          <div className="p-6 space-y-5 text-sm">

            <div>
              <p className="text-xs text-gray-400">TITLE</p>
              <p className="font-medium text-gray-900">
                {form.title || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400">DESCRIPTION</p>
              <p className="text-gray-600">
                {form.description || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400">PRIORITY</p>
              <span className={`inline-block mt-1 px-3 py-1 rounded-md text-xs border ${priorityStyle(form.priority)}`}>
                {form.priority}
              </span>
            </div>

            <div>
              <p className="text-xs text-gray-400">DEPARTMENT</p>
              <p className="text-gray-700">
                {form.department || "—"}
              </p>
            </div>

            {files.length > 0 && (
              <div>
                <p className="text-xs text-gray-400">FILES</p>
                <ul className="text-xs text-gray-600 list-disc ml-5 mt-1">
                  {files.map((f, i) => (
                    <li key={i}>{f.name}</li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}