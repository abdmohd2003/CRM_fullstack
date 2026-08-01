import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiCheck,
  FiFileText,
  FiArrowLeft,
  FiDownload,
  FiMail,
  FiPrinter,
  FiX,
  FiPlus,
  FiAlertTriangle,
  FiCheckCircle,
  FiPackage,
} from "react-icons/fi";
import { toast } from "react-toastify";

import Button from "../../components/ui/Button";
import { useOrder } from "../../contexts/orderContext";
import invoiceService from "../../services/order/invoiceService";
import orderService from "../../services/order/orderService";

// Round to 2 decimal places, guarding against IEEE-754 float drift.
// Used for any money value that gets displayed after arithmetic.
const round2 = (n) => Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;

// ─────────────────────────────────────────────
// PAYMENT MODAL
// ─────────────────────────────────────────────
const PaymentModal = ({ isOpen, onClose, order, onPaymentRecorded }) => {
  const { recordPayment } = useOrder();
  const [formData, setFormData] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    method: 'BANK_TRANSFER',
    reference: '',
    transactionId: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  // Display and cap against a rounded balance, not a raw float, so the
  // "full payment" amount a user copies from this label always matches
  // exactly what the backend will accept as fully paid.
  const roundedBalanceDue = round2(order.balanceDue);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFillFullAmount = () => {
    setFormData(prev => ({ ...prev, amount: roundedBalanceDue.toFixed(2) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setSubmitting(true);
    try {
      const paymentData = {
        orderId: order._id,
        amount: round2(parseFloat(formData.amount)),
        paymentDate: formData.paymentDate,
        method: formData.method,
        reference: formData.reference || undefined,
        transactionId: formData.transactionId || undefined,
        notes: formData.notes || undefined,
      };

      await recordPayment(paymentData);
      toast.success(`Payment of $${formData.amount} recorded successfully!`);
      onPaymentRecorded();
      onClose();
    } catch (error) {
      toast.error(error.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-[480px] max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-slate-800">Record Payment</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          Order: <span className="font-semibold text-slate-700">{order.orderNumber}</span>
        </p>
        <p className="text-sm text-slate-500 mb-6">
          Balance Due: <span className="font-bold text-amber-600">${roundedBalanceDue.toFixed(2)}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                Amount *
              </label>
              {/* Explicit "pay in full" button instead of relying on the
                  user to manually retype the balance due — removes any
                  chance of a typo or stale copy-paste causing a 1-cent
                  shortfall. */}
              <button
                type="button"
                onClick={handleFillFullAmount}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Pay full amount
              </button>
            </div>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              max={roundedBalanceDue}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-400 transition-all"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
              Payment Date *
            </label>
            <input
              type="date"
              name="paymentDate"
              value={formData.paymentDate}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-400 transition-all"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
              Payment Method *
            </label>
            <select
              name="method"
              value={formData.method}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-400 transition-all"
              required
            >
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
              <option value="ONLINE">Online</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
              Reference
            </label>
            <input
              type="text"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
              placeholder="Invoice number or reference"
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-400 transition-all"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
              Transaction ID
            </label>
            <input
              type="text"
              name="transactionId"
              value={formData.transactionId}
              onChange={handleChange}
              placeholder="Transaction ID from bank"
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-400 transition-all"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block mb-1.5">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes about this payment"
              rows="2"
              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-400 transition-all resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
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
              {submitting ? "Recording..." : "Confirm Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const styles = {
    DRAFT: "bg-slate-100 text-slate-500",
    CONFIRMED: "bg-blue-50 text-blue-600",
    INVOICED: "bg-amber-50 text-amber-600",
    PARTIAL: "bg-orange-50 text-orange-500",
    PAID: "bg-emerald-50 text-emerald-600",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-50 text-red-500",
  };

  return (
    <span className={`px-3 py-1 rounded-md text-[11px] font-bold ${styles[status] || styles.DRAFT}`}>
      {status || "DRAFT"}
    </span>
  );
};

// ─────────────────────────────────────────────
// ORDER STEPPER
// ─────────────────────────────────────────────
const STAGES = ["DRAFT", "CONFIRMED", "INVOICED", "PAID", "COMPLETED"];

const OrderStepper = ({ status }) => {
  const activeIndex = STAGES.indexOf(status);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-10 py-6">
      <div className="flex items-center">
        {STAGES.map((stage, i) => {
          const isDone = i < activeIndex;
          const isActive = i === activeIndex;

          return (
            <React.Fragment key={stage}>
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all
                    ${isDone
                      ? "bg-[#6366F1] text-white"
                      : isActive
                        ? "border-2 border-[#6366F1] bg-white"
                        : "border-2 border-gray-200 bg-white"
                    }`}
                >
                  {isDone && <FiCheck size={12} />}
                  {isActive && <div className="w-2 h-2 rounded-full bg-[#6366F1]" />}
                </div>
                <span
                  className={`text-[11px] font-bold whitespace-nowrap ${isDone || isActive ? "text-slate-700" : "text-gray-300"
                    }`}
                >
                  {stage}
                </span>
              </div>

              {i < STAGES.length - 1 && (
                <div
                  className={`flex-1 h-[2px] mx-2 rounded-full mb-5 transition-all duration-300 ${i < activeIndex ? "bg-[#6366F1]" : "bg-gray-100"
                    }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN ORDER PREVIEW / DETAIL PAGE
// ─────────────────────────────────────────────
const OrderPreview = () => {
  const { orderId: paramOrderId } = useParams();
  const navigate = useNavigate();
  const {
    currentOrder: order,
    loading,
    fetchOrderById,
    confirmOrder,
    generateInvoice,
    recordPayment,
    markOrderCompleted,
    cancelOrder,
  } = useOrder();

  const [actionLoading, setActionLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const isValidEmail = (email) => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const getOrderId = () => {
    if (paramOrderId) return paramOrderId;
    if (order?._id) return order._id;
    const pathParts = window.location.pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && lastPart !== 'orders' && lastPart !== '') return lastPart;
    return null;
  };

  const orderId = getOrderId();

  useEffect(() => {
    if (orderId) {
      fetchOrderById(orderId)
        .then(() => setFetchError(false))
        .catch(err => {
          console.error('❌ Failed to fetch order:', err);
          setFetchError(true);
        });
    } else {
      toast.error('Order ID is missing. Redirecting...');
      const timer = setTimeout(() => navigate('/orders'), 2000);
      return () => clearTimeout(timer);
    }
  }, [orderId]);

  const handleConfirmOrder = async () => {
    const orderIdToUse = orderId || order?._id;
    if (!orderIdToUse) return toast.error('Order ID is missing');

    setActionLoading(true);
    try {
      await confirmOrder(orderIdToUse, true);
      toast.success(`Order ${order.orderNumber} confirmed!`);
      await fetchOrderById(orderIdToUse);
    } catch (error) {
      toast.error(error.message || "Failed to confirm order");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    const orderIdToUse = orderId || order?._id;
    if (!orderIdToUse) return toast.error('Order ID is missing. Please refresh.');
    if (order?.invoiceNumber) return toast.info(`Invoice ${order.invoiceNumber} already exists`);

    setActionLoading(true);
    try {
      const response = await generateInvoice(orderIdToUse);
      toast.success(response?.invoice?.invoiceNumber ? `Invoice ${response.invoice.invoiceNumber} generated!` : 'Invoice generated successfully!');
      await fetchOrderById(orderIdToUse);
    } catch (error) {
      if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
        toast.info('An invoice already exists for this order');
        await fetchOrderById(orderIdToUse);
      } else {
        toast.error(error.message || "Failed to generate invoice");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendInvoice = async () => {
    const orderIdToUse = orderId || order?._id;
    if (!orderIdToUse) return toast.error('Order ID is missing');
    if (!isValidEmail(order?.contactEmail)) return toast.error('❌ No valid customer email found.');

    setActionLoading(true);
    try {
      const invoiceResponse = await invoiceService.getInvoiceByOrder(orderIdToUse);
      const invoice = invoiceResponse.data;
      if (!invoice) return toast.error("No invoice found for this order");

      await invoiceService.sendInvoiceEmail(invoice._id, {
        email: order.contactEmail,
        subject: `Invoice ${invoice.invoiceNumber} from CRM Platform`,
        message: `Dear ${order.contactName},\n\nPlease find attached invoice ${invoice.invoiceNumber}.\n\nAmount Due: $${round2(order.balanceDue ?? order.totalAmount).toFixed(2)}\n\nThank you for your business.`
      });

      toast.success(`Invoice ${invoice.invoiceNumber} sent to ${order.contactEmail}`);
      await fetchOrderById(orderIdToUse);
    } catch (error) {
      toast.error(error.message || "Failed to send invoice");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    const orderIdToUse = orderId || order?._id;
    if (!orderIdToUse) return toast.error('Order ID is missing');

    try {
      const invoiceResponse = await invoiceService.getInvoiceByOrder(orderIdToUse);
      const invoice = invoiceResponse.data;
      if (!invoice) return toast.error("No invoice found for this order");

      const blob = await invoiceService.downloadInvoice(invoice._id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      toast.error(error.message || "Failed to download invoice");
    }
  };

  const handlePrintInvoice = async () => {
    const orderIdToUse = orderId || order?._id;
    if (!orderIdToUse) return toast.error('Order ID is missing');

    try {
      const invoiceResponse = await invoiceService.getInvoiceByOrder(orderIdToUse);
      const invoice = invoiceResponse.data;
      if (!invoice) return toast.error("No invoice found for this order");

      await invoiceService.printInvoice(invoice._id);
    } catch (error) {
      toast.error(error.message || "Failed to print invoice");
    }
  };

  const handleMarkCompleted = async () => {
    const orderIdToUse = orderId || order?._id;
    if (!orderIdToUse) return toast.error('Order ID is missing');

    setActionLoading(true);
    try {
      await markOrderCompleted(orderIdToUse);
      toast.success(`Order ${order.orderNumber} marked as completed!`);
      await fetchOrderById(orderIdToUse);
    } catch (error) {
      toast.error(error.message || "Failed to mark order as completed");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePaymentRecorded = () => {
    if (orderId || order?._id) fetchOrderById(orderId || order._id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-slate-500 mt-4">Loading order...</p>
        </div>
      </div>
    );
  }

  if (fetchError || !order) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiAlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-slate-700 font-semibold">Order not found</p>
          <button onClick={() => navigate("/orders")} className="mt-4 text-indigo-600 hover:text-indigo-700 font-bold">
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const lineTotals = order.lineItems?.map((item) => {
    const gross = item.quantity * item.unitPrice;
    const discountAmt = gross * (item.discount / 100);
    return { ...item, gross, discountAmt, total: gross - discountAmt };
  }) || [];

  const subtotal = lineTotals.reduce((sum, i) => sum + i.gross, 0);
  const totalDiscount = lineTotals.reduce((sum, i) => sum + i.discountAmt, 0);
  const taxable = subtotal - totalDiscount;
  const tax = taxable * (order.taxRate / 100);
  const orderTotal = taxable + tax;

  // Use the backend's canonical order.balanceDue instead of recomputing
  // (order.totalAmount - order.amountPaid) here in the frontend. That
  // independent subtraction was never rounded/clamped, so it could show
  // a stray $0.01/$0.02 even when the backend correctly considers the
  // order fully paid. order.balanceDue is already rounded server-side
  // (see Order.js pre-save hook + orderHelpers.js), so displaying it
  // directly (rounded again defensively here) keeps this page in sync
  // with what the backend actually charged/recorded.
  const balanceDue = Math.max(0, round2(order.balanceDue));

  const hasInvoice = order.invoiceNumber;
  const canConfirm = order.status === 'DRAFT';
  const canGenerateInvoice = order.status === 'CONFIRMED' && !hasInvoice;
  const canRecordPayment = order.status === 'INVOICED' || order.status === 'PARTIAL';
  const canMarkCompleted = order.status === 'PAID' && !order.completedAt;
  const isCompleted = order.status === 'COMPLETED';
  const hasValidEmail = isValidEmail(order.contactEmail);

  const getCompanyName = () => (order.companyName && order.companyName !== 'Unknown Company') ? order.companyName : 'N/A';
  const getContactName = () => (order.contactName && order.contactName !== 'Unknown User') ? order.contactName : (order.dealId?.contactName || 'N/A');
  const getDealName = () => order.dealId ? (typeof order.dealId === 'object' ? order.dealId.name : order.dealId) : '-';

  return (
    <div className="min-h-full bg-white p-5 pb-1 rounded-2xl space-y-3">
      <button type="button" onClick={() => navigate("/orders")} className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
        <FiArrowLeft size={14} /> Orders
      </button>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">{order.orderNumber}</h2>
          <StatusBadge status={order.status} />
          {order.completedAt && (
            <span className="text-[10px] font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
              Completed {new Date(order.completedAt).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="flex gap-3 flex-wrap">
          {canConfirm && (
            <Button variant="primary" size="md" onClick={handleConfirmOrder} disabled={actionLoading} className="bg-[#6366F1] px-6 py-2 rounded-xl font-bold text-xs shadow-md">
              {actionLoading ? "Processing..." : "Confirm Order"}
            </Button>
          )}
          {canGenerateInvoice && (
            <Button variant="primary" size="md" onClick={handleGenerateInvoice} disabled={actionLoading} className="bg-amber-500 px-6 py-2 rounded-xl font-bold text-xs shadow-md">
              Generate Invoice
            </Button>
          )}
          {canRecordPayment && (
            <Button variant="primary" size="md" onClick={() => setShowPaymentModal(true)} className="bg-emerald-500 px-6 py-2 rounded-xl font-bold text-xs shadow-md">
              <FiPlus className="inline mr-1" /> Record Payment
            </Button>
          )}
          {canMarkCompleted && (
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-sm font-bold text-emerald-600">✅ Order Fully Paid</p>
              <button
                onClick={handleMarkCompleted}
                disabled={actionLoading}
                className="mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiPackage className="inline mr-1" size={12} /> Mark as Completed
              </button>
            </div>
          )}
          {hasInvoice && (
            <>
              <Button variant="outline" size="md" onClick={handleDownloadInvoice} className="border border-indigo-200 text-indigo-600 bg-white px-4 py-2 rounded-xl font-bold text-xs">
                <FiDownload className="inline mr-1" /> PDF
              </Button>
              <Button variant="outline" size="md" onClick={handleSendInvoice} disabled={!hasValidEmail} className={`border border-indigo-200 text-indigo-600 bg-white px-4 py-2 rounded-xl font-bold text-xs ${!hasValidEmail ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <FiMail className="inline mr-1" /> Email
              </Button>
              <Button variant="outline" size="md" onClick={handlePrintInvoice} className="border border-indigo-200 text-indigo-600 bg-white px-4 py-2 rounded-xl font-bold text-xs">
                <FiPrinter className="inline mr-1" /> Print
              </Button>
            </>
          )}
        </div>
      </div>

      <OrderStepper status={order.status} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 space-y-3">
          {/* Line items section */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Line Items</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-2 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Product</th>
                    <th className="py-2 text-right text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Qty</th>
                    <th className="py-2 text-right text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Unit Price</th>
                    <th className="py-2 text-right text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Disc.</th>
                    <th className="py-2 text-right text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lineTotals.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/40 transition-all">
                      <td className="py-4">
                        <p className="text-xs font-bold text-slate-700">{item.productName}</p>
                        <p className="text-[11px] text-slate-400">{item.description || '-'}</p>
                      </td>
                      <td className="py-4 text-right text-xs font-medium text-slate-500">{item.quantity}</td>
                      <td className="py-4 text-right text-xs font-medium text-slate-500">${item.unitPrice.toFixed(2)}</td>
                      <td className="py-4 text-right text-xs font-medium">
                        {item.discount ? <span className="text-emerald-500">{item.discount}%</span> : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="py-4 text-right text-xs font-bold text-slate-700">${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="w-full space-y-2 pt-2 border-t border-gray-100">
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>Tax ({order.taxRate}%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-800">
                <span>Total</span>
                {/* Display the backend's canonical totalAmount rather than
                    this page's own recomputed orderTotal, so the number
                    shown here always matches what balanceDue is based on. */}
                <span>${round2(order.totalAmount ?? orderTotal).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payments Status Tracking */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            {/* Header & Buttons */}
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                Payments
              </p>
              <div className="flex items-center gap-2">
                
                {canRecordPayment && (
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(true)}
                    className="px-3 py-1.5 bg-[#6366F1] text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors flex items-center"
                  >
                    <FiPlus className="inline mr-1" size={12} /> Record
                  </button>
                )}
              </div>
            </div>

            {/* Progress Bar Container */}
            <div className="space-y-2.5">
              {/* The Progress Bar Line */}
              <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#6366F1] transition-all duration-500 ease-in-out rounded-full"
                  style={{
                    width: `${order.totalAmount > 0
                        ? Math.min(100, ((order.amountPaid || 0) / order.totalAmount) * 100)
                        : 0
                      }%`,
                  }}
                />
              </div>

              {/* Amount Labels */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">
                  ${round2(order.amountPaid).toFixed(2)} paid
                </span>
                <span className="text-amber-500 font-medium">
                  ${balanceDue.toFixed(2)} due
                </span>
              </div>
            </div>

            {/* Payments List or Empty State */}
            {order.payments?.length > 0 ? (
              <div className="space-y-2 mt-4 pt-4 border-t border-slate-50">
                {order.payments.map((payment) => (
                  <div key={payment._id} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-xs font-bold text-slate-700">${payment.amount.toFixed(2)}</p>
                      <p className="text-[10px] text-slate-400">{payment.method?.replace(/_/g, ' ')}</p>
                    </div>
                    <span className={`text-[10px] font-bold ${payment.status === 'COMPLETED' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {payment.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">
                No payments yet.{" "}
                {canRecordPayment && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="text-[#6366F1] font-medium hover:underline ml-1"
                  >
                    Record first &rarr;
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Info blocks column */}
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Summary</p>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Order total</p>
              <p className="text-lg font-bold text-slate-800">${round2(order.totalAmount ?? orderTotal).toFixed(2)}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3">
              <p className="text-[11px] text-emerald-600 font-bold">Amount paid</p>
              <p className="text-sm font-bold text-emerald-600">${round2(order.amountPaid).toFixed(2)}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3">
              <p className="text-[11px] text-amber-600 font-bold">Balance due</p>
              <p className="text-sm font-black text-amber-600">${balanceDue.toFixed(2)}</p>
            </div>
            {order.status === 'PAID' && (
              <div className="bg-emerald-50 rounded-xl p-3 text-center">
                <p className="text-sm font-bold text-emerald-600">✅ Order Fully Paid</p>
                <button onClick={handleMarkCompleted} className="mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors">
                  <FiPackage className="inline mr-1" size={12} /> Mark as Completed
                </button>
              </div>
            )}
            {order.status === 'COMPLETED' && (
              <div className="bg-green-50 rounded-xl p-3 text-center border border-green-200">
                <FiCheckCircle className="w-6 h-6 text-green-500 mx-auto mb-1" />
                <p className="text-sm font-bold text-green-700">✅ Order Completed</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Invoice</p>
            {hasInvoice ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                  <FiFileText className="text-indigo-500" size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-indigo-600">{order.invoiceNumber}</p>
                  <p className="text-[11px] text-slate-400">{order.invoiceGeneratedAt ? new Date(order.invoiceGeneratedAt).toLocaleDateString() : 'Pending'}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-300 text-center py-3">No invoice yet</p>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Details</p>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Contact</p>
              <p className="text-xs font-bold text-slate-700">{getContactName()}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Company</p>
              <p className="text-xs font-bold text-slate-700">{getCompanyName()}</p>
            </div>
            {order.dealId && (
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Deal</p>
                <p className="text-xs font-bold text-slate-700">{getDealName()}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <PaymentModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} order={order} onPaymentRecorded={handlePaymentRecorded} />
    </div>
  );
};

export default OrderPreview;