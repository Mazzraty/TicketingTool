import { useState } from "react";
import * as XLSX from "xlsx";
import api from "../api/axios";
import toast from "react-hot-toast";

/* =========================
   SCHEMAS (SAP STYLE)
========================= */
const ALLOWED_EMPLOYEE_FIELDS = [
  "company",
  "staffCode",
  "name",
  "department",
  "designation",
  "division",
  "placeOfWork",
  "visaNo",
  "dateOfJoining",
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
     FUZZY MATCH ENGINE
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

      cleaned[field] = bestScore >= 0.6 ? row[bestMatch] : "";
    });

    return cleaned;
  };

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

        setFileType("Employee");

        const formatted = json.map((r) => {
          const row = fuzzyMapRow(
            r,
            ALLOWED_EMPLOYEE_FIELDS
          );

          return {
            type: "Employee",
            company: clean(row.company),
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
      } catch (err) {
        console.error(err);
        toast.error("Invalid Excel file");
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const isValid = (r) => {
    return r.staffCode && r.name;
  };

  const validCount = rows.filter(isValid).length;
  const invalidCount = rows.length - validCount;

  const uploadExcel = async () => {
    try {
      setLoading(true);

      const valid = rows.filter(isValid);

      if (!valid.length) {
        toast.error("No valid employees found");
        return;
      }

      const res = await api.post(
        "/employees/bulk-upload",
        {
          employees: valid,
        }
      );

      toast.success(
        `Employees Inserted: ${res.data.inserted}`
      );

      setRows([]);
      setFile(null);
    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.message ||
        "Upload failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Employee Excel Upload
          </h1>

          <p className="text-sm text-gray-500">
            Bulk Employee Upload
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

        {/* DROP ZONE */}
        <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer hover:bg-gray-50 transition">

          <input
            type="file"
            onChange={handleFile}
            className="hidden"
          />

          <p className="text-lg font-semibold text-gray-700">
            📤 Drag & Drop Excel File
          </p>
          <p className="text-sm text-gray-500 mt-1">
            or click to browse
          </p>

          {file && (
            <p className="mt-3 text-sm text-blue-600">
              {file.name}
            </p>
          )}
        </label>

        {/* STATS */}
        {rows.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-6">

            <div className="bg-gray-50 p-4 rounded-xl border text-center">
              Total
              <div className="font-bold text-xl">{rows.length}</div>
            </div>

            <div className="bg-green-50 p-4 rounded-xl border text-center">
              Valid
              <div className="font-bold text-green-700 text-xl">
                {validCount}
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-xl border text-center">
              Invalid
              <div className="font-bold text-red-600 text-xl">
                {invalidCount}
              </div>
            </div>

          </div>
        )}

        {/* TABLE */}
        {rows.length > 0 && (
          <div className="mt-6 overflow-x-auto border rounded-xl">

            <table className="w-full text-sm">

              <thead className="bg-gray-100">
                <tr>
                  {Object.keys(rows[0]).map((h) => (
                    <th key={h} className="p-3 text-left border">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={i}
                    className={`border-t ${isValid(r) ? "" : "bg-red-100"
                      }`}
                  >
                    {Object.values(r).map((v, j) => (
                      <td key={j} className="p-3 border">
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
        {rows.length > 0 && (
          <div className="flex justify-end mt-6">
            <button
              onClick={uploadExcel}
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-[#0a6ed1] text-white font-semibold hover:bg-[#085caf] disabled:opacity-50"
            >
              {loading ? "Uploading..." : "Upload Employees"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}