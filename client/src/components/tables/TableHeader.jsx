import React from "react";
import { FiFilter, FiDownload, FiPlus } from "react-icons/fi";
import SearchBar from "../forms/SearchBar";

const TableHeader = ({ 
  title, 
  count, 
  onAddClick,
  showSearch = true,
  showFilter = true,
  showDownload = true,
  showAdd = true,
  onDownloadClick,
  // ADDED: A prop to handle search input
  onSearchChange,
  children 
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
          {title}
          {count !== undefined && (
            <span className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </h2>
      </div>

      {/* ADDED: flex-wrap to prevent buttons from squishing on tiny mobile screens */}
      <div className="flex flex-wrap items-center gap-3">
        
        {/* Pass the search handler down to the SearchBar */}
        {showSearch && <SearchBar onChange={onSearchChange} />}
        
        {showFilter && (
          <button 
            title="Filter options"
            aria-label="Filter"
            className="p-2.5 text-gray-400 hover:text-indigo-600 bg-white border border-gray-100 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <FiFilter size={18} />
          </button>
        )}

        {showDownload && (
          <button 
            title="Download"
            aria-label="Download"
            onClick={onDownloadClick}
            className="p-2.5 text-gray-400 hover:text-indigo-600 bg-white border border-gray-100 rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <FiDownload size={18} />
          </button>
        )}

        {showAdd && (
          <button 
            onClick={onAddClick}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-100 cursor-pointer"
          >
            <FiPlus size={16} />
            ADD NEW
          </button>
        )}

        {children}
      </div>
    </div>
  );
};

export default TableHeader;