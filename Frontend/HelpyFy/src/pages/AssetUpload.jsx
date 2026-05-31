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

  /* =========================
     CLEAN VALUE
  ========================= */
  const clean = (v) => (v ? v.toString().trim() : "");

  /* =========================
     FUZZY MATCH ENGINE (AI CORE)
  ========================= */
  const similarity = (a, b) => {
    const str1 = a.toLowerCase().replace(/[^a-z0-9]/g, "");
    const str2 = b.toLowerCase().replace(/[^a-z0-9]/g, "");

    if (str1 === str2) return 1;

    let matches = 0;
    const len = Math.max(str1.length, str2.length);

    for (let i = 0; i < Math.min(str1.length, str2.length); i++) {
      if (str1[i] === str2[i]) matches++;
    }

    return matches / len;
  };

  /* =========================
     AI SMART MAPPER
  ========================= */
  const fuzzyMapRow = (row, allowedFields) => {
    const cleaned = {};
    const rowKeys = Object.keys(row);

    allowedFields.forEach((field) => {
      let bestMatch = null;
      let bestScore = 0;

      rowKeys.forEach((key) => {
        const score = similarity(field, key);

        if (score > bestScore) {
          bestScore = score;
          bestMatch = key;
        }
      });

      if (bestScore >= 0.6) {
        cleaned[field] = row[bestMatch];
      } else {
        cleaned[field] = "";
      }
    });

    return cleaned;
  };

  /* =========================
     DETECT TYPE
  ========================= */
  const detectType = (row) => {
    const keys = Object.keys(row).map((k) =>
      k.toLowerCase().replace(/[-_\s]/g, "")
    );

    if (
      keys.includes("imei") ||
      keys.includes("simnumber") ||
      keys.includes("salesmancode")
    ) {
      return "HHT";
    }

    if (
      keys.includes("printerserial") ||
      keys.includes("printermodel")
    ) {
      return "Printer";
    }

    return "Employee";
  };

  /* =========================
     FILE HANDLER
  ========================= */
  const handleFile = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);

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
          raw: false,
        });

        if (!json.length) {
          toast.error("Excel is empty");
          return;
        }

        const detected = detectType(json[0]);
        setFileType(detected);

        /* ================= EMPLOYEE ================= */
        if (detected === "Employee") {
          const formatted = json.map((r) => {
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

          setRows(formatted);
        }

        /* ================= HHT ================= */
        if (detected === "HHT") {
          const formatted = json.map((r) => {
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

          setRows(formatted);
        }

        /* ================= PRINTER ================= */
        if (detected === "Printer") {
          const formatted = json.map((r) => {
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

          setRows(formatted);
        }
      } catch (err) {
        console.error(err);
        toast.error("Invalid Excel file");
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  /* =========================
     VALIDATION
  ========================= */
  const isValid = (r) => {
    if (r.type === "Employee") return r.staffCode && r.name;
    if (r.type === "HHT") return r.assetCode && r.imei;
    if (r.type === "Printer") return r.assetCode && r.serialNumber;
    return false;
  };

  const validCount = rows.filter(isValid).length;
  const invalidCount = rows.length - validCount;

  /* =========================
     UPLOAD
  ========================= */
  const uploadExcel = async () => {
    try {
      setLoading(true);

      const valid = rows.filter(isValid);

      if (!valid.length) {
        toast.error("No valid rows found");
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
      console.error(err);
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     UI
  ========================= */
  return (
    <div className="p-6 bg-[#f5f7fa] min-h-screen">
      {/* ================= BACK NAVIGATION ================= */}
      <div className="mb-4">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition shadow-sm text-sm font-semibold"
        >
          ← Back
        </button>
      </div>
      <h1 className="text-3xl font-bold text-[#0a2342] mb-2">
        Upload
      </h1>

      <p className="text-gray-500 mb-5">
        Smart Excel upload
      </p>

      <div className="bg-white p-5 rounded-2xl border shadow-sm">

        <input
          type="file"
          onChange={handleFile}
          className="mb-4"
        />

        {file && (
          <div className="mb-4">
            <p>📄 {file.name}</p>
            <p className="text-blue-600 font-semibold">
              Detected: {fileType}
            </p>

            <p className="text-green-600">
              Valid: {validCount} | Invalid: {invalidCount}
            </p>
          </div>
        )}

        {rows.length > 0 && (
          <div className="overflow-auto border rounded-xl">

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
                    className={
                      isValid(r) ? "" : "bg-red-100"
                    }
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