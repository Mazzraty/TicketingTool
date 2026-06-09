import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "../auth/AuthContext"; // adjust path

export default function UserAssetPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      const res = await api.get("/assets/my-assets");
      setAssets(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  /* ===================================
     GET ACCESSORIES
  =================================== */
  const getAccessories = (item) => {
    return (
      item.accessories ||
      item.asset?.accessories ||
      {}
    );
  };

  const renderAccessories = (item) => {
    if (item.asset?.type?.toLowerCase() !== "laptop") return "-";

    const acc = getAccessories(item);
    const list = [];

    if (acc.charger) list.push("🔌 Charger");
    if (acc.mouse) list.push("🖱 Mouse");
    if (acc.laptopBag) list.push("🎒 Bag");
    if (acc.keyboard) list.push("⌨ Keyboard");
    if (acc.headset) list.push("🎧 Headset");

    return list.length > 0 ? list.join("  ") : "-";
  };

  const accessoriesText = (item) => {
    if (item.asset?.type?.toLowerCase() !== "laptop") return "-";

    const acc = getAccessories(item);
    const list = [];

    if (acc.charger) list.push("Charger");
    if (acc.mouse) list.push("Mouse");
    if (acc.laptopBag) list.push("Bag");
    if (acc.keyboard) list.push("Keyboard");
    if (acc.headset) list.push("Headset");

    return list.length > 0 ? list.join(", ") : "-";
  };

  /* ===================================
     EXPORT PDF
  =================================== */
  const exportPDF = async () => {
    const doc = new jsPDF();

    const logoUrl =
      "https://www.mazzraty.com/_next/image?url=%2Fimages%2FMazzraty_Logo.png&w=3840&q=75";

    const getBase64 = (url) =>
      new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          canvas.getContext("2d").drawImage(img, 0, 0);
          resolve({
            base64: canvas.toDataURL("image/png"),
            ratio: img.width / img.height,
          });
        };
        img.onerror = () => resolve(null);
        img.src = url;
      });

    const result = await getBase64(logoUrl);

    // ← logo top right with correct aspect ratio
    if (result) {
      const logoWidth = 30;
      const logoHeight = logoWidth / result.ratio;
      doc.addImage(result.base64, "PNG", 167, 6, logoWidth, logoHeight);
    }

    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text("Assigned Assets", 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Employee: ${user?.name || "-"}`, 14, 22);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

    autoTable(doc, {
      startY: 34,
      head: [[
        "Asset Code",
        "Serial Number",
        "Type",
        "Model",
        "Assigned Date",
        "Accessories",
        "Status",
      ]],
      body: assets.map((item) => [
        item.asset?.assetCode || "-",
        item.asset?.serialNumber || "-",
        item.asset?.type || "-",
        item.asset?.model || "-",
        item.assignedDate
          ? new Date(item.assignedDate).toLocaleDateString()
          : "-",
        accessoriesText(item),
        "Active",
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save("my-assets.pdf");
  };
  return (
    <div className="bg-white rounded-2xl shadow-sm border p-6">

      {/* HEADER */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">My Assigned Assets</h1>
          <p className="text-gray-500">
            Assets currently assigned to{" "}
            <span className="font-semibold text-gray-700">{user?.name}</span>
          </p>
        </div>

        <button
          onClick={exportPDF}
          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl text-sm font-medium"
        >
          Export PDF
        </button>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4 text-left">Asset Code</th>
              <th className="p-4 text-left">Serial Number</th>
              <th className="p-4 text-left">Type</th>
              <th className="p-4 text-left">Model</th>
              <th className="p-4 text-left">Assigned Date</th>
              <th className="p-4 text-left">Accessories</th>
              <th className="p-4 text-left">Status</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="p-6 text-center">Loading...</td>
              </tr>
            ) : assets.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-6 text-center text-gray-500">
                  No assigned assets
                </td>
              </tr>
            ) : (
              assets.map((item) => (
                <tr key={item._id} className="border-t hover:bg-gray-50">

                  <td className="p-4">{item.asset?.assetCode || "-"}</td>
                  <td className="p-4">
                    {item.asset?.serialNumber || "-"}
                  </td>
                  <td className="p-4">{item.asset?.type || "-"}</td>

                  <td className="p-4">{item.asset?.model || "-"}</td>

                  <td className="p-4">
                    {new Date(item.assignedDate).toLocaleDateString()}
                  </td>

                  <td className="p-4">{renderAccessories(item)}</td>

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