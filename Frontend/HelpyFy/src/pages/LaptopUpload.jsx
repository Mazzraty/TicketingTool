import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function LaptopUpload() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");

  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");

  // 🔥 IN-PAGE PASTE SHEET
  const SHEET_COLUMNS = ["assetCode", "type", "serialNumber", "model", "Name"];
  const emptySheetRow = () => ({
    assetCode: "",
    type: "",
    serialNumber: "",
    model: "",
    Name: "",
  });
  const [sheetRows, setSheetRows] = useState(
    Array.from({ length: 8 }, emptySheetRow)
  );

  const user = JSON.parse(localStorage.getItem("user"));
  const isSuperAdmin = user?.role === "super_admin";

  const clean = (v) => (v ? v.toString().trim() : "");

  // load companies for super admin
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/companies");
        const payload = res.data;
        const list = Array.isArray(payload)
          ? payload
          : payload?.companies || [];
        setCompanies(list);
      } catch (err) {
        console.error(err);
      }
    };

    if (isSuperAdmin) load();
  }, [isSuperAdmin]);

  // update a single cell
  const updateSheetCell = (rowIdx, col, value) => {
    setSheetRows((prev) => {
      const next = [...prev];
      next[rowIdx] = { ...next[rowIdx], [col]: value };
      return next;
    });
  };

  const addSheetRow = () => {
    setSheetRows((prev) => [...prev, emptySheetRow()]);
  };

  const clearSheet = () => {
    setSheetRows(Array.from({ length: 8 }, emptySheetRow));
  };

  // paste tab/newline separated data (copied from Excel) starting at rowIdx/colIdx
  const handleSheetPaste = (e, rowIdx, colIdx) => {
    const text = e.clipboardData.getData("text");
    if (!text || !text.includes("\t") && !text.includes("\n")) return; // let single-cell paste behave normally

    e.preventDefault();

    const pastedRows = text
      .replace(/\r/g, "")
      .split("\n")
      .filter((r) => r.length > 0)
      .map((r) => r.split("\t"));

    setSheetRows((prev) => {
      const next = [...prev];

      pastedRows.forEach((pastedRow, i) => {
        const targetRow = rowIdx + i;

        while (next.length <= targetRow) {
          next.push(emptySheetRow());
        }

        pastedRow.forEach((val, j) => {
          const targetCol = SHEET_COLUMNS[colIdx + j];
          if (targetCol) {
            next[targetRow] = { ...next[targetRow], [targetCol]: val.trim() };
          }
        });
      });

      return next;
    });
  };

  // push the sheet's data into the same `rows` pipeline used by file upload
  const loadSheetIntoRows = () => {
    const formatted = sheetRows
      .filter((r) => r.assetCode || r.serialNumber || r.model)
      .map((r) => ({
        type: r.type ? clean(r.type) : "Laptop",
        assetCode: clean(r.assetCode),
        model: clean(r.model),
        serialNumber: clean(r.serialNumber),
      }));

    if (formatted.length === 0) {
      toast.error("Sheet is empty — paste or type your asset details first");
      return;
    }

    setRows(formatted);
    setFileName("");
    toast.success(`${formatted.length} rows loaded — review below and click Upload`);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = (event) => {
      const workbook = XLSX.read(event.target.result, {
        type: "array",
      });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);

      const formatted = json.map((r) => ({
        type: "Laptop",
        assetCode: clean(r.assetCode),
        model: clean(r.model),
        serialNumber: clean(r.serialNumber),
      }));

      setRows(formatted);
    };

    reader.readAsArrayBuffer(file);
  };

  const upload = async () => {
    try {
      setLoading(true);

      const valid = rows.filter(
        (r) => r.assetCode && r.serialNumber
      );

      const payload = { assets: valid };

      if (isSuperAdmin) {
        if (!selectedCompany) {
          toast.error("Please select company");
          setLoading(false);
          return;
        }
        payload.companyId = selectedCompany;
      }

      const res = await api.post("/assets/bulk-upload", payload);

      toast.success(`Inserted: ${res.data.inserted}`);

      setRows([]);
      setFileName("");
    } catch (err) {
      console.error(err);
      toast.error("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const validCount = rows.filter(
    (r) => r.assetCode && r.serialNumber
  ).length;

  const invalidCount = rows.length - validCount;

  return (
    <div className="min-h-screen bg-[#f4f6f9] p-6">

      {/* 🔥 COMPANY SELECT (ONLY SUPER ADMIN) */}
      {isSuperAdmin && (
        <div className="mb-4 bg-white p-3 rounded-xl border">
          <label className="text-sm font-semibold text-gray-600">
            Select Company
          </label>

          <select
            className="w-full mt-2 p-2 border rounded"
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
          >
            <option value="">-- Choose Company --</option>
            {companies.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* HEADER (PRINTER STYLE) */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Laptop Bulk Upload
          </h1>
          <p className="text-sm text-gray-500">
            Upload Excel file (.xlsx / .xls)
          </p>
        </div>

        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 rounded-xl bg-white border text-gray-700 hover:bg-gray-100 text-sm"
        >
          ← Back
        </button>
      </div>

      {/* UPLOAD CARD (PRINTER STYLE UI) */}
      <div className="bg-white border rounded-2xl p-6 shadow-sm">

        {/* IN-PAGE PASTE SHEET */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">
              Copy your asset details from Excel and paste directly into the sheet below (click a cell first, then <kbd className="px-1 py-0.5 bg-gray-100 border rounded text-xs">Ctrl+V</kbd>)
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

          <div className="overflow-x-auto border rounded-xl">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-100 text-xs uppercase">
                <tr>
                  {SHEET_COLUMNS.map((col) => (
                    <th key={col} className="p-2 text-left border-b">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sheetRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="border-t">
                    {SHEET_COLUMNS.map((col, colIdx) => (
                      <td key={col} className="p-0 border-r last:border-r-0">
                        <input
                          value={row[col]}
                          onChange={(e) =>
                            updateSheetCell(rowIdx, col, e.target.value)
                          }
                          onPaste={(e) => handleSheetPaste(e, rowIdx, colIdx)}
                          className="w-full p-2 text-sm outline-none focus:bg-green-50"
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
              className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700"
            >
              Load Sheet →
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center mb-2">— or —</p>


        {/* DROP AREA */}
        <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer hover:bg-gray-50 transition">

          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFile}
            className="hidden"
          />

          <div className="text-center">
            <p className="text-lg font-semibold text-gray-700">
              📤 Drag & Drop Excel File
            </p>
            <p className="text-sm text-gray-500 mt-1">
              or click to browse (use the template above)
            </p>

            {fileName && (
              <p className="mt-3 text-sm text-blue-600">
                Selected: {fileName}
              </p>
            )}
          </div>
        </label>

        {/* STATS (PRINTER STYLE) */}
        {rows.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-6">

            <div className="bg-gray-50 p-4 rounded-xl border text-center">
              <p className="text-xs text-gray-500">Total Rows</p>
              <p className="text-xl font-bold">{rows.length}</p>
            </div>

            <div className="bg-green-50 p-4 rounded-xl border text-center">
              <p className="text-xs text-green-600">Valid</p>
              <p className="text-xl font-bold text-green-700">
                {validCount}
              </p>
            </div>

            <div className="bg-red-50 p-4 rounded-xl border text-center">
              <p className="text-xs text-red-500">Invalid</p>
              <p className="text-xl font-bold text-red-600">
                {invalidCount}
              </p>
            </div>

          </div>
        )}

        {/* TABLE (PRINTER STYLE) */}
        {rows.length > 0 && (
          <div className="mt-6 overflow-x-auto border rounded-xl">

            <table className="w-full text-sm">

              <thead className="bg-gray-100 text-xs uppercase">
                <tr>
                  <th className="p-3 text-left">Asset Code</th>
                  <th className="p-3 text-left">Model</th>
                  <th className="p-3 text-left">Serial Number</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="p-3">{r.assetCode}</td>
                    <td className="p-3">{r.model}</td>
                    <td className="p-3">{r.serialNumber}</td>
                  </tr>
                ))}
              </tbody>

            </table>

          </div>
        )}

        {/* ACTION BUTTON (PRINTER STYLE) */}
        {rows.length > 0 && (
          <div className="flex justify-end mt-6">
            <button
              onClick={upload}
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Uploading..." : "Upload Laptops"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
