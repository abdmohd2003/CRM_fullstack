import React from "react";

const Avatar = ({ label }) => (
  <div className="w-10 h-10 rounded-full bg-[#6366F1] flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:opacity-90 transition-opacity">
    {label}
  </div>
);

export default Avatar;