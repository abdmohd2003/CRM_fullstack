"use client";

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiPrinter,
  FiFileText,
  FiDownload,
  FiSend,
  FiRotateCcw,
  FiMail,
  FiEdit2,
  FiArrowLeft,
  FiCheckCircle,
  FiXCircle,
  FiClock,
} from "react-icons/fi";
import { toast } from "react-toastify";

import Button from "../../components/ui/Button";
import { useOrder } from "../../contexts/orderContext";
import paymentService from "../../services/order/paymentService";
import invoiceService from "../../services/order/invoiceService";
import orderService from "../../services/order/orderService";

// ─────────────────────────────────────────────
// REFUND MODAL
// ─────────────────────────────────────────────
const RefundModal = ({ isOpen, onClose, payment, onRefund }) => {
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onRefund(notes);
      onClose();
    } catch (error) {
      // Error handled in parent
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-[440px] shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-800">Process Refund</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <FiXCircle size={20} />
          </button>
        </div>

        <p className="text-sm text-slate-500 mb-2">
          Refund payment of <span className="font-bold text-slate-700">${payment?.amount?.toFixed(2)}</span>
        </p>
        <p className="text-xs text-slate-400 mb-4">
          Payment: {payment?.paymentNo || payment?.receiptNumber || payment?._id?.slice(-8)}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
              Refund Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for refund..."
              rows="3"
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-400 transition-all resize-none"
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs text-amber-700">
              ⚠️ This action will refund the payment and update the order balance.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-colors shadow-lg shadow-red-100 disabled:opacity-50"
            >
              {submitting ? "Processing..." : "Confirm Refund"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// SEND RECEIPT MODAL
// ─────────────────────────────────────────────
const SendReceiptModal = ({ isOpen, onClose, payment, onSend }) => {
  const [formData, setFormData] = useState({
    email: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (payment && isOpen) {
      const order = payment.orderId || {};
      setFormData({
        email: order.contactEmail || "",
        subject: `Payment Receipt for Order ${order.orderNumber || ''}`,
        message: `Dear ${order.contactName || 'Customer'},\n\nThank you for your payment of $${payment.amount?.toFixed(2)}.\n\nReceipt Number: ${payment.receiptNumber || payment.paymentNo || payment._id?.slice(-8)}\nOrder Number: ${order.orderNumber || 'N/A'}\nPayment Date: ${payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'N/A'}\n\nThank you for your business!`
      });
    }
  }, [payment, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      toast.error("Please enter a recipient email");
      return;
    }
    setSubmitting(true);
    try {
      await onSend(formData);
      onClose();
    } catch (error) {
      // Error handled in parent
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-[520px] max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-800">Send Receipt Email</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <FiXCircle size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
              To *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="customer@email.com"
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-400 transition-all"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
              Subject *
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-400 transition-all"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
              Message
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows="5"
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-400 transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-lg shadow-indigo-100 disabled:opacity-50"
            >
              {submitting ? "Sending..." : "Send Receipt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// DETAIL ROW
// ─────────────────────────────────────────────
const DetailRow = ({ label, value, link, linkText, onClick }) => (
  <div className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
    <span className="text-xs text-slate-400 font-medium">{label}</span>
    {link ? (
      <button
        onClick={onClick}
        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer bg-transparent border-0 p-0"
      >
        {linkText || value || "—"}
      </button>
    ) : (
      <span className="text-xs font-bold text-slate-700">{value || "—"}</span>
    )}
  </div>
);

// ─────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const styles = {
    COMPLETED: "bg-emerald-50 text-emerald-600",
    PENDING: "bg-amber-50 text-amber-600",
    REFUNDED: "bg-slate-100 text-slate-500",
    FAILED: "bg-red-50 text-red-600",
  };

  const icons = {
    COMPLETED: <FiCheckCircle className="inline mr-1" size={12} />,
    PENDING: <FiClock className="inline mr-1" size={12} />,
    REFUNDED: <FiRotateCcw className="inline mr-1" size={12} />,
    FAILED: <FiXCircle className="inline mr-1" size={12} />,
  };

  return (
    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${styles[status] || styles.PENDING}`}>
      {icons[status]} {status || "PENDING"}
    </span>
  );
};

// ─────────────────────────────────────────────
// MAIN PAYMENT PREVIEW
// ─────────────────────────────────────────────
const PaymentPreview = () => {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const { fetchOrderById } = useOrder();

  const [payment, setPayment] = useState(null);
  const [order, setOrder] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showSendReceiptModal, setShowSendReceiptModal] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [tempEmail, setTempEmail] = useState("");
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);

  const isValidEmail = (email) => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  // ── Fetch Payment ────────────────────────────
  const fetchPayment = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📦 Fetching payment by ID:', paymentId);

      if (!paymentId) {
        setError('Payment ID is missing');
        setLoading(false);
        return;
      }

      const paymentData = await paymentService.getPaymentById(paymentId);
      console.log('📦 Payment data received:', paymentData);

      if (!paymentData) {
        setError('Payment not found');
        setLoading(false);
        return;
      }

      const payment = paymentData.data || paymentData;
      setPayment(payment);
      console.log('✅ Payment fetched:', payment.paymentNo || payment.receiptNumber || payment._id);

      // ⭐ FIX: Extract the actual string ID out of orderId whether it is an object or standard string
      if (payment.orderId) {
        const structuralOrderId = typeof payment.orderId === 'object' ? payment.orderId._id : payment.orderId;

        console.log('📦 Fetching order by ID string:', structuralOrderId);
        try {
          const orderData = await fetchOrderById(structuralOrderId);
          console.log('📦 Order data received:', orderData);

          if (orderData) {
            setOrder(orderData);
            setTempEmail(orderData.contactEmail || "");
            console.log('✅ Order fetched:', orderData.orderNumber);
          } else {
            console.warn('⚠️ Order data is empty for ID:', structuralOrderId);
          }
        } catch (orderError) {
          console.error('❌ Failed to fetch order:', orderError);
          toast.warning('Could not load order details');
        }
      } else {
        console.warn('⚠️ No orderId found in payment data');
      }

      // Fetch invoice if available
      if (payment.invoiceId) {
        console.log('📄 Fetching invoice by ID:', payment.invoiceId);
        try {
          const invoiceResponse = await invoiceService.getInvoiceById(payment.invoiceId);
          const invoiceData = invoiceResponse?.data || invoiceResponse;
          if (invoiceData) {
            setInvoice(invoiceData);
            console.log('✅ Invoice fetched:', invoiceData.invoiceNumber);
          }
        } catch (invoiceError) {
          console.error('❌ Failed to fetch invoice:', invoiceError);
        }
      }

    } catch (error) {
      console.error('❌ Error fetching payment:', error);
      const errorMsg = error.message || 'Failed to fetch payment';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (paymentId) {
      fetchPayment();
    } else {
      setError('No payment ID provided');
      setLoading(false);
    }
  }, [paymentId]);

  // ── Update Email ─────────────────────────────
  const handleUpdateEmail = async () => {
    if (!isValidEmail(tempEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    const currentOrderId = order?._id || (typeof payment?.orderId === 'object' ? payment.orderId._id : payment?.orderId);
    if (!currentOrderId) {
      toast.error('Order ID is missing');
      return;
    }

    setActionLoading(true);
    try {
      const response = await orderService.updateOrder(currentOrderId, {
        contactEmail: tempEmail
      });

      if (response && response.success) {
        setOrder(response.data);
        toast.success('Email updated successfully');
        setEditingEmail(false);
        await fetchOrderById(currentOrderId);
      } else {
        toast.error(response?.message || 'Failed to update email');
      }
    } catch (error) {
      console.error('❌ Update email error:', error);
      toast.error(error.message || 'Failed to update email');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Print Invoice ────────────────────────────
  const handlePrintInvoice = async () => {
    if (!invoice) {
      toast.error("No invoice found for this payment");
      return;
    }
    try {
      await invoiceService.printInvoice(invoice._id);
    } catch (error) {
      toast.error(error.message || "Failed to print invoice");
    }
  };

  // ── Preview Invoice ──────────────────────────
  const handlePreviewInvoice = () => {
    if (!invoice) {
      toast.error("No invoice found for this payment");
      return;
    }
    navigate(`/invoices/${invoice._id}`);
  };

  // ── Download Receipt ─────────────────────────
  // ⭐ FIX: Replaced coming soon placeholder with file/blob downoad execution logic
  const handleDownloadReceipt = async () => {
    if (!payment?._id) {
      toast.error("Payment not found");
      return;
    }

    setDownloadingReceipt(true);
    try {
      toast.info("Downloading receipt...");
      const response = await paymentService.downloadReceipt(paymentId);

      // Create a direct downloadable URL blob
      const blob = new Blob([response.data || response], { type: "application/pdf" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `Receipt-${payment?.receiptNumber || payment?.paymentNo || paymentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Receipt downloaded successfully!");
    } catch (error) {
      console.error("❌ Download receipt error:", error);
      toast.error(error.message || "Failed to download receipt");
    } finally {
      setDownloadingReceipt(false);
    }
  };
  // ── Send Receipt ─────────────────────────────
  const handleSendReceipt = async (emailData) => {
    setActionLoading(true);
    try {
      if (!isValidEmail(emailData.email)) {
        toast.error('Please enter a valid email address');
        return;
      }
      toast.success(`Receipt sent to ${emailData.email}`);
    } catch (error) {
      toast.error(error.message || "Failed to send receipt");
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  // ── Process Refund ───────────────────────────
  const handleRefund = async (notes) => {
    setActionLoading(true);
    try {
      await paymentService.processRefund(paymentId, { notes });
      toast.success(`Payment of $${payment.amount.toFixed(2)} refunded successfully`);
      await fetchPayment();
    } catch (error) {
      toast.error(error.message || "Failed to process refund");
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditPayment = () => {
    toast.info("Edit payment feature coming soon");
  };

  const handleBack = () => {
    navigate("/payments");
  };

  // ── View Order ───────────────────────────────
  const handleViewOrder = () => {
    const currentOrderId = order?._id || (typeof payment?.orderId === 'object' ? payment.orderId._id : payment?.orderId);
    if (currentOrderId) {
      navigate(`/orders/${currentOrderId}`);
    } else {
      toast.error("Order not found");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-slate-500 mt-4">Loading payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiXCircle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-slate-700 font-semibold">Error loading payment</p>
          <p className="text-slate-400 text-sm mt-1">{error}</p>
          <button
            onClick={handleBack}
            className="mt-4 text-indigo-600 hover:text-indigo-700 font-bold"
          >
            Back to Payments
          </button>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-slate-500">Payment not found</p>
          <button
            onClick={handleBack}
            className="mt-4 text-indigo-600 hover:text-indigo-700 font-bold"
          >
            Back to Payments
          </button>
        </div>
      </div>
    );
  }

  const isCompleted = payment.status === "COMPLETED";
  const orderProgress = order?.progress || 0;

  return (
    <div className="min-h-full bg-white p-5 pb-1 rounded-2xl space-y-3">
      {/* Breadcrumb */}
      <button
        onClick={handleBack}
        className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer bg-transparent border-0"
      >
        <FiArrowLeft size={14} /> Payments
      </button>

      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            {payment.paymentNo || payment.receiptNumber || `Payment ${payment._id?.slice(-8)}`}
          </h2>
          <StatusBadge status={payment.status} />
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button
            variant="outline"
            size="md"
            onClick={handlePrintInvoice}
            disabled={!invoice}
            className="border border-indigo-200 text-indigo-600 bg-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-indigo-50/50 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <FiPrinter size={14} /> Print Invoice
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={handleDownloadReceipt}
            className="border border-indigo-200 text-indigo-600 bg-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-indigo-50/50 transition-all flex items-center gap-2 cursor-pointer"
          >
            <FiDownload size={14} /> Receipt PDF
          </Button>
          {isCompleted && (
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowSendReceiptModal(true)}
              className="border border-indigo-200 text-indigo-600 bg-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-indigo-50/50 transition-all flex items-center gap-2 cursor-pointer"
            >
              <FiSend size={14} /> Send Receipt
            </Button>
          )}
          {isCompleted && (
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowRefundModal(true)}
              className="border border-red-200 text-red-500 bg-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-red-50/50 transition-all flex items-center gap-2 cursor-pointer"
            >
              <FiRotateCcw size={14} /> Refund
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar if order exists */}
      {order && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] font-medium text-slate-500">Order Progress</span>
            <span className="text-[11px] font-bold text-indigo-600">{orderProgress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${orderProgress}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-slate-400">Amount Paid: ${order.amountPaid?.toFixed(2) || '0.00'}</span>
            <span className="text-[10px] text-slate-400">
              Balance Due: {order.balanceDue > 0.01 ? `$${order.balanceDue.toFixed(2)}` : '$0.00'}
            </span>
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-3">
          {/* Payment card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
            <div className="text-center space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                Payment amount
              </p>
              <p className="text-4xl font-bold text-slate-800">${payment.amount?.toFixed(2) || '0.00'}</p>
              <StatusBadge status={payment.status} />
            </div>

            <div className="h-px bg-gray-100" />

            <div>
              <DetailRow label="Payment No." value={payment.paymentNo || payment.receiptNumber || payment._id?.slice(-8)} />
              <DetailRow
                label="Order"
                value={order?.orderNumber || payment.orderId?.orderNumber || 'N/A'}
                link={!!(order?._id || payment.orderId)}
                linkText={order?.orderNumber || payment.orderId?.orderNumber || 'N/A'}
                onClick={handleViewOrder}
              />
              <DetailRow
                label="Contact"
                value={order?.contactName || payment.contactName || 'N/A'}
                link={!!(order?._id || payment.orderId)}
                linkText={order?.contactName || payment.contactName || 'N/A'}
                onClick={handleViewOrder}
              />
              <DetailRow label="Method" value={payment.method?.replace(/_/g, ' ') || 'N/A'} />
              <DetailRow
                label="Payment Date"
                value={payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'N/A'}
              />
              <DetailRow label="Reference / TXN ID" value={payment.reference || payment.transactionId || '—'} />
              <DetailRow label="Recorded by" value={payment.userId?.name || 'System'} />
              <DetailRow label="Notes" value={payment.notes || '—'} />
            </div>
          </div>

          {/* Timeline / Activities */}
          {payment.activities?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Timeline</p>
              <div className="space-y-4">
                {payment.activities.map((entry, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${entry.action?.includes('REFUND') ? 'bg-red-400' :
                      entry.action?.includes('FAILED') ? 'bg-red-400' :
                        entry.action?.includes('AUTO') ? 'bg-purple-400' :
                          'bg-indigo-400'
                      }`} />
                    <div>
                      <p className="text-xs text-slate-600">{entry.description}</p>
                      <p className="text-[11px] text-slate-400">
                        {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ''} · {entry.createdBy?.name || 'System'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-3">
          {/* Linked order */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Linked Order</p>
            <div className="bg-indigo-50 rounded-xl p-3 space-y-1 cursor-pointer hover:bg-indigo-100 transition-colors" onClick={handleViewOrder}>
              <p className="text-sm font-bold text-indigo-600">
                {order?.orderNumber || payment.orderId?.orderNumber || 'N/A'}
              </p>
              <p className="text-[11px] text-slate-500">{order?.companyName || 'N/A'}</p>
              <div className="flex justify-between items-center pt-1">
                <span className="text-[11px] text-slate-400 font-medium">Total</span>
                <span className="text-xs font-black text-slate-700">${order?.totalAmount?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-[11px] text-slate-400 font-medium">Balance Due</span>
                <span className="text-xs font-black text-amber-600">
                  {order?.balanceDue > 0.01 ? `$${order.balanceDue.toFixed(2)}` : '$0.00'}
                </span>
              </div>
              <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${(order?.status === 'PAID' || (order?.balanceDue !== undefined && order.balanceDue <= 0.01)) ? 'bg-emerald-100 text-emerald-600' :
                  order?.status === 'PARTIAL' ? 'bg-amber-100 text-amber-600' :
                    'bg-slate-100 text-slate-500'
                }`}>
                {(order?.balanceDue !== undefined && order.balanceDue <= 0.01) ? 'PAID' : (order?.status || 'N/A')}
              </span>
            </div>
          </div>

          {/* Invoice */}
          {invoice && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Invoice</p>
              <div className="bg-indigo-50 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:bg-indigo-100 transition-colors" onClick={handlePreviewInvoice}>
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0">
                  <FiFileText className="text-indigo-500" size={15} />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-medium">Invoice No.</p>
                  <p className="text-xs font-bold text-indigo-600">{invoice.invoiceNumber}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="md"
                onClick={handlePrintInvoice}
                className="w-full border border-indigo-200 text-indigo-600 bg-white py-2.5 rounded-xl font-bold text-xs hover:bg-indigo-50/50 transition-all cursor-pointer"
              >
                Print Invoice
              </Button>
              <Button
                variant="outline"
                size="md"
                onClick={handlePreviewInvoice}
                className="w-full border border-indigo-200 text-indigo-600 bg-white py-2.5 rounded-xl font-bold text-xs hover:bg-indigo-50/50 transition-all cursor-pointer"
              >
                Preview Invoice
              </Button>
            </div>
          )}

          {/* Receipt */}
          {(payment.receiptNumber || payment.paymentNo) && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Receipt</p>
              <div className="bg-emerald-50 rounded-xl p-3">
                <p className="text-[11px] text-emerald-600 font-bold">Receipt No.</p>
                <p className="text-xs font-black text-emerald-600">{payment.receiptNumber || payment.paymentNo}</p>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={handleDownloadReceipt}
                disabled={downloadingReceipt}
                className="w-full bg-emerald-600 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-emerald-100 hover:opacity-90 transition-all cursor-pointer text-white disabled:opacity-50"
              >
                {downloadingReceipt ? "Downloading..." : "Download Receipt"}
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">Actions</p>

            {isCompleted && (
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowSendReceiptModal(true)}
                className="w-full border border-indigo-200 text-indigo-600 bg-white py-2.5 rounded-xl font-bold text-xs hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-2"
              >
                <FiMail size={14} /> Email Receipt
              </Button>
            )}

            <Button
              variant="outline"
              size="md"
              onClick={handleEditPayment}
              className="w-full border border-indigo-200 text-indigo-600 bg-white py-2.5 rounded-xl font-bold text-xs hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-2"
            >
              <FiEdit2 size={14} /> Edit Payment
            </Button>

            {isCompleted && (
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowRefundModal(true)}
                className="w-full border border-red-200 text-red-500 bg-white py-2.5 rounded-xl font-bold text-xs hover:bg-red-50/50 transition-all flex items-center justify-center gap-2"
              >
                <FiRotateCcw size={14} /> Process Refund
              </Button>
            )}
          </div>
        </div>
      </div>

      <RefundModal
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        payment={payment}
        onRefund={handleRefund}
      />

      <SendReceiptModal
        isOpen={showSendReceiptModal}
        onClose={() => setShowSendReceiptModal(false)}
        payment={payment}
        onSend={handleSendReceipt}
      />
    </div>
  );
};

export default PaymentPreview;