import { useEffect, useState } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";

const INITIAL_FORM = {
  title: "",
  description: "",
  priority: "Medium",
  department: "IT",
  assetId: "",
};

const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const DEPARTMENTS = ["IT", "HR", "Finance", "Operations"];

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
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-5">Create Manual Ticket</h1>

      <form onSubmit={submitHandler} className="space-y-4">
        <input
          className="border p-3 w-full"
          placeholder="Issue title"
          value={form.title}
          onChange={handleChange("title")}
          required
        />

        <textarea
          className="border p-3 w-full"
          placeholder="Description"
          value={form.description}
          onChange={handleChange("description")}
          required
        />

        <select
          className="border p-3 w-full"
          value={form.assetId}
          onChange={handleChange("assetId")}
        >
          <option value="">Select Asset</option>
          {assets.map((asset) => (
            <option key={asset._id} value={asset._id}>
              {asset.assetCode} - {asset.type}
            </option>
          ))}
        </select>

        <select
          className="border p-3 w-full"
          value={form.department}
          onChange={handleChange("department")}
        >
          {DEPARTMENTS.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>

        <select
          className="border p-3 w-full"
          value={form.priority}
          onChange={handleChange("priority")}
        >
          {PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white px-5 py-3 rounded disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create Ticket"}
        </button>
      </form>
    </div>
  );
}
