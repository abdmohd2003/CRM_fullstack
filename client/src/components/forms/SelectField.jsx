import React from "react";
import { FiChevronDown } from "react-icons/fi";

const SelectField = ({ 
  label, 
  name, 
  required, 
  options = [], 
  value, 
  onChange, 
  placeholder = "Choose",
  error // Added error prop
}) => {
  // Check if a placeholder/empty option is already provided explicitly in the options array
  const hasExplicitPlaceholder = options.some(opt => {
    return typeof opt === "object" && opt !== null ? opt.value === "" : opt === "";
  });

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-[11px] font-semibold text-slate-700 capitalize tracking-wider">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          name={name}          
          value={value}
          onChange={onChange}
          // Dynamically swaps borders and ring highlights based on the presence of an error
          className={`w-full px-4 py-2.5 text-xs font-semibold bg-white border rounded-xl outline-none appearance-none transition-all cursor-pointer text-slate-700 ${
            error 
              ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-100" 
              : "border-slate-200 focus:border-indigo-500"
          }`}
        >
          {/* Only render this default option if the parent didn't supply one in the options list */}
          {!hasExplicitPlaceholder && (
            <option value="" className="text-slate-400">
              {placeholder}
            </option>
          )}

          {options.map((opt, i) => {
            const isObject = typeof opt === "object" && opt !== null;
            const optionValue = isObject ? opt.value : opt;
            const optionLabel = isObject ? opt.label : opt;
            return (
              <option className="text-slate-900" key={i} value={optionValue}>
                {optionLabel}
              </option>
            );
          })}
        </select>

        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
          <FiChevronDown size={14} />
        </div>
      </div>

      {/* Render validation text */}
      {error && (
        <span className="text-xs text-red-500 block mt-1 font-medium transition-all">
          {error}
        </span>
      )}
    </div>
  );
};

export default SelectField;