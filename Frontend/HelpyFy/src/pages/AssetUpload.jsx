import { useState } from "react";
import * as XLSX from "xlsx";
import api from "../api/axios";
import toast from "react-hot-toast";

/* =========================
   SCHEMAS (SAP STYLE)
========================= */
const ALLOWED_EMPLOYEE_FIELDS = [
  "staffCode",
  "name",
  "department",
  "designation",
  "division",
  "placeOfWork",
  "visaNo",
  "dateOfJoining",
];

const ALLOWED_HHT_FIELDS = [
  "assetCode",
  "model",
  "imei",
  "simNumber",
  "salesmanCode",
  "salesmanName",
  "supervisor",
  "route",
];

const ALLOWED_PRINTER_FIELDS = [
  "assetCode",
  "model",
  "serialNumber",
  "salesmanCode",
  "salesmanName",
  "supervisor",
  "route",
];

export default function EmployeeExcelUpload() {
  const [rows, setRows] = useState([]);
  const [fileType, setFileType] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const clean = (v) => (v ? v.toString().trim() : "");

  /* ================= FUZZY ================= */
  const similarity = (a, b) => {
    const s1 = a.toLowerCase().replace(/[^a-z0-9]/g, "");
    const s2 = b.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (s1 === s2) return 1;

    let m = 0;
    const len = Math.max(s1.length, s2.length);

    for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
      if (s1[i] === s2[i]) m++;
    }
    return m / len;
  };

  const fuzzyMapRow = (row, fields) => {
    const cleaned = {};
    const keys = Object.keys(row);

    fields.forEach((field) => {
      let best = null;
      let score = 0;

      keys.forEach((k) => {
        const s = similarity(field, k);
        if (s > score) {
          score = s;
          best = k;
        }
      });

      cleaned[field] = score >= 0.6 ? row[best] : "";
    });

    return cleaned;
  };

  const detectType = (row) => {
    const keys = Object.keys(row).map((k) =>
      k.toLowerCase().replace(/[-_\s]/g, "")
    );

    if (keys.includes("imei") || keys.includes("simnumber"))
      return "HHT";

    if (keys.includes("serialnumber") || keys.includes("printermodel"))
      return "Printer";

    return "Employee";
  };

  /* ================= FILE ================= */
  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;

    setFile(f);

    const reader = new FileReader();

    reader.onload = (event) => {
      const wb = XLSX.read(event.target.result, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, {
        defval: "",
        raw: false,
      });

      if (!json.length) {
        toast.error("Empty file");
        return;
      }

      const type = detectType(json[0]);
      setFileType(type);

      let formatted = [];

      if (type === "Employee") {
        formatted = json.map((r) => {
          const row = fuzzyMapRow(r, ALLOWED_EMPLOYEE_FIELDS);
          return {
            type: "Employee",
            staffCode: clean(row.staffCode),
            name: clean(row.name),
            department: clean(row.department),
            designation: clean(row.designation),
            division: clean(row.division),
            placeOfWork: clean(row.placeOfWork),
            visaNo: clean(row.visaNo),
            dateOfJoining: clean(row.dateOfJoining),
          };
        });
      }

      if (type === "HHT") {
        formatted = json.map((r) => {
          const row = fuzzyMapRow(r, ALLOWED_HHT_FIELDS);
          return {
            type: "HHT",
            assetCode: clean(row.assetCode),
            model: clean(row.model),
            imei: clean(row.imei),
            simNumber: clean(row.simNumber),
            salesmanCode: clean(row.salesmanCode),
            salesmanName: clean(row.salesmanName),
            supervisor: clean(row.supervisor),
            route: clean(row.route),
          };
        });
      }

      if (type === "Printer") {
        formatted = json.map((r) => {
          const row = fuzzyMapRow(r, ALLOWED_PRINTER_FIELDS);
          return {
            type: "Printer",
            assetCode: clean(row.assetCode),
            model: clean(row.model),
            serialNumber: clean(row.serialNumber),
            salesmanCode: clean(row.salesmanCode),
            salesmanName: clean(row.salesmanName),
            supervisor: clean(row.supervisor),
            route: clean(row.route),
          };
        });
      }

      setRows(formatted);
    };

    reader.readAsArrayBuffer(f);
  };

  const isValid = (r) => {
    if (r.type === "Employee") return r.staffCode && r.name;
    if (r.type === "HHT") return r.assetCode && r.imei;
    if (r.type === "Printer") return r.assetCode && r.serialNumber;
    return false;
  };

  const uploadExcel = async () => {
    try {
      setLoading(true);

      const valid = rows.filter(isValid);

      if (!valid.length) {
        toast.error("No valid rows");
        return;
      }

      if (fileType === "Employee") {
        const res = await api.post("/employees/bulk-upload", {
          employees: valid,
        });
        toast.success(`Employees Inserted: ${res.data.inserted}`);
      } else {
        const res = await api.post("/assets/bulk-upload", {
          assets: valid,
        });
        toast.success(`Assets Inserted: ${res.data.inserted}`);
      }

      setRows([]);
      setFile(null);
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI (MATCH PRINTER STYLE) ================= */
  return (
    <div className="p-6 bg-[#f5f7fa] min-h-screen">

      {/* BACK */}
      <div className="mb-4">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 shadow-sm text-sm font-semibold"
        >
          ← Back
        </button>
      </div>

      {/* TITLE */}
      <h2 className="text-2xl font-bold text-gray-800">
        Smart Excel Upload
      </h2>

      <p className="text-gray-500 mb-5">
        Employee / Asset bulk upload system
      </p>

      {/* CARD */}
      <div className="bg-white p-5 rounded-3xl border shadow-sm">

        <input
          type="file"
          onChange={handleFile}
          className="mb-4"
        />

        {file && (
          <div className="mb-4 text-sm">
            <p className="font-semibold">📄 {file.name}</p>
            <p className="text-blue-600">
              Detected: {fileType}
            </p>
            <p className="text-green-600">
              Valid: {rows.filter(isValid).length} | Invalid: {rows.length - rows.filter(isValid).length}
            </p>
          </div>
        )}

        {/* TABLE */}
        {rows.length > 0 && (
          <div className="overflow-auto border rounded-2xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  {Object.keys(rows[0]).map((h) => (
                    <th key={h} className="p-2 border">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={i}
                    className={isValid(r) ? "" : "bg-red-100"}
                  >
                    {Object.values(r).map((v, j) => (
                      <td key={j} className="p-2 border">
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* BUTTON */}
        <button
          onClick={uploadExcel}
          disabled={loading}
          className="mt-5 bg-blue-600 text-white px-6 py-2 rounded-xl"
        >
          {loading ? "Uploading..." : `Upload ${fileType}`}
        </button>
      </div>
    </div>
  );
}