import React, { useEffect, useMemo, useState } from "react";
import {
  FiSearch,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiCheckCircle,
  FiEye,
  FiDownload,
  FiMail,
  FiPrinter,
  FiPlus,
  FiDollarSign,
  FiEdit2,
  FiRefreshCw,
  FiTrash2,
  FiAlertTriangle,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { useOrder } from "../../contexts/orderContext";
import orderService from "../../services/order/orderService";

// ─────────────────────────────────────────────
// DELETE CONFIRMATION MODAL
// ─────────────────────────────────────────────
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, orderNumber }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-[440px] shadow-2xl">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
            <FiTrash2 className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Delete Order</h3>
        <p className="text-slate-500 text-center mb-6">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-slate-700">{orderNumber}</span>?<br />
          <span className="text-xs text-slate-400">This action cannot be undone.</span>
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 flex items-start gap-2">
          <FiAlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-700">Warning</p>
            <p className="text-xs text-amber-600">
              Deleting this order will permanently remove all associated data including
              payments, invoices, and activity history.
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
            Delete Order
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────
const StatCard = ({ label, value, dotColor, subtext }) => (
  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
    <div>
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className="text-2xl font-black text-slate-800 mt-1">{value}</p>
      {subtext && <p className="text-[10px] text-slate-400 mt-0.5">{subtext}</p>}
    </div>
    <div className={`w-9 h-9 rounded-full ${dotColor}`} />
  </div>
);

// ─────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────
const statusStyles = {
  DRAFT: "bg-slate-100 text-slate-500",
  CONFIRMED: "bg-indigo-50 text-indigo-600",
  INVOICED: "bg-amber-50 text-amber-600",
  PARTIAL: "bg-orange-50 text-orange-500",
  PAID: "bg-emerald-50 text-emerald-600",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-50 text-red-500",
};

const StatusBadge = ({ status }) => (
  <span
    className={`px-3 py-1 rounded-full text-[11px] font-bold ${statusStyles[status] || "bg-slate-100 text-slate-500"
      }`}
  >
    {status || "DRAFT"}
  </span>
);

