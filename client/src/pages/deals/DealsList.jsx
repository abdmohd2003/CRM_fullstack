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
  FiTrendingUp,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiRefreshCw,
} from "react-icons/fi";

import { useDispatch, useSelector } from "react-redux";

import TableRowActions from "../../components/tables/TableRowActions";
import CreateDealModal from "./DealsModal";
import Button from "../../components/ui/Button";
import axiosInstance from "../../api/axiosConfig";

import {
  deleteDeal,
  setDeals,
  setSelectedDeal,
  dealStart,
  dealSuccess,
  dealFailure,
} from "../../redux/slices/dealSlice";

import dealService from "../../services/dealService";

// ─────────────────────────────────────────────
// DELETE CONFIRMATION MODAL
// ─────────────────────────────────────────────
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, dealName }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-[440px] shadow-2xl">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
            <FiTrash2 className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Delete Deal</h3>
        <p className="text-slate-500 text-center mb-6">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-slate-700">{dealName}</span>?<br />
          <span className="text-xs text-slate-400">This action cannot be undone.</span>
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 flex items-start gap-2">
          <FiAlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-700">Warning</p>
            <p className="text-xs text-amber-600">
              Deleting this deal will permanently remove all associated data including
              leads, documents, and activity history.
            </p>
          </div>
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
            Delete Deal
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// STAGE UPDATE MODAL
// ─────────────────────────────────────────────
const StageUpdateModal = ({ isOpen, onClose, onConfirm, dealName, currentStage, isUpdating }) => {
  const [selectedStage, setSelectedStage] = useState(currentStage || "");
  const [showWarning, setShowWarning] = useState(false);

  const stages = [
    "LEAD",
    "QUALIFIED",
    "PROPOSAL",
    "NEGOTIATION",
    "CLOSED_WON",
    "CLOSED_LOST",
  ];

  const stageColors = {
    LEAD: "bg-gray-100 text-gray-700",
    QUALIFIED: "bg-blue-100 text-blue-700",
    PROPOSAL: "bg-purple-100 text-purple-700",
    NEGOTIATION: "bg-amber-100 text-amber-700",
    CLOSED_WON: "bg-green-100 text-green-700",
    CLOSED_LOST: "bg-red-100 text-red-700",
  };

  const stageIcons = {
    LEAD: <FiClock size={16} />,
    QUALIFIED: <FiCheckCircle size={16} />,
    PROPOSAL: <FiTrendingUp size={16} />,
    NEGOTIATION: <FiClock size={16} />,
    CLOSED_WON: <FiCheckCircle size={16} className="text-green-600" />,
    CLOSED_LOST: <FiXCircle size={16} className="text-red-600" />,
  };

  if (!isOpen) return null;

  const handleStageSelect = (stage) => {
    setSelectedStage(stage);
    if (stage === "CLOSED_WON") {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  };

  const handleConfirm = () => {
    if (!selectedStage) {
      toast.warning("Please select a stage");
      return;
    }
    onConfirm(selectedStage);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-[500px] max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-800">Update Deal Stage</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <FiXCircle size={20} />
          </button>
        </div>
        
        <p className="text-sm text-slate-500 mb-4">
          Update stage for <span className="font-semibold text-slate-700">{dealName}</span>
        </p>
        <p className="text-xs text-slate-400 mb-6">
          Current Stage: <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stageColors[currentStage] || 'bg-gray-100 text-gray-700'}`}>
            {currentStage || "Not set"}
          </span>
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {stages.map((stage) => (
            <button
              key={stage}
              onClick={() => handleStageSelect(stage)}
              className={`p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3
                ${selectedStage === stage 
                  ? 'border-indigo-600 bg-indigo-50' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
                ${stage === 'CLOSED_WON' ? 'hover:border-green-400' : ''}
                ${stage === 'CLOSED_LOST' ? 'hover:border-red-400' : ''}
              `}
            >
              <div className={`p-1.5 rounded-full ${stageColors[stage]}`}>
                {stageIcons[stage]}
              </div>
              <div>
                <p className={`text-xs font-bold ${selectedStage === stage ? 'text-indigo-600' : 'text-slate-700'}`}>
                  {stage.replace('_', ' ')}
                </p>
                <p className="text-[10px] text-slate-400">
                  {stage === 'CLOSED_WON' && '🎉 Deal won - Order auto-created'}
                  {stage === 'CLOSED_LOST' && '❌ Deal lost'}
                  {stage === 'LEAD' && 'Initial contact'}
                  {stage === 'QUALIFIED' && 'Qualified lead'}
                  {stage === 'PROPOSAL' && 'Proposal sent'}
                  {stage === 'NEGOTIATION' && 'Negotiating terms'}
                </p>
              </div>
            </button>
          ))}
        </div>

        {showWarning && selectedStage === "CLOSED_WON" && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <FiCheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-700">🎉 Deal Won!</p>
                <p className="text-xs text-green-600">
                  Setting stage to CLOSED_WON will automatically create a draft order.
                  Customer will be notified and finance will review the order.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs font-bold text-green-600">Order will be created:</span>
                  <span className="text-xs text-green-600 font-mono">DRAFT → CONFIRMED → INVOICED → PAID</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedStage || isUpdating}
            className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-lg
              ${selectedStage === 'CLOSED_WON' 
                ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-100' 
                : selectedStage === 'CLOSED_LOST'
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-100'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
              }
              ${(!selectedStage || isUpdating) ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {isUpdating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent inline-block mr-2"></div>
                Updating...
              </>
            ) : (
              `Update to ${selectedStage.replace('_', ' ')}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// ⭐ HELPER: Get lead display name (handles both populated objects and IDs)
// ─────────────────────────────────────────────
const getLeadDisplayName = (lead) => {
  if (!lead) return '-';
  
  // If it's an array
  if (Array.isArray(lead)) {
    const names = lead.map(l => {
      // If it's a populated object with firstName/lastName
      if (typeof l === 'object' && l !== null) {
        if (l.firstName && l.lastName) return `${l.firstName} ${l.lastName}`;
        if (l.firstName) return l.firstName;
        if (l.lastName) return l.lastName;
        if (l.name) return l.name;
        if (l.email) return l.email;
        return l._id ? l._id.substring(0, 8) : 'Unknown';
      }
      // If it's a string (ID or name)
      return l;
    });
    return names.filter(Boolean).join(', ') || '-';
  }
  
  // If it's a single object
  if (typeof lead === 'object' && lead !== null) {
    if (lead.firstName && lead.lastName) return `${lead.firstName} ${lead.lastName}`;
    if (lead.firstName) return lead.firstName;
    if (lead.lastName) return lead.lastName;
    if (lead.name) return lead.name;
    if (lead.email) return lead.email;
    return lead._id ? lead._id.substring(0, 8) : '-';
  }
  
  // If it's a string (ID)
  if (typeof lead === 'string') {
    // Check if it looks like an ObjectId (24 hex chars)
    if (/^[0-9a-fA-F]{24}$/.test(lead)) {
      return `Lead ${lead.substring(0, 6)}...`; // Show shortened ID
    }
    return lead;
  }
  
  return '-';
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
const DealsList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState(null);
  const [dealToUpdateStage, setDealToUpdateStage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatingStage, setUpdatingStage] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const [selectedOwner, setSelectedOwner] = useState("");
  const [selectedCreatedDate, setSelectedCreatedDate] = useState("");
  const [selectedCloseDate, setSelectedCloseDate] = useState("");
  const [crmUsers, setCrmUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const deals = useSelector((state) => state.deals.deals || []);

  const fetchDeals = async () => {
    dispatch(dealStart());
    setLoading(true);
    try {
      const response = await dealService.getDeals();
      if (response.success) {
        dispatch(setDeals(response.data.deals || []));
        dispatch(dealSuccess());
      } else {
        dispatch(dealFailure(response.message));
      }
    } catch (error) {
      dispatch(dealFailure(error.message));
      toast.error(error.message || "Failed to fetch deals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRes = await axiosInstance.get("/users");
        setCrmUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.data || []);
      } catch (error) {
        console.error("Error loading CRM users:", error);
        setCrmUsers([]);
      }
    };
    fetchUsers();
  }, []);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStage, selectedOwner, selectedCreatedDate, selectedCloseDate]);

  const stages = [
    "LEAD",
    "QUALIFIED",
    "PROPOSAL",
    "NEGOTIATION",
    "CLOSED_WON",
    "CLOSED_LOST",
  ];

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const ownerName = Array.isArray(deal.owner)
        ? deal.owner.map((o) =>
          typeof o === "object" ? `${o.firstName || ""} ${o.lastName || ""}`.trim() : o
        ).join(", ")
        : typeof deal.owner === "object" && deal.owner !== null
          ? `${deal.owner.firstName || ""} ${deal.owner.lastName || ""}`.trim()
          : deal.owner || "";

      const matchesSearch =
        deal.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.stage?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStage = !selectedStage || deal.stage === selectedStage;
      const matchesOwner = !selectedOwner || ownerName === selectedOwner;

      let matchesCreatedDate = true;
      if (selectedCreatedDate) {
        const d = new Date(deal.createdAt);
        const s = new Date(selectedCreatedDate + "T00:00:00");
        matchesCreatedDate =
          !isNaN(d) &&
          d.getFullYear() === s.getFullYear() &&
          d.getMonth() === s.getMonth() &&
          d.getDate() === s.getDate();
      }

      let matchesCloseDate = true;
      if (selectedCloseDate) {
        const d = new Date(deal.closeDate);
        const s = new Date(selectedCloseDate + "T00:00:00");
        matchesCloseDate =
          !isNaN(d) &&
          d.getFullYear() === s.getFullYear() &&
          d.getMonth() === s.getMonth() &&
          d.getDate() === s.getDate();
      }

      return matchesSearch && matchesStage && matchesOwner && matchesCreatedDate && matchesCloseDate;
    });
  }, [deals, searchQuery, selectedStage, selectedOwner, selectedCreatedDate, selectedCloseDate]);

  const totalPages = Math.ceil(filteredDeals.length / itemsPerPage);

  const paginatedDeals = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDeals.slice(start, start + itemsPerPage);
  }, [filteredDeals, currentPage]);

  // ============ Refresh Handler ============
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchDeals();
      toast.success("Deals refreshed");
    } catch (error) {
      toast.error("Failed to refresh deals");
    } finally {
      setRefreshing(false);
    }
  };

  // ============ Handle Stage Update ============
  const handleStageUpdateClick = (deal) => {
    setDealToUpdateStage(deal);
    setIsStageModalOpen(true);
  };

