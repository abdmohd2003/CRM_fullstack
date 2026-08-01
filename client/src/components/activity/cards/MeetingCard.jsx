import React, { useState } from "react";
import { FiChevronDown } from "react-icons/fi";

export default function MeetingCard({ title, date, duration, attendees, description, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

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
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800">
              Meeting: <span className="font-semibold text-slate-700">{title}</span>
            </p>
          </div>
        </div>
        <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">{date}</span>
      </div>

      {expanded && (
        <div className="pl-7 pt-1 space-y-3 max-h-[180px] overflow-y-auto">
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 grid grid-cols-3 gap-4 text-xs">
            <div>
              <p className="text-slate-400 font-medium mb-0.5">Date & Time</p>
              <p className="text-slate-800 font-bold">{date}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium mb-0.5">Duration</p>
              <p className="text-slate-800 font-bold">{duration}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium mb-0.5">Attendees</p>
              <p className="text-slate-800 font-bold truncate">
                {Array.isArray(attendees) ? attendees.length : attendees || "0"}
              </p>
            </div>
          </div>
          {description && <p className="text-xs text-slate-500 leading-relaxed font-normal pt-1">{description}</p>}
        </div>
      )}
    </div>
  );
}