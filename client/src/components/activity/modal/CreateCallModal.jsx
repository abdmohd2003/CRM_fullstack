import React, { useState } from "react";
import { FiX, FiBold, FiItalic, FiUnderline, FiList, FiImage } from "react-icons/fi";
import { MdFormatListNumbered } from "react-icons/md";

import Modal from "../../../components/ui/Modal";
import SelectField from "../../../components/forms/SelectField";
import Button from "../../../components/ui/Button";
import TextArea from "../../../components/forms/TextArea";
import InputField from "../../../components/forms/InputField";
import activityService from "../../../services/activityService";

const CreateCallModal = ({ isOpen, onClose, entityId, entityType, onCreated }) => {

    const getCurrentDate = () => new Date().toISOString().split("T")[0];
  const getCurrentTime = () => new Date().toTimeString().slice(0, 5);
  const initialState = {
    connected:   "",
    callOutcome: "",
    date:        getCurrentDate(),
    time:        getCurrentTime(),
    note:        "",
  };

  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors]     = useState({});

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.connected)   newErrors.connected   = "Please select connected status";
    if (!formData.callOutcome) newErrors.callOutcome = "Please select a call outcome";
    if (!formData.date)        newErrors.date        = "Date is required";
    if (!formData.time)        newErrors.time        = "Time is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (!entityId) {
      alert("Invalid entity ID");
      return;
    }

    try {
      const activityData = {
        type:        "Call",
        entityType,
        entityId:    String(entityId),
        connected:   formData.connected,
        callOutcome: formData.callOutcome,
        callDate:    new Date(`${formData.date}T${formData.time}`),
        details: {
          note: formData.note,
        },
      };

      await activityService.logActivity(activityData);

      setFormData(initialState);
      setErrors({});
      onClose?.();
      onCreated?.();
    } catch (error) {
      console.error("❌ Error saving call:", error?.response?.data || error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} position="right">
      <div className="bg-white h-full w-full max-w-[400px] flex flex-col font-sans">

        {/* HEADER */}
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-slate-800 font-black text-sm">Log Call</h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <FiX size={18} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Connected */}
          <div>
            <SelectField
              label="Connected"
              name="connected"
              value={formData.connected}
              onChange={handleChange}
              options={[
                { value: "",    label: "Select..."  },
                { value: "Yes", label: "Yes"        },
                { value: "No",  label: "No"         },
              ]}
            />
            {errors.connected && (
              <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.connected}</p>
            )}
          </div>

          {/* Call Outcome */}
          <div>
            <SelectField
              label="Call Outcome"
              name="callOutcome"
              value={formData.callOutcome}
              onChange={handleChange}
              options={[
                { value: "",                label: "Select..."        },
                { value: "Busy",            label: "Busy"             },
                { value: "Connected",       label: "Connected"        },
                { value: "No Answer",       label: "No Answer"        },
                { value: "Left Voicemail",  label: "Left Voicemail"   },
                { value: "Wrong Number",    label: "Wrong Number"     },
              ]}
            />
            {errors.callOutcome && (
              <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.callOutcome}</p>
            )}
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <InputField
                label="Date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
              />
              {errors.date && (
                <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.date}</p>
              )}
            </div>
            <div>
              <InputField
                label="Time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleChange}
              />
              {errors.time && (
                <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.time}</p>
              )}
            </div>
          </div>

          {/* Note */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 px-3 py-1.5 flex gap-2 text-slate-400">
              <FiBold size={12} />
              <FiItalic size={12} />
              <FiUnderline size={12} />
              <span className="w-px h-3 bg-slate-200" />
              <FiList size={12} />
              <MdFormatListNumbered size={13} />
              <FiImage size={12} />
            </div>
            <TextArea
              name="note"
              value={formData.note}
              onChange={handleChange}
              placeholder="Enter note details here..."
              className="border-none rounded-none min-h-[110px] text-xs px-4 py-3"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary">Save</Button>
          </div>

        </form>
      </div>
    </Modal>
  );
};

export default CreateCallModal;