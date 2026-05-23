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

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
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
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data?.success) {
        toast.success(res.data.message || "Ticket created");

        if (res.data.emailStatus === "failed") {
          toast.error("Ticket created but email failed");
        }

        setForm({
          title: "",
          description: "",
          priority: "Low",
          department: "",
        });

        setFiles([]);
      } else {
        toast.error("Ticket creation failed");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">

      {/* HEADER */}
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

            {/* TITLE */}
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Ticket Title"
              className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
            />

            {/* DESCRIPTION */}
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe your issue..."
              rows={4}
              className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
            />

            {/* PRIORITY */}
            <div className="flex gap-2 flex-wrap">
              {["Low", "Medium", "High", "Critical"].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setPriority(level)}
                  className={`px-3 py-1 text-xs border rounded-md transition ${
                    form.priority === level
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-gray-600"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>

            {/* DEPARTMENT */}
            <input
              name="department"
              value={form.department}
              onChange={handleChange}
              placeholder="Department"
              className="w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
            />

            {/* FILE UPLOAD UI */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-5 text-center bg-gray-50">

              <input
                type="file"
                multiple
                id="fileUpload"
                className="hidden"
                onChange={(e) => setFiles([...e.target.files])}
              />

              <label
                htmlFor="fileUpload"
                className="cursor-pointer text-indigo-600 font-medium"
              >
                Click to upload files
              </label>

              <p className="text-xs text-gray-500 mt-1">
                or select multiple files from your device
              </p>

              {/* FILE LIST */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2 text-left">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center bg-white border rounded px-3 py-2"
                    >
                      <span className="text-sm truncate">{file.name}</span>

                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition"
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
            <div className="mt-3">
              <p className="font-medium text-sm mb-2">Attachments:</p>
              <ul className="text-sm space-y-1">
                {files.map((f, i) => (
                  <li key={i} className="text-gray-600">
                    📎 {f.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}