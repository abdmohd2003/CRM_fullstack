import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import {
  FiSearch,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiTrash2,
  FiAlertTriangle,
  FiBriefcase,
  FiLoader,
} from "react-icons/fi";

import { useDispatch } from "react-redux";

import TableRowActions from "../../components/tables/TableRowActions";
import CreateCompanyModal from "../../pages/companies/CompanyModal";
import Button from "../../components/ui/Button";

import {
  setSelectedCompany,
  companyStart,
  companySuccess,
  companyFailure,
  deleteCompany,
} from "../../redux/slices/companySlice";

import companyService from "../../services/companyService";

// ─────────────────────────────────────────────
// DELETE CONFIRMATION MODAL
// ─────────────────────────────────────────────
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, companyName, isDeleting }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-[440px] shadow-2xl">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
            <FiTrash2 className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Delete Company</h3>
        <p className="text-slate-500 text-center mb-6">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-slate-700">{companyName}</span>?<br />
          <span className="text-xs text-slate-400">This action cannot be undone.</span>
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 flex items-start gap-2">
          <FiAlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-700">Warning</p>
            <p className="text-xs text-amber-600">
              Deleting this company will permanently remove all associated data including
              leads, deals, tickets, and activity history.
            </p>
          </div>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <FiBriefcase className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{companyName}</p>
            <p className="text-xs text-slate-400">Company record</p>
          </div>
        </div>
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
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-colors shadow-lg shadow-red-100 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting ? <><FiLoader className="w-4 h-4 animate-spin" /> Deleting...</> : "Delete Company"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
const CompaniesList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [companiesList, setCompaniesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const fetchCompanies = async () => {
    setLoading(true);
    dispatch(companyStart());
    try {
      const response = await companyService.getCompanies();
      if (response.success) {
        setCompaniesList(response.data.companies || []);
        dispatch(companySuccess());
      }
    } catch (error) {
      dispatch(companyFailure(error.message));
      toast.error(error.message || "Failed to fetch companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedIndustry, selectedCity, selectedCountry, selectedDate]);


  const filteredCompanies = useMemo(() => {
    return companiesList.filter((company) => {
      const matchesSearch =
        company.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.phoneNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        company.city?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesIndustry = !selectedIndustry || company.industry === selectedIndustry;
      const matchesCity = !selectedCity || company.city === selectedCity;
      const matchesCountry =
        !selectedCountry ||
        company.countryRegion === selectedCountry ||
        company.country === selectedCountry;

      let matchesDate = true;
      if (selectedDate) {
        const companyDate = new Date(company.createdAt);
        const selected = new Date(selectedDate + "T00:00:00");
        matchesDate =
          !isNaN(companyDate) &&
          companyDate.getFullYear() === selected.getFullYear() &&
          companyDate.getMonth() === selected.getMonth() &&
          companyDate.getDate() === selected.getDate();
      }

      return matchesSearch && matchesIndustry && matchesCity && matchesCountry && matchesDate;
    });
  }, [companiesList, searchQuery, selectedIndustry, selectedCity, selectedCountry, selectedDate]);

  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);

  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCompanies.slice(start, start + itemsPerPage);
  }, [filteredCompanies, currentPage]);

  const handleDeleteClick = (company) => {
    setCompanyToDelete(company);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!companyToDelete) return;
    setDeletingId(companyToDelete._id);
    try {
      const response = await companyService.deleteCompany(companyToDelete._id);
      if (response.success) {
        toast.success(`Company "${companyToDelete.companyName}" deleted successfully`);
        dispatch(deleteCompany(companyToDelete._id));
        setIsDeleteModalOpen(false);
        setCompanyToDelete(null);
        fetchCompanies();
      }
    } catch (error) {
      dispatch(companyFailure(error.message));
      toast.error(error.message || "Failed to delete company");
    } finally {
      setDeletingId(null);
    }
  };

  const columns = [
    "", "Company Name", "Company Owner", "Phone Number",
    "Industry", "City", "Country/Region", "Created Date", "Actions",
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-slate-500 mt-4">Loading companies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white p-5 pb-1 rounded-2xl space-y-3">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Companies</h2>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="md"
            className="border border-indigo-200 text-indigo-600 bg-white px-6 py-2 rounded-xl font-bold text-xs hover:bg-indigo-50/50 transition-all"
          >
            Import
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => { dispatch(setSelectedCompany(null)); setIsModalOpen(true); }}
            className="bg-[#6366F1] px-6 py-2 rounded-xl font-bold text-xs shadow-md shadow-indigo-100 hover:opacity-90 transition-all text-white"
          >
            Create
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by name, phone, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50/60 border border-gray-100 rounded-xl text-xs outline-none focus:bg-white focus:border-indigo-400 transition-all"
            />
          </div>

       
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap gap-3">
          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[11px] font-bold text-gray-500 outline-none min-w-[140px] cursor-pointer hover:border-gray-300"
          >
            <option value="">All Industries</option>
            <option value="Technology">Technology</option>
            <option value="Real Estate">Real Estate</option>
            <option value="Legal Services">Legal Services</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Finance">Finance</option>
            <option value="Retail">Retail</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Education">Education</option>
            <option value="Consulting">Consulting</option>
            <option value="Other">Other</option>
          </select>

              <select
  value={selectedCity}
  onChange={(e) => setSelectedCity(e.target.value)}
  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[11px] font-bold text-gray-500 outline-none min-w-[130px] cursor-pointer hover:border-gray-300"
