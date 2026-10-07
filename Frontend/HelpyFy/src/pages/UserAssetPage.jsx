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
  Laptop,
  Monitor,
  Smartphone,
  Headphones,
  Zap,
  RefreshCw,
  Search,
  CheckCircle2,
} from "lucide-react";

export default function UserAssetPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  // NEW: client-side filter for the table (presentation only)
  const [filter, setFilter] = useState("");

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      setError(null);

      
      const res = await api.get("/assets/my-assets")
      
      setAssets(Array.isArray(res.data) ? res.data : []);
    } catch (err) {

      
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

      // Header (brand green instead of blue)
      doc.setFontSize(18);
      doc.setTextColor(31, 74, 53);
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
          fillColor: [31, 74, 53],
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

  /* ---------- presentation-only derived data ---------- */
  const laptopCount = assets.filter(
    (a) => a.asset?.type?.toLowerCase() === "laptop"
  ).length;

  const visibleAssets = assets.filter((item) => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    return [
      item.asset?.assetCode,
      item.asset?.serialNumber,
      item.asset?.type,
      item.asset?.model,
    ]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q));
  });

  const th =
    "px-5 py-2.5 text-left text-xs font-semibold text-gray-600 whitespace-nowrap";

  return (
    <div className="min-h-screen bg-[#f4f6f5] px-4 py-6 md:px-8">
      <div className="max-w-6xl mx-auto">

        {/* PAGE HEADER */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">
          <div>
            <p className="text-xs text-gray-500 mb-1.5">
              My workspace <span className="mx-1 text-gray-300">/</span> Assets
            </p>
            <h1 className="text-2xl font-semibold text-gray-900">
              My assigned assets
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Equipment currently assigned to{" "}
              <span className="font-medium text-gray-800">{user?.name}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAssets}
              disabled={loading}
              title="Refresh"
              aria-label="Refresh"
              className="flex items-center justify-center w-9 h-9 rounded-md border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1f4a35]"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>

            <button
              onClick={exportPDF}
              disabled={exporting || assets.length === 0}
              className="flex items-center justify-center gap-2 h-9 px-4 bg-[#1f4a35] hover:bg-[#173a29] text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1f4a35]"
            >
              {exporting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Export PDF
                </>
              )}
            </button>
          </div>
        </div>

        {/* ERROR STATE */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 border-l-4 border-l-red-500 rounded-md p-4 mb-5 flex items-start gap-3">
            <AlertCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-900">Couldn't load your assets</h3>
              <p className="text-sm text-red-800 mt-0.5 mb-2">{error}</p>
              <button
                onClick={loadAssets}
                className="text-sm font-medium text-red-700 hover:text-red-900 underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* LOADING STATE */}
        {loading && (
          <div className="bg-white rounded-md border border-gray-200 p-14">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-9 h-9 rounded-full border-[3px] border-gray-200 border-t-[#1f4a35] animate-spin"></div>
              <p className="text-sm text-gray-500">Loading your assets...</p>
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !error && assets.length === 0 && (
          <div className="bg-white rounded-md border border-gray-200 py-16 px-6">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-full bg-[#eef3ee] flex items-center justify-center mb-4">
                <Package size={26} className="text-[#1f4a35]" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">No assets assigned</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm">
                Nothing is assigned to you yet. If you expected a device here,
                contact your IT administrator.
              </p>
            </div>
          </div>
        )}

        {/* SUMMARY STRIP */}
        {!loading && assets.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 bg-white border border-gray-200 rounded-md divide-y sm:divide-y-0 sm:divide-x divide-gray-200 mb-5">
            <SummaryCard
              icon={<Package size={15} />}
              label="Total assets"
              value={assets.length}
              hint="Assigned to you"
            />
            <SummaryCard
              icon={<Laptop size={15} />}
              label="Laptops"
              value={laptopCount}
              hint="Includes accessories"
            />
            <SummaryCard
              icon={<Zap size={15} />}
              label="Status"
              value="All active"
              hint="No issues reported"
              valueClass="text-emerald-700"
            />
          </div>
        )}

        {/* ASSETS TABLE */}
        {!loading && assets.length > 0 && (
          <div className="bg-white rounded-md border border-gray-200 overflow-hidden">

            {/* TABLE TOOLBAR */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200">
              <div className="flex items-center gap-2 h-9 w-full max-w-xs px-3 rounded-md border border-gray-300 bg-white focus-within:border-[#1f4a35] focus-within:ring-1 focus-within:ring-[#1f4a35]">
                <Search size={15} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter by code, serial, model"
                  className="flex-1 min-w-0 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent"
                />
              </div>
              <p className="text-xs text-gray-500 whitespace-nowrap">
                {visibleAssets.length} of {assets.length}
              </p>
            </div>

            {visibleAssets.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-sm font-medium text-gray-700">No matching assets</p>
                <p className="text-xs text-gray-500 mt-1">Try a different code, serial number or model.</p>
              </div>
            )}

            {/* MOBILE VIEW */}
            <div className="md:hidden divide-y divide-gray-200">
              {visibleAssets.map((item) => (
                <div key={item._id} className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-md bg-[#eef3ee] flex items-center justify-center flex-shrink-0 text-[#1f4a35]">
                        {getAssetIcon(item.asset?.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {item.asset?.assetCode}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.asset?.type}
                        </p>
                      </div>
                    </div>
                    <StatusBadge />
                  </div>

                  <dl className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Serial</dt>
                      <dd className="font-medium text-gray-900">
                        {item.asset?.serialNumber || "-"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Model</dt>
                      <dd className="font-medium text-gray-900">
                        {item.asset?.model || "-"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Assigned</dt>
                      <dd className="font-medium text-gray-900">
                        {new Date(item.assignedDate).toLocaleDateString()}
                      </dd>
                    </div>
                    {item.asset?.type?.toLowerCase() === "laptop" && (
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Accessories</dt>
                        <dd className="font-medium text-gray-900">
                          {renderAccessories(item)}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              ))}
            </div>

            {/* DESKTOP TABLE */}
            {visibleAssets.length > 0 && (
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className={th}>Asset</th>
                      <th className={th}>Serial number</th>
                      <th className={th}>Type</th>
                      <th className={th}>Model</th>
                      <th className={th}>Assigned</th>
                      <th className={th}>Accessories</th>
                      <th className={th}>Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {visibleAssets.map((item) => (
                      <tr
                        key={item._id}
                        className="hover:bg-[#f4f8f4] transition-colors"
                      >
                        <td className="px-5 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-md bg-[#eef3ee] flex items-center justify-center text-[#1f4a35]">
                              {getAssetIcon(item.asset?.type)}
                            </div>
                            <span className="text-sm font-semibold text-[#1f4a35]">
                              {item.asset?.assetCode || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-600 font-mono">
                          {item.asset?.serialNumber || "-"}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-medium">
                            {item.asset?.type || "-"}
                          </span>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-700">
                          {item.asset?.model || "-"}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap text-sm text-gray-600">
                          {new Date(item.assignedDate).toLocaleDateString()}
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span title={getAccessoriesLabel(item)} className="text-base">
                            {renderAccessories(item)}
                          </span>
                        </td>
                        <td className="px-5 py-3 whitespace-nowrap">
                          <StatusBadge />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

/* ================= STATUS BADGE ================= */
function StatusBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-medium ring-1 ring-inset ring-emerald-200 flex-shrink-0">
      <CheckCircle2 size={12} />
      Active
    </span>
  );
}

/* ================= SUMMARY CARD ================= */
function SummaryCard({ icon, label, value, hint, valueClass = "text-gray-900" }) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-center gap-2 text-gray-500">
        {icon}
        <p className="text-xs font-medium">{label}</p>
      </div>
      <p className={`text-2xl font-semibold mt-1 ${valueClass}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
    </div>
  );
}