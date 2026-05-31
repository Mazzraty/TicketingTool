import { useState } from "react";
import * as XLSX from "xlsx";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function PrinterUpload() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const clean = (v) => (v ? v.toString().trim() : "");

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      const workbook = XLSX.read(event.target.result, {
        type: "array",
      });

      const sheet =
        workbook.Sheets[workbook.SheetNames[0]];

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

      const res = await api.post(
        "/assets/bulk-upload",
        {
          assets: valid,
        }
      );

      toast.success(
        `Inserted: ${res.data.inserted}`
      );

      setRows([]);
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
        <div className="mb-4">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition shadow-sm text-sm font-semibold"
        >
          ← Back
        </button>
      </div>
      <h2 className="text-xl font-bold mb-4">
        Printer Upload
      </h2>

      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFile}
      />

      {rows.length > 0 && (
        <>
          <div className="overflow-auto mt-4">
            <table className="w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2">
                    Asset Code
                  </th>
                  <th className="border p-2">
                    Model
                  </th>
                  <th className="border p-2">
                    Serial
                  </th>
                  <th className="border p-2">
                    Route
                  </th>
                  <th className="border p-2">
                    Salesman Code
                  </th>
                  <th className="border p-2">
                    Salesman Name
                  </th>
                  <th className="border p-2">
                    Supervisor
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td className="border p-2">
                      {r.assetCode}
                    </td>
                    <td className="border p-2">
                      {r.model}
                    </td>
                    <td className="border p-2">
                      {r.serialNumber}
                    </td>
                    <td className="border p-2">
                      {r.route}
                    </td>
                    <td className="border p-2">
                      {r.salesmanCode}
                    </td>
                    <td className="border p-2">
                      {r.salesmanName}
                    </td>
                    <td className="border p-2">
                      {r.supervisor}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={upload}
            disabled={loading}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
          >
            {loading
              ? "Uploading..."
              : "Upload Printers"}
          </button>
        </>
      )}
    </div>
  );
}