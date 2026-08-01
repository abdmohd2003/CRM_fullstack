import React from "react";
import NavItem from "./NavItem"
import { 
  FiGrid, FiUsers, FiBriefcase, 
  FiCheckSquare, FiFileText ,
   FiShoppingCart, FiCreditCard
} from "react-icons/fi";

const SideBar = () => {
  return (
    <div className="w-24 h-screen bg-white border-r border-gray-100 flex flex-col items-center py-3  sticky top-0 z-50">
      
  

      <nav className="flex flex-col gap-4 w-full px-2">
        <NavItem to="/dashboard" icon={FiGrid} label="dashboard" />
        <NavItem to="/leads" icon={FiUsers} label="Leads" />
        <NavItem to="/companies" icon={FiBriefcase} label="Companies" />
        <NavItem to="/deals" icon={FiCheckSquare} label="Deals" />
        <NavItem to="/tickets" icon={FiFileText} label="Tickets" />
          <NavItem to="/orders" icon={FiShoppingCart} label="Orders" />
        <NavItem to="/payments" icon={FiCreditCard} label="Payments" />
      </nav>

    </div>
  );
};

export default SideBar;