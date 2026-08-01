import React from "react";

const Tabs = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="border-b border-gray-100 w-full">
      <div className="flex gap-8">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`relative pb-4 text-xs font-bold transition-all outline-none ${
                isActive 
                  ? "text-indigo-600" 
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <div className="flex items-center gap-2">
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                    isActive ? "bg-indigo-50 text-indigo-600" : "bg-gray-100 text-gray-400"
                  }`}>
                    {tab.count}
                  </span>
                )}
              </div>

              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-full animate-in slide-in-from-bottom-1 duration-200" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Tabs;