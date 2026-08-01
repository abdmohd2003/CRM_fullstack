import React, { useState } from "react";
import { FiX, FiBold, FiItalic, FiUnderline, FiList, FiImage } from "react-icons/fi";

import Modal from "../../../components/ui/Modal";
import TextArea from "../../../components/forms/TextArea";
import Button from "../../../components/ui/Button";

import activityService from "../../../services/activityService"; 

const CreateNoteModal = ({ isOpen, onClose, entityId, entityType, onCreated }) => {
  const [noteContent, setNoteContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

const handleSave = async (e) => {
    e.preventDefault();

    if (!noteContent.trim()) {
      alert("Please enter a note");
      return;
    }

    try {
      setIsSaving(true);

      // 🧠 SMART PAYLOAD: Dynamically handles Lead, Deal, Company, or Task
      const activityData = {
        // 1. The actual Note text (Adding it everywhere the backend might look)
        type: "Note",
        content: noteContent,       // Usually required by Mongoose 'Note' schema
        description: noteContent,
        note: noteContent,
        
        // 2. Dynamically assign the ID based on what page you are on!
        // If entityType is 'lead', this creates -> leadId: "6a3a..."
        // If entityType is 'deal', this creates -> dealId: "6a3a..."
        [`${entityType}Id`]: entityId, 

        // 3. Keep the generic ones just in case
        entityType: entityType,     
        entityId: entityId,         
        
        // 4. Nested fallback
        itemRef: {
          content: noteContent, 
          note: noteContent,
          description: noteContent
        }
      };

      // 👀 DEBUGGING: Look at your browser console to see exactly what is sent!

      // Send to backend
      await activityService.logActivity(activityData);

      // Clear and close
      setNoteContent("");
      if (onCreated) {
        onCreated();
      }
      onClose();

    } catch (error) {
      console.error("❌ Error saving note:", error);
      alert("Failed to save note. Check console for details.");
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose} position="right">
      <div className="bg-white h-full w-full max-w-md flex flex-col font-sans">
        
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-sm font-black text-slate-800 tracking-wide">
            Create Note
          </h2>
          <Button
            variant="secondary"
            icon={FiX}
            onClick={onClose}
            className="p-1.5 !rounded-full border-none hover:bg-slate-50 text-slate-400"
          />
        </div>

        <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden px-6 py-6 space-y-1.5 custom-scrollbar">
          <label className="text-[11px] font-bold text-slate-700">
            Note <span className="text-rose-500">*</span>
          </label>

          <div className="w-full border border-slate-200 rounded-xl overflow-hidden focus-within:border-indigo-500 transition-all flex flex-col bg-white shadow-sm">
            
            <div className="flex items-center gap-4 px-3 py-2 border-b border-slate-100 bg-slate-50/50 select-none text-slate-400 text-[10px] font-bold">
              <div className="flex items-center gap-1 cursor-pointer text-slate-500 hover:text-slate-800">
                <span>Normal text</span>
                <span className="text-[7px]">▼</span>
              </div>
              <div className="w-px h-3 bg-slate-200" />
              <button type="button" className="hover:text-slate-700"><FiBold size={12} /></button>
              <button type="button" className="hover:text-slate-700"><FiItalic size={12} /></button>
              <button type="button" className="hover:text-slate-700"><FiUnderline size={12} /></button>
              <div className="w-px h-3 bg-slate-200" />
              <button type="button" className="hover:text-slate-700"><FiList size={12} /></button>
              <button type="button" className="hover:text-slate-700 flex items-center gap-0.5">
                <FiList size={12} className="scale-x-[-1]" />
                <span className="text-[7px]">▼</span>
              </button>
              <button type="button" className="hover:text-slate-700"><FiImage size={12} /></button>
            </div>

            <TextArea
              name="note"
              placeholder="Enter your notes details here..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              required
              className="border-none rounded-none min-h-[220px] shadow-none focus-within:ring-0 text-xs px-4 py-3"
            />
          </div>

          <div className="mt-auto border-t border-slate-100 bg-white grid grid-cols-2 gap-3 shrink-0">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider text-slate-600"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              disabled={isSaving} 
              className="py-2.5 rounded-xl font-black text-[11px] bg-indigo-600 shadow-lg shadow-indigo-100 uppercase tracking-wider text-white disabled:bg-indigo-400"
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>

      </div>
    </Modal>
  );
};

export default CreateNoteModal;