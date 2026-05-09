import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function AssetHistoryPage() {

  const [employees, setEmployees] = useState([]);
  const [assets, setAssets] = useState([]);

  const [employeeId, setEmployeeId] = useState("");
  const [assetCode, setAssetCode] = useState("");

  const [empHistory, setEmpHistory] = useState([]);
  const [assetHistory, setAssetHistory] = useState([]);

  // ===============================
  // LOAD EMPLOYEES + ASSETS
  // ===============================
  useEffect(() => {

    const loadData = async () => {
      try {

        const [empRes, assetRes] = await Promise.all([
          api.get("/employees"),
          api.get("/assets"),
        ]);

        setEmployees(empRes.data);
        setAssets(assetRes.data);

      } catch (err) {
        console.error(err);
        toast.error("Failed to load employees/assets");
      }
    };

    loadData();

  }, []);

  // ===============================
  // EMPLOYEE HISTORY
  // ===============================
  useEffect(() => {

    if (!employeeId) {
      setEmpHistory([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {

        const res = await api.get(
          `/assets/employee/${employeeId}`
        );

        setEmpHistory(res.data);

      } catch (err) {
        console.error(err);
        toast.error("Employee history not found");
      }
    }, 300);

    return () => clearTimeout(timer);

  }, [employeeId]);

  // ===============================
  // ASSET HISTORY
  // ===============================
  useEffect(() => {

    if (!assetCode) {
      setAssetHistory([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {

        const res = await api.get(
          `/assets/asset/${assetCode}`
        );

        setAssetHistory(res.data);

      } catch (err) {
        console.error(err);
        toast.error("Asset history not found");
      }
    }, 300);

    return () => clearTimeout(timer);

  }, [assetCode]);

  return (
    <div className="p-6 bg-[#f4f6f9] min-h-screen">

      {/* HEADER */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-800">
          Asset History Management
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          ERP System → Asset Tracking Module
        </p>
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-xl border shadow-sm p-4 mb-5">

        <div className="grid md:grid-cols-2 gap-4">

          {/* EMPLOYEE */}
          <div>
            <label className="text-sm font-medium text-gray-600">
              Employee
            </label>

            <select
              className="w-full border rounded-lg p-2 mt-1"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            >
              <option value="">
                Select Employee
              </option>

              {employees.map((emp) => (
                <option
                  key={emp._id}
                  value={emp.staffCode}
                >
                  {emp.staffCode} - {emp.name}
                </option>
              ))}
            </select>
          </div>

          {/* ASSET */}
          <div>
            <label className="text-sm font-medium text-gray-600">
              Asset
            </label>

            <select
              className="w-full border rounded-lg p-2 mt-1"
              value={assetCode}
              onChange={(e) => setAssetCode(e.target.value)}
            >
              <option value="">
                Select Asset
              </option>

              {assets.map((asset) => (
                <option
                  key={asset._id}
                  value={asset.assetCode}
                >
                  {asset.assetCode} - {asset.name}
                </option>
              ))}
            </select>
          </div>

        </div>

      </div>

      {/* TABLES */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* EMPLOYEE HISTORY */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">

          <div className="bg-gray-100 px-4 py-3 border-b font-semibold">
            Employee History
          </div>

          <table className="w-full text-sm">

            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 border-b">
                  Asset
                </th>

                <th className="text-left px-4 py-3 border-b">
                  Status
                </th>

                <th className="text-left px-4 py-3 border-b">
                  Assigned
                </th>

                <th className="text-left px-4 py-3 border-b">
                  Returned
                </th>
              </tr>
            </thead>

            <tbody>

              {empHistory.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center p-6 text-gray-400"
                  >
                    No employee history
                  </td>
                </tr>
              ) : (
                empHistory.map((h) => (
                  <tr
                    key={h._id}
                    className="hover:bg-gray-50 border-b"
                  >

                    <td className="px-4 py-3">
                      {h.asset?.assetCode}
                    </td>

                    <td className="px-4 py-3 capitalize">
                      {h.status}
                    </td>

                    <td className="px-4 py-3">
                      {new Date(
                        h.assignedDate
                      ).toLocaleString()}
                    </td>

                    <td className="px-4 py-3">
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

        {/* ASSET HISTORY */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">

          <div className="bg-gray-100 px-4 py-3 border-b font-semibold">
            Asset History
          </div>

          <table className="w-full text-sm">

            <thead className="bg-gray-50">
              <tr>

                <th className="text-left px-4 py-3 border-b">
                  Employee
                </th>

                <th className="text-left px-4 py-3 border-b">
                  Status
                </th>

                <th className="text-left px-4 py-3 border-b">
                  Assigned
                </th>

                <th className="text-left px-4 py-3 border-b">
                  Returned
                </th>

              </tr>
            </thead>

            <tbody>

              {assetHistory.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center p-6 text-gray-400"
                  >
                    No asset history
                  </td>
                </tr>
              ) : (
                assetHistory.map((h) => (
                  <tr
                    key={h._id}
                    className="hover:bg-gray-50 border-b"
                  >

                    <td className="px-4 py-3">
                      {h.employee?.staffCode} -{" "}
                      {h.employee?.name}
                    </td>

                    <td className="px-4 py-3 capitalize">
                      {h.status}
                    </td>

                    <td className="px-4 py-3">
                      {new Date(
                        h.assignedDate
                      ).toLocaleString()}
                    </td>

                    <td className="px-4 py-3">
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