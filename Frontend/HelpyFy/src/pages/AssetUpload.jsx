import { useState } from "react";
import * as XLSX from "xlsx";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function EmployeeExcelUpload() {
  const [rows, setRows] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // ----------------------------
  // FILE PARSER
  // ----------------------------
  const detect = (obj, keys) => {
    for (let k of Object.keys(obj)) {
      for (let match of keys) {
        if (k.toLowerCase().includes(match.toLowerCase())) {
          return obj[k];
        }
      }
    }
    return "";
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    setFile(file);

    const reader = new FileReader();

    reader.onload = (event) => {
      const workbook = XLSX.read(event.target.result, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, {
        defval: "",
        raw: false,
      });

      const formatted = json.map((r) => ({
        employeeId: detect(r, ["id", "code", "staff", "employee"]),
        name: detect(r, ["name"]),
        department: detect(r, ["department"]),
        position: detect(r, ["position", "designation"]),
      }));

      setRows(formatted);
    };

    reader.readAsBinaryString(file);
  };

  const isValid = (r) => r.employeeId && r.name;

  // ----------------------------
  // UPLOAD FUNCTION (FIXED)
  // ----------------------------
  const uploadExcel = async () => {
    try {
      setLoading(true);

      const valid = rows.filter(isValid);

      if (!valid.length) {
        toast.error("No valid rows found");
        return;
      }

      // 🔥 FINAL FIXED PAYLOAD
      const payload = {
        employees: valid.map((r) => ({
          staffCode: r.employeeId,
          name: r.name,
          department: r.department,
          designation: r.position,
        })),
      };

      console.log("📦 PAYLOAD SENT:", payload);

      const res = await api.post("/employees/bulk-upload", payload);

      console.log("📥 RESPONSE:", res);

      toast.success(
        `Uploaded: ${res.data.inserted || valid.length} employees`
      );

      setRows([]);
      setFile(null);

    } catch (err) {
      console.error("❌ UPLOAD ERROR:", err);

      const msg =
        err.response?.data?.message ||
        err.response?.status === 401
          ? "Unauthorized (Check login/token)"
          : "Upload failed";

      toast.error(msg);

    } finally {
      setLoading(false);
    }
  };

  // ----------------------------
  // UI
  // ----------------------------
  return (
    <div className="p-6 bg-white">

      <h2 className="text-lg font-bold mb-4">
        Employee Excel Upload
      </h2>

      <input type="file" onChange={handleFile} />

      {file && (
        <p className="mt-2 text-blue-600">
          📄 {file.name}
        </p>
      )}

      {/* PREVIEW TABLE */}
      {rows.length > 0 && (
        <table className="w-full mt-4 border">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Department</th>
              <th>Position</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r, i) => (
              <tr
                key={i}
                style={{
                  backgroundColor: isValid(r)
                    ? "white"
                    : "#ffe5e5",
                }}
              >
                <td>{r.employeeId}</td>
                <td>{r.name}</td>
                <td>{r.department}</td>
                <td>{r.position}</td>
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