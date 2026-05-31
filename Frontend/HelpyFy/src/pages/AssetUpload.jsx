import { useState } from "react";
import * as XLSX from "xlsx";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function AssetUploadFiori() {
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);

  const clean = (v) => (v ? v.toString().trim() : "");

  /* ================= FILE ================= */
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target.result, {
          type: "array",
        });

        const sheet =
          workbook.Sheets[workbook.SheetNames[0]];

        const json = XLSX.utils.sheet_to_json(sheet, {
          defval: "",
        });

        const formatted = json.map((r) => ({
          type: clean(r.type || r.Type),
          assetCode: clean(r.assetCode),
          model: clean(r.model),
          serialNumber: clean(r.serialNumber),
          imei: clean(r.imei),
          simNumber: clean(r.simNumber),
          salesmanCode: clean(r.salesmanCode),
          salesmanName: clean(r.salesmanName),
          supervisor: clean(r.supervisor),
          route: clean(r.route),
          staffCode: clean(r.staffCode),
          name: clean(r.name),
        }));

        setRows(formatted);
      } catch (err) {
        console.error(err);
        toast.error("Invalid Excel file");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  /* ================= VALID ================= */
  const isValid = (r) => {
    if (r.type === "Employee") return r.staffCode && r.name;
    if (r.type === "HHT") return r.assetCode && r.imei;
    if (r.type === "Printer") return r.assetCode && r.serialNumber;
    if (r.type === "Laptop") return r.assetCode && r.serialNumber;
    return false;
  };

  const validCount = rows.filter(isValid).length;
  const invalidCount = rows.length - validCount;

  /* ================= UPLOAD ================= */
  const upload = async () => {
    try {
      setLoading(true);

      const valid = rows.filter(isValid);

      if (!valid.length) {
        toast.error("No valid rows found");
        return;
      }

      const res = await api.post("/assets/bulk-upload", {
        assets: valid,
      });

      toast.success(`Inserted: ${res.data.inserted}`);

      setRows([]);
      setFileName("");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.msg || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-[#f4f6f9] p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Asset Bulk Upload
          </h1>
          <p className="text-sm text-gray-500">
            Upload Employees / Printers / HHT / Laptop Excel file
          </p>
        </div>

        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 rounded-xl bg-white border text-gray-700 hover:bg-gray-100 text-sm"
        >
          ← Back
        </button>
      </div>

      {/* CARD */}
      <div className="bg-white border rounded-2xl p-6 shadow-sm">

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
              or click to browse file
            </p>

            {fileName && (
              <p className="mt-3 text-sm text-blue-600">
                Selected: {fileName}
              </p>
            )}
          </div>
        </label>

        {/* STATS */}
        {rows.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-6">

            <div className="bg-gray-50 p-4 rounded-xl border text-center">
              <p className="text-xs text-gray-500">Total</p>
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

        {/* TABLE */}
        {rows.length > 0 && (
          <div className="mt-6 overflow-x-auto border rounded-xl">

            <table className="w-full text-sm">

              <thead className="bg-gray-100 text-xs uppercase">
                <tr>
                  <th className="p-3 text-left">Type</th>
                  <th className="p-3 text-left">Asset Code</th>
                  <th className="p-3 text-left">Model</th>
                  <th className="p-3 text-left">Serial / IMEI</th>
                  <th className="p-3 text-left">Salesman</th>
                  <th className="p-3 text-left">Supervisor</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={i}
                    className={`border-t hover:bg-gray-50 ${
                      isValid(r) ? "" : "bg-red-100"
                    }`}
                  >
                    <td className="p-3 font-semibold">
                      {r.type}
                    </td>

                    <td className="p-3">{r.assetCode}</td>
                    <td className="p-3">{r.model}</td>

                    <td className="p-3">
                      {r.serialNumber || r.imei}
                    </td>

                    <td className="p-3">
                      {r.salesmanCode} - {r.salesmanName}
                    </td>

                    <td className="p-3">{r.supervisor}</td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}

        {/* BUTTON */}
        {rows.length > 0 && (
          <div className="flex justify-end mt-6">
            <button
              onClick={upload}
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-[#0a6ed1] text-white font-semibold hover:bg-[#085caf] disabled:opacity-50"
            >
              {loading ? "Uploading..." : "Upload Assets"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}