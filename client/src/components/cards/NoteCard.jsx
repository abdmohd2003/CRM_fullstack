import React, { useState } from "react";
import { FiChevronDown } from "react-icons/fi";

const NoteCard = ({
  author,
  content,
  date,
  expanded: initialExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(initialExpanded);

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-0.5 text-slate-400 hover:text-indigo-500 transition-colors shrink-0"
          >
            <FiChevronDown
              size={14}
              className={`transition-transform duration-200 ${
                expanded ? "" : "-rotate-90"
              }`}
            />
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800">
              Note <span className="font-normal text-slate-400">by</span>{" "}
              {author}
            </p>

            {expanded && (
              <p className="text-xs text-slate-500 mt-1">{content}</p>
            )}
          </div>
        </div>

        <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
          {date}
        </span>
      </div>
    </div>
  );
};

export default NoteCard;