import React from "react";
import { NavLink } from "react-router-dom";

const NavItem = ({ to, icon: Icon, label }) => {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => 
        `flex flex-col items-center gap-2 group transition-all`
      }
    >
      {({ isActive }) => (
        <>
          <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
            isActive 
              ? "bg-[#6366F1] text-white shadow-lg shadow-indigo-100" 
              : "border border-gray-200 text-slate-400 group-hover:bg-gray-50 group-hover:text-[#6366F1]"
          }`}>
            <Icon size={18} />
          </div>

          {/* Label */}
          <span className={`text-[8px] font-bold uppercase tracking-tight transition-all ${
            isActive ? "text-slate-800" : "text-slate-400 group-hover:text-slate-600"
          }`}>
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
};

export default NavItem;