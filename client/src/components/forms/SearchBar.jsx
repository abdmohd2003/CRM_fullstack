import React from "react";
import { FiSearch } from "react-icons/fi";

const SearchBar = ({ placeholder = "Search phone, name, email..." }) => (
  <div className="relative w-full max-w-sm">
    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
    <input
      type="text"
      className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg outline-none focus:bg-white focus:border-indigo-500 transition-all"
      placeholder={placeholder}
    />
  </div>
);

export default SearchBar;