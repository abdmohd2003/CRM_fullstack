
import React, { useState, useEffect, useRef } from "react";
import { FiX, FiChevronDown, FiCheck } from "react-icons/fi";
import Modal from "../../../components/ui/Modal";
import InputField from "../../../components/forms/InputField";
import SelectField from "../../../components/forms/SelectField";
import TextArea from "../../../components/forms/TextArea";
import Button from "../../../components/ui/Button";
import axiosInstance from "../../../api/axiosConfig";
import activityService from "../../../services/activityService";

// ─── Attendee Dropdown ───────────────────────────────────────────────────────

const AttendeeDropdown = ({ users, selected, onToggle, error }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedNames = users
    .filter((u) => selected.includes(u._id))
    .map((u) => `${u.firstName} ${u.lastName}`)
    .join(", ");

  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-slate-700">
        Attendees <span className="text-rose-500">*</span>
      </label>

      <div className="relative" ref={ref}>
        {/* Trigger */}
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`w-full flex items-center justify-between px-3 py-2 text-xs border rounded-xl bg-white text-slate-700 hover:border-indigo-400 transition-all
            ${error ? "border-rose-500 ring-2 ring-rose-100" : "border-slate-200"}`}
        >
          <span className={`truncate ${!selectedNames ? "text-slate-400" : ""}`}>
            {selectedNames || "Select attendees..."}
          </span>
          <FiChevronDown
            size={13}
            className={`ml-2 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            {users.length === 0 ? (
              <p className="text-xs text-slate-400 px-3 py-2">No users found</p>
            ) : (
              users.map((u) => {
                const isSelected = selected.includes(u._id);
                return (
                  <div
                    key={u._id}
                    onClick={() => onToggle(u._id)}
                    className={`flex items-center justify-between px-3 py-2 cursor-pointer text-xs transition-colors
                      ${isSelected ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-50"}`}
                  >
                    <span>{u.firstName} {u.lastName}</span>
                    {isSelected && <FiCheck size={12} className="text-indigo-600" />}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-rose-500 text-[10px] font-bold mt-1.5 ml-1">{error}</p>
      )}

      {/* Count */}
      {selected.length > 0 && !error && (
        <p className="text-[10px] text-indigo-500">{selected.length} attendee(s) selected</p>
      )}
    </div>
  );
};

// ─── CreateMeetingModal ──────────────────────────────────────────────────────

