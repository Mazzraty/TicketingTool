import { useState } from "react";
import * as XLSX from "xlsx";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function EmployeeExcelUpload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFile = (e) => {
    setFile(e.target.files[0]);
  };

  const uploadExcel = async () => {
    if (!file) return toast.error("Select Excel file");

    setLoading(true);

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: "binary" });

        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        if (jsonData.length === 0) {
          setLoading(false);
          return toast.error("Excel is empty");
        }

        await api.post("/employees/bulk-upload", {
          employees: jsonData,
        });

        toast.success("Employees uploaded successfully");
        setFile(null);

      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.message || "Upload failed");
      } finally {
        setLoading(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  return (
    <div className="p-5 bg-white rounded-xl shadow border">
      <h2 className="text-lg font-bold mb-3">Employee Bulk Upload</h2>

      <input type="file" accept=".xlsx, .xls" onChange={handleFile} />

      <button
        onClick={uploadExcel}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded mt-3"
      >
        {loading ? "Uploading..." : "Upload Excel"}
      </button>
    </div>
  );
}