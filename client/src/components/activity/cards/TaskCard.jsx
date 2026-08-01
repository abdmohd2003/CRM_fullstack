import React, { useState } from "react";
import { FiChevronDown, FiCheck, FiCalendar } from "react-icons/fi";

export default function TaskCard({ assignedTo, title, dueDate, priority, type, note, isOverdue, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [isChecked, setIsChecked] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-0.5 text-slate-400 hover:text-indigo-500 transition-colors shrink-0"
          >
            <FiChevronDown size={16} className={`transition-transform duration-200 ${expanded ? "" : "-rotate-90"}`} />
          </button>

          <div className="flex gap-2.5 flex-1 min-w-0">
            <div
              onClick={() => setIsChecked(!isChecked)}
              className={`flex items-center justify-center w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 cursor-pointer transition-all ${
                isChecked ? "bg-indigo-500 border-indigo-500" : "border-slate-400 hover:border-indigo-500"
              }`}
            >
              {isChecked && <FiCheck strokeWidth={4} className="text-white text-[10px]" />}
            </div>

            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium transition-all ${isChecked ? "text-slate-400 line-through" : "text-slate-800"}`}>
                <span className="font-bold">Task</span> assigned to <span className="font-bold">{assignedTo || "Unassigned"}</span>
              </p>
              <p className={`text-xs font-semibold mt-1 cursor-pointer transition-all ${isChecked ? "text-slate-400 line-through" : "text-indigo-600 hover:underline"}`}>
                {title}
              </p>
            </div>
          </div>
        </div>

        {isOverdue && !isChecked && (
          <span className="text-[11px] font-semibold text-rose-500 whitespace-nowrap shrink-0 flex items-center gap-1">
            <FiCalendar size={12} /> Overdue: {dueDate}
          </span>
        )}
      </div>

      {expanded && (
        <div className="pl-7 pt-3 border-t border-slate-50 space-y-4">
          <div className="bg-slate-50 rounded-xl p-3 grid grid-cols-3 gap-4 text-xs">
            <div>
              <p className="text-slate-400 font-medium mb-0.5">Due Date & Time</p>
              <p className="text-slate-800 font-bold">{dueDate}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium mb-0.5">Priority</p>
              <p className="text-slate-800 font-bold">{priority || "-"}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium mb-0.5">Type</p>
              <p className="text-slate-800 font-bold">{type || "-"}</p>
            </div>
          </div>
          {note && <p className="text-xs text-slate-500 leading-relaxed font-normal italic">{note}</p>}
        </div>
      )}
    </div>
  );
}