>
  <option value="">All Cities</option>
  <option value="Kochi">Kochi</option>
  <option value="Delhi">Delhi</option>
  <option value="Bengaluru">Bengaluru</option>
  <option value="Kannur">Kannur</option>
  <option value="Trivandrum">Trivandrum</option>
</select>

         <select
  value={selectedCountry}
  onChange={(e) => setSelectedCountry(e.target.value)}
  className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[11px] font-bold text-gray-500 outline-none min-w-[130px] cursor-pointer hover:border-gray-300"
>
  <option value="">All Countries</option>
  <option value="Qatar">Qatar</option>
  <option value="UAE">UAE</option>
  <option value="India">India</option>
  <option value="USA">USA</option>
  <option value="Canada">Canada</option>
</select>

          <div
            className="flex items-center justify-between gap-6 px-4 py-2 bg-white border border-gray-200 rounded-xl cursor-pointer relative min-w-[140px]"
            onClick={() => document.getElementById("companyDateInput").showPicker()}
          >
            <span className="text-[11px] font-bold text-gray-500 whitespace-nowrap">
              {selectedDate
                ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "Created Date"}
            </span>
            <FiCalendar className="text-gray-500 shrink-0" size={14} />
            <input
              id="companyDateInput"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="absolute inset-0 opacity-0 w-full cursor-pointer"
            />
          </div>

          {selectedDate && (
            <button
              onClick={() => setSelectedDate("")}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[11px] font-bold text-gray-400 hover:text-red-400 hover:border-red-200 transition-all"
            >
              Clear Date
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="bg-[#6366F1] text-white">
              <tr>
                {columns.map((col, i) => (
                  <th key={i} className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.15em]">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/70 bg-white">
              {paginatedCompanies.length > 0 ? (
                paginatedCompanies.map((row) => (
                  <tr key={row._id} className="hover:bg-slate-50/40 transition-all group">
                    <td className="px-6 py-4 w-12">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                    </td>
                    <td className="px-6 py-4 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => { dispatch(setSelectedCompany(row)); navigate(`/companies/${row._id}`); }}
                        className="text-slate-700 hover:text-indigo-600 font-bold transition-colors text-left outline-none cursor-pointer"
                      >
                        {row.companyName}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
                      {row.companyOwner?.firstName || ""} {row.companyOwner?.lastName || ""}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">{row.phoneNumber}</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">{row.industry || "-"}</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">{row.city || "-"}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600">
                        {row.countryRegion || row.country || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {row.createdAt
                        ? new Date(row.createdAt).toLocaleString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric"
                          })
                        : "-"}
                    </td>
                    <td className="px-6 py-4 w-24">
                      <TableRowActions
                        onEdit={() => { dispatch(setSelectedCompany(row)); setIsModalOpen(true); }}
                        onDelete={() => handleDeleteClick(row)}
                        isDeleting={deletingId === row._id}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="text-center py-10 text-sm text-gray-400">
                    No companies found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-around px-6 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 font-medium">
              Showing {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filteredCompanies.length)} of {filteredCompanies.length} companies
            </p>
            <div className="flex items-center gap-4 text-gray-400 text-xs font-bold">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1.5 hover:text-slate-700 transition-all disabled:opacity-30"
              >
                <FiChevronLeft /> Previous
              </button>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <span
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer text-xs font-bold transition-all
                      ${currentPage === page ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
                  >
                    {page}
                  </span>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 transition-all disabled:opacity-30"
              >
                Next <FiChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      <CreateCompanyModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); fetchCompanies(); }}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setCompanyToDelete(null); }}
        onConfirm={handleConfirmDelete}
        companyName={companyToDelete?.companyName || ""}
        isDeleting={deletingId === companyToDelete?._id}
      />
    </div>
  );
};

export default CompaniesList;