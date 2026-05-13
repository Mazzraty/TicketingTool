import { useState } from "react";
import * as XLSX from "xlsx";
import api from "../api/axios";
import toast from "react-hot-toast";

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
     DETECT FILE TYPE
  ========================= */
  const detectType = (row) => {
    const keys = Object.keys(row)
      .map((k) =>
        k.toLowerCase().replace(/[\s_-]/g, "")
      );

    // HHT
    if (
      keys.includes("imei") ||
      keys.includes("simnumber") ||
      keys.includes("salesmancode")
    ) {
      return "HHT";
    }

    // Printer
    if (
      keys.includes("printerserial") ||
      keys.includes("printermodel")
    ) {
      return "Printer";
    }

    // Employee
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
              type: "Employee",

              staffCode: clean(
                row.staffcode ||
                  row.employeeid ||
                  row.code
              ),

              name: clean(
                row.name ||
                  row.fullname ||
                  row.employeename
              ),

              department: clean(row.department),
              designation: clean(row.designation),
              division: clean(row.division),
              placeOfWork: clean(row.placeofwork),
              visaNo: clean(row.visano),
              dateOfJoining: clean(
                row.dateofjoining
              ),
            };
          });

          setRows(formatted);
        }

        /* ================= HHT ================= */
        if (detected === "HHT") {
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
              type: "HHT",

              assetCode: clean(
                row.assetcode ||
                  row.hhtcode ||
                  row.devicecode
              ),

              model: clean(row.model),

              imei: clean(row.imei),

              simNumber: clean(
                row.simnumber || row.sim
              ),

              salesmanCode: clean(
                row.salesmancode
              ),

              salesmanName: clean(
                row.salesmanname
              ),

              supervisor: clean(row.supervisor),

              route: clean(row.route),
            };
          });

          setRows(formatted);
        }

        /* ================= PRINTER ================= */
        if (detected === "Printer") {
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
              type: "Printer",

              assetCode: clean(
                row.assetcode ||
                  row.printercode
              ),

              model: clean(
                row.printermodel || row.model
              ),

              serialNumber: clean(
                row.printerserial ||
                  row.serialnumber
              ),

              salesmanCode: clean(
                row.salesmancode
              ),

              salesmanName: clean(
                row.salesmanname
              ),

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
    if (r.type === "Employee") {
      return r.staffCode && r.name;
    }

    if (r.type === "HHT") {
      return r.assetCode && r.imei;
    }

    if (r.type === "Printer") {
      return r.assetCode && r.serialNumber;
    }

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

      // EMPLOYEE
      if (fileType === "Employee") {
        const res = await api.post(
          "/employees/bulk-upload",
          {
            employees: valid,
          }
        );

        toast.success(
          `Employees Inserted: ${res.data.inserted}`
        );
      }

      // HHT / PRINTER
      else {
        const res = await api.post(
          "/assets/bulk-upload",
          {
            assets: valid,
          }
        );

        toast.success(
          `Assets Inserted: ${res.data.inserted}`
        );
      }

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
    <div className="p-6 bg-[#f5f7fa] min-h-screen">

      <div className="mb-5">
        <h1 className="text-3xl font-bold text-[#0a2342]">
          SAP Fiori Upload Center
        </h1>

        <p className="text-gray-500">
          Upload Employees, Printers & HHT Devices
        </p>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-5">

        <input
          type="file"
          onChange={handleFile}
          className="mb-4"
        />

        {file && (
          <div className="mb-4">
            <p className="text-sm">
              📄 {file.name}
            </p>

            <p className="text-blue-600 font-semibold">
              Detected Type: {fileType}
            </p>

            <div className="flex gap-5 mt-2 text-sm">
              <span className="text-green-600">
                ✅ Valid: {validCount}
              </span>

              <span className="text-red-500">
                ❌ Invalid: {invalidCount}
              </span>
            </div>
          </div>
        )}

        {rows.length > 0 && (
          <div className="overflow-auto border rounded-xl">
            <table className="w-full text-sm">

              <thead className="bg-gray-100">
                <tr>
                  {Object.keys(rows[0]).map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left border-b"
                    >
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
                      isValid(r)
                        ? "bg-white"
                        : "bg-red-100"
                    }
                  >
                    {Object.values(r).map((v, idx) => (
                      <td
                        key={idx}
                        className="px-4 py-2 border-b"
                      >
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
          className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl"
        >
          {loading
            ? "Uploading..."
            : `Upload ${fileType}`}
        </button>

      </div>

    </div>
  );
}