import React from "react";

const TextArea = ({
  label,
  placeholder,
  rows = 4,
  className = "",
  ...props
}) => (
  <div className="w-full">
    
    {label && (
      <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">
        {label}
      </label>
    )}

    <textarea
      rows={rows}
      className={`w-full p-3 text-sm bg-white border border-gray-200 rounded-lg outline-none focus:border-indigo-500 transition-all placeholder:text-gray-300 text-slate-700 resize-none placeholder:pl-2 ${className}`}
      placeholder={placeholder}
      {...props}
    />
  </div>

);

export default TextArea;