import React from "react";

const DataTable = ({ columns = [], data = [] }) => {
  const safeData = Array.isArray(data) ? data : [];
  const safeColumns = Array.isArray(columns) ? columns : [];

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-separate border-spacing-y-3">
        {/* HEADER ROW */}
        <thead>
          <tr className="text-left">
            {safeColumns.map((col, i) => (
              <th
                key={i}
                className={`px-6 py-4 bg-slate-50 text-xs font-bold text-slate-800 ${
                  col === "Revenue"
                    ? "text-right"
                    : col === "Active Deals" || col === "Closed Deals"
                    ? "text-center"
                    : ""
                }`}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>

        {/* DATA ROWS */}
        <tbody>
          {safeData.length === 0 ? (
            <tr>
              <td
                colSpan={safeColumns.length || 1}
                className="px-6 py-6 text-center text-xs font-medium text-slate-400"
              >
                No data available.
              </td>
            </tr>
          ) : (
            safeData.map((row, index) => (
              <tr key={index} className="bg-white group cursor-pointer shadow-sm hover:shadow-md transition-all">

                <td className="px-6 py-4 group-hover:bg-slate-50 transition-all">
                  <span className="text-xs font-bold text-slate-700">
                    {row?.name ?? "-"}
                  </span>
                </td>

                <td className="px-6 py-4 text-center group-hover:bg-slate-50 transition-all">
                  <span className="text-xs font-medium text-slate-600">
                    {row?.active ?? 0}
                  </span>
                </td>

                <td className="px-6 py-4 text-center group-hover:bg-slate-50 transition-all">
                  <span className="text-xs font-medium text-slate-600">
                    {row?.closed ?? 0}
                  </span>
                </td>

                <td className="px-6 py-4 text-right group-hover:bg-slate-50 transition-all">
                  <div className="flex items-center justify-end gap-3">
                    <span className="text-xs font-black text-slate-800">
                      {row?.revenue ?? "$0"}
                    </span>
                    {row?.trend && (
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          row.isPositive
                            ? "bg-emerald-50 text-emerald-500"
                            : "bg-rose-50 text-rose-500"
                        }`}
                      >
                        {row.trend}
                      </span>
                    )}
                  </div>
                </td>

              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;