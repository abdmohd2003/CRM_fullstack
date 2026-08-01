import React, { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiX, FiCalendar, FiChevronDown, FiInfo } from "react-icons/fi";
import { toast } from "react-toastify";

import Modal from "../../components/ui/Modal";
import InputField from "../../components/forms/InputField";
import SelectField from "../../components/forms/SelectField";
import Button from "../../components/ui/Button";

import dealService from "../../services/dealService";
import axiosInstance from "../../api/axiosConfig";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../../contexts/AuthContexts";
import {
  addDeal,
  clearSelectedDeal,
  updateDeal,
} from "../../redux/slices/dealSlice";

// ─────────────────────────────────────────────
// CUSTOM MULTI-SELECT DROPDOWN COMPONENT
// ─────────────────────────────────────────────
const MultiSelectDropdown = ({
  label,
  placeholder = "Select...",
  options = [],
  selectedValues = [],
  onChange,
  disabled = false,
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
    if (disabled) return;
    if (selectedValues?.includes(value)) {
      onChange(selectedValues.filter((item) => item !== value));
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
      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
        {label}
      </label>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 flex justify-between items-center shadow-sm ${
          disabled
            ? "bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed opacity-70"
            : "cursor-pointer hover:border-slate-300"
        }`}
      >
        <span className="truncate">
          {(selectedValues?.length || 0) === 0 ? (
            <span className="text-slate-400">{placeholder}</span>
          ) : (
            getDisplayString()
          )}
        </span>
        <FiChevronDown
          className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </div>
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto py-1">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedValues?.includes(option.value)}
                onChange={() => handleToggle(option.value)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300"
              />
              <span className="text-xs font-medium text-slate-700">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN CREATE DEAL MODAL COMPONENT
// ─────────────────────────────────────────────
const CreateDealModal = ({ isOpen, onClose, prefillLead = null }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [crmUsers, setCrmUsers] = useState([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [showOrderInfo, setShowOrderInfo] = useState(false);

  const { user: authUser } = useAuth();

  const selectedDeal = useSelector((state) => state.deals.selectedDeal);

  const leadsFromRedux = useSelector((state) =>
    state.leads?.leads ||
    state.leads?.data ||
    state.leads?.list ||
    state.lead?.leads ||
    state.lead?.data ||
    []
  );
  const [localLeads, setLocalLeads] = useState([]);
  const [leadsLoaded, setLeadsLoaded] = useState(false);
  const leads = leadsFromRedux.length > 0 ? leadsFromRedux : localLeads;

  const getTodayDate = () => new Date().toISOString().split("T")[0];

  const INITIAL_STATE = {
    dealName: "",
    associatedLead: [],
    dealStage: "",
    amount: 0,
    dealOwner: [],
    closeDate: getTodayDate(),
    priority: "",
  };

  const [formData, setFormData] = useState(INITIAL_STATE);
  const [errors, setErrors] = useState({});

  // ─────────────────────────────────────────────
  // AUTO-CALCULATE AMOUNT from selected leads
  // ─────────────────────────────────────────────
  const calculatedAmount = useMemo(() => {
    if (!formData.associatedLead || formData.associatedLead.length === 0) return 0;
    return formData.associatedLead.reduce((sum, leadIdOrName) => {
      const matchedLead = leads.find((lead) => {
        if (lead._id && String(lead._id) === String(leadIdOrName)) return true;
        const fullLabel = `${lead.firstName || ""} ${lead.lastName || ""}`.trim();
        return fullLabel === leadIdOrName;
      });
      return sum + (matchedLead?.totalProductAmount || matchedLead?.amount || 0);
    }, 0);
  }, [formData.associatedLead, leads]);

  // ─────────────────────────────────────────────
  // AUTO-DERIVE OWNERS from selected leads
  // ─────────────────────────────────────────────
  const derivedOwnerIds = useMemo(() => {
    if (!formData.associatedLead || formData.associatedLead.length === 0) return [];

    const ownerIds = [];

    formData.associatedLead.forEach((leadIdOrName) => {
      const matchedLead = leads.find((lead) => {
        if (lead._id && String(lead._id) === String(leadIdOrName)) return true;
        const fullLabel = `${lead.firstName || ""} ${lead.lastName || ""}`.trim();
        return fullLabel === leadIdOrName;
      });

      if (matchedLead && Array.isArray(matchedLead.owner)) {
        matchedLead.owner.forEach((ownerName) => {
          const matchedUser = crmUsers.find((u) => {
            const fullName = u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim();
            return fullName === ownerName;
          });
          if (matchedUser && !ownerIds.includes(matchedUser._id)) {
            ownerIds.push(matchedUser._id);
          }
        });
      }
    });

    return ownerIds;
  }, [formData.associatedLead, leads, crmUsers]);

  // ─────────────────────────────────────────────
  // SYNC amount + dealOwner when leads change
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!selectedDeal) {
      setFormData((prev) => ({
        ...prev,
        amount: calculatedAmount,
        dealOwner: usersLoaded ? derivedOwnerIds : prev.dealOwner,
      }));
    } else {
      setFormData((prev) => ({ ...prev, amount: calculatedAmount }));
    }
  }, [calculatedAmount, derivedOwnerIds, selectedDeal, usersLoaded]);

  // ─────────────────────────────────────────────
  // POPULATE FORM
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    if (selectedDeal) {
      const rawOwners = selectedDeal.owner || selectedDeal.dealOwner || [];
      const parsedOwners = (Array.isArray(rawOwners) ? rawOwners : [rawOwners])
        .map((o) => (typeof o === "object" && o !== null ? o._id : o))
        .filter(Boolean);

      setFormData({
        dealName: selectedDeal.dealName || selectedDeal.name || "",
        dealStage: selectedDeal.dealStage || selectedDeal.stage || "",
        associatedLead: selectedDeal.associatedLead || [],
        amount: selectedDeal.amount || 0,
        dealOwner: parsedOwners,
        closeDate: selectedDeal.closeDate || "",
        priority: selectedDeal.priority || "",
      });
      return;
    }

    if (prefillLead) {
      if (!leadsLoaded) return;

      const matchedLead = leads.find(
        (l) => String(l._id) === String(prefillLead._id)
      );
      const leadFullName = `${prefillLead.firstName || ""} ${prefillLead.lastName || ""}`.trim();
      const leadIdentifier = matchedLead?._id || prefillLead._id || leadFullName;

      setFormData((prev) => ({
        ...INITIAL_STATE,
        dealName: leadFullName ? `${leadFullName} - Deal` : prev.dealName,
        associatedLead: leadIdentifier ? [leadIdentifier] : [],
      }));
      return;
    }

    setFormData({ ...INITIAL_STATE });
  }, [selectedDeal, prefillLead, isOpen, leadsLoaded]);

  // ─────────────────────────────────────────────
  // FETCH CRM USERS + LEADS
  // ─────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      setUsersLoaded(false);
      setLeadsLoaded(false);

      try {
        const usersRes = await axiosInstance.get("/users");
        setCrmUsers(
          Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.data || []
        );
      } catch (error) {
        console.error("Error loading CRM users:", error);
        setCrmUsers([]);
      } finally {
        setUsersLoaded(true);
      }

      if (leadsFromRedux.length > 0) {
        setLeadsLoaded(true);
        return;
      }

      try {
        const leadsRes = await axiosInstance.get("/leads");
        const fetchedLeads = Array.isArray(leadsRes.data)
          ? leadsRes.data
          : leadsRes.data?.data ||
            leadsRes.data?.leads ||
            leadsRes.data?.result ||
            leadsRes.data?.results ||
            [];
        setLocalLeads(fetchedLeads);
      } catch (error) {
        console.error("❌ Error loading leads:", error);
        setLocalLeads([]);
      } finally {
        setLeadsLoaded(true);
      }
    };

    if (isOpen) fetchData();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.dealName.trim()) newErrors.dealName = "Deal name is required";
    if (!formData.dealStage) newErrors.dealStage = "Select a deal stage";
    if (!formData.dealOwner || formData.dealOwner.length === 0)
      newErrors.dealOwner = "Select owner";
    if (!formData.closeDate) newErrors.closeDate = "Close date is required";
    if (!formData.priority) newErrors.priority = "Select priority";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClose = () => {
    dispatch(clearSelectedDeal());
    setFormData(INITIAL_STATE);
    setErrors({});
    setShowOrderInfo(false);
    onClose();
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the form errors");
      return;
    }

    setSubmitting(true);

    try {
      const sanitizedOwners = formData.dealOwner
        .flat()
        .map((ownerVal) => {
          if (!ownerVal) return null;
          const cleanVal = String(ownerVal).replace(/[\[\]'"]/g, "").trim();
          if (/^[0-9a-fA-F]{24}$/.test(cleanVal)) return cleanVal;
          const matchedUser = crmUsers.find((u) => {
            const fullName = u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim();
            return fullName === cleanVal;
          });
          return matchedUser ? matchedUser._id : null;
        })
        .filter(Boolean);

      // ✨ FIX: Extract products/line items from the selected leads ✨
      const dealProducts = (formData.associatedLead || []).reduce((acc, leadIdOrName) => {
        const matchedLead = leads.find((lead) => {
          if (lead._id && String(lead._id) === String(leadIdOrName)) return true;
          const fullLabel = `${lead.firstName || ""} ${lead.lastName || ""}`.trim();
          return fullLabel === leadIdOrName;
        });

        if (matchedLead) {
          // Grab products from the lead (checks for 'products' or 'lineItems' arrays)
          const items = matchedLead.products || matchedLead.lineItems || [];
          return [...acc, ...items];
        }
        return acc;
      }, []);

      const dealData = {
        name: formData.dealName.trim(),
        stage: formData.dealStage,
        associatedLead: formData.associatedLead,
        amount: Number(formData.amount),
        owner: sanitizedOwners,
        closeDate: formData.closeDate,
        priority: formData.priority,
        // ✨ Add the extracted products to the backend payload ✨
        products: dealProducts,
        lineItems: dealProducts, // Included as a fallback for the backend schema
      };

      let response;
      let isClosedWon = false;

      if (selectedDeal) {
        if (formData.dealStage === 'CLOSED_WON' && selectedDeal.stage !== 'CLOSED_WON') {
          response = await dealService.updateDealStage(selectedDeal._id, 'CLOSED_WON');
          isClosedWon = true;
        } else {
          response = await dealService.updateDeal(selectedDeal._id, dealData);
        }
        
        toast.success("Deal updated successfully");
        dispatch(updateDeal(response.data || response));
        
        const orderData = response.data?.order || response.data?.data?.order || response.order;
        if (isClosedWon && orderData) {
          toast.success(
            `🎉 Order ${orderData.orderNumber || 'created'} auto-created!`,
            {
              autoClose: 5000,
              onClick: () => navigate(`/orders/${orderData._id}`)
            }
          );
          navigate(`/orders/${orderData._id}`);
        } else if (isClosedWon && response.data?.orderId) {
          toast.success(`🎉 Order created!`);
          navigate('/orders');
        }
        
        onClose();
      } else {
        response = await dealService.createDeal(dealData);
        
        if (response) {
          toast.success("Deal created successfully");
          dispatch(addDeal(response.data || response));
          
          const orderData = response.data?.order || response.data?.data?.order || response.order;
          if (formData.dealStage === 'CLOSED_WON' && orderData) {
            toast.success(
              `🎉 Order ${orderData.orderNumber || 'created'} auto-created!`,
              {
                autoClose: 5000,
                onClick: () => navigate(`/orders/${orderData._id}`)
              }
            );
            navigate(`/orders/${orderData._id}`);
          } else if (formData.dealStage === 'CLOSED_WON' && response.data?.orderId) {
            toast.success(`🎉 Order created!`);
            navigate('/orders');
          }
          
          onClose();
        } else {
          toast.error("Failed to create deal: No response from server");
        }
      }
    } catch (error) {
      console.error("❌ Error saving deal:", error);
      toast.error(error.message || "Failed to save deal");
    } finally {
      setSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────
  // BUILD OPTIONS
  // ─────────────────────────────────────────────
  const leadOptions = leads.map((lead) => {
    const leadName =
      lead.name ||
      lead.leadName ||
      lead.fullName ||
      `${lead.firstName || ""} ${lead.lastName || ""}`.trim() ||
      lead.email ||
      "Unnamed Lead";
    return { value: lead._id || leadName, label: leadName };
  });

  const mappedUserOptions = crmUsers.map((u) => ({
    value: u._id,
    label: u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim(),
  }));

  // ─────────────────────────────────────────────
  // STAGE OPTIONS
  // ─────────────────────────────────────────────
  const stageOptions = [
    { value: "", label: "Select..." },
    { value: "LEAD", label: "LEAD" },
    { value: "QUALIFIED", label: "QUALIFIED" },
    { value: "PROPOSAL", label: "PROPOSAL" },
    { value: "NEGOTIATION", label: "NEGOTIATION" },
    { value: "CLOSED_WON", label: "🎉 CLOSED WON" },
    { value: "CLOSED_LOST", label: "❌ CLOSED LOST" },
  ];

  const isClosedWonSelected = formData.dealStage === 'CLOSED_WON';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} position="right">
      <div className="w-[380px] h-full bg-white flex flex-col font-sans">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">
            {selectedDeal ? "Edit Deal" : "Create Deal"}
          </h3>
          <Button
            type="button"
            variant="secondary"
            icon={FiX}
            onClick={handleClose}
            className="p-1.5 !rounded-full border-none hover:bg-slate-50 text-slate-400 transition-colors"
          />
        </div>

        <form
          onSubmit={handleSave}
          className="flex-1 overflow-y-auto px-6 py-6 space-y-5 custom-scrollbar"
        >
          {/* Deal Name */}
          <div>
            <InputField
              label="Deal Name"
              name="dealName"
              type="text"
              placeholder="Enter"
              value={formData.dealName}
              onChange={handleChange}
            />
            {errors.dealName && (
              <p className="text-rose-500 text-[10px] font-bold mt-1.5 ml-1">{errors.dealName}</p>
            )}
          </div>

          {/* Deal Stage */}
          <div>
            <SelectField
              label="Deal Stage"
              name="dealStage"
              value={formData.dealStage}
              onChange={handleChange}
              options={stageOptions}
            />
            {errors.dealStage && (
              <p className="text-rose-500 text-[10px] font-bold mt-1.5 ml-1">{errors.dealStage}</p>
            )}
            
            {isClosedWonSelected && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-xl flex items-start gap-2">
                <FiInfo className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-green-700">🎉 Order will be auto-created</p>
                  <p className="text-[10px] text-green-600">
                    Setting to CLOSED WON will automatically create a draft order.
                    Finance will review and confirm the order.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Associated Lead */}
          <MultiSelectDropdown
            label="Associated Lead"
            placeholder="Select leads..."
            options={leadOptions}
            selectedValues={formData.associatedLead || []}
            onChange={(newValues) =>
              setFormData((prev) => ({ ...prev, associatedLead: newValues }))
            }
          />

          {/* Amount */}
          <div>
            <InputField
              label="Amount"
              name="amount"
              type="text"
              readOnly
              disabled
              placeholder="Calculated deal amount"
              value={`$${Number(formData.amount || 0).toLocaleString()}`}
              className="bg-slate-50 border-slate-200 text-slate-500 font-bold cursor-not-allowed"
            />
          </div>

          {/* Deal Owner */}
          <div>
            <MultiSelectDropdown
              label="Deal Owner"
              placeholder="Select owners..."
              options={mappedUserOptions}
              selectedValues={formData.dealOwner}
              onChange={(newValues) => {
                setFormData((prev) => ({ ...prev, dealOwner: newValues }));
                if (errors.dealOwner)
                  setErrors((prev) => ({ ...prev, dealOwner: "" }));
              }}
            />
            {errors.dealOwner && (
              <p className="text-rose-500 text-[10px] font-bold mt-1.5 ml-1">{errors.dealOwner}</p>
            )}
          </div>

          {/* Date + Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <InputField
                label="Close Date"
                name="closeDate"
                type="date"
                placeholder="mm/dd/yyyy"
                icon={FiCalendar}
                value={formData.closeDate}
                onChange={handleChange}
              />
              {errors.closeDate && (
                <p className="text-rose-500 text-[10px] font-bold mt-1.5 ml-1">{errors.closeDate}</p>
              )}
            </div>
            <div>
              <SelectField
                label="Priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                options={[
                  { value: "", label: "Select..." },
                  { value: "High", label: "High" },
                  { value: "Medium", label: "Medium" },
                  { value: "Low", label: "Low" },
                ]}
              />
              {errors.priority && (
                <p className="text-rose-500 text-[10px] font-bold mt-1.5 ml-1">{errors.priority}</p>
              )}
            </div>
          </div>

          {/* Order Info Banner */}
          {selectedDeal && selectedDeal.orderId && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
              <div className="flex items-start gap-2">
                <FiInfo className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-indigo-700">Order Associated</p>
                  <p className="text-[10px] text-indigo-600">
                    This deal has an order. View it in the Orders section.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="border-t border-slate-100 bg-white grid grid-cols-2 gap-3 shrink-0 pt-6 mt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={submitting}
              className="w-full py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              className={`w-full py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider text-white transition-all disabled:opacity-50 ${
                isClosedWonSelected 
                  ? 'bg-green-600 shadow-md shadow-green-100 hover:bg-green-700' 
                  : 'bg-indigo-600 shadow-md shadow-indigo-100 hover:bg-indigo-700'
              }`}
            >
              {submitting ? "Saving..." : selectedDeal ? "Update" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CreateDealModal;