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

  const [assetType, setAssetType] = useState("All");

  const [empHistory, setEmpHistory] = useState([]);
  const [assetHistory, setAssetHistory] = useState([]);

  const [loadingEmp, setLoadingEmp] = useState(false);
  const [loadingAsset, setLoadingAsset] = useState(false);

  /* ===================================
     LOAD EMPLOYEES + ASSETS
  =================================== */
  useEffect(() => {
    const loadData = async () => {
      try {
        const [empRes, assetRes] = await Promise.all([
          api.get("/employees"),
          api.get("/assets?limit=1000"),
        ]);

        console.log("EMPLOYEES =>", empRes.data);
        console.log("ASSETS =>", assetRes.data);

        // EMPLOYEES
        setEmployees(
          Array.isArray(empRes.data)
            ? empRes.data
            : empRes.data?.employees || []
        );

        // ASSETS
        setAssets(
          Array.isArray(assetRes.data)
            ? assetRes.data
            : Array.isArray(assetRes.data?.assets)
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
          Array.isArray(res.data) ? res.data : []
        );
      } catch (err) {
        console.error(err);
        toast.error("Employee history not found");
      } finally {
        setLoadingEmp(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [employeeId, assetType]);

  /* ===================================
     ASSET HISTORY
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
          Array.isArray(res.data) ? res.data : []
        );
      } catch (err) {
        console.error(err);
        toast.error("Asset history not found");
      } finally {
        setLoadingAsset(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [assetCode, assetType]);

  /* ===================================
     STATUS BADGE
  =================================== */
  const statusBadge = (h) => {
    if (!h.returnedDate) {
      return (
        <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">
          Active
        </span>
      );
    }

    return (
      <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-700">
        Returned
      </span>
    );
  };

  /* ===================================
     EXPORT EMP PDF
  =================================== */
  const exportEmpPDF = () => {
    const doc = new jsPDF();

    doc.text("Employee Asset History", 14, 10);

    autoTable(doc, {
      head: [["Asset", "Type", "Status", "Assigned", "Returned"]],

      body: empHistory.map((h) => [
        h.asset?.assetCode || "-",
        h.assetType || "-",
        h.status || "-",
        h.assignedDate
          ? new Date(h.assignedDate).toLocaleString()
          : "-",

        h.returnedDate
          ? new Date(h.returnedDate).toLocaleString()
          : "Active",
      ]),
    });

    doc.save("employee-history.pdf");
  };

  /* ===================================
     EXPORT ASSET PDF
  =================================== */
  const exportAssetPDF = () => {
    const doc = new jsPDF();

    doc.text("Asset History", 14, 10);

    autoTable(doc, {
      head: [["Employee", "Type", "Status", "Assigned", "Returned"]],

      body: assetHistory.map((h) => [
        `${h.employee?.staffCode || "-"} - ${
          h.employee?.name || "-"
        }`,
        h.assetType || "-",
        h.status || "-",

        h.assignedDate
          ? new Date(h.assignedDate).toLocaleString()
          : "-",

        h.returnedDate
          ? new Date(h.returnedDate).toLocaleString()
          : "Active",
      ]),
    });

    doc.save("asset-history.pdf");
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      {/* HEADER */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold">
          Asset History
        </h1>

        <p className="text-sm text-gray-500">
          Track employee & asset assignment history
        </p>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-5 rounded-xl shadow mb-5">

        <div className="grid md:grid-cols-3 gap-4">

          {/* EMPLOYEE */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Search Employee
            </label>

            <input
              list="employee-list"
              className="border p-2 rounded w-full"
              placeholder="Search employee..."
              value={employeeId}
              onChange={(e) =>
                setEmployeeId(e.target.value)
              }
            />

            <datalist id="employee-list">
              {employees
                .filter((emp) =>
                  `${emp.staffCode} ${emp.name}`
                    .toLowerCase()
                    .includes(employeeId.toLowerCase())
                )
                .map((emp) => (
                  <option
                    key={emp._id}
                    value={emp._id}
                  >
                    {emp.staffCode} - {emp.name}
                  </option>
                ))}
            </datalist>

            {employeeId && (
              <p className="text-xs text-gray-500 mt-1">
                {
                  employees.find(
                    (e) => e._id === employeeId
                  )?.staffCode
                }{" "}
                -{" "}
                {
                  employees.find(
                    (e) => e._id === employeeId
                  )?.name
                }
              </p>
            )}
          </div>

          {/* ASSET */}
          <div>

            <label className="text-xs text-gray-500 mb-1 block">
              Search Asset
            </label>

            <input
              list="asset-list"
              className="border p-2 rounded w-full"
              placeholder="Search asset..."
              value={assetCode}
              onChange={(e) =>
                setAssetCode(e.target.value)
              }
            />

            <datalist id="asset-list">
              {assets
                .filter((a) =>
                  `${a.assetCode} ${a.type}`
                    .toLowerCase()
                    .includes(assetCode.toLowerCase())
                )
                .map((asset) => (
                  <option
                    key={asset._id}
                    value={asset.assetCode}
                  >
                    {asset.assetCode} - {asset.type}
                  </option>
                ))}
            </datalist>

            {assetCode && (
              <p className="text-xs text-gray-500 mt-1">
                {
                  assets.find(
                    (a) => a.assetCode === assetCode
                  )?.assetCode
                }{" "}
                -{" "}
                {
                  assets.find(
                    (a) => a.assetCode === assetCode
                  )?.type
                }
              </p>
            )}
          </div>

          {/* TYPE */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Asset Type
            </label>

            <select
              className="border p-2 rounded w-full"
              value={assetType}
              onChange={(e) =>
                setAssetType(e.target.value)
              }
            >
              <option value="All">All</option>

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
      <div className="bg-white rounded-xl shadow p-5 mb-5">

        <div className="flex justify-between items-center mb-4">

          <div>
            <h2 className="font-bold text-lg">
              Employee History
            </h2>

            <p className="text-sm text-gray-500">
              Assignment records by employee
            </p>
          </div>

          <button
            onClick={exportEmpPDF}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Export PDF
          </button>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">
                  Asset
                </th>

                <th className="p-3 text-left">
                  Type
                </th>

                <th className="p-3 text-left">
                  Status
                </th>

                <th className="p-3 text-left">
                  Assigned
                </th>

                <th className="p-3 text-left">
                  Returned
                </th>
              </tr>
            </thead>

            <tbody>

              {loadingEmp ? (
                <tr>
                  <td
                    colSpan="5"
                    className="p-5 text-center"
                  >
                    Loading...
                  </td>
                </tr>
              ) : empHistory.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="p-5 text-center text-gray-500"
                  >
                    No employee history found
                  </td>
                </tr>
              ) : (
                empHistory.map((h) => (
                  <tr
                    key={h._id}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="p-3">
                      {h.asset?.assetCode || "-"}
                    </td>

                    <td className="p-3">
                      {h.assetType}
                    </td>

                    <td className="p-3">
                      {statusBadge(h)}
                    </td>

                    <td className="p-3">
                      {new Date(
                        h.assignedDate
                      ).toLocaleString()}
                    </td>

                    <td className="p-3">
                      {h.returnedDate
                        ? new Date(
                            h.returnedDate
                          ).toLocaleString()
                        : "Active"}
                    </td>
                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>
      </div>

      {/* ASSET HISTORY */}
      <div className="bg-white rounded-xl shadow p-5">

        <div className="flex justify-between items-center mb-4">

          <div>
            <h2 className="font-bold text-lg">
              Asset History
            </h2>

            <p className="text-sm text-gray-500">
              Assignment records by asset
            </p>
          </div>

          <button
            onClick={exportAssetPDF}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
          >
            Export PDF
          </button>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full text-sm">

            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">
                  Employee
                </th>

                <th className="p-3 text-left">
                  Type
                </th>

                <th className="p-3 text-left">
                  Status
                </th>

                <th className="p-3 text-left">
                  Assigned
                </th>

                <th className="p-3 text-left">
                  Returned
                </th>
              </tr>
            </thead>

            <tbody>

              {loadingAsset ? (
                <tr>
                  <td
                    colSpan="5"
                    className="p-5 text-center"
                  >
                    Loading...
                  </td>
                </tr>
              ) : assetHistory.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="p-5 text-center text-gray-500"
                  >
                    No asset history found
                  </td>
                </tr>
              ) : (
                assetHistory.map((h) => (
                  <tr
                    key={h._id}
                    className="border-t hover:bg-gray-50"
                  >
                    <td className="p-3">
                      {h.employee?.staffCode} -{" "}
                      {h.employee?.name}
                    </td>

                    <td className="p-3">
                      {h.assetType}
                    </td>

                    <td className="p-3">
                      {statusBadge(h)}
                    </td>

                    <td className="p-3">
                      {new Date(
                        h.assignedDate
                      ).toLocaleString()}
                    </td>

                    <td className="p-3">
                      {h.returnedDate
                        ? new Date(
                            h.returnedDate
                          ).toLocaleString()
                        : "Active"}
                    </td>
                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>
      </div>

    </div>
  );
}