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
    FiTag,
    FiLoader,
  } from "react-icons/fi";

  import { useDispatch, useSelector } from "react-redux";

  import TableRowActions from "../../components/tables/TableRowActions";
  import CreateTicketModal from "../tickets/CreateTicketsModal";
  import Button from "../../components/ui/Button";

  import {
    deleteTicket,
    setSelectedTicket,
    setTickets,
    setLoading,
    setError,
  } from "../../redux/slices/ticketSlice";

  import { setDeals } from "../../redux/slices/dealSlice";
  import ticketService from "../../services/ticketService";
  import dealService from "../../services/dealService";

  // ─────────────────────────────────────────────
  // DELETE CONFIRMATION MODAL
  // ─────────────────────────────────────────────
  const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, ticketName, isDeleting }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 w-[440px] shadow-2xl">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
              <FiTrash2 className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Delete Ticket</h3>
          <p className="text-slate-500 text-center mb-6">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-slate-700">{ticketName}</span>?<br />
            <span className="text-xs text-slate-400">This action cannot be undone.</span>
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 flex items-start gap-2">
            <FiAlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-amber-700">Warning</p>
              <p className="text-xs text-amber-600">
                Deleting this ticket will permanently remove all associated data including
                activities, comments, and history.
              </p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 mb-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center">
              <FiTag className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{ticketName}</p>
              <p className="text-xs text-slate-400">Ticket record</p>
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
              {isDeleting ? <><FiLoader className="w-4 h-4 animate-spin" /> Deleting...</> : "Delete Ticket"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────
  // MAIN COMPONENT
  // ─────────────────────────────────────────────
  const TicketsList = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [ticketToDelete, setTicketToDelete] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [loading, setLoadingState] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [selectedPriority, setSelectedPriority] = useState("");
    const [selectedCreatedDate, setSelectedCreatedDate] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4;

    const tickets = useSelector((state) => state.tickets?.tickets || []);
    const deals = useSelector((state) => state.deals?.deals || []);

    const fetchTickets = async () => {
      dispatch(setLoading(true));
      setLoadingState(true);
      try {
        const response = await ticketService.getTickets();
        if (response.success) {
          dispatch(setTickets(response.data.tickets));
        }
      } catch (error) {
        dispatch(setError(error.message));
        toast.error(error.message || "Failed to fetch tickets");
      } finally {
        dispatch(setLoading(false));
        setLoadingState(false);
      }
    };

    useEffect(() => {
      fetchTickets();
    }, []);

    useEffect(() => {
      const fetchDeals = async () => {
        try {
          const response = await dealService.getDeals();
          if (response.success) dispatch(setDeals(response.data.deals));
        } catch (error) {
          console.error("Failed to fetch deals:", error);
        }
      };
      if (deals.length === 0) fetchDeals();
    }, [deals.length, dispatch]);

    // Reset page on filter change
    useEffect(() => {
      setCurrentPage(1);
    }, [searchQuery, selectedStatus, selectedPriority, selectedCreatedDate]);

    const statuses = ["New", "Waiting on contact", "Waiting on us", "In Progress", "Resolved", "Closed"];
    const priorities = ["Low", "Medium", "High", "Critical"];

    const filteredTickets = useMemo(() => {
      return tickets.filter((ticket) => {
        const ownerName = `${ticket.ticketOwner?.firstName || ""} ${ticket.ticketOwner?.lastName || ""}`.trim();

      const matchesSearch =
    ticket.ticketName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.ticketStatus?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ticket.associatedDeal?.name && ticket.associatedDeal.name.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus = !selectedStatus || ticket.ticketStatus === selectedStatus;
        const matchesPriority = !selectedPriority || ticket.priority === selectedPriority;

        let matchesDate = true;
        if (selectedCreatedDate) {
          const d = new Date(ticket.createdAt);
          const s = new Date(selectedCreatedDate );
          matchesDate =
            !isNaN(d) &&
            d.getFullYear() === s.getFullYear() &&
            d.getMonth() === s.getMonth() &&
            d.getDate() === s.getDate();
        }

        return matchesSearch && matchesStatus && matchesPriority && matchesDate;
      });
    }, [tickets, searchQuery, selectedStatus, selectedPriority, selectedCreatedDate]);

    const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);

    const paginatedTickets = useMemo(() => {
      const start = (currentPage - 1) * itemsPerPage;
      return filteredTickets.slice(start, start + itemsPerPage);
    }, [filteredTickets, currentPage]);

    const handleDeleteClick = (ticket) => {
      setTicketToDelete(ticket);
      setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
      if (!ticketToDelete) return;
      setDeletingId(ticketToDelete._id);
      try {
        const response = await ticketService.deleteTicket(ticketToDelete._id);
        if (response.success) {
          toast.success(`Ticket "${ticketToDelete.ticketName}" deleted successfully`);
          dispatch(deleteTicket(ticketToDelete._id));
          setIsDeleteModalOpen(false);
          setTicketToDelete(null);
        }
      } catch (error) {
        toast.error(error.message || "Failed to delete ticket");
      } finally {
        setDeletingId(null);
      }
    };

    const getPriorityStyle = (priority) => {
      switch (priority) {
        case "Critical": return "bg-rose-50 text-rose-600 border border-rose-100";
        case "High": return "bg-orange-50 text-orange-600 border border-orange-100";
        case "Medium": return "bg-amber-50 text-amber-600 border border-amber-100";
        case "Low": return "bg-slate-50 text-slate-500 border border-slate-100";
        default: return "bg-slate-50 text-slate-600";
      }
    };

    const getStatusStyle = (status) => {
      if (status === "Closed" || status === "Resolved") return "text-slate-400 line-through font-medium";
      if (status === "New") return "text-indigo-600 font-bold";
      if (status === "Waiting on contact") return "text-amber-600 font-semibold";
      if (status === "Waiting on us") return "text-blue-600 font-semibold";
      if (status === "In Progress") return "text-emerald-600 font-semibold";
      return "text-slate-600 font-semibold";
    };

    const columns = [
      "", "Ticket Name", "Deal Name", "Ticket Status",
      "Priority", "Source", "Ticket Owner", "Created Date", "Actions",
    ];
    const getDealName = (dealData) => {
    if (!dealData) return "-";

    if (typeof dealData === 'object') {
      return dealData.name || dealData.dealName || "-";
    }

    const foundDeal = deals.find(deal => deal._id === dealData || deal.id === dealData);
    return foundDeal ? (foundDeal.name || foundDeal.dealName) : "-";
  };

    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-slate-500 mt-4">Loading tickets...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-full bg-white p-5 pb-1 rounded-2xl space-y-3">

        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Tickets</h2>
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
              onClick={() => { dispatch(setSelectedTicket(null)); setIsModalOpen(true); }}
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
                placeholder="Search tickets by name, owner, or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50/60 border border-gray-100 rounded-xl text-xs outline-none focus:bg-white focus:border-indigo-400 transition-all"
              />
            </div>


          </div>

          {/* Dropdowns */}
          <div className="flex flex-wrap gap-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[11px] font-bold text-gray-500 outline-none min-w-[130px] cursor-pointer hover:border-gray-300"
            >
              <option value="">All Ticket Status</option>
              {statuses.map((s, i) => <option key={i} value={s}>{s}</option>)}
            </select>

            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[11px] font-bold text-gray-500 outline-none min-w-[130px] cursor-pointer hover:border-gray-300"
            >
              <option value="">All Priority</option>
              {priorities.map((p, i) => <option key={i} value={p}>{p}</option>)}
            </select>

            <div
              className="flex items-center justify-between gap-6 px-4 py-2 bg-white border border-gray-200 rounded-xl cursor-pointer relative min-w-[140px]"
              onClick={() => document.getElementById("ticketDateInput").showPicker()}
            >
              <span className="text-[11px] font-bold text-gray-500 whitespace-nowrap">
                {selectedCreatedDate
                  ? new Date(selectedCreatedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "Created Date"}
              </span>
              <FiCalendar className="text-gray-500 shrink-0" size={14} />
              <input
                id="ticketDateInput"
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
                {paginatedTickets.length > 0 ? (
                  paginatedTickets.map((row) => (
                    <tr key={row._id} className="hover:bg-slate-50/40 transition-all group">
                      <td className="px-6 py-4 w-12">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                      </td>
                      <td className="px-6 py-4 text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => { dispatch(setSelectedTicket(row)); navigate(`/tickets/${row._id}`); }}
                          className="text-slate-700 hover:text-indigo-600 font-bold transition-colors text-left outline-none cursor-pointer"
                        >
                          {row.ticketName}
                        </button>
                      </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
    {getDealName(row.associatedDeal)}
  </td>
                      <td className="px-6 py-4 text-xs">
                        <span className={getStatusStyle(row.ticketStatus)}>
                          {row.ticketStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${getPriorityStyle(row.priority)}`}>
                          {row.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">{row.source || "-"}</td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">
                        {row.ticketOwner?.firstName} {row.ticketOwner?.lastName}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {row.createdAt
                          ? new Date(row.createdAt).toLocaleString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric",
                          })
                          : "-"}
                      </td>
                      <td className="px-6 py-4 w-24">
                        <TableRowActions
                          onEdit={() => { dispatch(setSelectedTicket(row)); setIsModalOpen(true); }}
                          onDelete={() => handleDeleteClick(row)}
                          isDeleting={deletingId === row._id}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={columns.length} className="text-center py-10 text-sm text-gray-400">
                      No tickets found
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
                Showing {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filteredTickets.length)} of {filteredTickets.length} tickets
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

        <CreateTicketModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); fetchTickets(); }}
        />

        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => { setIsDeleteModalOpen(false); setTicketToDelete(null); }}
          onConfirm={handleConfirmDelete}
          ticketName={ticketToDelete?.ticketName || ""}
          isDeleting={deletingId === ticketToDelete?._id}
        />
      </div>
    );
  };

  export default TicketsList;