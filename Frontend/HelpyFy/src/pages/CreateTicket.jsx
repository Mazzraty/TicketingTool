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

      const res = await api.post("/tickets", data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // ✅ SUCCESS HANDLING (BASED ON BACKEND)
      if (res.data?.success) {
        toast.success(res.data.message || "Ticket created");

        // ⚠️ EMAIL STATUS CHECK
        if (res.data.emailStatus === "failed") {
          toast.error("Ticket created but email failed");
        }
      } else {
        toast.error("Ticket creation failed");
      }

      // RESET FORM
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

      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* FORM */}
        <div className="lg:col-span-2 bg-white border rounded-xl shadow-sm">
          <div className="px-6 py-5 border-b">
            <h2 className="text-sm font-semibold text-gray-800">
              Ticket Information
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">

            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Title"
              className="w-full px-4 py-3 border rounded-lg"
            />

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Description"
              className="w-full px-4 py-3 border rounded-lg"
            />

            <div className="flex gap-2 flex-wrap">
              {["Low", "Medium", "High", "Critical"].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setPriority(level)}
                  className={`px-3 py-1 text-xs border rounded-md ${
                    form.priority === level ? "bg-indigo-600 text-white" : ""
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>

            <input
              name="department"
              value={form.department}
              onChange={handleChange}
              placeholder="Department"
              className="w-full px-4 py-3 border rounded-lg"
            />

            <input
              type="file"
              multiple
              onChange={(e) => setFiles([...e.target.files])}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg"
            >
              {loading ? "Submitting..." : "Submit Ticket"}
            </button>
          </form>
        </div>

        {/* PREVIEW */}
        <div className="bg-white border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Live Preview</h3>

          <p><b>Title:</b> {form.title || "-"}</p>
          <p><b>Description:</b> {form.description || "-"}</p>
          <p><b>Priority:</b> {form.priority}</p>
          <p><b>Department:</b> {form.department || "-"}</p>

          {files.length > 0 && (
            <ul className="mt-3 text-sm">
              {files.map((f, i) => (
                <li key={i}>{f.name}</li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}