const handleConfirmStageUpdate = async (newStage) => {
  if (!dealToUpdateStage) return;
  
  setUpdatingStage(true);
  try {
    // ⭐ Get due date from the deal or use default (30 days from now)
    const dueDate = dealToUpdateStage.dueDate || dealToUpdateStage.orderDueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    // ⭐ Pass dueDate as options
    const response = await dealService.updateDealStage(
      dealToUpdateStage._id, 
      newStage,
      { 
        dueDate: new Date(dueDate).toISOString().split('T')[0] // Format as YYYY-MM-DD
      }
    );
    
    
    let orderData = null;
    
    if (response.data?.order) {
      orderData = response.data.order;
    } else if (response.data?.data?.order) {
      orderData = response.data.data.order;
    } else if (response.order) {
      orderData = response.order;
    }
    
    if (orderData) {
      toast.success(
        `🎉 Deal closed! Order ${orderData.orderNumber || 'created'} auto-created.`,
        {
          autoClose: 5000,
          onClick: () => navigate(`/orders/${orderData._id}`)
        }
      );
      navigate(`/orders/${orderData._id}`);
    } else {
      if (response.data?.orderId) {
        toast.success(`🎉 Deal closed! Order created.`);
        navigate('/orders');
      } else {
        toast.success(`Deal stage updated to ${newStage}`);
      }
    }
    
    await fetchDeals();
    setIsStageModalOpen(false);
    setDealToUpdateStage(null);
    
  } catch (error) {
    console.error('❌ Failed to update stage:', error);
    toast.error(error.message || "Failed to update deal stage");
  } finally {
    setUpdatingStage(false);
  }
};

  const handleDeleteClick = (deal) => {
    setDealToDelete(deal);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!dealToDelete) return;
    try {
      await dealService.deleteDeal(dealToDelete._id);
      dispatch(deleteDeal(dealToDelete._id));
      toast.success(`Deal "${dealToDelete.name}" deleted successfully`);
      setIsDeleteModalOpen(false);
      setDealToDelete(null);
    } catch (error) {
      toast.error(error.message || "Failed to delete deal");
    }
  };

  // ============ Get stage badge color ============
  const getStageBadge = (stage) => {
    const colors = {
      'LEAD': 'bg-gray-100 text-gray-700',
      'QUALIFIED': 'bg-blue-100 text-blue-700',
      'PROPOSAL': 'bg-purple-100 text-purple-700',
      'NEGOTIATION': 'bg-amber-100 text-amber-700',
      'CLOSED_WON': 'bg-green-100 text-green-700',
      'CLOSED_LOST': 'bg-red-100 text-red-700',
    };
    return colors[stage] || 'bg-gray-100 text-gray-700';
  };

  const columns = [
    "", "Deal Name", "Lead Name", "Deal Stage",
    "Close Date", "Deal Owner", "Amount", "Actions",
  ];

  const getOwnerDisplay = (owner) => {
    if (Array.isArray(owner))
      return owner.map((o) =>
        typeof o === "object" && o !== null
          ? `${o.firstName || ""} ${o.lastName || ""}`.trim() || o.name || "-"
          : o
      ).filter(Boolean).join(", ") || "-";
    if (typeof owner === "object" && owner !== null)
      return `${owner.firstName || ""} ${owner.lastName || ""}`.trim() || "-";
    return owner || "-";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-slate-500 mt-4">Loading deals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white p-5 pb-1 rounded-2xl space-y-3">

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Deals</h2>
        <div className="flex gap-2">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="border border-indigo-200 text-indigo-600 bg-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-indigo-50/50 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <FiRefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> 
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
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
            onClick={() => { dispatch(setSelectedDeal(null)); setIsModalOpen(true); }}
            className="bg-[#6366F1] px-6 py-2 rounded-xl font-bold text-xs shadow-md shadow-indigo-100 hover:opacity-90 transition-all text-white"
          >
            Create
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search deal name, owner, stage"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50/60 border border-gray-100 rounded-xl text-xs outline-none focus:bg-white focus:border-indigo-400 transition-all"
            />
          </div>
        </div>

        {/* Dropdowns */}
        <div className="flex flex-wrap gap-3">
          <select
            value={selectedOwner}
            onChange={(e) => setSelectedOwner(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[11px] font-bold text-gray-500 outline-none min-w-[130px] cursor-pointer hover:border-gray-300"
          >
            <option value="">All Deal Owners</option>
            {crmUsers.map((user) => (
              <option key={user._id} value={`${user.firstName} ${user.lastName}`.trim()}>
                {user.firstName} {user.lastName}
              </option>
            ))}
          </select>

          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[11px] font-bold text-gray-500 outline-none min-w-[130px] cursor-pointer hover:border-gray-300"
          >
            <option value="">All Deal Stages</option>
            {stages.map((stage, i) => <option key={i} value={stage}>{stage}</option>)}
          </select>

          {/* Close Date */}
          <div
            className="flex items-center justify-between gap-6 px-4 py-2 bg-white border border-gray-200 rounded-xl cursor-pointer relative min-w-[140px]"
            onClick={() => document.getElementById("closeDateInput").showPicker()}
          >
            <span className="text-[11px] font-bold text-gray-500 whitespace-nowrap">
              {selectedCloseDate
                ? new Date(selectedCloseDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "Close Date"}
            </span>
            <FiCalendar className="text-gray-500 shrink-0" size={14} />
            <input
              id="closeDateInput"
              type="date"
              value={selectedCloseDate}
              onChange={(e) => setSelectedCloseDate(e.target.value)}
              className="absolute inset-0 opacity-0 w-full cursor-pointer"
            />
          </div>
          {selectedCloseDate && (
            <button
              onClick={() => setSelectedCloseDate("")}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[11px] font-bold text-gray-400 hover:text-red-400 hover:border-red-200 transition-all"
            >
              Clear Close Date
            </button>
          )}

          {/* Created Date */}
          <div
            className="flex items-center justify-between gap-6 px-4 py-2 bg-white border border-gray-200 rounded-xl cursor-pointer relative min-w-[140px]"
            onClick={() => document.getElementById("createdDateInput").showPicker()}
          >
            <span className="text-[11px] font-bold text-gray-500 whitespace-nowrap">
              {selectedCreatedDate
                ? new Date(selectedCreatedDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "Created Date"}
            </span>
            <FiCalendar className="text-gray-500 shrink-0" size={14} />
            <input
              id="createdDateInput"
              type="date"
              value={selectedCreatedDate}
              onChange={(e) => setSelectedCreatedDate(e.target.value)}
              className="absolute inset-0 opacity-0 w-full cursor-pointer"
            />
          </div>
          {selectedCreatedDate && (
            <button
              onClick={() => setSelectedCreatedDate("")}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[11px] font-bold text-gray-400 hover:text-red-400 hover:border-red-200 transition-all"
            >
              Clear Created Date
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
              {paginatedDeals.length > 0 ? (
                paginatedDeals.map((row) => (
                  <tr key={row._id} className="hover:bg-slate-50/40 transition-all group">
                    <td className="px-6 py-4 w-12">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                    </td>
                    <td className="px-6 py-4 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => { dispatch(setSelectedDeal(row)); navigate(`/deals/${row._id}`); }}
                        className="text-slate-700 hover:text-indigo-600 font-bold transition-colors text-left outline-none cursor-pointer"
                      >
                        {row.name}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
                      {getLeadDisplayName(row.associatedLead)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${getStageBadge(row.stage)}`}>
                        {row.stage || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-400 whitespace-nowrap">
                      {row.closeDate
                        ? new Date(row.closeDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
                      {getOwnerDisplay(row.owner)}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-800">
                      {row.amount ? `$${row.amount.toLocaleString()}` : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStageUpdateClick(row)}
                          className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Update Stage"
                        >
                          <FiTrendingUp size={14} />
                        </button>
                        <TableRowActions
                          onEdit={() => { dispatch(setSelectedDeal(row)); setIsModalOpen(true); }}
                          onDelete={() => handleDeleteClick(row)}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="text-center py-10 text-sm text-gray-400">
                    No deals found
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
              Showing {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filteredDeals.length)} of {filteredDeals.length} deals
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

      <CreateDealModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); fetchDeals(); }}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setDealToDelete(null); }}
        onConfirm={handleConfirmDelete}
        dealName={dealToDelete?.name || ""}
      />

      <StageUpdateModal
        isOpen={isStageModalOpen}
        onClose={() => { setIsStageModalOpen(false); setDealToUpdateStage(null); }}
        onConfirm={handleConfirmStageUpdate}
        dealName={dealToUpdateStage?.name || ""}
        currentStage={dealToUpdateStage?.stage || ""}
        isUpdating={updatingStage}
      />
    </div>
  );
};

export default DealsList;