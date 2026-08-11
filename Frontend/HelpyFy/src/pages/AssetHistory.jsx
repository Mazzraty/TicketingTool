// pages/AssetHistoryPage.jsx

import { useEffect, useState, useMemo, useCallback, memo } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ===================================
   MOVED OUT of the main component + wrapped in memo().
   Previously this was declared inside AssetHistoryPage, so every
   keystroke in the date input (editDate state change) re-created
   this function from scratch, forcing React to remount the cell
   and re-render the ENTIRE page (including the employee/asset
   search dropdowns) on every keystroke.

   Now it's a stable component reference. memo() means it only
   re-renders when its own props (h, isEditing, editDate, onStart,
   onSave, onCancel, onChangeDate) actually change — not when
   unrelated state (like employeeSearch) changes.
=================================== */
const AssignedDateCell = memo(function AssignedDateCell({
  h,
  isEditing,
  editDate,
  onStart,
  onSave,
  onCancel,
  onChangeDate,
}) {
  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="date"
          className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={editDate}
          onChange={(e) => onChangeDate(e.target.value)}
          autoFocus
        />
        <button
          onClick={() => onSave(h)}
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-800"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="text-xs font-semibold text-gray-400 hover:text-gray-600"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      <span>
        {h.assignedDate
          ? new Date(h.assignedDate).toLocaleString()
          : "-"}
      </span>
      <button
        onClick={() => onStart(h)}
        className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 hover:underline transition"
      >
        Edit
      </button>
    </div>
  );
});

/* ===================================
   NEW: renders vendor/repair details for a "repair" record row.
   Kept as its own small component purely for readability — it has
   no internal state so it doesn't need memo().
=================================== */
function VendorDetailsCell({ h }) {
  const v = h.vendorDetails || {};

  return (
    <div className="text-xs leading-relaxed">
      <div className="font-semibold text-gray-700">
        {v.vendorName || "-"}
      </div>

      {v.complaintDescription && (
        <div className="text-gray-500">
          {v.complaintDescription}
        </div>
      )}

      {(v.cost || v.cost === 0) && (
        <div className="text-gray-500">
          Cost: {v.cost}
        </div>
      )}

      {v.receiptUrl && (
        <a
          href={v.receiptUrl}
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 hover:underline"
        >
          Receipt
        </a>
      )}

      {h.ticketNumber && (
        <div className="text-gray-400 mt-1">
          Ticket: {h.ticketNumber}
        </div>
      )}
    </div>
  );
}

