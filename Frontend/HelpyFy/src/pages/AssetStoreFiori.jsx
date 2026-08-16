import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
export default function AssetStoreFiori() {
  const [assets, setAssets] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [companyFilter, setCompanyFilter] = useState("All"); // super_admin scoping
  const [companies, setCompanies] = useState([]);
  // EDIT
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  // ================= USER INFO =================
  const user = JSON.parse(localStorage.getItem("user"));
  const isSuperAdmin = user?.role === "super_admin";

  /* ================= LOAD ================= */
  const loadAssets = async (companyId = companyFilter) => {
    try {
      const res = await api.get("/assets", {
        params: {
          limit: 1000,
          ...(isSuperAdmin && companyId && companyId !== "All"
            ? { companyId }
            : {}),
        },
      });

      console.log("ASSET RESPONSE:", res.data);

      setAssets(
        Array.isArray(res.data.assets)
          ? res.data.assets
          : []
      );
    } catch (err) {
      console.error(err);

      toast.error("Failed to load assets");

      setAssets([]);
    }
  };

  const loadCompanies = async () => {
    try {
      const res = await api.get("/companies");
      setCompanies(res.data.companies || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      loadCompanies();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch assets whenever the super-admin company filter changes
  useEffect(() => {
    loadAssets(companyFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyFilter]);

  /* ================= FILTER ================= */
  const filtered = Array.isArray(assets)
    ? assets.filter((a) => {
      const type = a.type?.toLowerCase();
      const selectedFilter = filter?.toLowerCase();

      const matchType =
        selectedFilter === "all" || type === selectedFilter;

      const matchStatus =
        statusFilter === "All" ||
        a.status?.toLowerCase() === statusFilter.toLowerCase();

      const text = search.toLowerCase();

      const matchSearch =
        a.assetCode?.toLowerCase().includes(text) ||
        a.model?.toLowerCase().includes(text) ||
        a.serialNumber?.toLowerCase().includes(text) ||
        a.salesmanName?.toLowerCase().includes(text) ||
        a.salesmanCode?.toLowerCase().includes(text);

      return matchType && matchStatus && matchSearch;
    })
    : [];

  /* ================= KPI ================= */
  const total = assets.length;

  const laptop = assets.filter(
    (a) => a.type === "Laptop"
  ).length;
  const mobile = assets.filter(
    (a) => a.type === "Mobile"
  ).length;
  const printer = assets.filter(
    (a) => a.type === "Printer"
  ).length;

  const hht = assets.filter(
    (a) => a.type === "HHT"
  ).length;

  /* ================= TABLE CONTROL ================= */
  const showHHTFields = filter === "HHT";

  /* ================= CURRENT USER ================= */
  const getCurrentUser = (asset) => {
    if (asset.employee?.name) {
      return asset.employee.name;
    }

    if (asset.employee?.employeeName) {
      return asset.employee.employeeName;
    }

    if (asset.assignedTo?.name) {
      return asset.assignedTo.name;
    }

    if (asset.assignedTo?.employeeName) {
      return asset.assignedTo.employeeName;
    }

    if (asset.user?.name) {
      return asset.user.name;
    }

    if (asset.salesmanName) {
      return asset.salesmanName;
    }

    return "Not Assigned";
  };

  /* ================= EDIT ================= */
  const openEdit = (asset) => {
    const updatedAsset = { ...asset };

    if (updatedAsset.type === "Laptop") {
      updatedAsset.accessories = {
        charger: updatedAsset.accessories?.charger ?? true,
        mouse: updatedAsset.accessories?.mouse ?? true,
        laptopBag: updatedAsset.accessories?.laptopBag ?? true,
        keyboard: updatedAsset.accessories?.keyboard ?? false,
        headset: updatedAsset.accessories?.headset ?? false,
      };
    }

    setSelected(updatedAsset);
    setEditOpen(true);
  };

  /* ================= UPDATE ================= */
  const updateAsset = async () => {
    try {
      await api.put(
        `/assets/${selected._id}`,
        selected
      );

      toast.success("Asset Updated");

      setEditOpen(false);

      loadAssets();
    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.msg ||
        "Update failed"
      );
    }
  };

  /* ================= DELETE ================= */
  const deleteAsset = async (id) => {
    const confirmDelete = window.confirm(
      "Delete this asset?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/assets/${id}`);

      toast.success("Asset Deleted");

      loadAssets();
    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.msg ||
        "Delete failed"
      );
    }
  };
  const exportToExcel = () => {
    const exportData = filtered.map((a) => ({
      AssetCode: a.assetCode,
      Type: a.type,
      Model: a.model,
      SerialNumber: a.serialNumber,
      CurrentUser: getCurrentUser(a),
      Status:
        {
          available: "Available",
          assigned: "Assigned",
          damaged: "Damaged",
          printer_for_service: "for Service",
          under_service: "Under Service",
        }[a.status] || a.status,

      SalesmanName: a.salesmanName || "",
      SalesmanCode: a.salesmanCode || "",
      Route: a.route || "",
      Supervisor: a.supervisor || "",
      IMEI: a.imei || "",
      SIMNumber: a.simNumber || "",
      Notes: a.notes || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Assets"
    );

    XLSX.writeFile(
      workbook,
      `Assets_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  /* ================= UI HELPERS (styling only, no logic) ================= */
  const STATUS_LABELS = {
    All: "All",
    available: "Available",
    assigned: "Assigned",
    damaged: "Damaged",
    printer_for_service: "for Service",
    under_service: "Under Service",
  };

  const STATUS_BADGE = {
    available: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    assigned: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    damaged: "bg-red-50 text-red-700 ring-1 ring-red-200",
    printer_for_service: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    under_service: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
  };

  const TYPE_BADGE = {
    Laptop: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
    Mobile: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",
    Printer: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    HHT: "bg-purple-50 text-purple-700 ring-1 ring-purple-200",
  };
  const navLink = (label, href, active = false) => (
    <button
      key={label}
      onClick={() => (window.location.href = href)}
      className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition ${active
        ? "bg-[#0a6ed1] text-white shadow-sm shadow-blue-600/30"
        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
    >
      {label}
    </button>
  );

  const inputClass =
    "border border-gray-200 bg-white rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition";

  const modalInput =
    "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition";

  const modalLabel = "text-xs font-semibold text-gray-500 tracking-wide block mb-1.5";

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-6">

        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            Asset Details
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Asset Management Dashboard
          </p>
        </div>

        {/* ================= STICKY NAVIGATION ================= */}
        <div className="sticky top-0 z-40 bg-white/90 backdrop-blur border border-gray-200 rounded-2xl shadow-sm mb-6">
          <div className="px-4 py-3 flex flex-wrap gap-2 items-center">
            {navLink("Assets Assign", "/admin/assets", true)}
            {navLink("Asset History", "/admin/assets/history")}
            {navLink("Upload Printer", "/admin/assets/upload-printer")}
            {navLink("Upload Laptop", "/admin/assets/upload-laptop")}
            {navLink("Upload HHT", "/admin/assets/upload-hht")}
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
            <span className="w-11 h-11 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center text-lg">
              📊
            </span>
            <div>
              <p className="text-gray-500 text-xs font-medium">Total Assets</p>
              <h2 className="text-2xl md:text-3xl font-bold mt-0.5 text-gray-900">
                {total}
              </h2>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
            <span className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg">
              💻
            </span>
            <div>
              <p className="text-gray-500 text-xs font-medium">Laptops</p>
              <h2 className="text-2xl md:text-3xl font-bold mt-0.5 text-blue-600">
                {laptop}
              </h2>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
            <span className="w-11 h-11 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center text-lg">
              📱
            </span>
            <div>
              <p className="text-gray-500 text-xs font-medium">Mobiles</p>
              <h2 className="text-2xl md:text-3xl font-bold mt-0.5 text-cyan-600">
                {mobile}
              </h2>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
            <span className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg">
              🖨️
            </span>
            <div>
              <p className="text-gray-500 text-xs font-medium">Printers</p>
              <h2 className="text-2xl md:text-3xl font-bold mt-0.5 text-emerald-600">
                {printer}
              </h2>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm flex items-center gap-4">
            <span className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-lg">
              📟
            </span>
            <div>
              <p className="text-gray-500 text-xs font-medium">HHT Devices</p>
              <h2 className="text-2xl md:text-3xl font-bold mt-0.5 text-purple-600">
                {hht}
              </h2>
            </div>
          </div>
        </div>

        {/* ================= SEARCH + FILTERS (single consolidated card) ================= */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm mb-6 overflow-hidden">

          {/* TOP BAR: search + actions */}
          <div className="px-6 py-5 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                🔍
              </span>
              <input
                className={`${inputClass} w-full pl-10`}
                placeholder="Search asset / serial / salesman..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* COMPANY FILTER — super_admin only */}
            {isSuperAdmin && (
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className={`${inputClass} w-full lg:w-56 truncate shrink-0`}
              >
                <option value="All">All companies</option>
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 rounded-2xl text-sm font-semibold transition ${showFilters
                  ? "bg-[#0a6ed1] text-white shadow-sm shadow-blue-600/30"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                {showFilters ? "Hide Filters" : "Show Filters"}
              </button>

              <button
                onClick={exportToExcel}
                className="px-4 py-2.5 rounded-2xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm shadow-emerald-600/20"
              >
                Export Excel
              </button>

              <button
                onClick={() => {
                  setSearch("");
                  setFilter("All");
                  setStatusFilter("All");
                  setCompanyFilter("All");
                }}
                className="px-4 py-2.5 rounded-2xl text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* EXPANDABLE FILTER AREA */}
          <div
            className={`grid transition-all duration-300 ease-in-out ${showFilters ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
          >
            <div className="overflow-hidden">
              <div className="px-6 pb-6 pt-1 space-y-5 border-t border-gray-100">

                {/* TYPE FILTER */}
                <div className="pt-4">
                  <p className="text-xs font-semibold text-gray-400 tracking-wide mb-2">
                    TYPE
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {["All", "Laptop", "Mobile", "Printer", "HHT"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setFilter(t)}
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition ${filter === t
                          ? "bg-[#0a6ed1] text-white border-[#0a6ed1] shadow-sm shadow-blue-600/20"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                          }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* STATUS FILTER */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 tracking-wide mb-2">
                    STATUS
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {[
                      "All",
                      "available",
                      "assigned",
                      "damaged",
                      "printer_for_service",
                      "under_service",
                    ].map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition ${statusFilter === s
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                          }`}
                      >
                        {STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= TABLE ================= */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f7f9fb] border-b border-gray-200">
                <tr className="text-gray-500">
                  <th className="text-left px-6 py-3.5 font-semibold text-xs tracking-wide uppercase">
                    Asset Code
                  </th>

                  <th className="text-left px-6 py-3.5 font-semibold text-xs tracking-wide uppercase">
                    Type
                  </th>

                  {!showHHTFields && (
                    <>
                      <th className="text-left px-6 py-3.5 font-semibold text-xs tracking-wide uppercase">
                        Model
                      </th>

                      <th className="text-left px-6 py-3.5 font-semibold text-xs tracking-wide uppercase">
                        Serial
                      </th>
                    </>
                  )}

                  {showHHTFields && (
                    <>
                      <th className="text-left px-6 py-3.5 font-semibold text-xs tracking-wide uppercase">
                        Salesman
                      </th>

                      <th className="text-left px-6 py-3.5 font-semibold text-xs tracking-wide uppercase">
                        Route
                      </th>
                    </>
                  )}

                  <th className="text-left px-6 py-3.5 font-semibold text-xs tracking-wide uppercase">
                    Current User
                  </th>

                  <th className="text-left px-6 py-3.5 font-semibold text-xs tracking-wide uppercase">
                    Status
                  </th>

                  <th className="text-center px-6 py-3.5 font-semibold text-xs tracking-wide uppercase">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-16">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <span className="text-3xl">🗂️</span>
                        <p className="text-sm font-medium">No assets found</p>
                        <p className="text-xs">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((a, index) => (
                    <tr
                      key={a._id}
                      className={`border-b border-gray-100 last:border-0 hover:bg-blue-50/40 transition ${index % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                        }`}
                    >
                      <td className="px-6 py-3.5 font-semibold text-gray-900">
                        {a.assetCode}
                      </td>

                      <td className="px-6 py-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold ${TYPE_BADGE[a.type] || "bg-gray-100 text-gray-700"
                            }`}
                        >
                          {a.type}
                        </span>
                      </td>

                      {!showHHTFields && (
                        <>
                          <td className="px-6 py-3.5 text-gray-600">
                            {a.model || "-"}
                          </td>

                          <td className="px-6 py-3.5 text-gray-600">
                            {a.serialNumber || "-"}
                          </td>
                        </>
                      )}

                      {showHHTFields && (
                        <>
                          <td className="px-6 py-3.5 text-gray-600">
                            {a.salesmanName || "-"}
                          </td>

                          <td className="px-6 py-3.5 text-gray-600">
                            {a.route || "-"}
                          </td>
                        </>
                      )}

                      <td className="px-6 py-3.5 text-gray-700 font-medium">
                        {getCurrentUser(a)}
                      </td>

                      <td className="px-6 py-3.5">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_BADGE[a.status] || "bg-gray-100 text-gray-700"
                            }`}
                        >
                          {STATUS_LABELS[a.status] || a.status}
                        </span>
                      </td>

                      <td className="px-6 py-3.5">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEdit(a)}
                            className="min-w-[76px] h-8 rounded-lg bg-white hover:bg-blue-50 text-[#0a6ed1] text-xs font-semibold border border-blue-200 transition"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => deleteAsset(a._id)}
                            className="min-w-[76px] h-8 rounded-lg bg-white hover:bg-red-50 text-red-600 text-xs font-semibold border border-red-200 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-100 text-xs text-gray-400">
              Showing {filtered.length} of {total} assets
            </div>
          )}
        </div>

        {/* ================= EDIT MODAL ================= */}
        {editOpen && selected && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden max-h-[90vh] flex flex-col">
              {/* HEADER */}
              <div className="bg-[#0a6ed1] px-6 py-4 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Edit Asset
                  </h2>
                  <p className="text-blue-100 text-xs">
                    Update asset information
                  </p>
                </div>

                <button
                  onClick={() => setEditOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 text-white transition flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              {/* BODY */}
              <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  <div>
                    <label className={modalLabel}>Asset Code</label>
                    <input
                      className={modalInput}
                      value={selected.assetCode || ""}
                      onChange={(e) =>
                        setSelected({
                          ...selected,
                          assetCode: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className={modalLabel}>Type</label>
                    <select
                      className={modalInput}
                      value={selected.type || ""}
                      onChange={(e) =>
                        setSelected({
                          ...selected,
                          type: e.target.value,
                        })
                      }
                    >
                      <option value="Laptop">Laptop</option>
                      <option value="Mobile">Mobile</option>
                      <option value="Printer">Printer</option>
                      <option value="HHT">HHT</option>
                    </select>
                  </div>

                  {(selected.type === "Laptop" ||
                    selected.type === "Mobile" ||
                    selected.type === "Printer") && (
                      <>
                        <div>
                          <label className={modalLabel}>Model</label>
                          <input
                            className={modalInput}
                            value={selected.model || ""}
                            onChange={(e) =>
                              setSelected({
                                ...selected,
                                model: e.target.value,
                              })
                            }
                          />
                        </div>

                        <div>
                          <label className={modalLabel}>Serial Number</label>
                          <input
                            className={modalInput}
                            value={selected.serialNumber || ""}
                            onChange={(e) =>
                              setSelected({
                                ...selected,
                                serialNumber: e.target.value,
                              })
                            }
                          />
                        </div>
                      </>
                    )}

                  {selected.type === "Printer" && (
                    <>
                      <div>
                        <label className={modalLabel}>Route</label>
                        <input
                          className={modalInput}
                          value={selected.route || ""}
                          onChange={(e) =>
                            setSelected({
                              ...selected,
                              route: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <label className={modalLabel}>Supervisor</label>
                        <input
                          className={modalInput}
                          value={selected.supervisor || ""}
                          onChange={(e) =>
                            setSelected({
                              ...selected,
                              supervisor: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <label className={modalLabel}>Salesman Code</label>
                        <input
                          className={modalInput}
                          value={selected.salesmanCode || ""}
                          onChange={(e) =>
                            setSelected({
                              ...selected,
                              salesmanCode: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <label className={modalLabel}>Salesman Name</label>
                        <input
                          className={modalInput}
                          value={selected.salesmanName || ""}
                          onChange={(e) =>
                            setSelected({
                              ...selected,
                              salesmanName: e.target.value,
                            })
                          }
                        />
                      </div>
                    </>
                  )}

                  {selected.type === "HHT" && (
                    <>
                      <div>
                        <label className={modalLabel}>Salesman Name</label>
                        <input
                          className={modalInput}
                          value={selected.salesmanName || ""}
                          onChange={(e) =>
                            setSelected({
                              ...selected,
                              salesmanName: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <label className={modalLabel}>Route</label>
                        <input
                          className={modalInput}
                          value={selected.route || ""}
                          onChange={(e) =>
                            setSelected({
                              ...selected,
                              route: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <label className={modalLabel}>IMEI</label>
                        <input
                          className={modalInput}
                          value={selected.imei || ""}
                          onChange={(e) =>
                            setSelected({
                              ...selected,
                              imei: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <label className={modalLabel}>SIM Number</label>
                        <input
                          className={modalInput}
                          value={selected.simNumber || ""}
                          onChange={(e) =>
                            setSelected({
                              ...selected,
                              simNumber: e.target.value,
                            })
                          }
                        />
                      </div>
                    </>
                  )}

                  <div className="md:col-span-2">
                    <label className={modalLabel}>Status</label>
                    <select
                      className={modalInput}
                      value={selected.status || ""}
                      onChange={(e) =>
                        setSelected({
                          ...selected,
                          status: e.target.value,
                        })
                      }
                    >
                      <option value="available">Available</option>
                      <option value="assigned">Assigned</option>
                      <option value="damaged">Damaged</option>
                      <option value="printer_for_service">
                        For Service
                      </option>
                      <option value="under_service">Under Service</option>
                    </select>
                  </div>

                  {selected?.type === "Laptop" && (
                    <div className="md:col-span-2">
                      <label className={modalLabel + " mb-2"}>
                        Accessories
                      </label>

                      <div className="grid grid-cols-2 gap-2.5">
                        {[
                          ["charger", "Charger"],
                          ["mouse", "Mouse"],
                          ["laptopBag", "Laptop Bag"],
                          ["keyboard", "Keyboard"],
                          ["headset", "Headset"],
                        ].map(([key, label]) => (
                          <label
                            key={key}
                            className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 cursor-pointer hover:bg-gray-100 transition"
                          >
                            <input
                              type="checkbox"
                              className="accent-[#0a6ed1]"
                              checked={selected?.accessories?.[key] || false}
                              onChange={(e) =>
                                setSelected({
                                  ...selected,
                                  accessories: {
                                    ...selected.accessories,
                                    [key]: e.target.checked,
                                  },
                                })
                              }
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className={modalLabel}>Notes</label>
                    <textarea
                      rows="4"
                      className={modalInput}
                      value={selected.notes || ""}
                      onChange={(e) =>
                        setSelected({
                          ...selected,
                          notes: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="flex gap-3 p-6 pt-0 shrink-0">
                <button
                  onClick={updateAsset}
                  className="flex-1 h-11 rounded-xl bg-[#0a6ed1] hover:bg-[#085caf] text-white font-semibold shadow-sm shadow-blue-600/20 transition"
                >
                  Save Changes
                </button>

                <button
                  onClick={() => setEditOpen(false)}
                  className="flex-1 h-11 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}