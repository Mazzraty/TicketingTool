import { useState } from "react";
import * as XLSX from "xlsx";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function EmployeeExcelUpload() {
  const [rows, setRows] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const uploadExcel = async () => {
    try {
      setLoading(true);

      const valid = rows.filter(isValid);

      if (!valid.length) {
        toast.error("No valid rows found");
        return;
      }

      // 🔥 FIXED PAYLOAD (IMPORTANT PART)
      const payload = {
        employees: valid.map((r) => ({
          staffCode: r.employeeId,
          name: r.name,
          department: r.department,
          designation: r.position,
        })),
      };

      await api.post("/employees/bulk-upload", payload);

      toast.success(`Uploaded ${valid.length} employees`);
      setRows([]);
      setFile(null);

    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white">
      <input type="file" onChange={handleFile} />

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
              <tr key={i}>
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
        {loading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}