import React, { useEffect, useState, useRef, useMemo } from "react";
import { FiX, FiMail, FiChevronDown, FiDollarSign } from "react-icons/fi";
import { toast } from "react-toastify";

import Modal from "../../components/ui/Modal";
import InputField from "../../components/forms/InputField";
import SelectField from "../../components/forms/SelectField";
import Button from "../../components/ui/Button";

import { useDispatch, useSelector } from "react-redux";
import {
  addLead,
  updateLead,
  clearSelectedLead,
} from "../../redux/slices/leadSlice";

import leadService from "../../services/leadService";
import axiosInstance from "../../api/axiosConfig";

// ─────────────────────────────────────────────
// IMPROVED MULTI-SELECT DROPDOWN COMPONENT
// ─────────────────────────────────────────────
const MultiSelectDropdown = ({ 
  label, 
  placeholder = "Select...", 
  options, 
  selectedValues, 
  onChange,
  error,
  showTotal = false,
  totalAmount = 0
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
    if (selectedValues.length === 0) return "";
    const labels = selectedValues.map((val) => {
      const match = options.find((opt) => opt.value === val);
      return match ? match.label : val;
    });
    return labels.join(", ");
  };

  return (
    <div className="relative space-y-1.5" ref={dropdownRef}>
      <label className="text-[11px] font-semibold text-slate-700 capitalize tracking-wide">
        {label}
      </label>
      
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2.5 bg-white border rounded-xl text-xs font-medium text-slate-800 cursor-pointer flex justify-between items-center shadow-sm transition-all hover:border-slate-300 ${
          error ? "border-rose-500 ring-2 ring-rose-100" : "border-slate-200"
        }`}
      >
        <span className="truncate">
          {selectedValues.length === 0 ? (
            <span className="text-slate-400">{placeholder}</span>
          ) : (
            getDisplayString()
          )}
        </span>
        <FiChevronDown className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto py-1">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex items-center justify-between px-4 py-2 hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={() => handleToggle(option.value)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-700">{option.label}</span>
              </div>
              <span className="text-xs font-semibold text-slate-500">{option.price}</span>
            </label>
          ))}
        </div>
      )}


      {error && (
        <p className="text-rose-500 text-[10px] font-bold mt-1.5 ml-1">{error}</p>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN CREATE LEADS MODAL COMPONENT
// ─────────────────────────────────────────────
const CreateLeadsModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const selectedLead = useSelector((state) => state.leads.selectedLead);

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    city: "",
    jobTitle: "",
    contactOwner: [],
    leadStatus: "",
    products: [],
    company: "",
  });

  const [errors, setErrors] = useState({});
  const [dbProducts, setDbProducts] = useState([]);
  const [crmUsers, setCrmUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Fetch Setup Data
  useEffect(() => {
    const fetchSetupData = async () => {
      try {
        const usersRes = await axiosInstance.get("/users");
        setCrmUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.data || []);

        const productsRes = await axiosInstance.get("/products");
        setDbProducts(Array.isArray(productsRes.data) ? productsRes.data : productsRes.data?.data || []);

        const companiesRes = await axiosInstance.get("/companies");
        let companiesData = [];
        if (Array.isArray(companiesRes.data)) {
          companiesData = companiesRes.data;
        } else if (companiesRes.data?.data?.companies) {
          companiesData = companiesRes.data.data.companies;
        } else if (companiesRes.data?.data) {
          companiesData = Array.isArray(companiesRes.data.data) ? companiesRes.data.data : [];
        } else if (companiesRes.data?.companies) {
          companiesData = companiesRes.data.companies;
        }
        
        setCompanies(companiesData);
        
      } catch (error) {
        console.error("Error loading setup data:", error);
        setCompanies([]);
        setDbProducts([]);
        setCrmUsers([]);
      }
    };

    if (isOpen) {
      fetchSetupData();
    }
  }, [isOpen]);

  // Hydrate form when selectedLead changes
  useEffect(() => {
    if (selectedLead) {
      const existingProductIds = selectedLead.products
        ? selectedLead.products.map((p) => (typeof p === "object" ? p._id || p.id : p))
        : [];

      setFormData({
        email: selectedLead.email || "",
        firstName: selectedLead.firstName || "",
        lastName: selectedLead.lastName || "",
        phoneNumber: selectedLead.phone || "",
        city: selectedLead.city || "",
        jobTitle: selectedLead.jobTitle || "",
        contactOwner: selectedLead.owner
          ? Array.isArray(selectedLead.owner)
            ? selectedLead.owner
            : [selectedLead.owner]
          : [],
        leadStatus: selectedLead.status || "",
        products: existingProductIds,
        company: typeof selectedLead.company === "object" ? selectedLead.company?._id || "" : selectedLead.company || "",
      });
    } else {
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        phoneNumber: "",
        city: "",
        jobTitle: "",
        contactOwner: [],
        leadStatus: "",
        products: [],
        company: "",
      });
    }
  }, [selectedLead, isOpen]);

  // ─── DYNAMICALLY COMPUTE TOTAL PRODUCT AMOUNT ───
  const totalProductAmount = useMemo(() => {
    if (!formData.products || formData.products.length === 0) return 0;
    
    return formData.products.reduce((sum, productId) => {
      const matchedProduct = dbProducts.find((p) => (p._id || p.id) === productId);
      return sum + (matchedProduct?.amount || 0);
    }, 0);
  }, [formData.products, dbProducts]);

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
    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "Phone number is required";
    if (!formData.leadStatus) newErrors.leadStatus = "Select a lead status";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClose = () => {
    dispatch(clearSelectedLead());
    setFormData({
      email: "",
      firstName: "",
      lastName: "",
      phoneNumber: "",
      city: "",
      jobTitle: "",
      contactOwner: [],
      leadStatus: "",
      products: [],
      company: "",
    });
    setErrors({});
    onClose();
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the form errors");
      return;
    }

    try {
      setSubmitting(true);

      const backendPayload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phoneNumber.trim(),
        jobTitle: formData.jobTitle.trim(),
        city: formData.city.trim(),
        status: formData.leadStatus,
        owner: formData.contactOwner,
        products: formData.products,
        company: formData.company || undefined,
        totalProductAmount: totalProductAmount,
      };

      let savedLead;

      if (selectedLead) {
        savedLead = await leadService.updateLead(selectedLead._id || selectedLead.id, backendPayload);
        dispatch(updateLead(savedLead));
        toast.success("Lead updated successfully!");
      } else {
        savedLead = await leadService.createLead(backendPayload);
        dispatch(addLead(savedLead));
        toast.success("Lead created successfully!");
      }

      handleClose();
      
    } catch (err) {
      console.error("Backend execution error:", err);
      const errorMessage = err.response?.data?.message || err.message || "An unexpected error occurred saving lead.";
      setErrors((prev) => ({
        ...prev,
        submit: errorMessage,
      }));
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Turn runtime backend responses into structured option sets with prices
  const mappedProductOptions = dbProducts.map((p) => ({
    value: p._id || p.id,
    label: p.name,
    price: `$${p.amount || 0}`,
  }));

  const mappedUserOptions = crmUsers.map((u) => ({
    value: u.name || `${u.firstName} ${u.lastName}`,
    label: u.name || `${u.firstName} ${u.lastName}`,
  }));

  const mappedCompanyOptions = [
    { value: "", label: "Select Company..." },
    ...(Array.isArray(companies) ? companies.map((c) => ({
      value: c._id || c.id,
      label: c.companyName || c.name || 'Unnamed Company',
    })) : []),
  ];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} position="right">
      <div className="bg-white h-full w-full max-w-md flex flex-col font-sans">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h2 className="text-sm font-black text-slate-800 tracking-wide">
            {selectedLead ? "Edit Lead" : "Create Lead"}
          </h2>
          <Button
            variant="secondary"
            icon={FiX}
            onClick={handleClose}
            className="p-1.5 !rounded-full border-none hover:bg-slate-50 text-slate-400"
          />
        </div>

        {/* Form Container */}
        <form onSubmit={handleSave} className="flex-1 px-6 py-6 overflow-y-auto space-y-5 custom-scrollbar">
          {errors.submit && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold rounded-xl">
              {errors.submit}
            </div>
          )}

          {/* Email */}
          <div>
            <InputField
              label="Email"
              name="email"
              icon={FiMail}
              placeholder="Enter"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && (
              <p className="text-rose-500 text-[10px] font-bold mt-1.5 ml-1">{errors.email}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <InputField
                label="First Name"
                name="firstName"
                placeholder="Enter"
                value={formData.firstName}
                onChange={handleChange}
              />
              {errors.firstName && (
                <p className="text-rose-500 text-[10px] font-bold mt-1.5 ml-1">{errors.firstName}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <InputField
                label="Last Name"
                name="lastName"
                placeholder="Enter"
                value={formData.lastName}
                onChange={handleChange}
              />
              {errors.lastName && (
                <p className="text-rose-500 text-[10px] font-bold mt-1.5 ml-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-700">
              Phone Number<span className="text-rose-500 ml-1">*</span>
            </label>
            <div className="flex gap-2">
              <div className={`flex items-center gap-1.5 px-3 bg-slate-50 border rounded-xl transition-all ${errors.phoneNumber ? "border-rose-500 ring-2 ring-rose-100" : "border-slate-200"}`}>
                <img src="https://flagcdn.com/w20/in.png" width="16" alt="India" className="rounded-sm" />
                <span className="text-[9px] font-bold text-slate-400">▼</span>
              </div>
              <input
                type="text"
                name="phoneNumber"
                placeholder="Enter"
                value={formData.phoneNumber}
                onChange={(e) => {
                  handleChange(e);
                  if (errors.phoneNumber) setErrors((prev) => ({ ...prev, phoneNumber: "" }));
                }}
                className={`flex-1 px-4 py-2.5 bg-white border rounded-xl text-xs font-medium text-slate-800 outline-none transition-all shadow-sm placeholder-slate-400 ${errors.phoneNumber ? "border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-100" : "border-slate-200 focus:border-indigo-500"}`}
              />
            </div>
            {errors.phoneNumber && (
              <p className="text-rose-500 text-[10px] font-bold mt-1.5 ml-1">{errors.phoneNumber}</p>
            )}
          </div>

          <InputField
            label="Job Title"
            name="jobTitle"
            placeholder="Enter"
            value={formData.jobTitle}
            onChange={handleChange}
          />

          {/* Contact Owner */}
          <MultiSelectDropdown
            label="Contact Owner"
            placeholder={crmUsers.length === 0 ? "Loading users..." : "Select owners..."}
            options={mappedUserOptions}
            selectedValues={formData.contactOwner}
            onChange={(newValues) => setFormData((prev) => ({ ...prev, contactOwner: newValues }))}
          />

          {/* Lead Status */}
          <div>
            <SelectField
              label="Lead Status"
              name="leadStatus"
              value={formData.leadStatus}
              onChange={handleChange}
              options={[
                { value: "", label: "Select..." },
                { value: "New", label: "New" },
                { value: "Contacted", label: "Contacted" },
                { value: "Qualified", label: "Qualified" },
                { value: "Unqualified", label: "Unqualified" },
              ]}
            />
            {errors.leadStatus && (
              <p className="text-rose-500 text-[10px] font-bold mt-1.5 ml-1">{errors.leadStatus}</p>
            )}
          </div>

          {/* Products with Total Amount Display */}
          <MultiSelectDropdown
            label="Products"
            placeholder={dbProducts.length === 0 ? "Loading products..." : "Select products..."}
            options={mappedProductOptions}
            selectedValues={formData.products}
            onChange={(newValues) => setFormData((prev) => ({ ...prev, products: newValues }))}
            showTotal={true}
            totalAmount={totalProductAmount}
          />

          {/* Company Selection */}
          <SelectField
            label="Company"
            name="company"
            value={formData.company}
            onChange={handleChange}
            options={mappedCompanyOptions}
          />

          <InputField
            label="City"
            name="city"
            placeholder="e.g. San Francisco"
            value={formData.city}
            onChange={handleChange}
          />

          {/* Footer Action Bar */}
          <div className="border-t border-slate-100 bg-white grid grid-cols-2 gap-3 shrink-0 pt-4">
            <Button
              type="button"
              variant="secondary"
              disabled={submitting}
              onClick={handleClose}
              className="py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              className="py-2.5 rounded-xl font-black text-[11px] bg-indigo-600 shadow-lg shadow-indigo-100 uppercase tracking-wider transition-all hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? "Saving..." : selectedLead ? "Update" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CreateLeadsModal;