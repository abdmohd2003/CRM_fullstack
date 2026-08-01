import React from "react";

const InputField = ({
  label,
  icon: Icon,
  placeholder,
  required,
  type = "text",
  name,
  value,
  onChange,
  error // Added error prop
}) => (
  <div className="space-y-1.5 w-full">
    
    {label && (
      <label className="text-[11px] font-semibold text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
    )}

    <div className="relative group">
      
      {Icon && (
        <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
          error ? "text-red-400" : "text-gray-400 group-focus-within:text-[#6366F1]"
        }`}>
          <Icon size={16} />
        </div>
      )}

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        // Native validations are disabled to allow your custom red inline styles to apply cleanly
        className={`w-full ${
          Icon ? "pl-11" : "px-4"
        } py-2.5 bg-white border rounded-xl text-xs outline-none transition-all placeholder:text-gray-300 ${
          error 
            ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-100" 
            : "border-gray-200 focus:border-[#6366F1] focus:ring-1 focus:ring-indigo-100"
        }`}
      />
      
    </div>

    {/* Render validation text */}
    {error && (
      <span className="text-xs text-red-500 block mt-1 font-medium transition-all">
        {error}
      </span>
    )}
  </div>
);

export default InputField;