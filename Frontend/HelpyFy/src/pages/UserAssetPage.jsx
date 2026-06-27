import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "../auth/AuthContext";
import {
  Download,
  Package,
  AlertCircle,
  Loader2,
  ChevronRight,
  Laptop,
  Monitor,
  Smartphone,
  Headphones,
  Zap,
} from "lucide-react";

export default function UserAssetPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("📍 Fetching assets from: /assets/my-assets");
      
      const res = await api.get("/assets/my-assets");
      console.log("✅ Assets loaded:", res.data);
      
      setAssets(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("❌ Error loading assets:", err);
      
      // Extract detailed error message
      const errorMsg = 
        err.response?.data?.msg || 
        err.response?.data?.message || 
        err.message || 
        "Failed to load assets";
      
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  /* ===================================
     GET ACCESSORIES
  =================================== */
  const getAccessories = (item) => {
    return item.accessories || item.asset?.accessories || {};
  };

  const renderAccessories = (item) => {
    if (item.asset?.type?.toLowerCase() !== "laptop") return "-";

    const acc = getAccessories(item);
    const list = [];

    if (acc.charger) list.push("🔌");
    if (acc.mouse) list.push("🖱");
    if (acc.laptopBag) list.push("🎒");
    if (acc.keyboard) list.push("⌨");
    if (acc.headset) list.push("🎧");

    return list.length > 0 ? list.join(" ") : "-";
  };

  const getAccessoriesLabel = (item) => {
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

  const getAssetIcon = (type) => {
    if (!type) return <Package size={18} />;
    const typeStr = type.toLowerCase();
    
    if (typeStr.includes("laptop")) return <Laptop size={18} />;
    if (typeStr.includes("monitor")) return <Monitor size={18} />;
    if (typeStr.includes("phone")) return <Smartphone size={18} />;
    if (typeStr.includes("headset") || typeStr.includes("audio")) return <Headphones size={18} />;
    if (typeStr.includes("power") || typeStr.includes("charger")) return <Zap size={18} />;
    
    return <Package size={18} />;
  };

  /* ===================================
     EXPORT PDF
  =================================== */
  const exportPDF = async () => {
    if (assets.length === 0) {
      toast.error("No assets to export");
      return;
    }

    try {
      setExporting(true);
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

      // Logo top right with correct aspect ratio
      if (result) {
        const logoWidth = 30;
        const logoHeight = logoWidth / result.ratio;
        doc.addImage(result.base64, "PNG", 167, 2, logoWidth, logoHeight);
      }

      // Header
      doc.setFontSize(18);
      doc.setTextColor(10, 110, 209);
      doc.text("Assigned Assets Report", 14, 15);

      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.text(`Employee: ${user?.name || "-"}`, 14, 23);
      doc.text(`Email: ${user?.email || "-"}`, 14, 29);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 35);

      // Table
      autoTable(doc, {
        startY: 42,
        head: [
          [
            "Asset Code",
            "Serial",
            "Type",
            "Model",
            "Assigned",
            "Accessories",
            "Status",
          ],
        ],
        body: assets.map((item) => [
          item.asset?.assetCode || "-",
          item.asset?.serialNumber || "-",
          item.asset?.type || "-",
          item.asset?.model || "-",
          item.assignedDate
            ? new Date(item.assignedDate).toLocaleDateString()
            : "-",
          getAccessoriesLabel(item),
          "Active",
        ]),
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [10, 110, 209],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { left: 14, right: 14 },
      });

      doc.save(`${user?.name || "employee"}-assets.pdf`);
      toast.success("PDF exported successfully!");
    } catch (err) {
      console.error("❌ PDF export error:", err);
      toast.error("Failed to export PDF");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0a6ed1] to-[#0856a8] flex items-center justify-center">
                  <Package size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    My Assigned Assets
                  </h1>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Assets currently assigned to{" "}
                <span className="font-semibold text-gray-900">{user?.name}</span>
              </p>
            </div>

            <button
              onClick={exportPDF}
              disabled={exporting || assets.length === 0}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#0a6ed1] to-[#0856a8] text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {exporting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={18} />
                  Export PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* ERROR STATE */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6 flex items-start gap-3">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Failed to Load Assets</h3>
              <p className="text-sm text-red-800 mb-3">{error}</p>
              <button
                onClick={loadAssets}
                className="text-sm font-medium text-red-700 hover:text-red-800 underline"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* LOADING STATE */}
        {loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-[#0a6ed1] animate-spin"></div>
              <p className="text-gray-600 font-medium">Loading your assets...</p>
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && assets.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <Package size={32} className="text-[#0a6ed1]" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">No Assets Assigned</h3>
              <p className="text-gray-600 text-center max-w-md">
                You don't have any assets assigned yet. Contact your administrator if you think this is incorrect.
              </p>
            </div>
          </div>
        )}

        {/* ASSETS TABLE */}
        {!loading && assets.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            
            {/* MOBILE VIEW */}
            <div className="md:hidden divide-y divide-gray-200">
              {assets.map((item) => (
                <div key={item._id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 text-[#0a6ed1]">
                        {getAssetIcon(item.asset?.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate">
                          {item.asset?.assetCode}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.asset?.type}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex-shrink-0">
                      Active
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Serial:</span>
                      <span className="font-medium text-gray-900">
                        {item.asset?.serialNumber || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Model:</span>
                      <span className="font-medium text-gray-900">
                        {item.asset?.model || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Assigned:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(item.assignedDate).toLocaleDateString()}
                      </span>
                    </div>
                    {item.asset?.type?.toLowerCase() === "laptop" && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Accessories:</span>
                        <span className="font-medium text-gray-900">
                          {renderAccessories(item)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* DESKTOP TABLE */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Asset Code
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Serial Number
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Model
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Assigned Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Accessories
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {assets.map((item) => (
                    <tr
                      key={item._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-[#0a6ed1]">
                            {getAssetIcon(item.asset?.type)}
                          </div>
                          <span className="font-semibold text-gray-900">
                            {item.asset?.assetCode || "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {item.asset?.serialNumber || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 rounded-full bg-blue-50 text-[#0a6ed1] text-sm font-medium">
                          {item.asset?.type || "-"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {item.asset?.model || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {new Date(item.assignedDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span title={getAccessoriesLabel(item)} className="text-lg">
                          {renderAccessories(item)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                          <ChevronRight size={14} />
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUMMARY */}
        {!loading && assets.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <SummaryCard
              icon={<Package size={20} />}
              label="Total Assets"
              value={assets.length}
              color="blue"
            />
            <SummaryCard
              icon={<Laptop size={20} />}
              label="Laptops"
              value={assets.filter((a) => a.asset?.type?.toLowerCase() === "laptop").length}
              color="purple"
            />
            <SummaryCard
              icon={<Zap size={20} />}
              label="Status"
              value="All Active"
              color="green"
            />
          </div>
        )}

      </div>
    </div>
  );
}

/* ================= SUMMARY CARD ================= */
function SummaryCard({ icon, label, value, color }) {
  const colorClasses = {
    blue: "bg-blue-100 text-[#0a6ed1]",
    purple: "bg-purple-100 text-purple-700",
    green: "bg-green-100 text-green-700",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
        <p className="text-sm text-gray-600 font-medium">{label}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
