import React, { useState, useRef, useEffect } from "react";
import { FiChevronDown, FiEdit2, FiTrash2, FiExternalLink } from "react-icons/fi";

const Dropdown = ({ label, options, variant = "outline" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center justify-between gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
          variant === "outline" 
            ? "border-2 border-gray-100 bg-white text-gray-600 hover:border-gray-200" 
            : "bg-indigo-600 text-white hover:bg-indigo-700"
        }`}
      >
        {label}
        <FiChevronDown className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden border border-gray-50">
          <div className="py-1">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => {
                  option.onClick?.();
                  setIsOpen(false);
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-[11px] font-medium text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors border-b last:border-0 border-gray-50"
              >
                {option.icon && <option.icon size={14} />}
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;