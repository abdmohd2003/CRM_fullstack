import React from "react";

const IconButton = ({ icon: Icon, hasBadge }) => (
  <button className="p-2.5 text-gray-400 bg-white border border-gray-100 rounded-xl hover:text-[#6366F1] hover:shadow-sm transition-all relative">
    <Icon size={20} />
    {hasBadge && (
      <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 border-2 border-white rounded-full"></span>
    )}
  </button>
);

export default IconButton;