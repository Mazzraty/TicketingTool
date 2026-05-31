return (
  <div className="min-h-screen bg-[#f4f6f9] p-6">

    {/* HEADER */}
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Smart Excel Upload
        </h1>
        <p className="text-sm text-gray-500">
          AI-powered mapping + auto detection
        </p>
      </div>

      <button
        onClick={() => window.history.back()}
        className="px-4 py-2 rounded-xl bg-white border text-gray-700 hover:bg-gray-100 text-sm"
      >
        ← Back
      </button>
    </div>

    {/* MAIN CARD */}
    <div className="bg-white border rounded-2xl p-6 shadow-sm">

      {/* DROP ZONE (KEEP INPUT SAME) */}
      <div className="border-2 border-dashed rounded-xl p-8 text-center hover:bg-gray-50 transition">

        <input
          type="file"
          onChange={handleFile}
          className="mb-4"
        />

        <p className="text-lg font-semibold text-gray-700">
          📤 Upload Excel File
        </p>
        <p className="text-sm text-gray-500">
          AI will auto detect Employee / HHT / Printer
        </p>

      </div>

      {/* FILE INFO */}
      {file && (
        <div className="mt-5 bg-gray-50 border rounded-xl p-4 flex justify-between items-center">

          <div>
            <p className="text-sm font-semibold text-gray-700">
              📄 {file.name}
            </p>

            <p className="text-xs text-gray-500 mt-1">
              Detected Type:
              <span className="ml-2 font-bold text-blue-600">
                {fileType}
              </span>
            </p>
          </div>

          <div className="text-right text-sm">
            <p className="text-green-600 font-semibold">
              Valid: {validCount}
            </p>
            <p className="text-red-500">
              Invalid: {invalidCount}
            </p>
          </div>

        </div>
      )}

      {/* KPI CARDS */}
      {rows.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mt-6">

          <div className="bg-gray-50 border p-4 rounded-xl text-center">
            <p className="text-xs text-gray-500">Total Rows</p>
            <p className="text-xl font-bold">{rows.length}</p>
          </div>

          <div className="bg-green-50 border p-4 rounded-xl text-center">
            <p className="text-xs text-green-600">Valid</p>
            <p className="text-xl font-bold text-green-700">
              {validCount}
            </p>
          </div>

          <div className="bg-red-50 border p-4 rounded-xl text-center">
            <p className="text-xs text-red-500">Invalid</p>
            <p className="text-xl font-bold text-red-600">
              {invalidCount}
            </p>
          </div>

        </div>
      )}

      {/* TABLE */}
      {rows.length > 0 && (
        <div className="mt-6 overflow-x-auto border rounded-xl">

          <table className="w-full text-sm">

            <thead className="bg-gray-100 text-xs uppercase">
              <tr>
                {Object.keys(rows[0]).map((h) => (
                  <th key={h} className="p-3 text-left border">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={i}
                  className={`border-t hover:bg-gray-50 ${
                    isValid(r) ? "" : "bg-red-50"
                  }`}
                >
                  {Object.values(r).map((v, j) => (
                    <td key={j} className="p-3 border">
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>

          </table>

        </div>
      )}

      {/* ACTION BUTTON */}
      {rows.length > 0 && (
        <div className="flex justify-end mt-6">
          <button
            onClick={uploadExcel}
            disabled={loading}
            className="px-6 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Uploading..." : `Upload ${fileType}`}
          </button>
        </div>
      )}

    </div>
  </div>
);