import { useState } from "react";
import * as XLSX from "xlsx";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function LaptopUpload() {
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
        (r) =>
          r.assetCode && r.serialNumber
      );

      const res = await api.post(
        "/assets/bulk-upload",
        { assets: valid }
      );

      toast.success(
        `Inserted: ${res.data.inserted}`
      );

      setRows([]);
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold">
        Laptop Upload
      </h2>

      <input type="file" onChange={handleFile} />

      {rows.length > 0 && (
        <>
          <table className="w-full mt-4 border">
            <thead>
              <tr>
                <th>Asset Code</th>
                <th>Model</th>
                <th>Serial</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.assetCode}</td>
                  <td>{r.model}</td>
                  <td>{r.serialNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            onClick={upload}
            disabled={loading}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
          >
            Upload Laptops
          </button>
        </>
      )}
    </div>
  );
}
