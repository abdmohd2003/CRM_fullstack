import React, { useEffect, useState, useRef, useMemo } from "react";
import { FiX, FiChevronDown } from "react-icons/fi";
import { toast } from "react-toastify";

import Modal from "../../components/ui/Modal";
import InputField from "../../components/forms/InputField";
import SelectField from "../../components/forms/SelectField";
import Button from "../../components/ui/Button";

import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../../contexts/AuthContexts";
import axiosInstance from "../../api/axiosConfig";
import ticketService from "../../services/ticketService";

import {
  addTicket,
  updateTicket,
  clearSelectedTicket,
  setLoading,
  setError,
} from "../../redux/slices/ticketSlice";

const MultiSelectDropdown = ({ label, options, selectedValues, onChange }) => {
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

  return (
    <div className="relative space-y-1.5" ref={dropdownRef}>
      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
        {label}
      </label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 cursor-pointer flex justify-between items-center shadow-sm transition-all hover:border-slate-300"
      >
        <span className="truncate">
          {selectedValues.length === 0
            ? <span className="text-slate-400">Select owners...</span>
            : selectedValues.join(", ")}
        </span>
        <FiChevronDown className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto py-1">
          {options.map((option) => (
            <label
              key={option}
              className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedValues.includes(option)}
                onChange={() => handleToggle(option)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs font-medium text-slate-700">{option}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};


const CreateTicketModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { user: authUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ CRM users state
  const [crmUsers, setCrmUsers] = useState([]);

  const selectedTicket = useSelector((state) => state.tickets.selectedTicket);
  const deals = useSelector((state) => state.deals?.deals || []);

  // ✅ Fetch all CRM users when modal opens
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axiosInstance.get("/users");
        const users = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setCrmUsers(users);
      } catch (error) {
        console.error("Error loading users:", error);
        setCrmUsers([]);
      }
    };
    if (isOpen) fetchUsers();
  }, [isOpen]);

  // ✅ All CRM users in dropdown, fallback to logged-in user
  const availableOwners = useMemo(() => {
    if (crmUsers.length > 0) {
      return crmUsers.map((u) => ({
        value: u._id,
        label: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email || "Unknown",
      }));
    }
    if (authUser?._id) {
      return [{
        value: authUser._id,
        label: `${authUser.firstName || ""} ${authUser.lastName || ""}`.trim() || authUser.email,
      }];
    }
    return [];
  }, [crmUsers, authUser]);

  // ✅ Deal options
  const dealOptions = useMemo(() => {
    const initialOption = [{ value: "", label: "No associated deal" }];
    const items = (deals || []).map(deal => ({
      value: deal._id || deal.id || "",
      label: deal.name || deal.dealName || "Unnamed Deal",
    }));
    return [...initialOption, ...items];
  }, [deals]);

  const INITIAL_STATE = {
    ticketName: "",
    description: "",
    ticketStatus: "New",
    source: "",
    priority: "Medium",
    ticketOwner: "",
    associatedDeal: "",
  };

  const [formData, setFormData] = useState(INITIAL_STATE);
  const [errors, setErrors] = useState({});

  // Autofill edit data
  useEffect(() => {
    if (selectedTicket) {
      setFormData({
        ticketName: selectedTicket.ticketName || selectedTicket.name || "",
        description: selectedTicket.description || "",
        ticketStatus: selectedTicket.ticketStatus || selectedTicket.status || "New",
        source: selectedTicket.source || "",
        priority: selectedTicket.priority || "Medium",
        ticketOwner: selectedTicket.ticketOwner?._id || selectedTicket.ticketOwner || "",
        associatedDeal: selectedTicket.associatedDeal?._id || selectedTicket.associatedDeal || "",
      });
    } else {
      setFormData(INITIAL_STATE);
    }
  }, [selectedTicket]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.ticketName.trim())  newErrors.ticketName  = "Ticket name is required";
    if (!formData.ticketStatus)       newErrors.ticketStatus = "Select a ticket status";
    if (!formData.source)             newErrors.source       = "Select a source";
    if (!formData.priority)           newErrors.priority     = "Select a priority";
    if (!formData.ticketOwner)        newErrors.ticketOwner  = "Select a ticket owner";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClose = () => {
    dispatch(clearSelectedTicket());
    setFormData(INITIAL_STATE);
    setErrors({});
    onClose();
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the form errors");
      return;
    }

    setIsSubmitting(true);
    dispatch(setLoading(true));

    const ticketData = {
      ticketName:     formData.ticketName.trim(),
      description:    formData.description?.trim() || "",
      ticketStatus:   formData.ticketStatus,
      source:         formData.source,
      priority:       formData.priority,
      ticketOwner:    formData.ticketOwner,
      associatedDeal: formData.associatedDeal || null,
    };

    try {
      if (selectedTicket) {
        // 👇 UPDATE PATH
        const ticketId = selectedTicket._id || selectedTicket.id;
        const response = await ticketService.updateTicket(ticketId, ticketData);

        if (response.success) {
          toast.success("✅ Ticket updated successfully");
          dispatch(updateTicket(response.data)); // Updates the Redux state array
          handleClose();
        } else {
          toast.error(response.message || "Failed to update ticket");
        }
      } else {
        // 👇 CREATE PATH
        const response = await ticketService.createTicket(ticketData);

        if (response.success) {
          toast.success("✅ Ticket created successfully");
          dispatch(addTicket(response.data)); // Adds to the Redux state array
          handleClose();
        } else {
          toast.error(response.message || "Failed to create ticket");
        }
      }
    } catch (error) {
      console.error("❌ Error saving ticket:", error);
      dispatch(setError(error.message));
      toast.error(error.message || "Failed to save ticket");
    } finally {
      setIsSubmitting(false);
      dispatch(setLoading(false));
    }
  };
  return (
    <Modal isOpen={isOpen} onClose={handleClose} position="right">
      <div className="bg-white h-full w-full max-w-md flex flex-col font-sans">

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-sm font-black text-slate-800 tracking-wide uppercase">
            {selectedTicket ? "Update Ticket" : "Create Ticket"}
          </h2>
          <Button
            variant="secondary"
            icon={FiX}
            onClick={handleClose}
            className="p-1.5 !rounded-full border-none hover:bg-slate-50 text-slate-400 transition-colors"
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="flex-1 px-6 py-6 overflow-y-auto space-y-5 custom-scrollbar">

          {/* Ticket Name */}
          <div>
            <InputField
              label="Ticket Name"
              name="ticketName"
              placeholder="Enter ticket name"
              value={formData.ticketName}
              onChange={handleChange}
              required
            />
            {errors.ticketName && (
              <p className="text-rose-500 text-[10px] font-bold mt-1.5 ml-1">{errors.ticketName}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700">Description</label>
            <textarea
              name="description"
              placeholder="Enter description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 transition-all shadow-sm placeholder-slate-400 resize-none"
            />
          </div>

          {/* Status + Source */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <SelectField
                label="Ticket Status"
                name="ticketStatus"
                value={formData.ticketStatus}
                onChange={handleChange}
                options={[
                  { value: "New",                  label: "New"                  },
                  { value: "Waiting on us",         label: "Waiting on us"        },
                  { value: "Waiting on contact",    label: "Waiting on contact"   },
                  { value: "In Progress",           label: "In Progress"          },
                  { value: "Resolved",              label: "Resolved"             },
                  { value: "Closed",                label: "Closed"               },
                ]}
              />
              {errors.ticketStatus && (
                <p className="text-rose-500 text-[10px] font-bold mt-1.5 ml-1">{errors.ticketStatus}</p>
              )}
            </div>
            <div>
              <SelectField
                label="Source"
                name="source"
                value={formData.source}
                onChange={handleChange}
                options={[
                  { value: "",              label: "Select..."    },
                  { value: "Chat",          label: "Chat"         },
                  { value: "Email",         label: "Email"        },
                  { value: "Phone",         label: "Phone"        },
                  { value: "Website",       label: "Website"      },
                  { value: "Social Media",  label: "Social Media" },
                  { value: "Other",         label: "Other"        },
                ]}
              />
              {errors.source && (
                <p className="text-rose-500 text-[10px] font-bold mt-1.5 ml-1">{errors.source}</p>
              )}
            </div>
          </div>

          {/* Priority */}
          <div>
            <SelectField
              label="Priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              options={[
                { value: "Critical", label: "Critical" },
                { value: "High",     label: "High"     },
                { value: "Medium",   label: "Medium"   },
                { value: "Low",      label: "Low"      },
              ]}
            />
            {errors.priority && (
              <p className="text-rose-500 text-[10px] font-bold mt-1.5 ml-1">{errors.priority}</p>
            )}
          </div>

          {/* Ticket Owner — ✅ എല്ലാ CRM users-ഉം */}
          <div>
            <SelectField
              label="Ticket Owner"
              name="ticketOwner"
              value={formData.ticketOwner}
              onChange={handleChange}
              options={[
                { value: "", label: "Select owner..." },
                ...availableOwners,
              ]}
            />
            {errors.ticketOwner && (
              <p className="text-rose-500 text-[10px] font-bold mt-1.5 ml-1">{errors.ticketOwner}</p>
            )}
          </div>

          {/* Associated Deal */}
          <div>
            <SelectField
              label="Associated Deal"
              name="associatedDeal"
              value={formData.associatedDeal}
              onChange={handleChange}
              options={dealOptions}
            />
          </div>

          {/* Buttons */}
          <div className="p-2 border-t border-slate-100 bg-white grid grid-cols-2 gap-3 sticky bottom-0 shrink-0">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
              className="py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="py-2.5 rounded-xl font-black text-[11px] bg-indigo-600 shadow-md shadow-indigo-100 uppercase tracking-wider text-white hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : (selectedTicket ? "Update" : "Save")}
            </Button>
          </div>

        </form>
      </div>
    </Modal>
  );
};

export default CreateTicketModal;