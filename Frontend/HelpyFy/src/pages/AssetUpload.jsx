import { useState } from "react";
import * as XLSX from "xlsx";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function EmployeeExcelUpload() {
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [failedRows, setFailedRows] = useState([]);

  // ----------------------------
  // AUTO DETECT COLUMN VALUE
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

  // ----------------------------
  // FILE HANDLER (PREVIEW MODE)
  // ----------------------------
  const handleFile = (e) => {
    const file = e.target.files[0];
    setFile(file);

    const reader = new FileReader();

    reader.onload = (event) => {
      const data = event.target.result;
      const workbook = XLSX.read(data, { type: "binary" });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      const json = XLSX.utils.sheet_to_json(sheet, {
        defval: "",
        raw: false,
      });

      const formatted = json.map((r) => ({
        employeeId: detect(r, ["id", "code", "employee", "staff"]),
        name: detect(r, ["name", "employee"]),
        department: detect(r, ["department"]),
        position: detect(r, ["position", "designation"]),
        raw: r,
      }));

      setRows(formatted);
    };

    reader.readAsBinaryString(file);
  };

  // ----------------------------
  // VALIDATION
  // ----------------------------
  const isValid = (r) => r.employeeId && r.name;

  // ----------------------------
  // UPLOAD ONLY VALID ROWS
  // ----------------------------
  const uploadExcel = async () => {
    if (!rows.length) return toast.error("No data found");

    setLoading(true);

    try {
      const valid = rows.filter(isValid);
      const failed = rows.filter((r) => !isValid(r));

      setFailedRows(failed);

      if (!valid.length) {
        toast.error("No valid employee rows found");
        setLoading(false);
        return;
      }

      await api.post("/employees/bulk-upload", {
        employees: valid,
      });

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

  // ----------------------------
  // DOWNLOAD FAILED ROWS
  // ----------------------------
  const downloadFailed = () => {
    const ws = XLSX.utils.json_to_sheet(
      failedRows.map((r) => r.raw)
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "FailedRows");

    XLSX.writeFile(wb, "failed_employees.xlsx");
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] p-6">

      {/* HEADER */}
      <div className="bg-white border rounded-xl p-5 shadow-sm mb-6">
        <h1 className="text-xl font-bold">
          Employee Excel Upload (SAP Mode)
        </h1>
        <p className="text-gray-500 text-sm">
          Auto-detect + preview + validation system
        </p>
      </div>

      {/* UPLOAD BOX */}
      <div className="bg-white border rounded-xl p-6">

        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFile}
        />

        {file && (
          <p className="mt-2 text-sm text-blue-600">
            📄 {file.name}
          </p>
        )}

        {/* TABLE PREVIEW */}
        {rows.length > 0 && (
          <div className="mt-6 overflow-x-auto">

            <table className="w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Employee ID</th>
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Department</th>
                  <th className="p-2 border">Position</th>
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
                    <td className="p-2 border">{r.employeeId}</td>
                    <td className="p-2 border">{r.name}</td>
                    <td className="p-2 border">{r.department}</td>
                    <td className="p-2 border">{r.position}</td>
                  </tr>
                ))}
              </tbody>
            </table>

          </div>
        )}

        {/* BUTTONS */}
        <div className="mt-5 flex gap-3">

          <button
            onClick={uploadExcel}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {loading ? "Uploading..." : "Upload Valid Rows"}
          </button>

          {failedRows.length > 0 && (
            <button
              onClick={downloadFailed}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Download Failed Rows
            </button>
          )}

        </div>

      </div>
    </div>
  );
}