export default function AssetHistoryPage() {
  const [employees, setEmployees] = useState([]);
  const [assets, setAssets] = useState([]);

  const [employeeId, setEmployeeId] = useState("");
  const [assetCode, setAssetCode] = useState("");

  const [employeeSearch, setEmployeeSearch] =
    useState("");

  const [assetSearch, setAssetSearch] =
    useState("");

  const [showEmployeeDropdown, setShowEmployeeDropdown] =
    useState(false);

  const [showAssetDropdown, setShowAssetDropdown] =
    useState(false);

  const [assetType, setAssetType] =
    useState("All");

  const [empHistory, setEmpHistory] =
    useState([]);

  const [assetHistory, setAssetHistory] =
    useState([]);

  const [loadingEmp, setLoadingEmp] =
    useState(false);

  const [loadingAsset, setLoadingAsset] =
    useState(false);

  // inline "assigned date" edit state (shared by both tables)
  const [editingId, setEditingId] = useState(null);
  const [editDate, setEditDate] = useState("");

  /* ===================================
     FILTERED EMPLOYEES
  =================================== */
  const filteredEmployees = useMemo(
    () =>
      employees.filter((emp) =>
        `${emp.staffCode} ${emp.name}`
          .toLowerCase()
          .includes(employeeSearch.toLowerCase())
      ),
    [employees, employeeSearch]
  );

  /* ===================================
     FILTERED ASSETS
  =================================== */
  const filteredAssets = useMemo(
    () =>
      assets.filter((asset) =>
        `${asset.assetCode} ${asset.type}`
          .toLowerCase()
          .includes(assetSearch.toLowerCase())
      ),
    [assets, assetSearch]
  );

  const getAccessories = (h) => {
    return h.accessories || h.asset?.accessories || {};
  };

  /* ===================================
     FIX: Convert a Date/ISO string to a
     "YYYY-MM-DD" value using LOCAL time,
     not UTC. `toISOString()` shifts the
     date backward/forward across midnight
     depending on the browser's timezone
     offset from UTC — which is what was
     causing the date picker to show the
     wrong day.
  =================================== */
  const toLocalDateInputValue = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  /* ===================================
     LOAD EMPLOYEES + ASSETS
  =================================== */
  useEffect(() => {
    const loadData = async () => {
      try {
        const [empRes, assetRes] =
          await Promise.all([
            api.get("/employees"),
            api.get("/assets?limit=1000"),
          ]);

        console.log(
          "EMPLOYEES =>",
          empRes.data
        );

        console.log(
          "ASSETS =>",
          assetRes.data
        );

        setEmployees(
          Array.isArray(empRes.data)
            ? empRes.data
            : empRes.data?.employees || []
        );

        setAssets(
          Array.isArray(assetRes.data)
            ? assetRes.data
            : Array.isArray(
              assetRes.data?.assets
            )
              ? assetRes.data.assets
              : []
        );
      } catch (err) {
        console.error(err);
        toast.error("Failed to load data");
      }
    };

    loadData();
  }, []);

  /* ===================================
     EMPLOYEE HISTORY
  =================================== */
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

        setEmpHistory(
          Array.isArray(res.data)
            ? res.data
            : []
        );
      } catch (err) {
        console.error(err);
        toast.error(
          "Employee history not found"
        );
      } finally {
        setLoadingEmp(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [employeeId, assetType]);

  /* ===================================
     ASSET HISTORY
     NOTE: the backend now returns a merged list of
     "assignment" and "repair" (vendor) records for this
     asset, each tagged with `recordType`. No frontend
     change needed here — just render both kinds below.
  =================================== */
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

        setAssetHistory(
          Array.isArray(res.data)
            ? res.data
            : []
        );
      } catch (err) {
        console.error(err);
        toast.error(
          "Asset history not found"
        );
      } finally {
        setLoadingAsset(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [assetCode, assetType]);

  /* ===================================
     STATUS BADGE
     UPDATED: repair records get their own badge instead of
     falling through to Active/Returned logic (repair rows have
     no `returnedDate` in the assignment sense).
  =================================== */
  const statusBadge = (h) => {
    if (h.recordType === "repair") {
      return (
        <span className="px-3 py-1 text-xs rounded-full bg-amber-100 text-amber-700 font-medium">
          Sent for Repair
        </span>
      );
    }

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

  /* ===================================
     EDIT ASSIGNED DATE
     h._id here is the AssetAssignment _id (both empHistory and
     assetHistory rows come from AssetAssignment documents), so this
     hits PUT /assets/assignments/:id/date directly.

     NOTE: repair rows in assetHistory carry a Ticket _id, not an
     AssetAssignment _id, so this must never be invoked for them —
     the render logic below only wires AssignedDateCell up for
     recordType !== "repair".
  =================================== */
  // FIX: wrapped in useCallback so these keep the same function
  // reference across renders. This matters because AssignedDateCell
  // is wrapped in memo() — if these were plain functions, they'd be
  // recreated every render and memo() would never skip a re-render.
  const startEditDate = useCallback((h) => {
    setEditingId(h._id);
    setEditDate(
      h.assignedDate
        ? toLocalDateInputValue(h.assignedDate) // FIX: was toISOString().slice(0,10)
        : ""
    );
  }, []);

  const cancelEditDate = useCallback(() => {
    setEditingId(null);
    setEditDate("");
  }, []);

  const saveEditDate = useCallback(
    async (h) => {
      if (!editDate) {
        return toast.error("Please pick a date");
      }

      try {
        await api.put(`/assets/assignments/${h._id}/date`, {
          // FIX: send with a fixed local-noon time component so that
          // when the backend does `new Date("YYYY-MM-DD...")`, the
          // UTC conversion can never roll the date to the previous
          // or next calendar day, no matter what timezone the DB
          // server is running in.
          assignedDate: `${editDate}T12:00:00`,
        });

        toast.success("Assigned date updated");

        setEmpHistory((prev) =>
          prev.map((row) =>
            row._id === h._id
              ? { ...row, assignedDate: `${editDate}T12:00:00` }
              : row
          )
        );

        setAssetHistory((prev) =>
          prev.map((row) =>
            row._id === h._id
              ? { ...row, assignedDate: `${editDate}T12:00:00` }
              : row
          )
        );

        setEditingId(null);
        setEditDate("");
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.msg || "Failed to update date");
      }
    },
    [editDate]
  );

  const handleChangeEditDate = useCallback((val) => {
    setEditDate(val);
  }, []);

  /* ===================================
     EXPORT EMP PDF
     (unchanged — employee history has no repair rows)
  =================================== */
  const exportEmpPDF = () => {
    const doc = new jsPDF();

    doc.text("Employee Asset History", 14, 10);

    const body = empHistory.map((h) => {
      const acc = h.accessories || h.asset?.accessories || {};

      const accessoriesText =
        h.assetType?.toLowerCase() === "laptop"
          ? [
            acc.charger && "Charger",
            acc.mouse && "Mouse",
            acc.laptopBag && "Laptop Bag",
            acc.keyboard && "Keyboard",
            acc.headset && "Headset",
          ]
            .filter(Boolean)
            .join(", ")
          : "-";

      return [
        h.asset?.assetCode || "-",
        h.assetType || "-",
        h.assignedDate
          ? new Date(h.assignedDate).toLocaleString()
          : "-",
        accessoriesText,
        h.returnedDate
          ? new Date(h.returnedDate).toLocaleString()
          : "Active",
      ];
    });

    autoTable(doc, {
      head: [["Asset", "Type", "Assigned", "Accessories", "Returned"]],
      body,
    });

    doc.save("employee-history.pdf");
  };

  /* ===================================
     EXPORT ASSET PDF
     UPDATED: repair rows now print vendor name / cost / complaint
     in the "Accessories" column position instead of "-", and
     "Assigned" prints "-" for repair rows since they have none.
  =================================== */
  const exportAssetPDF = () => {
    const doc = new jsPDF();

    doc.text("Asset History", 14, 10);

    autoTable(doc, {
      head: [
        [
          "Employee",
          "Type",
          "Status",
          "Assigned",
          "Returned",
          "Details",
        ],
      ],

      body: assetHistory.map((h) => {
        if (h.recordType === "repair") {
          const v = h.vendorDetails || {};
          const details = [
            v.vendorName && `Vendor: ${v.vendorName}`,
            v.complaintDescription,
            (v.cost || v.cost === 0) && `Cost: ${v.cost}`,
          ]
            .filter(Boolean)
            .join(" | ") || "-";

          return [
            "-",
            h.assetType || "-",
            "Sent for Repair",
            "-",
            // FIX: date-only, not toLocaleString(). Repair date comes from
            // a plain date picker with no time component — rendering it
            // with a time showed the UTC-midnight artifact as a stray
            // early-morning timestamp (e.g. "8/11/2026, 3:00:00 AM").
            h.returnedDate
              ? new Date(h.returnedDate).toLocaleDateString()
              : "-",
            details,
          ];
        }

        return [
          `${h.employee?.staffCode || "-"} - ${h.employee?.name || "-"
          }`,

          h.assetType || "-",

          h.status || "-",

          h.assignedDate
            ? new Date(
              h.assignedDate
            ).toLocaleString()
            : "-",

          h.returnedDate
            ? new Date(
              h.returnedDate
            ).toLocaleString()
            : "Active",

          "-",
        ];
      }),
    });

    doc.save("asset-history.pdf");
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* ================= BACK NAVIGATION ================= */}
      <div className="mb-4">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 transition shadow-sm text-sm font-semibold"
        >
          ← Back
        </button>
      </div>
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Asset History
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Track employee & asset
          assignment history
        </p>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border mb-6">

        <div className="grid md:grid-cols-3 gap-5">

          {/* EMPLOYEE SEARCH */}
          <div className="relative">

            <label className="text-xs font-medium text-gray-500 mb-2 block uppercase tracking-wide">
              Search Employee
            </label>

            <input
              type="text"
              className="border border-gray-300 p-3 rounded-xl w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search by staff code or employee..."
              value={employeeSearch}
              onChange={(e) => {
                setEmployeeSearch(
                  e.target.value
                );

                setShowEmployeeDropdown(
                  true
                );
              }}
              onFocus={() =>
                setShowEmployeeDropdown(
                  true
                )
              }
            />

            {/* DROPDOWN */}
            {showEmployeeDropdown &&
              employeeSearch &&
              filteredEmployees.length >
              0 && (
                <div className="absolute z-50 bg-white border rounded-xl shadow-lg mt-1 w-full max-h-60 overflow-y-auto">

                  {filteredEmployees.map(
                    (emp) => (
                      <div
                        key={emp._id}
                        onClick={() => {
                          setEmployeeId(
                            emp._id
                          );

                          setEmployeeSearch(
                            `${emp.staffCode} - ${emp.name}`
                          );

                          setShowEmployeeDropdown(
                            false
                          );
                        }}
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b"
                      >
                        <div className="font-semibold text-sm text-gray-800">
                          {
                            emp.staffCode
                          }
                        </div>

                        <div className="text-xs text-gray-500">
                          {emp.name}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

            {/* SELECTED */}
            {employeeId && (
              <div className="mt-2 text-xs bg-blue-50 text-blue-700 px-3 py-2 rounded-lg border border-blue-100">
                Selected:{" "}
                {employeeSearch}
              </div>
            )}
          </div>

          {/* ASSET SEARCH */}
          <div className="relative">

            <label className="text-xs font-medium text-gray-500 mb-2 block uppercase tracking-wide">
              Search Asset
            </label>

            <input
              type="text"
              className="border border-gray-300 p-3 rounded-xl w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Search by asset code..."
              value={assetSearch}
              onChange={(e) => {
                setAssetSearch(
                  e.target.value
                );

                setShowAssetDropdown(
                  true
                );
              }}
              onFocus={() =>
                setShowAssetDropdown(
                  true
                )
              }
            />

            {/* DROPDOWN */}
            {showAssetDropdown &&
              assetSearch &&
              filteredAssets.length >
              0 && (
                <div className="absolute z-50 bg-white border rounded-xl shadow-lg mt-1 w-full max-h-60 overflow-y-auto">

                  {filteredAssets.map(
                    (asset) => (
                      <div
                        key={asset._id}
                        onClick={() => {
                          setAssetCode(
                            asset.assetCode
                          );

                          setAssetSearch(
                            `${asset.assetCode} - ${asset.type}`
                          );

                          setShowAssetDropdown(
                            false
                          );
                        }}
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b"
                      >
                        <div className="font-semibold text-sm text-gray-800">
                          {
                            asset.assetCode
                          }
                        </div>

                        <div className="text-xs text-gray-500">
                          {asset.type}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

            {/* SELECTED */}
            {assetCode && (
              <div className="mt-2 text-xs bg-green-50 text-green-700 px-3 py-2 rounded-lg border border-green-100">
                Selected: {assetSearch}
              </div>
            )}
          </div>

          {/* TYPE */}
          <div>

            <label className="text-xs font-medium text-gray-500 mb-2 block uppercase tracking-wide">
              Asset Type
            </label>

            <select
              className="border border-gray-300 p-3 rounded-xl w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={assetType}
              onChange={(e) =>
                setAssetType(
                  e.target.value
                )
              }
            >
              <option value="All">
                All
              </option>

              <option value="Laptop">
                Laptop
              </option>

              <option value="Printer">
                Printer
              </option>

              <option value="HHT">
                HHT
              </option>
            </select>

          </div>

        </div>
      </div>

      {/* EMPLOYEE HISTORY */}
      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">

        <div className="flex justify-between items-center mb-5">

          <div>
            <h2 className="font-bold text-xl text-gray-800">
              Employee History
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Assignment records by
              employee
            </p>
          </div>

          <button
            onClick={exportEmpPDF}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl text-sm font-medium"
          >
            Export PDF
          </button>
        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left font-semibold">
                  Asset
                </th>

                <th className="p-4 text-left font-semibold">
                  Type
                </th>

                <th className="p-4 text-left font-semibold">
                  Status
                </th>

                <th className="p-4 text-left font-semibold">
                  Assigned
                </th>

                <th className="p-4 text-left font-semibold">
                  Returned
                </th>
                <th className="p-4 text-left font-semibold">
                  Accessories
                </th>
              </tr>
            </thead>

            <tbody>

              {loadingEmp ? (
                <tr>
                  <td
                    colSpan="5"
                    className="p-6 text-center"
                  >
                    Loading...
                  </td>
                </tr>
              ) : empHistory.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="p-6 text-center text-gray-500"
                  >
                    No employee history
                    found
                  </td>
                </tr>
              ) : (
                empHistory.map((h) => (
                  <tr
                    key={h._id}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="p-4">
                      {h.asset
                        ?.assetCode ||
                        "-"}
                    </td>

                    <td className="p-4">
                      {h.assetType}
                    </td>

                    <td className="p-4">
                      {statusBadge(h)}
                    </td>

                    {/* inline-editable assigned date */}
                    <td className="p-4">
                      <AssignedDateCell
                        h={h}
                        isEditing={editingId === h._id}
                        editDate={editDate}
                        onStart={startEditDate}
                        onSave={saveEditDate}
                        onCancel={cancelEditDate}
                        onChangeDate={handleChangeEditDate}
                      />
                    </td>

                    <td className="p-4">
                      {h.returnedDate
                        ? new Date(
                          h.returnedDate
                        ).toLocaleString()
                        : "Active"}
                    </td>
                    <td className="p-4 text-sm">
                      {h.assetType?.toLowerCase() === "laptop" ? (() => {
                        const acc = getAccessories(h);

                        return (
                          <>
                            {acc.charger && "🔌 Charger "}
                            {acc.mouse && "🖱 Mouse "}
                            {acc.laptopBag && "🎒 Bag "}
                            {acc.keyboard && "⌨ Keyboard "}
                            {acc.headset && "🎧 Headset "}
                          </>
                        );
                      })() : "-"}
                    </td>
                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>
      </div>

      {/* ASSET HISTORY */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">

        <div className="flex justify-between items-center mb-5">

          <div>
            <h2 className="font-bold text-xl text-gray-800">
              Asset History
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Assignment & repair records
              for this asset
            </p>
          </div>

          <button
            onClick={exportAssetPDF}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl text-sm font-medium"
          >
            Export PDF
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">

            <thead className="bg-gray-100">
              <tr>
                <th className="p-4 text-left font-semibold">
                  Employee
                </th>

                <th className="p-4 text-left font-semibold">
                  Type
                </th>

                <th className="p-4 text-left font-semibold">
                  Status
                </th>

                <th className="p-4 text-left font-semibold">
                  Assigned
                </th>

                <th className="p-4 text-left font-semibold">
                  Returned
                </th>
                <th className="p-4 text-left font-semibold">
                  Accessories / Vendor
                </th>
              </tr>
            </thead>

            <tbody>

              {loadingAsset ? (
                <tr>
                  <td
                    colSpan="6"
                    className="p-6 text-center"
                  >
                    Loading...
                  </td>
                </tr>
              ) : assetHistory.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="p-6 text-center text-gray-500"
                  >
                    No asset history found
                  </td>
                </tr>
              ) : (
                assetHistory.map((h) => {
                  const isRepair = h.recordType === "repair";

                  return (
                    <tr
                      key={h._id}
                      className={`border-t hover:bg-gray-50 ${isRepair ? "bg-amber-50/40" : ""
                        }`}
                    >
                      <td className="p-4">
                        {isRepair
                          ? "-"
                          : `${h.employee?.staffCode || "-"} - ${h.employee?.name || "-"
                          }`}
                      </td>

                      <td className="p-4">
                        {h.assetType || "-"}
                      </td>

                      <td className="p-4">
                        {statusBadge(h)}
                      </td>

                      {/* inline-editable assigned date — repair
                          rows have no AssetAssignment _id, so they
                          never get the editable cell */}
                      <td className="p-4">
                        {isRepair ? (
                          <span className="text-xs text-gray-400">
                            -
                          </span>
                        ) : (
                          <AssignedDateCell
                            h={h}
                            isEditing={editingId === h._id}
                            editDate={editDate}
                            onStart={startEditDate}
                            onSave={saveEditDate}
                            onCancel={cancelEditDate}
                            onChangeDate={handleChangeEditDate}
                          />
                        )}
                      </td>

                      <td className="p-4">
                        {h.returnedDate
                          ? isRepair
                            // FIX: repair rows carry a date-only value
                            // (from the vendor-repair date picker), so
                            // show date-only here too — toLocaleString()
                            // was surfacing the UTC-midnight artifact as
                            // a stray "3:00:00 AM"-style timestamp.
                            ? new Date(h.returnedDate).toLocaleDateString()
                            : new Date(h.returnedDate).toLocaleString()
                          : isRepair
                            ? "-"
                            : "Active"}
                      </td>

                      <td className="p-4 text-sm">
                        {isRepair ? (
                          <VendorDetailsCell h={h} />
                        ) : h.assetType?.toLowerCase() === "laptop" ? (
                          (() => {
                            const acc = getAccessories(h);

                            return (
                              <>
                                {acc.charger && "🔌 Charger "}
                                {acc.mouse && "🖱 Mouse "}
                                {acc.laptopBag && "🎒 Bag "}
                                {acc.keyboard && "⌨ Keyboard "}
                                {acc.headset && "🎧 Headset "}
                              </>
                            );
                          })()
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })
              )}

            </tbody>

          </table>
        </div>

      </div>

    </div>
  );
}