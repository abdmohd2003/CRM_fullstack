import React, { useState } from "react";
import { FiChevronDown } from "react-icons/fi";

const EmailCard = ({
  subject,
  author,
  date,
  body,
  isDefaultExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(isDefaultExpanded);

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 transition-all duration-200">
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
            <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
              Logged Email - {subject || "No Subject"}{" "}
              <span className="font-normal text-slate-400">by</span>{" "}
              {author || "Admin"}
            </p>

            {expanded ? (
              <div className="text-xs text-slate-600 mt-3 space-y-4 font-normal leading-relaxed border-t border-slate-50 pt-3">
                <p className="text-slate-400 font-medium">To {author},</p>
                <div className="whitespace-pre-line text-slate-600 space-y-2">
                  {body || "No content."}
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {body ? `${body.substring(0, 60)}...` : "No content."}
              </p>
            )}
          </div>
        </div>
        <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0 font-medium">
          {date}
        </span>
      </div>
    </div>
  );
};

export default EmailCard;