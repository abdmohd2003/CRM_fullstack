import React, { useEffect, useMemo, useState } from "react";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiRefreshCw,
  FiAlertCircle,
  FiTrash2
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { useOrder } from "../../contexts/orderContext";
import paymentService from "../../services/order/paymentService";

// ─────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────
const StatCard = ({ label, value, dotColor, subtext }) => (
  <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
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
  COMPLETED: "bg-emerald-50 text-emerald-600",
  PENDING: "bg-amber-50 text-amber-600",
  REFUNDED: "bg-slate-100 text-slate-500",
  FAILED: "bg-red-50 text-red-600",
  PARTIAL: "bg-orange-50 text-orange-500", // ⭐ ADDED: Orange styling for partial status
};

const StatusBadge = ({ status }) => (
  <span
    className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${statusStyles[status] || "bg-indigo-50 text-indigo-600"}`}
  >
    {status || "PENDING"}
  </span>
);

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
const PaymentsList = () => {
  const navigate = useNavigate();
  const { orders, fetchOrders } = useOrder();
  
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({
    totalReceived: 0,
    totalPending: 0,
    totalRefunded: 0,
    totalFailed: 0,
  });
  const itemsPerPage = 10;

  // ── Payment Methods ─────────────────────────
  const paymentMethods = ["BANK_TRANSFER", "CREDIT_CARD", "CASH", "CHEQUE", "ONLINE", "OTHER"];
  
  // ⭐ ADDED: "PARTIAL" to the filter dropdown options
  const paymentStatuses = ["PENDING", "COMPLETED", "PARTIAL", "FAILED", "REFUNDED"]; 

  // ── Fetch Payments from Orders ──────────────
  const fetchPayments = async () => {
    try {
      setLoading(true);

      const enrichPayment = (payment) => {
        const order = payment.orderId; 
        return {
          ...payment,
          orderId: order?._id || payment.orderId,
          orderNumber: order?.orderNumber,
          contactName: order?.contactName,
          companyName: order?.companyName,
          orderStatus: order?.status,
          orderTotal: order?.totalAmount,
        };
      };

      try {
        const response = await paymentService.getPayments?.();
        const paymentsArray = response?.data;
        if (Array.isArray(paymentsArray)) {
          const enriched = paymentsArray.map(enrichPayment);
          setPayments(enriched);
          calculateStats(enriched);
          return;
        }
      } catch (apiError) {
        console.log('Direct payments API not available, using orders data');
      }

      // Fallback: Extract payments from orders
      let currentOrders = orders;
      if (!currentOrders || currentOrders.length === 0) {
        currentOrders = (await fetchOrders()) || [];
      }

      const allPayments = [];
      currentOrders.forEach(order => {
        if (order.payments && order.payments.length > 0) {
          order.payments.forEach(payment => {
            allPayments.push({
              ...payment,
              orderId: order._id,
              orderNumber: order.orderNumber,
              contactName: order.contactName,
              companyName: order.companyName,
              orderStatus: order.status,
              orderTotal: order.totalAmount,
            });
          });
        }
      });

      setPayments(allPayments);
      calculateStats(allPayments);

    } catch (error) {
      toast.error(error.message || "Failed to fetch payments");
      setPayments([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  
  // ── Calculate Stats ─────────────────────────
  const calculateStats = (paymentData) => {
    const totalReceived = paymentData
      .filter((p) => p.status === "COMPLETED")
      .reduce((sum, p) => sum + p.amount, 0);
    const totalPending = paymentData
      .filter((p) => p.status === "PENDING")
      .reduce((sum, p) => sum + p.amount, 0);
    const totalRefunded = paymentData
      .filter((p) => p.status === "REFUNDED")
      .reduce((sum, p) => sum + p.amount, 0);
    const totalFailed = paymentData
      .filter((p) => p.status === "FAILED")
      .reduce((sum, p) => sum + p.amount, 0);

    setStats({
      totalReceived,
      totalPending,
      totalRefunded,
      totalFailed,
    });
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    if (orders.length > 0) {
      fetchPayments();
    }
  }, [orders.length]);

  // ── Filtering ──────────────────────────────
  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      
      // ⭐ CUSTOM FILTER LOGIC: Bridge transaction status with order status
      let matchesStatus = true;
      if (selectedStatus) {
        if (selectedStatus === "PARTIAL") {
          matchesStatus = payment.status === "COMPLETED" && payment.orderStatus === "PARTIAL";
        } else if (selectedStatus === "COMPLETED") {
          matchesStatus = payment.status === "COMPLETED" && payment.orderStatus !== "PARTIAL";
        } else {
          matchesStatus = payment.status === selectedStatus;
        }
      }

      const matchesMethod = !selectedMethod || payment.method === selectedMethod;

      let matchesDate = true;
      if (selectedDate) {
        const paymentDate = new Date(payment.paymentDate || payment.date);
        const selected = new Date(selectedDate + "T00:00:00");
        matchesDate =
          !isNaN(paymentDate) &&
          paymentDate.getFullYear() === selected.getFullYear() &&
          paymentDate.getMonth() === selected.getMonth() &&
          paymentDate.getDate() === selected.getDate();
      }

      return matchesStatus && matchesMethod && matchesDate;
    });
  }, [payments, selectedStatus, selectedMethod, selectedDate]);

  // ── Pagination ──────────────────────────────
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPayments.slice(start, start + itemsPerPage);
  }, [filteredPayments, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus, selectedMethod, selectedDate]);

  // ── Format Helpers ──────────────────────────
  const formatCurrency = (amount) => {
    if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    }
    return `$${amount.toFixed(0)}`;
  };

  const formatMethod = (method) => {
    if (!method) return "N/A";
    return method.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getPaymentNumber = (payment) => {
    return payment.paymentNo || payment.receiptNumber || `PAY-${payment._id?.slice(-8) || '0000'}`;
  };

  const handleViewPayment = (paymentId) => {
    if (!paymentId) return;
    navigate(`/payments/${paymentId}`);
  };

  const handleViewOrder = (orderId) => {
    if (!orderId) return;
    navigate(`/orders/${orderId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-slate-500 mt-4">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white p-5 pb-1 rounded-2xl space-y-3">

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Total Received" 
          value={formatCurrency(stats.totalReceived)} 
          dotColor="bg-emerald-100"
          subtext={`${payments.filter(p => p.status === "COMPLETED").length} payments`}
        />
        <StatCard 
          label="Pending" 
          value={formatCurrency(stats.totalPending)} 
          dotColor="bg-amber-100"
          subtext={`${payments.filter(p => p.status === "PENDING").length} awaiting`}
        />
        <StatCard 
          label="Failed" 
          value={formatCurrency(stats.totalFailed)} 
          dotColor="bg-red-100"
          subtext={`${payments.filter(p => p.status === "FAILED").length} failed`}
        />
        <StatCard 
          label="Refunded" 
          value={formatCurrency(stats.totalRefunded)} 
          dotColor="bg-slate-100"
          subtext={`${payments.filter(p => p.status === "REFUNDED").length} refunded`}
        />
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-slate-800 tracking-tight mt-1 mb-1">Payments</h2>
        <button
          onClick={fetchPayments}
          className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[11px] font-bold text-gray-500 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center gap-2"
        >
          <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[11px] font-bold text-gray-500 outline-none min-w-[110px] cursor-pointer hover:border-gray-300"
        >
          <option value="">All Status</option>
          {paymentStatuses.map((status, i) => (
            <option key={i} value={status}>{status}</option>
          ))}
        </select>

        <select
          value={selectedMethod}
          onChange={(e) => setSelectedMethod(e.target.value)}
          className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-[11px] font-bold text-gray-500 outline-none min-w-[110px] cursor-pointer hover:border-gray-300"
        >
          <option value="">All Methods</option>
          {paymentMethods.map((method, i) => (
            <option key={i} value={method}>{formatMethod(method)}</option>
          ))}
        </select>

        <div
          className="flex items-center justify-between gap-6 px-4 py-2 bg-white border border-gray-200 rounded-xl cursor-pointer relative min-w-[140px]"
          onClick={() => document.getElementById("paymentDateInput").showPicker()}
        >
          <span className="text-[11px] font-bold text-gray-500 whitespace-nowrap">
            {selectedDate
              ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : "Date range"}
          </span>
          <FiCalendar className="text-gray-500 shrink-0" size={14} />
          <input
            id="paymentDateInput"
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

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-[#6366F1] text-white">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.15em]">Payment No.</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.15em]">Order</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.15em]">Contact</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.15em]">Amount</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.15em]">Method</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.15em]">Date</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.15em]">Status</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-[0.15em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/70 bg-white">
              {paginatedPayments.length > 0 ? (
                paginatedPayments.map((row) => {
                  
                  // ⭐ CALCULATE DISPLAY STATUS: Override 'COMPLETED' if the order is 'PARTIAL'
                  const displayStatus = 
                    row.status === 'COMPLETED' && row.orderStatus === 'PARTIAL' 
                      ? 'PARTIAL' 
                      : row.status;

                  return (
                    <tr key={row._id} className="hover:bg-slate-50/40 transition-all group">
                      <td className="px-6 py-4 text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => handleViewPayment(row._id)}
                          className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors text-left outline-none cursor-pointer"
                        >
                          {getPaymentNumber(row)}
                        </button>
                      </td>

                      <td className="px-6 py-4 text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => handleViewOrder(row.orderId)}
                          className="text-indigo-600 hover:text-indigo-700 font-bold transition-colors text-left outline-none cursor-pointer"
                        >
                          {row.orderNumber || 'N/A'}
                        </button>
                      </td>

                      <td className="px-6 py-4 text-xs font-medium text-slate-700">
                        {row.contactName || row.user?.name || 'N/A'}
                      </td>

                      <td className="px-6 py-4 text-xs font-bold text-slate-800">
                        ${row.amount?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                      </td>

                      <td className="px-6 py-4 text-xs font-medium text-slate-500">
                        {formatMethod(row.method)}
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                        {row.paymentDate || row.date
                          ? new Date(row.paymentDate || row.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                          : 'N/A'}
                      </td>

                      <td className="px-6 py-4">
                        {/* ⭐ RENDER OVERRIDDEN STATUS */}
                        <StatusBadge status={displayStatus} />
                      </td>

                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleViewPayment(row._id)}
                          className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="View Payment"
                        >
                          <FiEye size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-sm text-gray-400">
                    {payments.length === 0 ? (
                      <div>
                        <p className="font-medium">No payments yet</p>
                        <p className="text-xs mt-1">Payments will appear here when customers pay their orders.</p>
                      </div>
                    ) : (
                      "No payments match your filters"
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-around px-6 py-2 border-t border-gray-100">
            <p className="text-xs text-gray-400 font-medium">
              Showing {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filteredPayments.length)} of {filteredPayments.length} payments
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

export default PaymentsList;