import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import api from "../api/axios";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ChevronDown,
  Plus,
  Eraser,
  Download,
  Upload,
  FileSpreadsheet,
  X,
} from "lucide-react";

/* ================= UI HELPERS (styling only, no logic) ================= */
// Atlassian / Jira Service Management styling
const inputCls =
  "h-9 w-full rounded-[3px] border-2 border-[#DFE1E6] bg-[#FAFBFC] px-2.5 text-sm text-[#172B4D] " +
  "placeholder:text-[#7A869A] transition-colors hover:bg-[#EBECF0] " +
  "focus:border-[#4C9AFF] focus:bg-white focus:outline-none";

const btnBase =
  "inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-[3px] px-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#4C9AFF] disabled:cursor-not-allowed disabled:opacity-50";
const btnPrimary = `${btnBase} bg-[#0052CC] text-white hover:bg-[#0065FF] active:bg-[#0747A6]`;
const btnDefault = `${btnBase} bg-[rgba(9,30,66,0.04)] text-[#42526E] hover:bg-[rgba(9,30,66,0.08)] active:bg-[#DEEBFF] active:text-[#0052CC]`;
const btnSubtle = `${btnBase} bg-transparent text-[#42526E] hover:bg-[rgba(9,30,66,0.08)]`;

const COLUMN_LABELS = {
  assetCode: "Asset code",
  model: "Model",
  serialNumber: "Serial number",
  route: "Route",
  salesmanCode: "Salesman code",
  salesmanName: "Salesman name",
  supervisor: "Supervisor",
  notes: "Notes",
};