const CreateMeetingModal = ({ isOpen, onClose, entityId, entityType, onCreated }) => {

  
const getCurrentTime = () => new Date().toTimeString().slice(0, 5);   // "09:37"
const getOneHourLater = () => {
  const d = new Date();
  d.setHours(d.getHours() + 1);
  return d.toTimeString().slice(0, 5);
};
  const initialState = {
    title: "",
    startTime: getCurrentTime(),
    endTime: getOneHourLater(),
    attendees: [],
    location: "",
    reminder: "",
    note: "",
  };

  const [formData, setFormData] = useState(initialState);
  const [users, setUsers]       = useState([]);
  const [errors, setErrors]     = useState({});

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axiosInstance.get("/users");
        setUsers(Array.isArray(res.data) ? res.data : res.data?.data || []);
      } catch (error) {
        console.error("User fetch error:", error);
        setUsers([]);
      }
    };
    if (isOpen) fetchUsers();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleAttendeeToggle = (userId) => {
    setFormData((prev) => {
      const already = prev.attendees.includes(userId);
      return {
        ...prev,
        attendees: already
          ? prev.attendees.filter((id) => id !== userId)
          : [...prev.attendees, userId],
      };
    });
    if (errors.attendees) setErrors((prev) => ({ ...prev, attendees: "" }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim())  newErrors.title     = "Title is required";
    if (!formData.startDate)     newErrors.startDate = "Start date is required";
    if (!formData.startTime)     newErrors.startTime = "Start time is required";
    if (!formData.endDate)       newErrors.endDate   = "End date is required";
    if (!formData.endTime)       newErrors.endTime   = "End time is required";
    if (!formData.location)      newErrors.location  = "Location is required";
    if (!formData.reminder)      newErrors.reminder  = "Reminder is required";
    if (!formData.note.trim())   newErrors.note      = "Note is required";

    if (formData.attendees.length === 0)
      newErrors.attendees = "Select at least one attendee";

    // Chronological check
    if (formData.startDate && formData.startTime && formData.endDate && formData.endTime) {
      const start = new Date(`${formData.startDate}T${formData.startTime}`);
      const end   = new Date(`${formData.endDate}T${formData.endTime}`);
      if (end <= start) newErrors.endTime = "End must be after start date & time";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const activityData = {
        type: "Meeting",
        entityType,
        entityId: String(entityId),
        title: formData.title,
        description: formData.note,
        details: {
          title:     formData.title,
          startDate: new Date(`${formData.startDate}T${formData.startTime}`),
          endDate:   new Date(`${formData.endDate}T${formData.endTime}`),
          attendees: formData.attendees,
          location:  formData.location,
          reminder:  formData.reminder,
          note:      formData.note,
        },
      };

      await activityService.logActivity(activityData);

      setFormData(initialState);
      setErrors({});
      onClose?.();
      onCreated?.();
    } catch (error) {
      console.error("❌ Error saving meeting:", error?.response?.data || error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} position="right">
      <div className="w-[380px] h-full bg-white flex flex-col font-sans">

        {/* HEADER */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h3 className="text-sm font-black text-slate-800">Schedule Meeting</h3>
          <Button variant="secondary" icon={FiX} onClick={onClose} />
        </div>

        {/* FORM */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Title */}
          <div>
            <InputField
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter meeting title..."
            />
            {errors.title && (
              <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.title}</p>
            )}
          </div>

          {/* Start Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            
            <div>
              <InputField
                label="Start Time"
                name="startTime"
                type="time"
                value={formData.startTime}
                onChange={handleChange}
              />
              {errors.startTime && (
                <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.startTime}</p>
              )}
            </div>
            <div>
              <InputField
                label="End Time"
                name="endTime"
                type="time"
                value={formData.endTime}
                onChange={handleChange}
              />
              {errors.endTime && (
                <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.endTime}</p>
              )}
            </div>
            
          </div>

        

          {/* Attendees */}
          <AttendeeDropdown
            users={users}
            selected={formData.attendees}
            onToggle={handleAttendeeToggle}
            error={errors.attendees}
          />

          {/* Location */}
          <div>
            <SelectField
              label="Location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              options={[
                { value: "",             label: "Select location..."  },
                { value: "Google Meet",  label: "Google Meet"         },
                { value: "Zoom",         label: "Zoom"                },
                { value: "Office Room 1",label: "Office Room 1"       },
              ]}
            />
            {errors.location && (
              <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.location}</p>
            )}
          </div>

          {/* Reminder */}
          <div>
            <SelectField
              label="Reminder"
              name="reminder"
              value={formData.reminder}
              onChange={handleChange}
              options={[
                { value: "",                  label: "Select reminder..."    },
                { value: "5 mins",            label: "5 mins"                },
                { value: "15 mins",           label: "15 mins"               },
                { value: "30 mins",           label: "30 mins"               },
                { value: "1 hour",            label: "1 hour"                },
                { value: "15 minutes before", label: "15 minutes before"     },
                { value: "30 minutes before", label: "30 minutes before"     },
                { value: "1 hour before",     label: "1 hour before"         },
              ]}
            />
            {errors.reminder && (
              <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.reminder}</p>
            )}
          </div>

          {/* Note */}
          <div>
            <TextArea
              label="Note"
              name="note"
              value={formData.note}
              onChange={handleChange}
              placeholder="Enter notes..."
            />
            {errors.note && (
              <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.note}</p>
            )}
          </div>

          {/* FOOTER */}
          <div className="pt-2 grid grid-cols-2 gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save
            </Button>
          </div>

        </form>
      </div>
    </Modal>
  );
};

export default CreateMeetingModal;



