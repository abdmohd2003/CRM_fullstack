import React, { useState, useEffect, useRef } from "react";
import {
  FiX,
  FiBold,
  FiItalic,
  FiUnderline,
  FiList,
  FiImage,
  FiChevronDown,
} from "react-icons/fi";

import Modal from "../../../components/ui/Modal";
import InputField from "../../../components/forms/InputField";
import SelectField from "../../../components/forms/SelectField";
import TextArea from "../../../components/forms/TextArea";
import Button from "../../../components/ui/Button";
import axiosInstance from "../../../api/axiosConfig";
import activityService from "../../../services/activityService";

// ─── MultiSelectDropdown ────────────────────────────────────────────────────

const MultiSelectDropdown = ({
  label,
  placeholder = "Select...",
  options,
  selectedValues,
  onChange,
  error,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (value) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const getDisplayString = () => {
    const labels = selectedValues.map((val) => {
      const match = options.find((opt) => opt.value === val);
      return match ? match.label : val;
    });
    return labels.join(", ");
  };

  return (
    <div className="relative space-y-1.5" ref={dropdownRef}>
      {label && (
        <label className="text-[11px] font-semibold text-slate-700 capitalize tracking-wide">
          {label}
        </label>
      )}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2.5 bg-white border rounded-xl text-xs font-medium text-slate-800
          cursor-pointer flex justify-between items-center shadow-sm transition-all hover:border-slate-300
          ${error
            ? "border-rose-500 ring-2 ring-rose-100"
            : "border-slate-200"
          }`}
      >
        <span className="truncate">
          {selectedValues.length === 0 ? (
            <span className="text-slate-400">{placeholder}</span>
          ) : (
            getDisplayString()
          )}
        </span>
        <FiChevronDown
          className={`text-slate-400 transition-transform flex-shrink-0 ml-2 ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto py-1">
          {options.length === 0 ? (
            <p className="text-xs text-slate-400 px-4 py-3 text-center">No options available</p>
          ) : (
            options.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={() => handleToggle(option.value)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-700">{option.label}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// ─── CreateTasksModal ────────────────────────────────────────────────────────

const CreateTasksModal = ({
  isOpen,
  onClose,
  entityId,
  entityType,
  onCreated,
}) => {
  const getCurrentDate = () => new Date().toISOString().split("T")[0];
  const getCurrentTime = () => new Date().toTimeString().slice(0, 5);

  const initialState = {
    taskName: "",
    dueDate: getCurrentDate(),
    dueTime: getCurrentTime(),
    taskType: "",
    priority: "",
    assignedTo: [],   // ← now an array
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
    fetchUsers();
  }, []);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Dedicated handler for the multi-select
  const handleAssignedToChange = (newValues) => {
    setFormData((prev) => ({ ...prev, assignedTo: newValues }));
    if (errors.assignedTo) setErrors((prev) => ({ ...prev, assignedTo: "" }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.taskName.trim()) newErrors.taskName   = "Task name is required";
    if (!formData.dueDate)         newErrors.dueDate    = "Due date is required";
    if (!formData.dueTime)         newErrors.dueTime    = "Due time is required";
    if (!formData.taskType)        newErrors.taskType   = "Task type is required";
    if (!formData.priority)        newErrors.priority   = "Priority is required";
    if (!formData.assignedTo.length) newErrors.assignedTo = "Please assign to at least one user";
    if (!formData.note.trim())     newErrors.note       = "Note is required";

    if (formData.dueDate && formData.dueTime) {
      const due = new Date(`${formData.dueDate}T${formData.dueTime}`);
      if (due < new Date()) newErrors.dueTime = "Due date & time must be in the future";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      const activityData = {
        type: "Task",
        entityType,
        entityId: String(entityId),
        title: formData.taskName,
        description: formData.note,
        dueDate: new Date(`${formData.dueDate}T${formData.dueTime}`),
        priority: formData.priority,
        taskType: formData.taskType,
        assignedTo: formData.assignedTo,          // array of user IDs
        details: {
          taskName: formData.taskName,
          dueDate:  formData.dueDate,
          dueTime:  formData.dueTime,
          taskType: formData.taskType,
          priority: formData.priority,
          note:     formData.note,
        },
      };

      await activityService.logActivity(activityData);

      setFormData(initialState);
      setErrors({});
      onClose?.();
      onCreated?.();
    } catch (error) {
      console.error("❌ Error saving task:", error?.response?.data || error);
    }
  };

  const userOptions = users.map((u) => ({
    value: u._id,
    label: `${u.firstName || ""} ${u.lastName || ""}`.trim(),
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} position="right">
      <div className="w-[380px] h-full bg-white flex flex-col font-sans">

        {/* HEADER */}
        <div className="px-5 py-4 flex items-center justify-between">
          <h3 className="text-sm font-black">Create Task</h3>
          <Button variant="secondary" icon={FiX} onClick={onClose} />
        </div>

        {/* FORM */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Task Name */}
          <div>
            <InputField
              label="Task Name"
              name="taskName"
              value={formData.taskName}
              onChange={handleChange}
              placeholder="Enter task name..."
            />
            {errors.taskName && (
              <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.taskName}</p>
            )}
          </div>

          {/* Due Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <InputField
                label="Due Date"
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleChange}
              />
              {errors.dueDate && (
                <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.dueDate}</p>
              )}
            </div>
            <div>
              <InputField
                label="Time"
                name="dueTime"
                type="time"
                value={formData.dueTime}
                onChange={handleChange}
              />
              {errors.dueTime && (
                <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.dueTime}</p>
              )}
            </div>
          </div>

          {/* Task Type + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <SelectField
                label="Task Type"
                name="taskType"
                value={formData.taskType}
                onChange={handleChange}
                options={[
                  { value: "",          label: "Select type..."  },
                  { value: "To-Do",     label: "To-Do"           },
                  { value: "Follow up", label: "Follow up"       },
                ]}
              />
              {errors.taskType && (
                <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.taskType}</p>
              )}
            </div>
            <div>
              <SelectField
                label="Priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                options={[
                  { value: "",       label: "Select..."  },
                  { value: "High",   label: "High"       },
                  { value: "Medium", label: "Medium"     },
                  { value: "Low",    label: "Low"        },
                ]}
              />
              {errors.priority && (
                <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.priority}</p>
              )}
            </div>
          </div>

          {/* Assigned To — MultiSelectDropdown */}
          <div>
            <MultiSelectDropdown
              label="Assigned To"
              placeholder="Select users..."
              options={userOptions}
              selectedValues={formData.assignedTo}
              onChange={handleAssignedToChange}
              error={errors.assignedTo}
            />
            {errors.assignedTo && (
              <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.assignedTo}</p>
            )}
          </div>

          {/* Note */}
          <div>
            <div
              className={`rounded-xl overflow-hidden border transition-all
                ${errors.note ? "border-rose-500 ring-2 ring-rose-100" : "border-slate-200"}`}
            >
              <div className="bg-slate-50 px-3 py-2 flex gap-2 text-slate-400 border-b border-slate-200">
                <FiBold size={12} />
                <FiItalic size={12} />
                <FiUnderline size={12} />
                <FiList size={12} />
                <FiImage size={12} />
              </div>
              <TextArea
                name="note"
                value={formData.note}
                onChange={handleChange}
                placeholder="Enter notes..."
              />
            </div>
            {errors.note && (
              <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{errors.note}</p>
            )}
          </div>

          {/* FOOTER */}
          <div className="pt-4 grid grid-cols-2 gap-3">
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

export default CreateTasksModal;