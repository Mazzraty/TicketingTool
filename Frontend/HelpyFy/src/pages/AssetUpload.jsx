import { useState } from "react";
import * as XLSX from "xlsx";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function EmployeeExcelUpload() {
  const [rows, setRows] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  /* =========================
     CLEAN VALUE
  ========================= */
  const clean = (v) => (v ? v.toString().trim() : "");

  /* =========================
     FILE HANDLER (FIXED)
  ========================= */
  const handleFile = (e) => {
    const file = e.target.files[0];
    setFile(file);

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target.result, {
          type: "array",
        });

        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        const json = XLSX.utils.sheet_to_json(sheet, {
          defval: "",
          raw: false,
        });

        // SAFETY CHECK (BIG FILE)
        if (json.length > 2000) {
          toast.error("File too large (Max 2000 rows)");
          return;
        }

        const formatted = json.map((r) => {
          const normalize = (obj) => {
            const cleaned = {};
            Object.keys(obj).forEach((k) => {
              const key = k
                .trim()
                .toLowerCase()
                .replace(/[-_\s]+/g, "");
              cleaned[key] = obj[k];
            });
            return cleaned;
          };

          const row = normalize(r);

          return {
            staffCode: clean(
              row["staffcode"] ||
              row["employeeid"] ||
              row["code"] ||
              row["empid"]
            ),

            name: clean(
              row["fullname"] ||
              row["employeename"] ||
              row["name"]
            ),

            department: clean(row["department"] || row["dept"]),
            designation: clean(row["designation"] || row["position"]),
            division: clean(row["division"] || row["businessunit"]),
            placeOfWork: clean(
              row["placeofwork"] ||
              row["place"] ||
              row["workplace"]
            ),
            visaNo: clean(row["visa"] || row["visano"]),
            dateOfJoining: clean(
              row["dateofjoining"] ||
              row["joiningdate"] ||
              row["date"]
            ),
          };
        });

        setRows(formatted);
      } catch (err) {
        console.error(err);
        toast.error("Invalid Excel file");
      }
    };

    reader.readAsArrayBuffer(file);
  };

  /* =========================
     VALIDATION
  ========================= */
  const isValid = (r) =>
    r.staffCode?.trim() && r.name?.trim();

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

      const res = await api.post("/employees/bulk-upload", {
        employees: valid,
      });

      toast.success(
        `Inserted: ${res.data.inserted} | Skipped: ${res.data.skipped}`
      );

      setRows([]);
      setFile(null);
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.message || "Upload failed"
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     UI
  ========================= */
  return (
    <div className="p-6">

      <h2 className="text-lg font-bold mb-4">
        Employee Excel Upload
      </h2>

      <input type="file" onChange={handleFile} />

      {file && (
        <p className="mt-2 text-sm text-gray-600">
          📄 {file.name}
        </p>
      )}

      {/* SUMMARY */}
      {rows.length > 0 && (
        <div className="mt-3 text-sm text-gray-600">
          ✅ Valid: {validCount} | ❌ Invalid: {invalidCount}
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <p className="text-blue-600 mt-2">
          Uploading employees...
        </p>
      )}

      {/* TABLE PREVIEW */}
      {rows.length > 0 && (
        <table className="w-full mt-4 border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th>Staff Code</th>
              <th>Name</th>
              <th>Department</th>
              <th>Designation</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r, i) => (
              <tr
                key={i}
                className={
                  isValid(r)
                    ? "bg-white"
                    : "bg-red-100"
                }
              >
                <td>{r.staffCode}</td>
                <td>{r.name}</td>
                <td>{r.department}</td>
                <td>{r.designation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* UPLOAD BUTTON */}
      <button
        onClick={uploadExcel}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 mt-4 rounded"
      >
        {loading ? "Uploading..." : "Upload Employees"}
      </button>

    </div>
  );
}