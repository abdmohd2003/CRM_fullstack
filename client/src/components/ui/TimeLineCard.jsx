import React from "react";
import { FiPhone, FiMail, FiFileText, FiCalendar, FiCheckSquare } from "react-icons/fi";

const typeConfig = {
  task:    { icon: FiCheckSquare, bg: "bg-emerald-50",  text: "text-emerald-600" },
  call:    { icon: FiPhone,       bg: "bg-indigo-50",   text: "text-indigo-600"  },
  email:   { icon: FiMail,        bg: "bg-blue-50",     text: "text-blue-600"    },
  note:    { icon: FiFileText,    bg: "bg-amber-50",    text: "text-amber-600"   },
  meeting: { icon: FiCalendar,    bg: "bg-purple-50",   text: "text-purple-600"  },
};

const TimelineCard = ({ type = "task", title, date, desc, isOverdue }) => {
  const config = typeConfig[type] ?? typeConfig.task;
  const Icon   = config.icon;

  return (
    <div className="p-4 bg-white border border-gray-100 rounded-2xl hover:border-indigo-100 transition-all space-y-2">
      <div className="flex justify-between items-start gap-4">
        
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Type icon */}
          <div className={`w-8 h-8 rounded-lg ${config.bg} ${config.text} flex items-center justify-center shrink-0 mt-0.5`}>
            <Icon size={14} />
          </div>

          <div className="space-y-0.5 min-w-0">
            <p className="text-xs font-bold text-slate-800">{title}</p>
            {desc && (
              <p className="text-[11px] font-medium text-slate-500 leading-relaxed">{desc}</p>
            )}
          </div>
        </div>

        {/* Date / overdue badge */}
        <span className={`text-[10px] font-bold whitespace-nowrap shrink-0 mt-0.5
          ${isOverdue
            ? "text-rose-500 bg-rose-50 px-2 py-0.5 rounded-md"
            : "text-gray-400"
          }`}>
          {isOverdue && "Overdue · "}{date}
        </span>
      </div>

      {/* Task-only: checkbox */}
      {type === "task" && (
        <div className="pl-11 flex items-center gap-2">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <span className="text-[11px] text-gray-400 font-medium">Mark as complete</span>
        </div>
      )}
    </div>
  );
};

export default TimelineCard;