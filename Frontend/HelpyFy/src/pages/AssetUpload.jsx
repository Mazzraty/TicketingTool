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
    if (!file) return toast.error("Please select an Excel file");

    setLoading(true);

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = e.target.result;

        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json(sheet);

        if (!jsonData.length) {
          toast.error("Excel file is empty");
          setLoading(false);
          return;
        }

        // 🔥 SEND TO EMPLOYEE API
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
    <div className="min-h-screen bg-[#f4f6f9] p-6">

      {/* HEADER */}
      <div className="bg-white border rounded-xl p-5 shadow-sm mb-6">
        <h1 className="text-xl font-bold text-gray-800">
          Employee Excel Upload
        </h1>
        <p className="text-sm text-gray-500">
          Upload employee master data using Excel file
        </p>
      </div>

      {/* CARD */}
      <div className="bg-white border rounded-xl shadow-sm p-6 max-w-3xl">

        {/* FILE INPUT */}
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50">

          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFile}
            className="w-full cursor-pointer"
          />

          <p className="text-sm text-gray-500 mt-2">
            Select Excel file (.xlsx / .xls)
          </p>

          {file && (
            <div className="mt-4 inline-block px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              📄 {file.name}
            </div>
          )}

        </div>

        {/* INFO */}
        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
          ✔ Columns required: employeeId, name, department, position
        </div>

        {/* BUTTON */}
        <div className="mt-5 flex justify-end">
          <button
            onClick={uploadExcel}
            disabled={loading}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {loading ? "Uploading..." : "Upload Employees"}
          </button>
        </div>

      </div>
    </div>
  );
}