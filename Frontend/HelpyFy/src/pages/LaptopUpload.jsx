import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function LaptopUpload() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");

  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const isSuperAdmin = user?.role === "super_admin";

  const clean = (v) => (v ? v.toString().trim() : "");

  // load companies for super admin
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/companies");
        const payload = res.data;
        const list = Array.isArray(payload)
          ? payload
          : payload?.companies || [];
        setCompanies(list);
      } catch (err) {
        console.error(err);
      }
    };

    if (isSuperAdmin) load();
  }, [isSuperAdmin]);

  // 🔥 DOWNLOAD SAMPLE TEMPLATE
  const downloadTemplate = () => {
    const sample = [
      {
        assetCode: 1052,
        model: "Dell 3510 laptop",
        serialNumber: "9RDQJ34",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sample);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laptops");
    XLSX.writeFile(workbook, "laptop_upload_template.xlsx");
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = (event) => {
      const workbook = XLSX.read(event.target.result, {
        type: "array",
      });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);

      const formatted = json.map((r) => ({
        type: "Laptop",
        assetCode: clean(r.assetCode),
        model: clean(r.model),
        serialNumber: clean(r.serialNumber),
      }));

      setRows(formatted);
    };

    reader.readAsArrayBuffer(file);
  };

  const upload = async () => {
    try {
      setLoading(true);

      const valid = rows.filter(
        (r) => r.assetCode && r.serialNumber
      );

      const payload = { assets: valid };

      if (isSuperAdmin) {
        if (!selectedCompany) {
          toast.error("Please select company");
          setLoading(false);
          return;
        }
        payload.companyId = selectedCompany;
      }

      const res = await api.post("/assets/bulk-upload", payload);

      toast.success(`Inserted: ${res.data.inserted}`);

      setRows([]);
      setFileName("");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const validCount = rows.filter(
    (r) => r.assetCode && r.serialNumber
  ).length;

  const invalidCount = rows.length - validCount;

  return (
    <div className="min-h-screen bg-[#f4f6f9] p-6">

      {/* 🔥 COMPANY SELECT (ONLY SUPER ADMIN) */}
      {isSuperAdmin && (
        <div className="mb-4 bg-white p-3 rounded-xl border">
          <label className="text-sm font-semibold text-gray-600">
            Select Company
          </label>

          <select
            className="w-full mt-2 p-2 border rounded"
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
          >
            <option value="">-- Choose Company --</option>
            {companies.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* HEADER (PRINTER STYLE) */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Laptop Bulk Upload
          </h1>
          <p className="text-sm text-gray-500">
            Upload Excel file (.xlsx / .xls)
          </p>
        </div>

        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 rounded-xl bg-white border text-gray-700 hover:bg-gray-100 text-sm"
        >
          ← Back
        </button>
      </div>

      {/* UPLOAD CARD (PRINTER STYLE UI) */}
      <div className="bg-white border rounded-2xl p-6 shadow-sm">

        {/* TEMPLATE HINT + DOWNLOAD */}
        <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
          <p className="text-sm text-blue-700">
            File must have columns: <b>assetCode</b>, <b>model</b>, <b>serialNumber</b>
          </p>
          <button
            onClick={downloadTemplate}
            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
          >
            ⬇ Download Template
          </button>
        </div>

        {/* DROP AREA */}
        <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer hover:bg-gray-50 transition">

          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFile}
            className="hidden"
          />

          <div className="text-center">
            <p className="text-lg font-semibold text-gray-700">
              📤 Drag & Drop Excel File
            </p>
            <p className="text-sm text-gray-500 mt-1">
              or click to browse (use the template above)
            </p>

            {fileName && (
              <p className="mt-3 text-sm text-blue-600">
                Selected: {fileName}
              </p>
            )}
          </div>
        </label>

        {/* STATS (PRINTER STYLE) */}
        {rows.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-6">

            <div className="bg-gray-50 p-4 rounded-xl border text-center">
              <p className="text-xs text-gray-500">Total Rows</p>
              <p className="text-xl font-bold">{rows.length}</p>
            </div>

            <div className="bg-green-50 p-4 rounded-xl border text-center">
              <p className="text-xs text-green-600">Valid</p>
              <p className="text-xl font-bold text-green-700">
                {validCount}
              </p>
            </div>

            <div className="bg-red-50 p-4 rounded-xl border text-center">
              <p className="text-xs text-red-500">Invalid</p>
              <p className="text-xl font-bold text-red-600">
                {invalidCount}
              </p>
            </div>

          </div>
        )}

        {/* TABLE (PRINTER STYLE) */}
        {rows.length > 0 && (
          <div className="mt-6 overflow-x-auto border rounded-xl">

            <table className="w-full text-sm">

              <thead className="bg-gray-100 text-xs uppercase">
                <tr>
                  <th className="p-3 text-left">Asset Code</th>
                  <th className="p-3 text-left">Model</th>
                  <th className="p-3 text-left">Serial Number</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="p-3">{r.assetCode}</td>
                    <td className="p-3">{r.model}</td>
                    <td className="p-3">{r.serialNumber}</td>
                  </tr>
                ))}
              </tbody>

            </table>

          </div>
        )}

        {/* ACTION BUTTON (PRINTER STYLE) */}
        {rows.length > 0 && (
          <div className="flex justify-end mt-6">
            <button
              onClick={upload}
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Uploading..." : "Upload Laptops"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
