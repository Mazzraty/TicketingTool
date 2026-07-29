import { useEffect, useState } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";

export default function CreateManualTicket() {
  const [assets, setAssets] = useState([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    department: "IT",
    assetId: "",
  });

  useEffect(() => {
    const loadAssets = async () => {
      try {
        const res = await api.get("/assets?limit=1000");
        setAssets(res.data.assets || []);
      } catch (error) {
        console.log(error);
      }
    };

    loadAssets();
  }, []);

  const submitHandler = async (e) => {
    e.preventDefault();

    try {
      await api.post("/tickets/manual", form);
      toast.success("Manual ticket created");

      setForm({
        title: "",
        description: "",
        priority: "Medium",
        department: "IT",
        assetId: "",
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed");
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
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <textarea
          className="border p-3 w-full"
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <select
          className="border p-3 w-full"
          value={form.assetId}
          onChange={(e) => setForm({ ...form, assetId: e.target.value })}
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
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value })}
        >
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
          <option>Critical</option>
        </select>

        <button className="bg-blue-600 text-white px-5 py-3 rounded">
          Create Ticket
        </button>
      </form>
    </div>
  );
}
