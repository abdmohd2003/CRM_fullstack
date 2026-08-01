import React from "react";

const StatCard = ({ title, value, icon: Icon, color }) => {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600 shadow-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 shadow-emerald-100",
    amber: "bg-amber-50 text-amber-600 shadow-amber-100",
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        <h2 className="text-3xl font-black text-slate-800 tracking-tight">{value}</h2>
      </div>
      
      {/* Gradient Circle with Icon */}
      <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-inner ${colors[color]}`}>
        <Icon size={24} />
      </div>
    </div>
  );
};

export default StatCard;