function Card({ title, subtitle, actions, children, footer }) {
  return (
    <div className="mb-4 rounded-[3px] border border-[#DFE1E6] bg-white">
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#DFE1E6] px-4 py-3">
          <div>
            <h2 className="text-base font-semibold text-[#172B4D]">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 text-sm text-[#5E6C84]">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-4">{children}</div>
      {footer && (
        <div className="flex justify-end gap-2 border-t border-[#DFE1E6] bg-[#FAFBFC] px-4 py-3">
          {footer}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone = "neutral" }) {
  const tones = {
    neutral: "text-[#172B4D]",
    success: "text-[#006644]",
    danger: "text-[#BF2600]",
  };
  return (
    <div className="rounded-[3px] border border-[#DFE1E6] bg-white px-4 py-3">
      <p className="text-xs font-semibold text-[#5E6C84]">{label}</p>
      <p className={`text-2xl font-medium leading-7 ${tones[tone]}`}>{value}</p>
    </div>
  );
}

function Lozenge({ tone, children }) {
  const tones = {
    success: "bg-[#E3FCEF] text-[#006644]",
    danger: "bg-[#FFEBE6] text-[#BF2600]",
  };
  return (
    <span
      className={`inline-block rounded-[3px] px-1.5 py-0.5 text-[11px] font-bold uppercase leading-4 tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export default function PrinterUpload() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");

  // 🔥 NEW: company selection
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");

  // 🔥 IN-PAGE PASTE SHEET
  const SHEET_COLUMNS = [
    "assetCode",
    "model",
    "serialNumber",
    "route",
    "salesmanCode",
    "salesmanName",
    "supervisor",
    "notes",
  ];
  const emptySheetRow = () =>
    SHEET_COLUMNS.reduce((acc, col) => ({ ...acc, [col]: "" }), {});
  const [sheetRows, setSheetRows] = useState(
    Array.from({ length: 8 }, emptySheetRow)
  );
  const [pasteText, setPasteText] = useState("");

  // UI-only state (new): drag highlight + file input reset key
  const [dragOver, setDragOver] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  const user = JSON.parse(localStorage.getItem("user"));
  const isSuperAdmin = user?.role === "super_admin";

  const clean = (v) => (v != null && v !== "" ? v.toString().trim() : "");

  // ================= LOAD COMPANIES (ONLY SUPER ADMIN)
  useEffect(() => {
    const loadCompanies = async () => {
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

    if (isSuperAdmin) {
      loadCompanies();
    }
  }, [isSuperAdmin]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = (event) => {
      const workbook = XLSX.read(event.target.result, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);

      const formatted = json.map((r) => ({
        type: "Printer",
        assetCode: clean(r.assetCode),
        model: clean(r.model),
        serialNumber: clean(r.serialNumber),
        route: clean(r.route),
        salesmanCode: clean(r.salesmanCode),
        salesmanName: clean(r.salesmanName),
        supervisor: clean(r.supervisor),
        notes: clean(r.notes),
      }));

      setRows(formatted);
    };

    reader.readAsArrayBuffer(file);
  };

  // ================= IN-PAGE PASTE SHEET =================
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
        row[col] = (cells[i] ?? "").trim();
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
      .filter((r) => r.assetCode || r.serialNumber || r.model)
      .map((r) => ({
        type: "Printer",
        assetCode: clean(r.assetCode),
        model: clean(r.model),
        serialNumber: clean(r.serialNumber),
        route: clean(r.route),
        salesmanCode: clean(r.salesmanCode),
        salesmanName: clean(r.salesmanName),
        supervisor: clean(r.supervisor),
        notes: clean(r.notes),
      }));

    if (formatted.length === 0) {
      toast.error("Sheet is empty — paste or type your asset details first");
      return;
    }

    setRows(formatted);
    setFileName("");
    toast.success(`${formatted.length} rows loaded — review below and click Upload`);
  };

  const upload = async () => {
    try {
      setLoading(true);

      const valid = rows.filter(
        (r) => r.assetCode && r.serialNumber
      );

      if (!valid.length) {
        toast.error("No valid rows");
        setLoading(false);
        return;
      }

      // 🔥 FINAL COMPANY LOGIC
      const payload = {
        assets: valid,
      };

      // super admin MUST select company
      if (isSuperAdmin) {
        if (!selectedCompany) {
          toast.error("Please select company");
          setLoading(false);
          return;
        }
        payload.companyId = selectedCompany;
      }

      const res = await api.post("/assets/bulk-upload", payload);

      const { inserted, skipped, failedRows } = res.data;

      if (inserted > 0) {
        toast.success(`Inserted: ${inserted}${skipped ? `, Skipped: ${skipped}` : ""}`);
      } else {
        toast.error(
          skipped > 0
            ? `Nothing inserted — ${skipped} row(s) skipped (likely duplicate assetCode or invalid data)`
            : "Nothing was inserted"
        );
      }

      if (failedRows?.length) {
        console.warn("Bulk upload failed rows:", failedRows);
      }

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

  /* ================= NEW (UI-only additions) ================= */

  // CANCEL #1 — paste sheet: discard everything typed/pasted in the grid
  const cancelSheet = () => {
    clearSheet();
  };

  // CANCEL #2 — preview: discard the loaded rows / selected file
  const cancelUpload = () => {
    setRows([]);
    setFileName("");
    setFileInputKey((k) => k + 1); // lets the same file be picked again
  };

  // Download a ready-to-fill Excel template with the exact header names
  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([SHEET_COLUMNS]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Printers");
    XLSX.writeFile(wb, "printer-upload-template.xlsx");
  };

  // Drag & drop onto the drop area — reuses handleFile as-is
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer?.files?.length) {
      handleFile({ target: { files: e.dataTransfer.files } });
    }
  };

  const filledSheetRows = sheetRows.filter(
    (r) => r.assetCode || r.serialNumber || r.model
  ).length;

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-[#172B4D]">
      <div className="mx-auto max-w-[1400px] px-6 py-6 lg:px-10">

        {/* BREADCRUMB + BACK */}
        <div className="mb-2 flex items-center justify-between">
          {/* <nav className="flex items-center gap-1.5 text-sm text-[#5E6C84]">
            <span>Admin</span>
            <span>/</span>
            <span>Assets</span>
            <span>/</span>
            <span>Upload Printer</span>
          </nav> */}

          <button
            onClick={() => window.history.back()}
            className={btnSubtle}
          >
            <ArrowLeft size={14} />
            Back
          </button>
        </div>

        {/* HEADER */}
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-medium text-[#172B4D]">
              Printer Bulk Upload
            </h1>
            <p className="mt-1 text-sm text-[#5E6C84]">
              Upload Excel file (.xlsx / .xls) or paste rows from Excel
            </p>
          </div>

          <button onClick={downloadTemplate} className={btnDefault}>
            <Download size={14} />
            Download template
          </button>
        </div>

        {/* 🔥 COMPANY SELECT (ONLY SUPER ADMIN) */}
        {isSuperAdmin && (
          <Card title="Company" subtitle="Assets will be created under this company">
            <label className="mb-1 block text-xs font-semibold text-[#5E6C84]">
              Select company<span className="ml-0.5 text-[#DE350B]">*</span>
            </label>
            <div className="relative max-w-md">
              <select
                className={`${inputCls} cursor-pointer appearance-none truncate pr-8`}
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
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B778C]"
              />
            </div>
          </Card>
        )}

        {/* IN-PAGE PASTE SHEET */}
        <Card
          title="Paste from Excel"
          subtitle="Copy your asset details from Excel (data rows only, no header) and paste into the box below"
          actions={
            <>
              <button onClick={addSheetRow} className={btnDefault}>
                <Plus size={14} />
                Add row
              </button>
              <button onClick={clearSheet} className={btnSubtle}>
                <Eraser size={14} />
                Clear
              </button>
            </>
          }
          footer={
            <>
              <span className="mr-auto self-center text-sm text-[#5E6C84]">
                {filledSheetRows} of {sheetRows.length} rows filled
              </span>
              {/* NEW: Cancel #1 */}
              <button onClick={cancelSheet} className={btnSubtle}>
                Cancel
              </button>
              <button onClick={loadSheetIntoRows} className={btnPrimary}>
                Load sheet
              </button>
            </>
          }
        >
          <textarea
            value={pasteText}
            onChange={handlePasteBoxChange}
            onPaste={handlePasteBoxPaste}
            placeholder="Click here and press Ctrl+V (or Cmd+V) to paste your copied Excel rows..."
            rows={3}
            className="mb-3 w-full rounded-[3px] border-2 border-[#DFE1E6] bg-[#FAFBFC] px-2.5 py-2 text-sm text-[#172B4D] placeholder:text-[#7A869A] transition-colors hover:bg-[#EBECF0] focus:border-[#4C9AFF] focus:bg-white focus:outline-none"
          />

          <div className="overflow-x-auto rounded-[3px] border border-[#DFE1E6]">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-[#DFE1E6] bg-[#FAFBFC]">
                  <th className="w-10 border-r border-[#DFE1E6] px-2 py-2 text-center text-xs font-semibold text-[#5E6C84]">
                    #
                  </th>
                  {SHEET_COLUMNS.map((col) => (
                    <th
                      key={col}
                      className="whitespace-nowrap border-r border-[#DFE1E6] px-2 py-2 text-left text-xs font-semibold text-[#5E6C84] last:border-r-0"
                    >
                      {COLUMN_LABELS[col]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sheetRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="border-b border-[#DFE1E6] last:border-b-0">
                    <td className="border-r border-[#DFE1E6] bg-[#FAFBFC] px-2 text-center text-xs text-[#6B778C]">
                      {rowIdx + 1}
                    </td>
                    {SHEET_COLUMNS.map((col) => (
                      <td key={col} className="border-r border-[#DFE1E6] p-0 last:border-r-0">
                        <input
                          value={row[col]}
                          onChange={(e) =>
                            updateSheetCell(rowIdx, col, e.target.value)
                          }
                          className="h-9 w-full min-w-[120px] bg-transparent px-2 text-sm text-[#172B4D] outline-none hover:bg-[#F4F5F7] focus:bg-white focus:shadow-[inset_0_0_0_2px_#4C9AFF]"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wide text-[#6B778C]">
          or
        </p>

        {/* UPLOAD CARD */}
        <Card
          title="Upload Excel file"
          subtitle="The first sheet is read. Required columns: assetCode and serialNumber"
        >
          {/* DROP AREA */}
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-[3px] border-2 border-dashed p-10 transition-colors ${dragOver
                ? "border-[#4C9AFF] bg-[#DEEBFF]"
                : "border-[#C1C7D0] bg-[#FAFBFC] hover:bg-[#F4F5F7]"
              }`}
          >
            <input
              key={fileInputKey}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFile}
              className="hidden"
            />

            <div className="flex flex-col items-center text-center">
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#DEEBFF] text-[#0052CC]">
                <Upload size={22} />
              </span>
              <p className="text-base font-medium text-[#172B4D]">
                Drag & drop Excel file
              </p>
              <p className="mt-1 text-sm text-[#5E6C84]">
                or <span className="font-medium text-[#0052CC]">click to browse</span>
              </p>

              {fileName && (
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-[3px] bg-[#DEEBFF] px-2 py-1 text-sm text-[#0747A6]">
                  <FileSpreadsheet size={14} />
                  {fileName}
                </p>
              )}
            </div>
          </label>
        </Card>

        {/* PREVIEW */}
        {rows.length > 0 && (
          <>
            {/* STATS */}
            <div className="mb-4 grid grid-cols-3 gap-3">
              <Stat label="Total rows" value={rows.length} />
              <Stat label="Valid" value={validCount} tone="success" />
              <Stat label="Invalid" value={invalidCount} tone="danger" />
            </div>

            <Card
              title="Review"
              subtitle={
                invalidCount > 0
                  ? "Rows missing an asset code or serial number will be skipped"
                  : "All rows are ready to upload"
              }
              actions={
                <button
                  onClick={cancelUpload}
                  className={btnSubtle}
                  aria-label="Discard loaded rows"
                >
                  <X size={14} />
                  Discard
                </button>
              }
              footer={
                <>
                  {/* NEW: Cancel #2 */}
                  <button
                    onClick={cancelUpload}
                    disabled={loading}
                    className={btnSubtle}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={upload}
                    disabled={loading}
                    className={btnPrimary}
                  >
                    {loading ? "Uploading..." : "Upload Printers"}
                  </button>
                </>
              }
            >
              <div className="-m-4 overflow-x-auto">
                <table className="w-full min-w-[860px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b-2 border-[#DFE1E6] text-left">
                      <th className="px-4 py-2.5 text-xs font-semibold text-[#5E6C84]">Status</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-[#5E6C84]">Asset code</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-[#5E6C84]">Model</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-[#5E6C84]">Serial</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-[#5E6C84]">Route</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-[#5E6C84]">Salesman</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-[#5E6C84]">Supervisor</th>
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((r, i) => {
                      const ok = r.assetCode && r.serialNumber;
                      return (
                        <tr
                          key={i}
                          className={`border-b border-[#DFE1E6] transition-colors hover:bg-[#F4F5F7] ${ok ? "" : "bg-[#FFF5F2]"
                            }`}
                        >
                          <td className="px-4 py-2.5">
                            {ok ? (
                              <Lozenge tone="success">Valid</Lozenge>
                            ) : (
                              <Lozenge tone="danger">Invalid</Lozenge>
                            )}
                          </td>
                          <td className="px-4 py-2.5 font-medium text-[#0052CC]">
                            {r.assetCode || <span className="text-[#BF2600]">Missing</span>}
                          </td>
                          <td className="px-4 py-2.5 text-[#42526E]">{r.model}</td>
                          <td className="px-4 py-2.5 font-mono text-[13px] text-[#42526E]">
                            {r.serialNumber || <span className="text-[#BF2600]">Missing</span>}
                          </td>
                          <td className="px-4 py-2.5 text-[#42526E]">{r.route}</td>
                          <td className="px-4 py-2.5 text-[#42526E]">
                            {r.salesmanCode} - {r.salesmanName}
                          </td>
                          <td className="px-4 py-2.5 text-[#42526E]">{r.supervisor}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}