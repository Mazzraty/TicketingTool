import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function HHTUpload() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");

  // 🔥 company (super admin only)
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const isSuperAdmin = user?.role === "super_admin";

  const clean = (v) => (v ? v.toString().trim() : "");

  const normalizeKey = (key) =>
    key
      ? key
          .toString()
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "")
          .replace(/[-_]/g, "")
      : "";

  const normalizeRow = (row) =>
    Object.keys(row).reduce((acc, key) => {
      acc[normalizeKey(key)] = row[key];
      return acc;
    }, {});

  const getValue = (row, ...keys) =>
    keys.reduce((value, key) => {
      if (value) return value;
      return clean(row[key]);
    }, "");

  const parseSalesman = (value) => {
    const text = clean(value);
    if (!text) return { code: "", name: "" };

    const match = text.match(/^([^\-]+)\s*-\s*(.+)$/);
    if (match) {
      const code = clean(match[1]);
      const name = clean(match[2]);
      return { code, name: code ? name : text.replace(/^\-\s*/, "") };
    }

    return { code: "", name: text };
  };

  // ================= LOAD COMPANIES =================
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
        toast.error("Failed to load companies");
      }
    };

    if (isSuperAdmin) {
      loadCompanies();
    }
  }, [isSuperAdmin]);

  // ================= FILE HANDLER =================
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = (event) => {
      const workbook = XLSX.read(event.target.result, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);

      const formatted = json
        .map((r) => normalizeRow(r))
        .map((r) => {
          const salesman = parseSalesman(
            getValue(r, "salesman", "salesmanname", "salesman_name", "name")
          );

          return {
            type: "HHT",
            assetCode: getValue(
              r,
              "assetcode",
              "asset_code"
            ),
            salesmanCode: salesman.code,
            salesmanName: salesman.name,
            route: getValue(r, "route"),
            imei: getValue(r, "imei"),
            simNumber: getValue(r, "simnumber", "sim", "sim_number"),
            supervisor: getValue(r, "supervisor"),
            notes: getValue(r, "notes"),
          };
        });

      setRows(formatted);
    };

    reader.readAsArrayBuffer(file);
  };

  // ================= UPLOAD =================
  const upload = async () => {
    try {
      setLoading(true);

      const valid = rows.filter(
        (r) => r.assetCode && (r.imei != null && r.imei !== "")
      );

      if (!valid.length) {
        toast.error("No valid rows");
        setLoading(false);
        return;
      }

      const payload = {
        assets: valid,
      };

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
    (r) => r.assetCode && (r.imei != null && r.imei !== "")
  ).length;

  const invalidCount = rows.length - validCount;

  return (
    <div className="min-h-screen bg-[#f4f6f9] p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            HHT Bulk Upload
          </h1>
          <p className="text-sm text-gray-500">
            Upload HHT Excel file
          </p>
        </div>

        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 rounded-xl bg-white border text-gray-700 hover:bg-gray-100 text-sm"
        >
          ← Back
        </button>
      </div>

      {/* COMPANY SELECT */}
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

      {/* UPLOAD BOX */}
      <div className="bg-white border rounded-2xl p-6 shadow-sm">

        {/* DROP AREA */}
        <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 cursor-pointer hover:bg-gray-50 transition">

          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFile}
            className="hidden"
          />

          <p className="text-lg font-semibold text-gray-700">
            📤 Drag & Drop Excel File
          </p>
          <p className="text-sm text-gray-500 mt-1">
            or click to browse
          </p>

          {fileName && (
            <p className="mt-3 text-sm text-blue-600">
              Selected: {fileName}
            </p>
          )}
        </label>

        {/* STATS */}
        {rows.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-gray-50 p-4 rounded-xl border text-center">
              Total
              <div className="text-xl font-bold">{rows.length}</div>
            </div>

            <div className="bg-green-50 p-4 rounded-xl border text-center">
              Valid
              <div className="text-xl font-bold text-green-700">
                {validCount}
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-xl border text-center">
              Invalid
              <div className="text-xl font-bold text-red-600">
                {invalidCount}
              </div>
            </div>
          </div>
        )}

        {/* TABLE */}
        {rows.length > 0 && (
          <div className="mt-6 overflow-x-auto border rounded-xl">
            <table className="w-full text-sm">

              <thead className="bg-gray-100 text-xs uppercase">
                <tr>
                  <th className="p-3 text-left">Asset Code</th>
                  <th className="p-3 text-left">Salesman</th>
                  <th className="p-3 text-left">Route</th>
                  <th className="p-3 text-left">IMEI</th>
                  <th className="p-3 text-left">SIM</th>
                  <th className="p-3 text-left">Supervisor</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50">

                    <td className="p-3">{r.assetCode}</td>

                    <td className="p-3">
                      {r.salesmanCode} - {r.salesmanName}
                    </td>

                    <td className="p-3">{r.route}</td>
                    <td className="p-3">{r.imei}</td>
                    <td className="p-3">{r.simNumber}</td>
                    <td className="p-3">{r.supervisor}</td>

                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}

        {/* UPLOAD BUTTON */}
        {rows.length > 0 && (
          <div className="flex justify-end mt-6">
            <button
              onClick={upload}
              disabled={loading}
              className="px-6 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Uploading..." : "Upload HHT"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}