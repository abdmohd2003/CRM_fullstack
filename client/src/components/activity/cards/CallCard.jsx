import React, { useState } from "react";
import { FiChevronDown, FiClock } from "react-icons/fi";

const CallCard = ({
  author,
  direction = "from",
  content,
  date,
  defaultExpanded = false,
}) => {


  const [expanded, setExpanded] = useState(defaultExpanded);
  const [outcome, setOutcome] = useState("");
  const [duration, setDuration] = useState("");

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-0.5 text-slate-400 hover:text-indigo-500 transition-colors shrink-0"
          >
            <FiChevronDown
              size={14}
              className={`transition-transform duration-200 ${expanded ? "" : "-rotate-90"}`}
            />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800">
              Call{" "}
              <span className="font-normal text-slate-400">{direction}</span>{" "}
              {author}
            </p>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {content || "No call notes provided."}
            </p>
          </div>
        </div>
        <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
          {date}
        </span>
      </div>

      {expanded && (
        <div className="pl-6 pt-3 border-t border-slate-50 grid grid-cols-2 gap-4">

          {/* Outcome */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">
              Outcome <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none appearance-none cursor-pointer focus:border-indigo-500 focus:bg-white transition-all"
              >
                <option value="">Choose</option>
                <option value="connected">Connected</option>
                <option value="no-answer">No Answer</option>
                <option value="busy">Busy</option>
                <option value="wrong-number">Wrong Number</option>
              </select>
              <FiChevronDown
                size={12}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500">
              Duration <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-xs text-slate-700 outline-none appearance-none cursor-pointer focus:border-indigo-500 focus:bg-white transition-all"
              >
                <option value="">Choose</option>
                <option value="1min">1 minute</option>
                <option value="5min">5 minutes</option>
                <option value="15min">15 minutes</option>
                <option value="30min">30 minutes</option>
              </select>
              <FiClock
                size={12}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default CallCard;