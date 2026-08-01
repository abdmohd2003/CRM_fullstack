import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const Modal = ({ isOpen, onClose, title, children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <>
      
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-md transition-all cursor-pointer"
        style={{ zIndex: 99998 }}
        onClick={onClose}
        aria-hidden="true"
      />
      
      <div 
        className="fixed inset-y-0 right-0 flex pointer-events-none"
        style={{ zIndex: 99999 }}
      >
        <div className="bg-white w-full max-w-md h-full flex flex-col border-l border-slate-200 shadow-2xl pointer-events-auto">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {children} 
          </div>

        </div>
      </div>
    </>
  );

  // Render the modal directly into the body tag
  return createPortal(modalContent, document.body);
};

export default Modal;