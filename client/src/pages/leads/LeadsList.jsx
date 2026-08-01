import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import {
  FiSearch,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiTrash2,
  FiX,
  FiAlertTriangle,
} from "react-icons/fi";

import { useDispatch, useSelector } from "react-redux";

import TableRowActions from "../../components/tables/TableRowActions";
import CreateLeadsModal from "../leads/CreateLeadsModal";
import Button from "../../components/ui/Button";
import ImportLeadsModal from "./ImportLeadsModal";

import {
  deleteLead,
  setLeads,
  setSelectedLead,
} from "../../redux/slices/leadSlice";

import leadService from "../../services/leadService";

// ─────────────────────────────────────────────
// DELETE CONFIRMATION MODAL COMPONENT
// ─────────────────────────────────────────────
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, leadName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl p-6 w-[420px] shadow-2xl transform transition-all animate-scaleIn">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
            <FiTrash2 className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <h3 className="text-xl font-bold text-slate-800 text-center mb-2">
          Delete Lead
        </h3>

        <p className="text-slate-500 text-center mb-6">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-slate-700">{leadName}</span>?
          <br />
          <span className="text-xs text-slate-400">This action cannot be undone.</span>
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 flex items-start gap-2">
          <FiAlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">
            Deleting this lead will permanently remove all associated data including
            notes, activities, and history.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-colors shadow-lg shadow-red-100"
          >
            Delete Lead
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN LEADS LIST COMPONENT
// ─────────────────────────────────────────────
const LeadsList = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [selectedOwner, setSelectedOwner] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const leads = useSelector((state) => state.leads.leads);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await leadService.getAllLeads();
      dispatch(setLeads(response.data));
    } catch (error) {
      console.error("Failed to fetch leads:", error);
      toast.error("Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  };
  const lead = useSelector(state => state.leads.selectedLead);

  const owners = [...new Set(leads.map((lead) => lead.owner).filter(Boolean))];
  const stages = ['New', 'Contacted', 'Qualified', 'Unqualified'];

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        `${lead.firstName || ""} ${lead.lastName || ""}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.phone?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStage = !selectedStage || lead.status === selectedStage;
      const matchesOwner = !selectedOwner || lead.owner === selectedOwner;

      let matchesDate = true;
      if (selectedDate) {
        const leadDate = new Date(lead.createdAt);
        const selected = new Date(selectedDate + "T00:00:00");
        matchesDate =
          !isNaN(leadDate) &&
          leadDate.getFullYear() === selected.getFullYear() &&
          leadDate.getMonth() === selected.getMonth() &&
          leadDate.getDate() === selected.getDate();
      }

      return matchesSearch && matchesStage && matchesOwner && matchesDate;
    });
  }, [leads, searchQuery, selectedStage, selectedOwner, selectedDate]);

  // ── Pagination ──────────────────────────────
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);

  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLeads.slice(start, start + itemsPerPage);
  }, [filteredLeads, currentPage]);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStage, selectedOwner, selectedDate]);

  const columns = [
    "",
    "Name",
    "Email",
    "Phone Number",
    "Created Date",
    "Lead Status",
    "Actions",
  ];

  const handleDeleteClick = (lead) => {
    setLeadToDelete(lead);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!leadToDelete) return;
    try {
      await leadService.deleteLead(leadToDelete._id);
      dispatch(deleteLead(leadToDelete._id));
      toast.success(`Lead "${leadToDelete.firstName} ${leadToDelete.lastName}" deleted successfully`);
      setIsDeleteModalOpen(false);
      setLeadToDelete(null);
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error(error.message || "Failed to delete lead");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-slate-500 mt-4">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white p-5 pb-1 rounded-2xl  space-y-3">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Leads</h2>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsImportModalOpen(true)}
            className="border border-indigo-200 text-indigo-600 bg-white px-6 py-2 rounded-xl font-bold text-xs hover:bg-indigo-50/50 transition-all"
          >
            Import
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              dispatch(setSelectedLead(null));
              setIsModalOpen(true);
            }}
            className="bg-[#6366F1] px-6 py-2 rounded-xl font-bold text-xs shadow-md shadow-indigo-100 hover:opacity-90 transition-all"
          >
            Create
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm space-y-2">
        <div className="flex flex-wrap gap-4 items-center justify-between">

          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search lead name, email, phone"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50/60 border border-gray-100 rounded-xl text-xs outline-none focus:bg-white focus:border-indigo-400 transition-all"
            />
          </div>

         
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap gap-3">
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[11px] font-bold text-gray-500 outline-none min-w-[130px] cursor-pointer hover:border-gray-300"
          >
            <option value="">Lead Status</option>
            {stages.map((stage, i) => <option key={i} value={stage}>{stage}</option>)}
          </select>

          <div
            className="flex items-center justify-between gap-6 px-4 py-2 bg-white border border-gray-200 rounded-xl cursor-pointer relative min-w-[140px]"
            onClick={() => document.getElementById('leadDateInput').showPicker()}
          >
            <span className="text-[11px] font-bold text-gray-500 whitespace-nowrap">
              {selectedDate
                ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "Created Date"}
            </span>
            <FiCalendar className="text-gray-500 shrink-0" size={14} />
            <input
              id="leadDateInput"
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
          <table className="w-full min-w-[900px]">
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
              {paginatedLeads.length > 0 ? (
                paginatedLeads.map((row) => (
                  <tr key={row._id} className="hover:bg-slate-50/40 transition-all group">

                    <td className="px-6 py-4 w-12">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                    </td>

                    <td className="px-6 py-4 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          dispatch(setSelectedLead(row));
                          navigate(`/leads/${row._id}`);
                        }}
                        className="text-slate-700 hover:text-indigo-600 font-bold transition-colors text-left outline-none cursor-pointer"
                      >
                        {`${row.firstName || ""} ${row.lastName || ""}`.trim()}
                      </button>
                    </td>

                    <td className="px-6 py-4 text-xs font-medium text-slate-500">{row.email}</td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">{row.phone}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {row.createdAt
                        ? new Date(row.createdAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                            
                          })
                        : "-"}
                    </td>

                    <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
  row.status === "New"         ? "bg-blue-50 text-blue-600"
  : row.status === "Contacted" ? "bg-amber-50 text-amber-600"
  : row.status === "Qualified" ? "bg-emerald-50 text-emerald-600"
  : row.status === "Unqualified" ? "bg-red-50 text-red-600"
  : "bg-indigo-50 text-indigo-600"
}`}>
  {row.status}
</span>
                    </td>

                    <td className="px-6 py-4 w-24">
                      <TableRowActions
                        onEdit={() => {
                          dispatch(setSelectedLead(row));
                          setIsModalOpen(true);
                        }}
                        onDelete={() => handleDeleteClick(row)}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="text-center py-10 text-sm text-gray-400">
                    No leads found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination + Count */}
        {totalPages > 1 && (
          <div className="flex items-center justify-around px-6 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400 font-medium">
              Showing {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filteredLeads.length)} of {filteredLeads.length} leads
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
                      ${currentPage === page
                        ? "bg-indigo-600 text-white"
                        : "text-gray-500 hover:bg-gray-50"}`}
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

      {/* Create / Edit Lead Modal */}
      <CreateLeadsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          fetchLeads();
        }}
        defaultTo={lead?.email}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setLeadToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        leadName={leadToDelete ? `${leadToDelete.firstName} ${leadToDelete.lastName}`.trim() : ''}
      />

      {/* Import Leads Modal */}
      <ImportLeadsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={fetchLeads}
      />
    </div>
  );
};

export default LeadsList;