// ─────────────────────────────────────────────
// ORDER ACTION BUTTONS
// ─────────────────────────────────────────────
const OrderActions = ({ order, onAction, onDelete }) => {
  const navigate = useNavigate();

  const handleAction = (action) => {
    if (onAction) onAction(action, order);
  };

  const getOrderId = () => {
    return order._id || order.id || order.orderId;
  };

  const orderId = getOrderId();

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => {
          if (orderId) {
            navigate(`/orders/${orderId}`);
          } else {
            toast.error('Cannot view order: ID is missing');
          }
        }}
        className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
        title="View Order"
      >
        <FiEye size={14} />
      </button>

      {order.status === 'DRAFT' && (
        <button
          onClick={() => handleAction('confirm')}
          className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
          title="Confirm Order"
        >
          <FiCheckCircle size={14} />
        </button>
      )}

      {order.status === 'CONFIRMED' && (
        <button
          onClick={() => handleAction('generateInvoice')}
          className="p-1.5 rounded-lg text-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
          title="Generate Invoice"
        >
          <FiDollarSign size={14} />
        </button>
      )}

      {(order.status === 'INVOICED' || order.status === 'PARTIAL') && (
        <>
          <button
            onClick={() => handleAction('recordPayment')}
            className="p-1.5 rounded-lg text-green-400 hover:text-green-600 hover:bg-green-50 transition-colors"
            title="Record Payment"
          >
            <FiPlus size={14} />
          </button>
          <button
            onClick={() => handleAction('sendInvoice')}
            className="p-1.5 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Send Invoice"
          >
            <FiMail size={14} />
          </button>
        </>
      )}

      {order.status === 'PAID' && (
        <>
          <button
            onClick={() => handleAction('markCompleted')}
            className="p-1.5 rounded-lg text-green-500 hover:text-green-700 hover:bg-green-50 transition-colors"
            title="Mark as Completed/Delivered"
          >
            <FiCheckCircle size={14} />
          </button>
        
        </>
      )}

    
      {/* Delete Button */}
      <button
        onClick={() => onDelete(order)}
        className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        title="Delete Order"
      >
        <FiTrash2 size={14} />
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
const OrdersList = () => {
  const navigate = useNavigate();
  const {
    orders,
    loading,
    stats,
    fetchOrders,
    refreshOrders,
    confirmOrder,
    generateInvoice,
    recordPayment,
    markOrderCompleted,
    cancelOrder,
  } = useOrder();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedOwner, setSelectedOwner] = useState("");
  const [selectedCreatedDate, setSelectedCreatedDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const itemsPerPage = 10;

  // ── Debug: Log orders and their IDs ──
  useEffect(() => {
    console.log('📦 Orders loaded:', orders);
    if (orders.length > 0) {
      console.log('📋 First order:', orders[0]);
    }
  }, [orders]);

  // ── Fetch Orders on Mount ─────────────────────
  useEffect(() => {
    fetchOrders();
  }, []);

  // ── Reset page on filter change ──────────────
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatus, selectedOwner, selectedCreatedDate]);

  // ── Order Statuses ────────────────────────────
  const orderStatuses = ["DRAFT", "CONFIRMED", "INVOICED", "PARTIAL", "PAID", "COMPLETED", "CANCELLED"];
  const owners = [...new Set(orders.map((order) => order.owner?.name || order.contactName).filter(Boolean))];

  // ── Filtering ──────────────────────────────
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderNo = order.orderNumber || order.orderNo || "";
      const contactName = order.contactName || "";
      const companyName = order.companyName || "";

      const matchesSearch =
        orderNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        companyName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = !selectedStatus || order.status === selectedStatus;
      const matchesOwner = !selectedOwner ||
        (order.owner?.name === selectedOwner || order.contactName === selectedOwner);

      let matchesDate = true;
      if (selectedCreatedDate) {
        const orderDate = new Date(order.createdAt);
        const selected = new Date(selectedCreatedDate + "T00:00:00");
        matchesDate =
          !isNaN(orderDate) &&
          orderDate.getFullYear() === selected.getFullYear() &&
          orderDate.getMonth() === selected.getMonth() &&
          orderDate.getDate() === selected.getDate();
      }

      return matchesSearch && matchesStatus && matchesOwner && matchesDate;
    });
  }, [orders, searchQuery, selectedStatus, selectedOwner, selectedCreatedDate]);

  // ── Pagination ──────────────────────────────
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage]);

  // ── Refresh Handler ──────────────────────────
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshOrders();
      toast.success("Orders refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh orders");
    } finally {
      setRefreshing(false);
    }
  };

  // ── Delete Order Handler ─────────────────────
  const handleDeleteClick = (order) => {
    setOrderToDelete(order);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;

    setDeleting(true);
    try {
      const response = await orderService.deleteOrder(orderToDelete._id);
      toast.success(`Order ${orderToDelete.orderNumber} deleted successfully`);
      setIsDeleteModalOpen(false);
      setOrderToDelete(null);
      await refreshOrders();
    } catch (error) {
      console.error('Delete order error:', error);
      toast.error(error.message || 'Failed to delete order');
    } finally {
      setDeleting(false);
    }
  };

  // ── Order Actions ────────────────────────────
  const handleOrderAction = async (action, order) => {
    setActionLoading(true);
    try {
      switch (action) {
        case 'confirm':
          await handleConfirmOrder(order);
          break;
        case 'generateInvoice':
          await handleGenerateInvoice(order);
          break;
        case 'recordPayment':
          navigate(`/orders/${order._id}/payment`);
          break;
        case 'sendInvoice':
          await handleSendInvoice(order);
          break;
        case 'viewReceipt':
          navigate(`/orders/${order._id}/receipt`);
          break;
        case 'markCompleted':
          await handleMarkCompleted(order);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      toast.error(error.message || `Failed to ${action}`);
    } finally {
      setActionLoading(false);
    }
  };

  // ⭐ Mark order as completed/delivered
  const handleMarkCompleted = async (order) => {
    try {
      await markOrderCompleted(order._id);
      toast.success(`Order ${order.orderNumber} marked as completed/delivered!`);
      await refreshOrders();
    } catch (error) {
      toast.error(error.message || 'Failed to mark order as completed');
      throw error;
    }
  };

  // ── Confirm Order ────────────────────────────
  const handleConfirmOrder = async (order) => {
    try {
      await confirmOrder(order._id, true);
      toast.success(`Order ${order.orderNumber} confirmed!`);
      await refreshOrders();
    } catch (error) {
      throw error;
    }
  };

  // ── Generate Invoice ─────────────────────────
  const handleGenerateInvoice = async (order) => {
    try {
      const response = await generateInvoice(order._id);
      toast.success(`Invoice ${response.invoice.invoiceNumber} generated!`);
      await refreshOrders();
    } catch (error) {
      throw error;
    }
  };

  // ── Send Invoice ─────────────────────────────
  const handleSendInvoice = async (order) => {
    try {
      navigate(`/orders/${order._id}/invoice`);
    } catch (error) {
      throw error;
    }
  };

  // ── Helper to get order ID ────────────────────
  const getOrderId = (order) => {
    return order._id || order.id || order.orderId;
  };

  // ⭐ Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-slate-500 mt-4">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white rounded-2xl p-5 space-y-5">

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setOrderToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        orderNumber={orderToDelete?.orderNumber || ""}
      />

      {/* Notification banner - Shows latest order notification */}
      {orders.length > 0 && orders[0].status === 'DRAFT' && (
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl px-5 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiCheckCircle className="text-indigo-500 w-5 h-5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-slate-700">
                New order created: {orders[0].orderNumber}
              </p>
              <p className="text-xs text-slate-400">
                From deal: {orders[0].dealId?.name || 'Unknown'} - {new Date(orders[0].createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const id = getOrderId(orders[0]);
              if (id) {
                navigate(`/orders/${id}`);
              } else {
                toast.error('Cannot view order: ID is missing');
              }
            }}
            className="px-4 py-2 rounded-xl border border-indigo-200 text-indigo-600 bg-white font-bold text-xs hover:bg-indigo-50 transition-all"
          >
            View order
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total orders"
          value={stats.total}
          dotColor="bg-indigo-100"
        />
        <StatCard
          label="Awaiting payment"
          value={stats.awaitingPayment}
          dotColor="bg-amber-100"
          subtext="Orders with pending invoices"
        />
        <StatCard
          label="Paid this month"
          value={stats.paidThisMonth}
          dotColor="bg-emerald-100"
        />
        <StatCard
          label="Revenue collected"
          value={`$${(stats.revenueCollected / 1000).toFixed(1)}k`}
          dotColor="bg-sky-100"
          subtext={`${orders.filter(o => o.status === 'PAID' || o.status === 'COMPLETED').length} paid/completed orders`}
        />
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl ml-1 font-black text-slate-800 tracking-tight">Orders</h2>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="border border-indigo-200 text-indigo-600 bg-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-indigo-50/50 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <FiRefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={() => navigate('/orders/create')}
            className="border border-indigo-200 text-indigo-600 bg-white px-6 py-2 rounded-xl font-bold text-xs hover:bg-indigo-50/50 transition-all"
          >
            Create Order
          </button>
          <button
            className="border border-indigo-200 text-indigo-600 bg-white px-6 py-2 rounded-xl font-bold text-xs hover:bg-indigo-50/50 transition-all"
          >
            Import
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm space-y-2">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search order, contact, company"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-gray-50/60 border border-gray-100 rounded-xl text-xs outline-none focus:bg-white focus:border-indigo-400 transition-all"
            />
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-3">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[11px] font-bold text-gray-500 outline-none min-w-[130px] cursor-pointer hover:border-gray-300"
          >
            <option value="">Order Status</option>
            {orderStatuses.map((status, i) => (
              <option key={i} value={status}>{status}</option>
            ))}
          </select>

          <select
            value={selectedOwner}
            onChange={(e) => setSelectedOwner(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[11px] font-bold text-gray-500 outline-none min-w-[130px] cursor-pointer hover:border-gray-300"
          >
            <option value="">Owner</option>
            {owners.map((owner, i) => (
              <option key={i} value={owner}>{owner}</option>
            ))}
          </select>

          {/* Created Date */}
          <div
            className="flex items-center justify-between gap-6 px-4 py-2 bg-white border border-gray-200 rounded-xl cursor-pointer relative min-w-[140px]"
            onClick={() => document.getElementById("orderCreatedDateInput").showPicker()}
          >
            <span className="text-[11px] font-bold text-gray-500 whitespace-nowrap">
              {selectedCreatedDate
                ? new Date(selectedCreatedDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "Created Date"}
            </span>
            <FiCalendar className="text-gray-500 shrink-0" size={14} />
            <input
              id="orderCreatedDateInput"
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
          <table className="w-full min-w-[1100px]">
            <thead className="bg-[#6366F1] text-white">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.15em]">Order No.</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.15em]">Contact / Company</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.15em]">From Deal</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.15em]">Amount</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.15em]">Status</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.15em]">Due Date</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.15em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/70 bg-white">
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map((order) => {
                  const orderId = getOrderId(order);

                  return (
                    <tr key={order._id || order.id || order.orderId} className="hover:bg-slate-50/40 transition-all group">
                      <td className="px-6 py-4 text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => {
                            if (orderId) {
                              navigate(`/orders/${orderId}`);
                            } else {
                              toast.error('Cannot view order: ID is missing');
                            }
                          }}
                          className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors text-left outline-none cursor-pointer"
                        >
                          {order.orderNumber}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <p className="font-bold text-slate-700">{order.contactName || '-'}</p>
                        <p className="font-medium text-slate-400 text-[10px]">{order.companyName || '-'}</p>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500 max-w-[150px] truncate">
                        {order.dealId?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-800">
                        ${order.totalAmount?.toLocaleString() || '0'}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={order.status} />
                      </td>

                      <td className="px-6 py-4 text-xs font-medium text-slate-400 whitespace-nowrap">
                        {order.paymentDueDate
                          ? new Date(order.paymentDueDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                          : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <OrderActions
                          order={order}
                          onAction={handleOrderAction}
                          onDelete={handleDeleteClick}
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-sm text-gray-400">
                    No orders found. Orders are auto-created when deals are won.
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
              Showing {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
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
    </div>
  );
};

export default OrdersList;