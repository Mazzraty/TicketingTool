import { useState, useEffect } from "react";
import api from "../api/axios.js";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

export default function CreateTicket() {
  const navigate = useNavigate();
  const { id } = useParams();

  // ✅ edit mode
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "Low",
    department: "",
  });

  const [files, setFiles] = useState([]);

  const [existingFiles, setExistingFiles] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  // ==========================
  // LOAD EXISTING TICKET
  // ==========================
  useEffect(() => {
    if (isEdit) {
      loadTicket();
    }
  }, [id]);

  const loadTicket = async () => {
    try {
      const res = await api.get(
        `/tickets/my`
      );

      const ticket = res.data.data.find(
        (t) => t._id === id
      );

      if (!ticket) {
        toast.error("Ticket not found");
        return;
      }

      setForm({
        title: ticket.title || "",
        description:
          ticket.description || "",
        priority:
          ticket.priority || "Low",
        department:
          ticket.department || "",
      });

      setExistingFiles(
        ticket.attachments || []
      );

    } catch (err) {
      console.log(err);

      toast.error(
        "Failed to load ticket"
      );
    }
  };

  // ==========================
  // HANDLE CHANGE
  // ==========================
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]:
        e.target.value,
    });
  };

  // ==========================
  // PRIORITY
  // ==========================
  const setPriority = (level) => {
    setForm({
      ...form,
      priority: level,
    });
  };

  // ==========================
  // SUBMIT
  // ==========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.title ||
      !form.description
    ) {
      toast.error(
        "Title and description are required"
      );

      return;
    }

    try {
      setLoading(true);

      const data = new FormData();

      Object.keys(form).forEach((k) =>
        data.append(k, form[k])
      );

      // FILES
      files.forEach((f) =>
        data.append("files", f)
      );

      const token =
        localStorage.getItem("token");

      let res;

      // ==========================
      // CREATE
      // ==========================
      if (!isEdit) {
        res = await api.post(
          "/tickets",
          data,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      // ==========================
      // EDIT REOPENED
      // ==========================
      else {
        res = await api.put(
          `/tickets/${id}/edit`,
          data,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      // SUCCESS
      if (res.data?.success) {
        toast.success(
          res.data.message ||
            (isEdit
              ? "Ticket updated"
              : "Ticket created")
        );

        // EMAIL FAILED
        if (
          res.data.emailStatus ===
          "failed"
        ) {
          toast.error(
            "Email notification failed"
          );
        }

        // RESET
        setForm({
          title: "",
          description: "",
          priority: "Low",
          department: "",
        });

        setFiles([]);

        // REDIRECT
        navigate("/my-tickets");

      } else {
        toast.error(
          isEdit
            ? "Update failed"
            : "Ticket creation failed"
        );
      }

    } catch (err) {
      console.log(err);

      toast.error(
        err.response?.data?.message ||
          "Request failed"
      );

    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // PRIORITY STYLE
  // ==========================
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

      {/* HEADER */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-5">

          <h1 className="text-lg font-semibold text-gray-900">

            {isEdit
              ? "Edit Ticket"
              : "Create Support Ticket"}

          </h1>

          <p className="text-sm text-gray-500">

            {isEdit
              ? "Update reopened ticket"
              : "Submit a request to IT support team"}

          </p>

        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* FORM */}
        <div className="lg:col-span-2 bg-white border rounded-xl shadow-sm">

          <div className="px-6 py-5 border-b">

            <h2 className="text-sm font-semibold text-gray-800">
              Ticket Information
            </h2>

          </div>

          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-5"
          >

            {/* TITLE */}
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Title"
              className="w-full px-4 py-3 border rounded-lg"
            />

            {/* DESCRIPTION */}
            <textarea
              rows={6}
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Description"
              className="w-full px-4 py-3 border rounded-lg"
            />

            {/* PRIORITY */}
            <div className="flex gap-2 flex-wrap">

              {[
                "Low",
                "Medium",
                "High",
                "Critical",
              ].map((level) => (

                <button
                  key={level}
                  type="button"
                  onClick={() =>
                    setPriority(level)
                  }
                  className={`px-3 py-1 text-xs border rounded-md transition ${
                    form.priority === level
                      ? "bg-indigo-600 text-white"
                      : priorityStyle(level)
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
              className="w-full px-4 py-3 border rounded-lg"
            />

            {/* FILES */}
            <div>

              <input
                type="file"
                multiple
                onChange={(e) =>
                  setFiles([
                    ...e.target.files,
                  ])
                }
              />

              {/* EXISTING FILES */}
              {existingFiles.length >
                0 && (
                <div className="mt-3">

                  <p className="text-sm font-medium mb-2">
                    Existing Files
                  </p>

                  <ul className="space-y-1">

                    {existingFiles.map(
                      (f, i) => (
                        <li
                          key={i}
                          className="text-sm text-blue-600 truncate"
                        >
                          {f}
                        </li>
                      )
                    )}

                  </ul>

                </div>
              )}

            </div>

            {/* BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg transition"
            >

              {loading
                ? isEdit
                  ? "Updating..."
                  : "Submitting..."
                : isEdit
                ? "Update Ticket"
                : "Submit Ticket"}

            </button>

          </form>

        </div>

        {/* PREVIEW */}
        <div className="bg-white border rounded-xl p-6 h-fit">

          <h3 className="font-semibold mb-4">
            Live Preview
          </h3>

          <div className="space-y-3 text-sm">

            <p>
              <b>Title:</b>{" "}
              {form.title || "-"}
            </p>

            <p>
              <b>Description:</b>{" "}
              {form.description || "-"}
            </p>

            <p>
              <b>Priority:</b>{" "}

              <span
                className={`px-2 py-1 rounded text-xs border ${priorityStyle(
                  form.priority
                )}`}
              >
                {form.priority}
              </span>

            </p>

            <p>
              <b>Department:</b>{" "}
              {form.department || "-"}
            </p>

            {/* FILES */}
            {files.length > 0 && (
              <div>

                <p className="font-medium">
                  New Files
                </p>

                <ul className="mt-2 text-sm space-y-1">

                  {files.map((f, i) => (
                    <li key={i}>
                      {f.name}
                    </li>
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