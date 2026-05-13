import { useState } from "react";
import * as XLSX from "xlsx";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function EmployeeExcelUpload() {
  const [rows, setRows] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // TYPE
  const [uploadType, setUploadType] = useState("");

  /* =========================
     CLEAN VALUE
  ========================= */
  const clean = (v) => (v ? v.toString().trim() : "");

  /* =========================
     DETECT FILE TYPE
  ========================= */
  const detectType = (row) => {
    const keys = Object.keys(row).map((k) =>
      k.toLowerCase().replace(/[-_\s]+/g, "")
    );

    // HHT
    if (
      keys.includes("hhtserial") ||
      keys.includes("imei")
    ) {
      return "HHT";
    }

    // PRINTER
    if (
      keys.includes("printerserials") ||
      keys.includes("supervisor")
    ) {
      return "Printer";
    }

    // EMPLOYEE
    return "Employee";
  };

  /* =========================
     FILE HANDLER
  ========================= */
  const handleFile = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setFile(file);

    const reader = new FileReader();

    reader.onload = async (event) => {
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
          toast.error("Empty excel file");
          return;
        }

        // DETECT TYPE
        const type = detectType(json[0]);

        setUploadType(type);

        /* =========================
           EMPLOYEE FORMAT
        ========================= */
        if (type === "Employee") {
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
                  row["code"]
              ),

              name: clean(
                row["fullname"] ||
                  row["employeename"] ||
                  row["name"]
              ),

              department: clean(
                row["department"] ||
                  row["dept"]
              ),

              designation: clean(
                row["designation"] ||
                  row["position"]
              ),

              division: clean(
                row["division"]
              ),

              placeOfWork: clean(
                row["placeofwork"]
              ),

              visaNo: clean(
                row["visano"]
              ),

              dateOfJoining: clean(
                row["dateofjoining"]
              ),
            };
          });

          setRows(formatted);
        }

        /* =========================
           PRINTER FORMAT
        ========================= */
        else if (type === "Printer") {
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
              assetCode: clean(
                row["printerserials"]
              ),

              type: "Printer",

              route: clean(row["route"]),

              salesmanCode: clean(
                row["salesmancode"]
              ),

              salesmanName: clean(
                row["salesmanname"]
              ),

              supervisor: clean(
                row["supervisor"]
              ),

              model: clean(row["model"]),

              soti: clean(row["soti"]),

              serialNumber: clean(
                row["printerserials"]
              ),
            };
          });

          setRows(formatted);
        }

        /* =========================
           HHT FORMAT
        ========================= */
        else if (type === "HHT") {
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
              assetCode: clean(
                row["hhtserial"]
              ),

              type: "HHT",

              route: clean(row["route"]),

              salesmanCode: clean(
                row["salesmancode"]
              ),

              salesmanName: clean(
                row["salesmanname"]
              ),

              model: clean(row["model"]),

              serialNumber: clean(
                row["hhtserial"]
              ),

              imei: clean(row["imei"]),
            };
          });

          setRows(formatted);
        }

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
  const isValid = (r) => {
    if (uploadType === "Employee") {
      return r.staffCode && r.name;
    }

    return r.assetCode;
  };

  /* =========================
     UPLOAD
  ========================= */
  const uploadExcel = async () => {
    try {
      setLoading(true);

      const valid = rows.filter(isValid);

      if (!valid.length) {
        toast.error("No valid rows");
        return;
      }

      // EMPLOYEE
      if (uploadType === "Employee") {
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
        err.response?.data?.msg ||
          "Upload failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">

      <h2 className="text-xl font-bold mb-4">
        Excel Upload Center
      </h2>

      <input
        type="file"
        onChange={handleFile}
      />

      {file && (
        <div className="mt-3">
          <p className="text-sm">
            📄 {file.name}
          </p>

          <p className="text-sm text-blue-600 font-medium">
            Detected Type: {uploadType}
          </p>
        </div>
      )}

      {/* PREVIEW */}
      {rows.length > 0 && (
        <div className="overflow-auto mt-5 border rounded-lg">

          <table className="w-full text-sm">

            <thead className="bg-gray-100">
              <tr>
                {Object.keys(rows[0]).map((k) => (
                  <th
                    key={k}
                    className="text-left px-3 py-2 border-b"
                  >
                    {k}
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
                      className="px-3 py-2 border-b"
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
        className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
      >
        {loading
          ? "Uploading..."
          : `Upload ${uploadType}`}
      </button>

    </div>
  );
}