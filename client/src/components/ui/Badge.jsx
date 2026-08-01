import React from "react";

const Badge = ({ status }) => {
  const statusConfig = {
    "qualified to buy": "bg-indigo-50 text-indigo-600",
    "presentation scheduled": "bg-blue-50 text-blue-600",
    "contract sent": "bg-amber-50 text-amber-600",
    "closed won": "bg-emerald-50 text-emerald-600",
    "closed lost": "bg-rose-50 text-rose-600",
    "appointment scheduled": "bg-purple-50 text-purple-600",
    "default": "bg-slate-100 text-slate-600"
  };

  const currentStyle = statusConfig[status?.toLowerCase()] || statusConfig.default;

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${currentStyle}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
      {status}
    </span>
  );
};

export default Badge;