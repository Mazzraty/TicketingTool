import { useState } from "react";
import * as XLSX from "xlsx";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function EmployeeExcelUpload() {

  const [rows, setRows] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // DETECTED TYPE
  const [uploadType, setUploadType] = useState("");

  /* =====================================
     CLEAN VALUE
  ===================================== */
  const clean = (v) =>
    v ? v.toString().trim() : "";

  /* =====================================
     DETECT FILE TYPE
  ===================================== */
  const detectType = (row) => {

    const keys = Object.keys(row).map((k) =>
      k
        .trim()
        .toLowerCase()
        .replace(/[-_\s]+/g, "")
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

  /* =====================================
     NORMALIZE OBJECT
  ===================================== */
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

  /* =====================================
     HANDLE FILE
  ===================================== */
  const handleFile = (e) => {

    const selectedFile = e.target.files[0];

    if (!selectedFile) return;

    setFile(selectedFile);

    const reader = new FileReader();

    reader.onload = (event) => {

      try {

        const workbook = XLSX.read(
          event.target.result,
          {
            type: "array",
          }
        );

        const sheet =
          workbook.Sheets[
            workbook.SheetNames[0]
          ];

        const json =
          XLSX.utils.sheet_to_json(sheet, {
            defval: "",
            raw: false,
          });

        if (!json.length) {
          toast.error("Empty excel file");
          return;
        }

        // AUTO DETECT
        const type = detectType(json[0]);

        setUploadType(type);

        /* =====================================
           EMPLOYEE FORMAT
        ===================================== */
        if (type === "Employee") {

          const formatted = json.map((r) => {

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

        /* =====================================
           PRINTER FORMAT
        ===================================== */
        else if (type === "Printer") {

          const formatted = json.map((r) => {

            const row = normalize(r);

            return {

              assetCode: clean(
                row["printerserials"]
              ),

              type: "Printer",

              route: clean(
                row["route"]
              ),

              salesmanCode: clean(
                row["salesmancode"]
              ),

              salesmanName: clean(
                row["salesmanname"]
              ),

              supervisor: clean(
                row["supervisor"]
              ),

              model: clean(
                row["model"]
              ),

              soti: clean(
                row["soti"]
              ),

              serialNumber: clean(
                row["printerserials"]
              ),
            };
          });

          setRows(formatted);
        }

        /* =====================================
           HHT FORMAT
        ===================================== */
        else if (type === "HHT") {

          const formatted = json.map((r) => {

            const row = normalize(r);

            return {

              assetCode: clean(
                row["hhtserial"]
              ),

              type: "HHT",

              route: clean(
                row["route"]
              ),

              salesmanCode: clean(
                row["salesmancode"]
              ),

              salesmanName: clean(
                row["salesmanname"]
              ),

              model: clean(
                row["model"]
              ),

              serialNumber: clean(
                row["hhtserial"]
              ),

              imei: clean(
                row["imei"]
              ),

              simNumber: clean(
                row["simnumber"]
              ),
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

  /* =====================================
     VALIDATION
  ===================================== */
  const isValid = (r) => {

    // EMPLOYEE
    if (uploadType === "Employee") {

      return (
        r.staffCode?.toString().trim() &&
        r.name?.toString().trim()
      );
    }

    // PRINTER / HHT
    if (
      uploadType === "Printer" ||
      uploadType === "HHT"
    ) {

      return (
        r.assetCode?.toString().trim()
      );
    }

    return false;
  };

  const validCount =
    rows.filter(isValid).length;

  const invalidCount =
    rows.length - validCount;

  /* =====================================
     UPLOAD
  ===================================== */
  const uploadExcel = async () => {

    try {

      setLoading(true);

      const valid =
        rows.filter(isValid);

      if (!valid.length) {
        toast.error("No valid rows found");
        return;
      }

      /* =====================================
         EMPLOYEE UPLOAD
      ===================================== */
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

      /* =====================================
         PRINTER / HHT UPLOAD
      ===================================== */
      else {

        const res = await api.post(
          "/employees/bulk-upload",
          {
            assets: valid,
          }
        );

        toast.success(
          `Assets Inserted: ${res.data.inserted}`
        );
      }

      // RESET
      setRows([]);
      setFile(null);
      setUploadType("");

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

      {/* HEADER */}
      <div className="mb-6">

        <h1 className="text-2xl font-bold text-gray-800">
          SAP Fiori Upload Center
        </h1>

        <p className="text-sm text-gray-500">
          Upload Employees, Printers & HHT Devices
        </p>

      </div>

      {/* UPLOAD CARD */}
      <div className="bg-white rounded-2xl border shadow-sm p-5">

        <input
          type="file"
          onChange={handleFile}
          className="mb-4"
        />

        {/* FILE DETAILS */}
        {file && (
          <div className="mb-4 text-sm">

            <p className="font-medium">
              📄 {file.name}
            </p>

            <p className="text-blue-600 font-semibold">
              Detected Type:
              {" "}
              {uploadType}
            </p>

            <div className="flex gap-5 mt-2">

              <p className="text-green-600">
                ✅ Valid:
                {" "}
                {validCount}
              </p>

              <p className="text-red-600">
                ❌ Invalid:
                {" "}
                {invalidCount}
              </p>

            </div>

          </div>
        )}

        {/* TABLE */}
        {rows.length > 0 && (
          <div className="overflow-auto border rounded-xl">

            <table className="w-full text-sm">

              <thead className="bg-gray-100">

                <tr>

                  {Object.keys(rows[0]).map((k) => (

                    <th
                      key={k}
                      className="text-left px-4 py-3 border-b"
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
                        ? "bg-white hover:bg-gray-50"
                        : "bg-red-100"
                    }
                  >

                    {Object.values(r).map((v, idx) => (

                      <td
                        key={idx}
                        className="px-4 py-3 border-b"
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

        {/* BUTTON */}
        <button
          onClick={uploadExcel}
          disabled={loading}
          className="mt-5 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl"
        >
          {loading
            ? "Uploading..."
            : `Upload ${uploadType}`}
        </button>

      </div>

    </div>
  );
}