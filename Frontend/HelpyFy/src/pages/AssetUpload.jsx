import { useState } from "react";
import * as XLSX from "xlsx";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function EmployeeExcelUpload() {
  const [rows, setRows] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // ----------------------------
  // FILE HANDLER (FIXED)
  // ----------------------------
  const handleFile = (e) => {
    const file = e.target.files[0];
    setFile(file);

    const reader = new FileReader();

    reader.onload = (event) => {
      const workbook = XLSX.read(event.target.result, {
        type: "binary",
      });

      const sheet =
        workbook.Sheets[workbook.SheetNames[0]];

      const json = XLSX.utils.sheet_to_json(sheet, {
        defval: "",
        raw: false,
      });

      console.log("RAW EXCEL:", json);

      const formatted = json.map((r) => {
        // normalize keys (remove spaces + lowercase)
        const normalize = (obj) => {
          const cleaned = {};
          Object.keys(obj).forEach((k) => {
            cleaned[k.trim().toLowerCase()] = obj[k];
          });
          return cleaned;
        };

        const row = normalize(r);

        return {
          staffCode:
            row["staff code"] ||
            row["employee id"] ||
            row["staffcode"] ||
            row["code"] ||
            "",

          name:
            row["full name"] ||
            row["employee name"] ||
            row["name"] ||
            "",

          department: row["department"] || "",
          designation: row["designation"] || "",
          division: row["division"] || "",
          placeOfWork: row["place"] || "",
          visaNo: row["visa"] || "",
          dateOfJoining: row["date"] || "",
        };
      });

      console.log("FORMATTED:", formatted);

      setRows(formatted);
    };

    reader.readAsBinaryString(file);
  };

  // ----------------------------
  // VALIDATION
  // ----------------------------
  const isValid = (r) =>
    r.staffCode?.toString().trim() &&
    r.name?.toString().trim();

  // ----------------------------
  // UPLOAD
  // ----------------------------
  const uploadExcel = async () => {
    try {
      setLoading(true);

      const valid = rows.filter(isValid);

      console.log("VALID ROWS:", valid);

      if (!valid.length) {
        toast.error("No valid rows found");
        return;
      }

      const payload = {
        employees: valid,
      };

      console.log("FINAL PAYLOAD:", payload);

      const res = await api.post(
        "/employees/bulk-upload",
        payload
      );

      toast.success(
        `Inserted: ${res.data.inserted} | Skipped: ${res.data.skipped}`
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

  // ----------------------------
  // UI
  // ----------------------------
  return (
    <div className="p-6">
      <h2 className="text-lg font-bold mb-4">
        Employee Excel Upload
      </h2>

      <input type="file" onChange={handleFile} />

      {file && (
        <p className="mt-2">📄 {file.name}</p>
      )}

      {rows.length > 0 && (
        <table className="w-full mt-4 border">
          <thead>
            <tr>
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
                style={{
                  background: isValid(r)
                    ? "white"
                    : "#ffe5e5",
                }}
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

      <button
        onClick={uploadExcel}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 mt-4"
      >
        {loading ? "Uploading..." : "Upload Employees"}
      </button>
    </div>
  );
}