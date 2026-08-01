import React from "react";
import { FiEdit2, FiTrash2, FiLoader } from "react-icons/fi";

const TableRowActions = ({ onEdit, onDelete, isDeleting = false }) => {
  return (
    <div className="flex items-center gap-3 ">
      <button 
        onClick={onEdit} 
        disabled={isDeleting}
        className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <FiEdit2 size={16} />
      </button>
      <button 
        onClick={onDelete} 
        disabled={isDeleting}
        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isDeleting ? <FiLoader size={16} className="animate-spin" /> : <FiTrash2 size={16} />}
      </button>
    </div>
  );
};

export default TableRowActions;