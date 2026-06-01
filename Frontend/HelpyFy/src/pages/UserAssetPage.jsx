import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";

export default function UserAssetPage() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      const res = await api.get("/assets/my-assets");

      setAssets(
        Array.isArray(res.data)
          ? res.data
          : []
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">
      <h1 className="text-2xl font-bold mb-1">
        My Assigned Assets
      </h1>

      <p className="text-gray-500 mb-6">
        Assets currently assigned to you
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">
                Asset Code
              </th>
              <th className="p-4 text-left">
                Type
              </th>
              <th className="p-4 text-left">
                Model
              </th>
              <th className="p-4 text-left">
                Assigned Date
              </th>
              <th className="p-4 text-left">
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="5"
                  className="p-6 text-center"
                >
                  Loading...
                </td>
              </tr>
            ) : assets.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="p-6 text-center text-gray-500"
                >
                  No assigned assets
                </td>
              </tr>
            ) : (
              assets.map((item) => (
                <tr
                  key={item._id}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="p-4">
                    {item.asset?.assetCode}
                  </td>

                  <td className="p-4">
                    {item.asset?.type}
                  </td>

                  <td className="p-4">
                    {item.asset?.model || "-"}
                  </td>

                  <td className="p-4">
                    {new Date(
                      item.assignedDate
                    ).toLocaleDateString()}
                  </td>

                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                      Active
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}