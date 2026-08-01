import React from "react";

const Button = ({ 
  children, 
  variant = "primary", 
  size = "md", 
  icon: Icon, 
  onClick, 
  className = "",
  disabled = false,
  type = "button"
}) => {
  
  const baseStyles = "inline-flex items-center justify-center gap-2 font-bold transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none rounded-lg";
  
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
    secondary: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100",
    outline: "border-2 border-gray-200 text-gray-600 hover:bg-gray-50",
    ghost: "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
    danger: "bg-rose-50 text-rose-600 hover:bg-rose-100"
  };

  // ബട്ടൺ സൈസുകൾ
  const sizes = {
    sm: "px-3 py-1.5 text-[11px]",
    md: "px-4 py-2 text-xs",
    lg: "px-6 py-3 text-sm"
  };

  return (
    <button 
      type={type}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {Icon && <Icon size={size === "sm" ? 14 : 18} />}
      {children}
    </button>
  );
};

export default Button;