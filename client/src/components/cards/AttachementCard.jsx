import React from "react";
import { FiFile, FiDownload, FiTrash2 } from "react-icons/fi";

const AttachementCard = ({ fileName, fileSize, fileType }) => {
  return (
    <div className="group flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl hover:bg-white hover:shadow-md transition-all">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-indigo-600 border border-gray-100">
          <FiFile size={18} />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-800 truncate max-w-[150px]">{fileName}</p>
          <p className="text-[10px] font-medium text-gray-400 uppercase">{fileSize} • {fileType}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
          <FiDownload size={16} />
        </button>
        <button className="p-2 text-gray-400 hover:text-rose-500 transition-colors">
          <FiTrash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default AttachementCard;