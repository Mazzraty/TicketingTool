// pages/AssetHistoryPage.jsx

import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AssetHistoryPage() {
  const [employees, setEmployees] = useState([]);
  const [assets, setAssets] = useState([]);

  const [employeeId, setEmployeeId] = useState("");
  const [assetCode, setAssetCode] = useState("");

  const [employeeSearch, setEmployeeSearch] = useState("");
  const [assetSearch, setAssetSearch] = useState("");

  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [showAssetDropdown, setShowAssetDropdown] = useState(false);

  const [assetType, setAssetType] = useState("All");

  const [empHistory, setEmpHistory] = useState([]);
  const [assetHistory, setAssetHistory] = useState([]);

  const [loadingEmp, setLoadingEmp] = useState(false);
  const [loadingAsset, setLoadingAsset] = useState(false);

  /* =========================
     REFRESH FUNCTION
  ========================= */
  const handleRefresh = () => {
    setEmployeeId("");
    setAssetCode("");

    setEmployeeSearch("");
    setAssetSearch("");

    setEmpHistory([]);
    setAssetHistory([]);

    setShowEmployeeDropdown(false);
    setShowAssetDropdown(false);

    setAssetType("All");

    toast.success("Refreshed");
  };

  /* =========================
     FILTERED EMPLOYEES
  ========================= */
  const filteredEmployees = employees.filter((emp) =>
    `${emp.staffCode} ${emp.name}`
      .toLowerCase()
      .includes(employeeSearch.toLowerCase())
  );

  /* =========================
     FILTERED ASSETS
  ========================= */
  const filteredAssets = assets.filter((asset) =>
    `${asset.assetCode} ${asset.type}`
      .toLowerCase()
      .includes(assetSearch.toLowerCase())
  );

  /* =========================
     LOAD DATA
  ========================= */
  useEffect(() => {
    const loadData = async () => {
      try {
        const [empRes, assetRes] = await Promise.all([
          api.get("/employees"),
          api.get("/assets?limit=1000"),
        ]);

        setEmployees(
          Array.isArray(empRes.data)
            ? empRes.data
            : empRes.data?.employees || []
        );

        setAssets(
          Array.isArray(assetRes.data)
            ? assetRes.data
            : Array.isArray(assetRes.data?.assets)
            ? assetRes.data.assets
            : []
        );
      } catch (err) {
        toast.error("Failed to load data");
      }
    };

    loadData();
  }, []);

  /* =========================
     EMPLOYEE HISTORY
  ========================= */
  useEffect(() => {
    if (!employeeId) {
      setEmpHistory([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoadingEmp(true);

        const res = await api.get(
          `/assets/employee/${employeeId}?type=${assetType}`
        );

        setEmpHistory(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        toast.error("Employee history not found");
      } finally {
        setLoadingEmp(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [employeeId, assetType]);

  /* =========================
     ASSET HISTORY
  ========================= */
  useEffect(() => {
    if (!assetCode) {
      setAssetHistory([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoadingAsset(true);

        const res = await api.get(
          `/assets/asset/${assetCode}?type=${assetType}`
        );

        setAssetHistory(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        toast.error("Asset history not found");
      } finally {
        setLoadingAsset(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [assetCode, assetType]);

  /* =========================
     STATUS BADGE
  ========================= */
  const statusBadge = (h) => {
    if (!h.returnedDate) {
      return (
        <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700 font-medium">
          Active
        </span>
      );
    }

    return (
      <span className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700 font-medium">
        Returned
      </span>
    );
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* HEADER */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Asset History
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track employee & asset assignment history
          </p>
        </div>

        {/* 🔄 REFRESH BUTTON */}
        <button
          onClick={handleRefresh}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
        >
          Refresh
        </button>
      </div>

      {/* ================= FILTERS ================= */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border mb-6">
        <div className="grid md:grid-cols-3 gap-5">

          {/* EMPLOYEE */}
          <div className="relative">
            <label className="text-xs font-medium text-gray-500 mb-2 block uppercase">
              Search Employee
            </label>

            <input
              type="text"
              className="border p-3 rounded-xl w-full"
              value={employeeSearch}
              onChange={(e) => {
                setEmployeeSearch(e.target.value);
                setShowEmployeeDropdown(true);
              }}
              onFocus={() => setShowEmployeeDropdown(true)}
              placeholder="Search employee..."
            />

            {showEmployeeDropdown && employeeSearch && (
              <div className="absolute z-50 bg-white border rounded-xl shadow-lg mt-1 w-full max-h-60 overflow-y-auto">
                {filteredEmployees.map((emp) => (
                  <div
                    key={emp._id}
                    onClick={() => {
                      setEmployeeId(emp._id);
                      setEmployeeSearch(`${emp.staffCode} - ${emp.name}`);
                      setShowEmployeeDropdown(false);
                    }}
                    className="p-3 hover:bg-blue-50 cursor-pointer border-b"
                  >
                    <div className="font-semibold text-sm">
                      {emp.staffCode}
                    </div>
                    <div className="text-xs text-gray-500">
                      {emp.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ASSET */}
          <div className="relative">
            <label className="text-xs font-medium text-gray-500 mb-2 block uppercase">
              Search Asset
            </label>

            <input
              type="text"
              className="border p-3 rounded-xl w-full"
              value={assetSearch}
              onChange={(e) => {
                setAssetSearch(e.target.value);
                setShowAssetDropdown(true);
              }}
              onFocus={() => setShowAssetDropdown(true)}
              placeholder="Search asset..."
            />

            {showAssetDropdown && assetSearch && (
              <div className="absolute z-50 bg-white border rounded-xl shadow-lg mt-1 w-full max-h-60 overflow-y-auto">
                {filteredAssets.map((asset) => (
                  <div
                    key={asset._id}
                    onClick={() => {
                      setAssetCode(asset.assetCode);
                      setAssetSearch(`${asset.assetCode} - ${asset.type}`);
                      setShowAssetDropdown(false);
                    }}
                    className="p-3 hover:bg-blue-50 cursor-pointer border-b"
                  >
                    <div className="font-semibold text-sm">
                      {asset.assetCode}
                    </div>
                    <div className="text-xs text-gray-500">
                      {asset.type}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* TYPE */}
          <div>
            <label className="text-xs font-medium text-gray-500 mb-2 block uppercase">
              Asset Type
            </label>

            <select
              className="border p-3 rounded-xl w-full"
              value={assetType}
              onChange={(e) => setAssetType(e.target.value)}
            >
              <option value="All">All</option>
              <option value="Laptop">Laptop</option>
              <option value="Printer">Printer</option>
              <option value="HHT">HHT</option>
            </select>
          </div>

        </div>
      </div>

      {/* KEEP YOUR TABLES EXACT SAME (NOT CHANGED) */}
    </div>
  );
}