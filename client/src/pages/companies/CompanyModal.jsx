import React, { useState, useEffect, useRef } from "react";
import { FiX, FiCheck, FiChevronDown } from "react-icons/fi";
import { toast } from "react-toastify";

import Modal from "../../components/ui/Modal";
import InputField from "../../components/forms/InputField";
import Button from "../../components/ui/Button";
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from "../../contexts/AuthContexts";

import {
  addCompany,
  updateCompany,
  clearSelectedCompany,
} from "../../redux/slices/companySlice";

import companyService from "../../services/companyService";

// ✅ Updated BASIC_FIELDS
const BASIC_FIELDS = [
  { name: "domainName", label: "Domain Name", required: true },
  { name: "companyName", label: "Company Name", required: true },
  { name: "website", label: "Website" },
  { name: "email", label: "Email" },
];

const INITIAL_STATE = {
  domainName: "",
  companyName: "",
  website: "",
  industry: "",
  type: "",
  email: "",
  phoneNumber: "",
  city: "",
  country: "",
  address: "",
  employees: "",
  revenue: "",
};

// ----------------------------------------------------------------------
// Custom Multi-Select Component
// ----------------------------------------------------------------------
const MultiSelectDropdown = ({
  label,
  options,
  selectedValues,
  onChange,
  required,
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

  const toggleOption = (value) => {
    const currentIndex = selectedValues.indexOf(value);
    const newSelected = [...selectedValues];

    if (currentIndex === -1) {
      newSelected.push(value);
    } else {
      newSelected.splice(currentIndex, 1);
    }
    onChange(newSelected);
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return "Choose";
    return selectedValues
      .map((val) => options.find((opt) => opt.value === val)?.label)
      .filter(Boolean)
      .join(", ");
  };

  return (
    <div className="relative space-y-1.5" ref={dropdownRef}>
      <label className="text-[12px] font-semibold text-slate-700 flex items-center gap-1">
        {label}
        {required && <span className="text-rose-500 font-bold">*</span>}
      </label>

      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full h-11 px-4 bg-white border rounded-lg cursor-pointer transition-colors ${
          error
            ? "border-rose-500 ring-2 ring-rose-100"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <span
          className={`text-xs truncate pr-2 ${
            selectedValues.length === 0 ? "text-slate-500" : "text-slate-800 font-medium"
          }`}
        >
          {getDisplayText()}
        </span>
        <FiChevronDown
          size={14}
          className={`text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      {error && (
        <p className="text-rose-500 text-[10px] font-bold mt-1 ml-1">{error}</p>
      )}

      {isOpen && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-100 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          <div className="p-1">
            {options.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              return (
                <div
                  key={option.value}
                  onClick={() => toggleOption(option.value)}
                  className={`flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{option.label}</span>
                  {isSelected && <FiCheck size={14} className="text-indigo-600" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------
const CreateCompanyModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const [submitting, setSubmitting] = useState(false);

  // Get authenticated user
  const { user: authUser } = useAuth();

const selectedCompany = useSelector((state) => state.company?.selectedCompany);
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (selectedCompany) {
      setFormData({
        domainName: selectedCompany.domainName || "",
        companyName: selectedCompany.companyName || "",
        website: selectedCompany.website || "",
        industry: selectedCompany.industry || "",
        type: selectedCompany.type || "",
        email: selectedCompany.email || "",
        phoneNumber: selectedCompany.phoneNumber || "",
        city: selectedCompany.city || "",
        country: selectedCompany.country || "",
        address: selectedCompany.address || "",
        employees: selectedCompany.noOfEmployees || "",
        revenue: selectedCompany.annualRevenue || "",
      });
    } else {
      setFormData(INITIAL_STATE);
    }
  }, [selectedCompany]);

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

    if (!formData.domainName.trim()) {
      newErrors.domainName = "Domain name is required";
    }

    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    }

    if (!formData.industry) {
      newErrors.industry = "Industry is required";
    }

    if (!formData.type) {
      newErrors.type = "Company type is required";
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClose = () => {
    dispatch(clearSelectedCompany());
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

    if (!authUser?._id) {
      toast.error("You must be logged in to create a company");
      return;
    }

    setSubmitting(true);

    let domainName = formData.domainName.trim();
    if (!domainName && formData.website) {
      domainName = formData.website
        .replace(/^https?:\/\//, '')
        .replace(/\/.*$/, '')
        .replace(/^www\./, '');
    }
    if (!domainName) {
      domainName = `${formData.companyName.toLowerCase().replace(/\s+/g, '')}.com`;
    }

    const companyData = {
      domainName: domainName,
      companyName: formData.companyName.trim(),
      website: formData.website || null,
      industry: formData.industry,
      type: formData.type,
      email: formData.email || null,
      phoneNumber: formData.phoneNumber.trim(),
      city: formData.city || null,
      countryRegion: formData.country || null,
      address: formData.address || null,
      companyOwner: authUser._id,
      noOfEmployees: formData.employees || null,
      annualRevenue: formData.revenue ? parseFloat(formData.revenue) : null,
    };


    try {
      let response;
      if (selectedCompany) {
        response = await companyService.updateCompany(selectedCompany._id, companyData);
        if (response.success) {
          toast.success("Company updated successfully");
          dispatch(updateCompany(response.data));
        }
      } else {
        response = await companyService.createCompany(companyData);
        if (response.success) {
          toast.success("Company created successfully");
          dispatch(addCompany(response.data));
        }
      }
      handleClose();
    } catch (error) {
      console.error('❌ Error:', error);
      toast.error(error.message || "Failed to save company");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} position="right">
      <div className="h-full bg-white flex flex-col font-sans">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10 shrink-0">
          <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">
            {selectedCompany ? "Update Company" : "Create Company"}
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Form - Fixed horizontal scroll */}
        <form 
          onSubmit={handleSave} 
          className="flex-1 overflow-y-auto p-6 custom-scrollbar"
          style={{ overflowX: 'hidden' }} // ✅ Force hide horizontal scroll
        >
          <div className="space-y-5 max-w-full">
            {/* Basic Fields */}
            <div className="space-y-4">
              {BASIC_FIELDS.map((field) => (
                <div key={field.name}>
                  <InputField
                    name={field.name}
                    label={field.label}
                    placeholder={`Enter ${field.label}`}
                    value={formData[field.name]}
                    onChange={handleChange}
                    required={field.required}
                  />
                  {errors[field.name] && (
                    <p className="text-rose-500 text-[10px] font-bold mt-1.5 ml-1">
                      {errors[field.name]}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Industry & Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 tracking-wide">
                  Industry
                  <span className="text-rose-500 ml-1">*</span>
                </label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  className={`w-full h-11 px-4 border rounded-xl text-xs font-medium outline-none ${
                    formData.industry ? "text-black" : "text-gray-400"
                  } ${
                    errors.industry
                      ? "border-rose-500 ring-2 ring-rose-100"
                      : "border-slate-200 focus:border-indigo-500"
                  }`}
                >
                  <option value="" className="text-gray-400">Select Industry</option>
                  <option value="Technology" className="text-black">Technology</option>
                  <option value="Real Estate" className="text-black">Real Estate</option>
                  <option value="Legal Services" className="text-black">Legal Services</option>
                  <option value="Healthcare" className="text-black">Healthcare</option>
                  <option value="Finance" className="text-black">Finance</option>
                  <option value="Retail" className="text-black">Retail</option>
                  <option value="Manufacturing" className="text-black">Manufacturing</option>
                  <option value="Education" className="text-black">Education</option>
                  <option value="Consulting" className="text-black">Consulting</option>
                  <option value="Other" className="text-black">Other</option>
                </select>
                {errors.industry && (
                  <p className="text-rose-500 text-[10px] font-bold mt-1.5 ml-1">
                    {errors.industry}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 tracking-wide">
                  Type
                  <span className="text-rose-500 ml-1">*</span>
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className={`w-full h-11 px-4 border rounded-xl text-xs font-medium outline-none ${
                    formData.type ? "text-black" : "text-gray-400"
                  } ${
                    errors.type
                      ? "border-rose-500 ring-2 ring-rose-100"
                      : "border-slate-200 focus:border-indigo-500"
                  }`}
                >
                  <option value="" className="text-gray-400">Select Type</option>
                  <option value="Corporation" className="text-black">Corporation</option>
                  <option value="Partnership" className="text-black">Partnership</option>
                  <option value="LLC" className="text-black">LLC</option>
                  <option value="Private Limited" className="text-black">Private Limited</option>
                  <option value="Public Limited" className="text-black">Public Limited</option>
                  <option value="Sole Proprietorship" className="text-black">Sole Proprietorship</option>
                  <option value="Non-Profit" className="text-black">Non-Profit</option>
                  <option value="Government" className="text-black">Government</option>
                </select>
                {errors.type && (
                  <p className="text-rose-500 text-[10px] font-bold mt-1.5 ml-1">
                    {errors.type}
                  </p>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-4">
              <InputField
                name="city"
                label="City"
                placeholder="Enter city"
                value={formData.city}
                onChange={handleChange}
              />
              <InputField
                name="country"
                label="Country/Region"
                placeholder="Enter country"
                value={formData.country}
                onChange={handleChange}
              />
            </div>

            {/* Company Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 tracking-wide">
                  No of Employees
                </label>
                <select
                  name="employees"
                  value={formData.employees}
                  onChange={handleChange}
                  className={`w-full h-11 px-4 border rounded-xl text-xs font-medium outline-none ${
                    formData.employees ? "text-black" : "text-gray-400"
                  } ${
                    errors.employees
                      ? "border-rose-500 ring-2 ring-rose-100"
                      : "border-slate-200 focus:border-indigo-500"
                  }`}
                >
                  <option value="" className="text-gray-400">Select range</option>
                  <option value="1-10" className="text-black">1-10</option>
                  <option value="11-50" className="text-black">11-50</option>
                  <option value="51-200" className="text-black">51-200</option>
                  <option value="201-500" className="text-black">201-500</option>
                  <option value="501-1000" className="text-black">501-1000</option>
                  <option value="1000+" className="text-black">1000+</option>
                </select>
                {errors.employees && (
                  <p className="text-rose-500 text-[10px] font-bold mt-1.5 ml-1">
                    {errors.employees}
                  </p>
                )}
              </div>

              <InputField
                name="revenue"
                label="Annual Revenue"
                type="number"
                placeholder="Enter annual revenue"
                value={formData.revenue}
                onChange={handleChange}
              />
            </div>

            {/* Address */}
            <div>
              <InputField
                name="address"
                label="Address"
                placeholder="Enter address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                Phone Number
                <span className="text-rose-500 ml-1">*</span>
              </label>
              <input
                name="phoneNumber"
                type="tel"
                placeholder="Enter phone number"
                className={`w-full h-11 px-4 border rounded-xl text-xs font-medium outline-none ${
                  errors.phoneNumber
                    ? "border-rose-500 ring-2 ring-rose-100"
                    : "border-slate-200 focus:border-indigo-500"
                }`}
                value={formData.phoneNumber}
                onChange={(e) => {
                  if (errors.phoneNumber) {
                    setErrors((prev) => ({
                      ...prev,
                      phoneNumber: "",
                    }));
                  }
                  handleChange({
                    target: {
                      name: "phoneNumber",
                      value: e.target.value.replace(/\D/g, ""),
                    },
                  });
                }}
              />
              {errors.phoneNumber && (
                <p className="text-rose-500 text-[10px] font-bold mt-1.5 ml-1">
                  {errors.phoneNumber}
                </p>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="border-t border-slate-100 bg-white grid grid-cols-2 gap-3 shrink-0 pt-6 mt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={submitting}
                className="py-2.5 rounded-xl font-black text-[11px] uppercase tracking-wider text-slate-600 border border-slate-200 hover:bg-slate-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
                className="py-2.5 rounded-xl font-black text-[11px] bg-indigo-600 shadow-md shadow-indigo-100 uppercase tracking-wider text-white hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                {submitting ? "Saving..." : selectedCompany ? "Update" : "Save"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CreateCompanyModal;