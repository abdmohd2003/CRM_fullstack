import React from "react";

const KanbanCard = ({ title, company, amount, statusColor = "bg-indigo-500" }) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm cursor-grab active:cursor-grabbing hover:border-indigo-200 transition-colors">
      <div className={`w-8 h-1 ${statusColor} rounded-full mb-3`}></div>
      <h4 className="text-sm font-bold text-slate-800 leading-tight">{title}</h4>
      <p className="text-[11px] font-medium text-gray-400 mt-1">{company}</p>
      
      <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center">
        <span className="text-xs font-black text-slate-700">{amount}</span>
        <div className="flex -space-x-2">

          <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 text-[8px] flex items-center justify-center font-bold">JS</div>
          <div className="w-6 h-6 rounded-full border-2 border-white bg-indigo-600 text-white text-[8px] flex items-center justify-center font-bold">AK</div>
        </div>
      </div>
    </div>
  );
};

export default KanbanCard;