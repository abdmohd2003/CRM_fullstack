 const DetailItem = ({ label, value, isBadge }) => (
  <div className="space-y-1">
    <span className="text-[10px] font-bold text-gray-400 block">{label}</span>
    {isBadge ? (
      <span className="inline-block px-2.5 py-0.5 bg-indigo-50 text-indigo-600 font-black text-[10px] rounded-md uppercase tracking-wider">
        {value}
      </span>
    ) : (
      <span className="text-xs font-bold text-slate-700 block break-all">
  {typeof value === "object" && value !== null
    ? Array.isArray(value)
      ? value.map(v => typeof v === "object" ? `${v.firstName || ""} ${v.lastName || ""}`.trim() : v).join(", ")
      : `${value.firstName || ""} ${value.lastName || ""}`.trim()
    : value ?? "-"}
</span>
)}
  </div>
);

const QuickActionButton = ({ icon: Icon, label, onClick }) => ( // 1. Add onClick prop
  <button 
    onClick={onClick} // 2. Attach it to the button
    className="flex flex-col items-center gap-1.5 p-2 bg-slate-50 hover:bg-indigo-50/50 rounded-xl group transition-all cursor-pointer"
  >
    <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 shadow-sm flex items-center justify-center text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all">
      <Icon size={14} />
    </div>
    <span className="text-[9px] font-bold text-gray-400 group-hover:text-slate-700">{label}</span>
  </button>
);

const TimelineCard = ({ type, title, date, desc, isOverdue }) => {
  return (
    <div className="p-4 bg-white border border-gray-100 rounded-2xl hover:border-indigo-100 transition-all space-y-2">
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-1">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <span className="text-gray-400">▼</span> {title}
          </span>
          <p className="text-[11px] font-medium text-slate-600 pl-4">{desc}</p>
        </div>
        <span className={`text-[10px] font-bold whitespace-nowrap ${isOverdue ? "text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md" : "text-gray-400"}`}>
          {date}
        </span>
      </div>
      {type === "task" && (
        <div className="pl-4 pt-1 flex items-center gap-2">
          <input type="checkbox" className="w-4 h-4 rounded-full border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
          <span className="text-xs text-gray-400 font-medium">Mark as complete</span>
        </div>
      )}
    </div>
  );
};


export default DetailItem