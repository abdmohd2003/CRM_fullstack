import React from "react";
import { FiFileText } from "react-icons/fi";

const NoteItem = ({ author, content, time }) => (
  <div className="flex gap-4 items-start">
    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 border-4 border-white shadow-sm">
      <FiFileText size={16} />
    </div>
    <div className="bg-amber-50/30 p-4 rounded-xl border border-amber-100/50 flex-1">
      <p className="text-xs leading-relaxed text-slate-700 italic">"{content}"</p>
      <p className="text-[10px] mt-3 text-gray-400 font-bold uppercase">Added by {author} • {time}</p>
    </div>
  </div>
);

export default NoteItem;