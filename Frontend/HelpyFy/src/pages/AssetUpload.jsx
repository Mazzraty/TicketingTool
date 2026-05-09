import { useState } from "react";
import * as XLSX from "xlsx";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function EmployeeExcelUpload() {
  const [rows, setRows] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // ----------------------------
  // FILE UPLOAD
  // ----------------------------
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

      console.log("📄 RAW EXCEL:", json);

      const formatted = json.map((r) => ({
        employeeId:
          r.employeeId ||
          r["Employee ID"] ||
          r["Staff Code"] ||
          "",

        name:
          r.name ||
          r["Full Name"] ||
          r["Employee Name"] ||
          "",

        department: r.department || "",
        designation: r.designation || r.position || "",
        division: r.division || "",
        placeOfWork: r.placeOfWork || "",
        visaNo: r.visaNo || "",
        dateOfJoining: r.dateOfJoining || "",
      }));

      setRows(formatted);
    };

    reader.readAsBinaryString(file);
  };

  const isValid = (r) => r.employeeId && r.name;

  // ----------------------------
  // UPLOAD
  // ----------------------------
  const uploadExcel = async () => {
    try {
      setLoading(true);

      const valid = rows.filter(isValid);

      if (!valid.length) {
        toast.error("No valid rows found");
        return;
      }

      const payload = {
        employees: valid.map((r) => ({
          staffCode: r.employeeId,
          name: r.name,
          department: r.department,
          designation: r.designation,
          division: r.division,
          placeOfWork: r.placeOfWork,
          visaNo: r.visaNo,
          dateOfJoining: r.dateOfJoining,
        })),
      };

      console.log("📦 FINAL PAYLOAD:", payload);

      const res = await api.post("/employees/bulk-upload", payload);

      toast.success(
        `Inserted: ${res.data.inserted} | Skipped: ${res.data.skipped}`
      );

      setRows([]);
      setFile(null);

    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Upload failed");
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

      {file && <p>📄 {file.name}</p>}

      {rows.length > 0 && (
        <table className="w-full mt-4 border">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Dept</th>
              <th>Designation</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r, i) => (
              <tr
                key={i}
                style={{
                  background: isValid(r) ? "white" : "#ffe5e5",
                }}
              >
                <td>{r.employeeId}</td>
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
        {loading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}