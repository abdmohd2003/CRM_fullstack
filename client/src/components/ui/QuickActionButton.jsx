import React from "react";

// 1. Added onClick to the props being passed in
const QuickActionButton = ({ icon: Icon, label, onClick }) => (
  <button 
    onClick={onClick} // 2. Attached the onClick function to the button
    className="flex flex-col items-center gap-1.5 p-2 bg-slate-50 hover:bg-indigo-50/50 rounded-xl group transition-all cursor-pointer"
  >
    <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 shadow-sm flex items-center justify-center text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all">
      <Icon size={14} />
    </div>
    <span className="text-[9px] font-bold text-gray-400 group-hover:text-slate-700">{label}</span>
  </button>
);

export default QuickActionButton;