import { useState } from "react";
import * as XLSX from "xlsx";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function PrinterUpload() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");

  const clean = (v) => (v ? v.toString().trim() : "");

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = (event) => {
      const workbook = XLSX.read(event.target.result, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);

      const formatted = json.map((r) => ({
        type: "Printer",
        assetCode: clean(r.assetCode),
        model: clean(r.model),
        serialNumber: clean(r.serialNumber),
        route: clean(r.route),
        salesmanCode: clean(r.salesmanCode),
        salesmanName: clean(r.salesmanName),
        supervisor: clean(r.supervisor),
        notes: clean(r.notes),
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

      const res = await api.post("/assets/bulk-upload", {
        assets: valid,
      });

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

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Printer Bulk Upload
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

      {/* UPLOAD CARD */}
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
              or click to browse
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

        {/* TABLE */}
        {rows.length > 0 && (
          <div className="mt-6 overflow-x-auto border rounded-xl">
            <table className="w-full text-sm">

              <thead className="bg-gray-100 text-xs uppercase">
                <tr>
                  <th className="p-3 text-left">Asset Code</th>
                  <th className="p-3 text-left">Model</th>
                  <th className="p-3 text-left">Serial</th>
                  <th className="p-3 text-left">Route</th>
                  <th className="p-3 text-left">Salesman</th>
                  <th className="p-3 text-left">Supervisor</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={i}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="p-3">{r.assetCode}</td>
                    <td className="p-3">{r.model}</td>
                    <td className="p-3">{r.serialNumber}</td>
                    <td className="p-3">{r.route}</td>
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

        {/* ACTION BUTTON */}
        {rows.length > 0 && (
          <div className="flex justify-end mt-6">
            <button
              onClick={upload}
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Uploading..." : "Upload Printers"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}