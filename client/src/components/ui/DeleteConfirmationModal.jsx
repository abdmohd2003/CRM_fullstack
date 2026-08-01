// src/components/ui/DeleteConfirmationModal.jsx
import React from "react";
import { FiTrash2, FiAlertTriangle, FiX, FiLoader } from "react-icons/fi";

const DeleteConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  itemName, 
  itemType = "Record",
  isDeleting = false,
  icon: CustomIcon,
  iconColor = "bg-emerald-50 text-emerald-600",
  warningMessage = "deleting this record will permanently remove all associated data."
}) => {
  if (!isOpen) return null;

  // Default icon based on item type
  const getDefaultIcon = () => {
    const icons = {
      'Company': <FiBriefcase className="w-6 h-6" />,
      'Deal': <FiBriefcase className="w-6 h-6" />,
      'Lead': <FiUser className="w-6 h-6" />,
      'Ticket': <FiTag className="w-6 h-6" />,
    };
    return icons[itemType] || <FiBriefcase className="w-6 h-6" />;
  };

  const getIconColor = () => {
    const colors = {
      'Company': 'bg-blue-50 text-blue-600',
      'Deal': 'bg-emerald-50 text-emerald-600',
      'Lead': 'bg-indigo-50 text-indigo-600',
      'Ticket': 'bg-rose-50 text-rose-600',
    };
    return colors[itemType] || 'bg-slate-50 text-slate-600';
  };

  const getWarningMessage = () => {
    const messages = {
      'Company': 'Deleting this company will permanently remove all associated data including leads, deals, tickets, and activity history.',
      'Deal': 'Deleting this deal will permanently remove all associated data including leads, activities, and history.',
      'Lead': 'Deleting this lead will permanently remove all associated data including notes, activities, and history.',
      'Ticket': 'Deleting this ticket will permanently remove all associated data including activities, comments, and history.',
    };
    return messages[itemType] || warningMessage;
  };

  const icon = CustomIcon || getDefaultIcon();
  const color = iconColor || getIconColor();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl p-6 w-[440px] shadow-2xl transform transition-all animate-scaleIn relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <FiX size={20} />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
            <FiTrash2 className="w-8 h-8 text-red-500" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-slate-800 text-center mb-2">
          Delete {itemType}
        </h3>

        {/* Message */}
        <p className="text-slate-500 text-center mb-6">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-slate-700">{itemName}</span>?
          <br />
          <span className="text-xs text-slate-400">This action cannot be undone.</span>
        </p>

        {/* Warning Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 flex items-start gap-2">
          <FiAlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-700">Warning</p>
            <p className="text-xs text-amber-600">
              {getWarningMessage()}
            </p>
          </div>
        </div>

        {/* Item Info */}
        <div className="bg-slate-50 rounded-xl p-3 mb-6 flex items-center gap-3">
          <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{itemName}</p>
            <p className="text-xs text-slate-400">{itemType} record</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-colors shadow-lg shadow-red-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <FiLoader className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              `Delete ${itemType}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;