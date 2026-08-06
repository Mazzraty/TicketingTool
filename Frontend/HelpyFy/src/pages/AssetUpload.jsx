import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { useAuth } from "../auth/AuthContext";
import api from "../api/axios";
import toast from "react-hot-toast";

/* =========================
   SCHEMAS (SAP STYLE)
========================= */
const ALLOWED_EMPLOYEE_FIELDS = [
  "company",
  "staffCode",
  "name",
  "department",
  "designation",
  "division",
  "placeOfWork",
  "visaNo",
  "dateOfJoining",
];

// 🔥 grid columns (label shown to user) mapped to internal field keys, in the exact order requested
const SHEET_COLUMNS = [
  { label: "Staff Code", key: "staffCode" },
  { label: "Name", key: "name" },
  { label: "Date of Joining", key: "dateOfJoining" },
  { label: "Division", key: "division" },
  { label: "Department", key: "department" },
  { label: "Place Of Work", key: "placeOfWork" },
  { label: "Designation", key: "designation" },
  { label: "Visa No.", key: "visaNo" },
  { label: "Company", key: "company" },
];

export default function EmployeeExcelUpload() {
  const { user, companyId: activeCompanyId } = useAuth();
  const [rows, setRows] = useState([]);
  const [fileType, setFileType] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState(activeCompanyId || "");

  // 🔥 IN-PAGE PASTE SHEET
  const emptySheetRow = () =>
    SHEET_COLUMNS.reduce((acc, col) => ({ ...acc, [col.key]: "" }), {});
  const [sheetRows, setSheetRows] = useState(
    Array.from({ length: 8 }, emptySheetRow)
  );
  const [pasteText, setPasteText] = useState("");

  /* =========================
     CLEAN VALUE
  ========================= */
  const clean = (v) => (v != null && v !== "" ? v.toString().trim() : "");

  /* =========================
     FUZZY MATCH ENGINE
  ========================= */
  const similarity = (a, b) => {
    const str1 = a.toLowerCase().replace(/[^a-z0-9]/g, "");
    const str2 = b.toLowerCase().replace(/[^a-z0-9]/g, "");

    if (str1 === str2) return 1;

    let matches = 0;
    const len = Math.max(str1.length, str2.length);

    for (let i = 0; i < Math.min(str1.length, str2.length); i++) {
      if (str1[i] === str2[i]) matches++;
    }

    return matches / len;
  };

  const fuzzyMapRow = (row, allowedFields) => {
    const cleaned = {};
    const rowKeys = Object.keys(row);

    allowedFields.forEach((field) => {
      let bestMatch = null;
      let bestScore = 0;

      rowKeys.forEach((key) => {
        const score = similarity(field, key);
        if (score > bestScore) {
          bestScore = score;
          bestMatch = key;
        }
      });

      cleaned[field] = bestScore >= 0.6 ? row[bestMatch] : "";
    });

    return cleaned;
  };

  useEffect(() => {
    setCompanyId(activeCompanyId || "");
  }, [activeCompanyId]);

  useEffect(() => {
    if (user?.role !== "super_admin") return;

    const loadCompanies = async () => {
      try {
        const res = await api.get("/companies");
        setCompanies(res.data.companies || []);
      } catch (err) {
        console.error("Failed to load companies", err);
      }
    };

    loadCompanies();
  }, [user?.role]);

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

        setFileType("Employee");

        const formatted = json.map((r) => {
          const row = fuzzyMapRow(
            r,
            ALLOWED_EMPLOYEE_FIELDS
          );

          return {
            type: "Employee",
            company: clean(row.company),
            staffCode: clean(row.staffCode),
            name: clean(row.name),
            department: clean(row.department),
            designation: clean(row.designation),
            division: clean(row.division),
            placeOfWork: clean(row.placeOfWork),
            visaNo: clean(row.visaNo),
            dateOfJoining: clean(row.dateOfJoining),
          };
        });

        setRows(formatted);
      } catch (err) {
        console.error(err);
        toast.error("Invalid Excel file");
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  // ================= IN-PAGE PASTE SHEET =================
  const updateSheetCell = (rowIdx, key, value) => {
    setSheetRows((prev) => {
      const next = [...prev];
      next[rowIdx] = { ...next[rowIdx], [key]: value };
      return next;
    });
  };

  const addSheetRow = () => {
    setSheetRows((prev) => [...prev, emptySheetRow()]);
  };

  const clearSheet = () => {
    setSheetRows(Array.from({ length: 8 }, emptySheetRow));
    setPasteText("");
  };

  // single reliable paste target — always fires, unlike per-cell paste listeners
  const parsePasteIntoGrid = (text) => {
    if (!text.trim()) return;

    const parsedRows = text
      .replace(/\r/g, "")
      .split("\n")
      .filter((r) => r.trim().length > 0)
      .map((r) => r.split("\t"));

    const newRows = parsedRows.map((cells) => {
      const row = emptySheetRow();
      SHEET_COLUMNS.forEach((col, i) => {
        row[col.key] = (cells[i] ?? "").trim();
      });
      return row;
    });

    if (newRows.length > 0) {
      setSheetRows(newRows);
      toast.success(`${newRows.length} rows pasted into the grid`);
    } else {
      toast.error("No data rows found in pasted content");
    }
  };

  const handlePasteBoxChange = (e) => setPasteText(e.target.value);

  const handlePasteBoxPaste = (e) => {
    const text = e.clipboardData.getData("text");
    parsePasteIntoGrid(text);
    setTimeout(() => setPasteText(""), 0);
  };

  // push the sheet's data into the same `rows` pipeline used by file upload
  const loadSheetIntoRows = () => {
    const formatted = sheetRows
      .filter((r) => r.staffCode || r.name)
      .map((r) => ({
        type: "Employee",
        company: clean(r.company),
        staffCode: clean(r.staffCode),
        name: clean(r.name),
        department: clean(r.department),
        designation: clean(r.designation),
        division: clean(r.division),
        placeOfWork: clean(r.placeOfWork),
        visaNo: clean(r.visaNo),
        dateOfJoining: clean(r.dateOfJoining),
      }));

    if (formatted.length === 0) {
      toast.error("Sheet is empty — paste or type employee details first");
      return;
    }

    setFileType("Employee");
    setRows(formatted);
    setFile(null);
    toast.success(`${formatted.length} rows loaded — review below and click Upload`);
  };

  const isValid = (r) => {
    return r.staffCode && r.name;
  };

  const validCount = rows.filter(isValid).length;
  const invalidCount = rows.length - validCount;

  const uploadExcel = async () => {
    try {
      setLoading(true);

      if (user?.role === "super_admin" && !companyId) {
        toast.error("Select the target company before uploading");
        setLoading(false);
        return;
      }

      const valid = rows.filter(isValid);

      if (!valid.length) {
        toast.error("No valid employees found");
        setLoading(false);
        return;
      }

      const payload = {
        employees: valid,
      };

      if (companyId) {
        payload.companyId = companyId;
      }

      const res = await api.post(
        "/employees/bulk-upload",
        payload
      );

      const { inserted, skipped, failedRows } = res.data;

      if (inserted > 0) {
        toast.success(`Employees Inserted: ${inserted}${skipped ? `, Skipped: ${skipped}` : ""}`);
      } else {
        toast.error(
          skipped > 0
            ? `Nothing inserted — ${skipped} row(s) skipped (likely duplicate staffCode)`
            : "Nothing was inserted"
        );
      }

      if (failedRows?.length) {
        console.warn("Bulk upload failed rows:", failedRows);
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
    <div className="min-h-screen bg-[#f4f6f9] p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Employee Excel Upload
          </h1>

          <p className="text-sm text-gray-500">
            Bulk Employee Upload
          </p>
        </div>

        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 rounded-xl bg-white border text-gray-700 hover:bg-gray-100 text-sm"
        >
          ← Back
        </button>
      </div>

      {/* CARD */}
      <div className="bg-white border rounded-2xl p-6 shadow-sm">

        {user?.role === "super_admin" && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Company
            </label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3"
            >
              <option value="">Select company</option>
              {companies.map((company) => (
                <option key={company._id} value={company._id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* IN-PAGE PASTE SHEET */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">
              Copy employee details from Excel (data rows only, no header) and paste into the box below
            </p>
            <div className="flex gap-2">
              <button
                onClick={addSheetRow}
                className="px-3 py-1.5 rounded-lg bg-white border text-gray-700 text-xs font-semibold hover:bg-gray-100"
              >
                + Add Row
              </button>
              <button
                onClick={clearSheet}
                className="px-3 py-1.5 rounded-lg bg-white border text-gray-700 text-xs font-semibold hover:bg-gray-100"
              >
                Clear
              </button>
            </div>
          </div>

          <textarea
            value={pasteText}
            onChange={handlePasteBoxChange}
            onPaste={handlePasteBoxPaste}
            placeholder="Click here and press Ctrl+V (or Cmd+V) to paste your copied Excel rows..."
            rows={3}
            className="w-full p-3 text-sm border rounded-xl outline-none focus:ring-2 focus:ring-blue-200 mb-3"
          />

          <div className="overflow-x-auto border rounded-xl">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-100 text-xs uppercase">
                <tr>
                  {SHEET_COLUMNS.map((col) => (
                    <th key={col.key} className="p-2 text-left border-b whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sheetRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="border-t">
                    {SHEET_COLUMNS.map((col) => (
                      <td key={col.key} className="p-0 border-r last:border-r-0">
                        <input
                          value={row[col.key]}
                          onChange={(e) =>
                            updateSheetCell(rowIdx, col.key, e.target.value)
                          }
                          className="w-full p-2 text-sm outline-none focus:bg-blue-50 min-w-[110px]"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mt-3">
            <button
              onClick={loadSheetIntoRows}
              className="px-4 py-2 rounded-xl bg-[#0a6ed1] text-white text-sm font-semibold hover:bg-[#085caf]"
            >
              Load Sheet →
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center mb-2">— or —</p>

        {/* DROP ZONE */}
        <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer hover:bg-gray-50 transition">

          <input
            type="file"
            onChange={handleFile}
            className="hidden"
          />

          <p className="text-lg font-semibold text-gray-700">
            📤 Drag & Drop Excel File
          </p>
          <p className="text-sm text-gray-500 mt-1">
            or click to browse
          </p>

          {file && (
            <p className="mt-3 text-sm text-blue-600">
              {file.name}
            </p>
          )}
        </label>

        {/* STATS */}
        {rows.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-6">

            <div className="bg-gray-50 p-4 rounded-xl border text-center">
              Total
              <div className="font-bold text-xl">{rows.length}</div>
            </div>

            <div className="bg-green-50 p-4 rounded-xl border text-center">
              Valid
              <div className="font-bold text-green-700 text-xl">
                {validCount}
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-xl border text-center">
              Invalid
              <div className="font-bold text-red-600 text-xl">
                {invalidCount}
              </div>
            </div>

          </div>
        )}

        {/* TABLE */}
        {rows.length > 0 && (
          <div className="mt-6 overflow-x-auto border rounded-xl">

            <table className="w-full text-sm">

              <thead className="bg-gray-100">
                <tr>
                  {Object.keys(rows[0]).map((h) => (
                    <th key={h} className="p-3 text-left border">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={i}
                    className={`border-t ${isValid(r) ? "" : "bg-red-100"
                      }`}
                  >
                    {Object.values(r).map((v, j) => (
                      <td key={j} className="p-3 border">
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
        {rows.length > 0 && (
          <div className="flex justify-end mt-6">
            <button
              onClick={uploadExcel}
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-[#0a6ed1] text-white font-semibold hover:bg-[#085caf] disabled:opacity-50"
            >
              {loading ? "Uploading..." : "Upload Employees"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
