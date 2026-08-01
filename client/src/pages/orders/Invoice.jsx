import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiPrinter, FiDownload, FiSend, FiMail, FiCheckCircle, FiX } from "react-icons/fi";
import { toast } from "react-toastify";

import Button from "../../components/ui/Button";
import { useOrder } from "../../contexts/orderContext";
import invoiceService from "../../services/order/invoiceService";

// ─────────────────────────────────────────────
// SEND INVOICE EMAIL MODAL
// ─────────────────────────────────────────────
const SendEmailModal = ({ isOpen, onClose, invoice, onSend }) => {
  const [formData, setFormData] = useState({
    email: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (invoice && isOpen) {
      const order = invoice.orderId || {};
      setFormData({
        email: order.contactEmail || '',
        subject: `Invoice ${invoice.invoiceNumber} from CRM Platform`,
        message: `Dear ${order.contactName || 'Customer'},\n\nPlease find attached invoice ${invoice.invoiceNumber} for your order ${order.orderNumber || 'N/A'}.\n\nAmount Due: $${order.balanceDue?.toFixed(2) || '0.00'}\nDue Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}\n\nThank you for your business.`
      });
    }
  }, [invoice, isOpen]);

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
          <h3 className="text-xl font-bold text-slate-800">Send Invoice Email</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>

        <p className="text-sm text-slate-500 mb-4">
          Sending: <span className="font-semibold text-slate-700">{invoice?.invoiceNumber}</span>
        </p>

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
              rows="6"
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
              {submitting ? "Sending..." : <><FiSend className="inline mr-2" /> Send Email</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// MAIN INVOICE PREVIEW
// ─────────────────────────────────────────────
const InvoicePreview = () => {
  console.log("InvoicePreview Loaded");
  const { invoiceId, orderId } = useParams();
  const navigate = useNavigate();
  const { fetchOrderById } = useOrder();
  
  const [invoice, setInvoice] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // ── Fetch Invoice ────────────────────────────
  const fetchInvoice = async () => {
    try {
      setLoading(true);
      
      // If we have orderId, get order first then invoice
      let invoiceIdToFetch = invoiceId;
      
      if (orderId && !invoiceId) {
        // Get invoice by order
        const invoiceResponse = await invoiceService.getInvoiceByOrder(orderId);
        if (invoiceResponse.success && invoiceResponse.data) {
          invoiceIdToFetch = invoiceResponse.data._id;
        }
      }
      
      if (invoiceIdToFetch) {
        const response = await invoiceService.getInvoiceById(invoiceIdToFetch);
        if (response.success) {
          setInvoice(response.data);
          
          // Fetch order details using OrderContext
          if (response.data.orderId) {
            const orderData = await fetchOrderById(response.data.orderId);
            if (orderData) {
              setOrder(orderData);
            }
          }
        } else {
          toast.error(response.message || "Failed to fetch invoice");
        }
      } else {
        toast.error("Invoice not found");
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
      toast.error(error.message || "Failed to fetch invoice");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (invoiceId || orderId) {
      fetchInvoice();
    }
  }, [invoiceId, orderId]);

  // ── Download PDF ─────────────────────────────
  const handleDownloadPDF = async () => {
    try {
      const blob = await invoiceService.downloadInvoice(invoice._id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Invoice downloaded successfully");
    } catch (error) {
      toast.error(error.message || "Failed to download invoice");
    }
  };

  // ── Print Invoice ────────────────────────────
  const handlePrint = async () => {
    try {
      await invoiceService.printInvoice(invoice._id);
    } catch (error) {
      toast.error(error.message || "Failed to print invoice");
    }
  };

  // ── Send Email ──────────────────────────────
  const handleSendEmail = async (emailData) => {
    setActionLoading(true);
    try {
      await invoiceService.sendInvoiceEmail(invoice._id, emailData);
      toast.success(`Invoice ${invoice.invoiceNumber} sent to ${emailData.email}`);
      await fetchInvoice();
    } catch (error) {
      toast.error(error.message || "Failed to send invoice email");
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  // ── Back to Order ────────────────────────────
  const handleBackToOrder = () => {
    if (order?._id) {
      navigate(`/orders/${order._id}`);
    } else if (invoice?.orderId) {
      navigate(`/orders/${invoice.orderId}`);
    } else {
      navigate("/orders");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-slate-500 mt-4">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-slate-500">Invoice not found</p>
          <button
            onClick={() => navigate("/orders")}
            className="mt-4 text-indigo-600 hover:text-indigo-700 font-bold"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  // ── Calculate totals ─────────────────────────
  const orderData = order || invoice.orderId;
  const lineItems = orderData?.lineItems || [];

  console.log("ORDER DATA", orderData);
console.log("LINE ITEMS", orderData?.lineItems);
  
  const lineTotals = lineItems.map((item) => {
    const gross = item.quantity * item.unitPrice;
    const discountAmt = gross * (item.discount / 100);
    return { ...item, gross, discountAmt, total: gross - discountAmt };
  });

  const subtotal = lineTotals.reduce((sum, i) => sum + i.gross, 0);
  const totalDiscount = lineTotals.reduce((sum, i) => sum + i.discountAmt, 0);
  const taxable = subtotal - totalDiscount;
  const tax = taxable * (invoice.taxRate || 15) / 100;
  const totalDue = taxable + tax;

  const statusStyles = {
    INVOICED: "bg-amber-50 text-amber-600",
    PAID: "bg-emerald-50 text-emerald-600",
    PARTIAL: "bg-orange-50 text-orange-500",
    DRAFT: "bg-slate-100 text-slate-500",
  };

  const status = orderData?.status || invoice.status || "INVOICED";

  return (
    <div className="min-h-full bg-white p-5 pb-1 rounded-2xl space-y-3">
      {/* Back link */}
      <button
        type="button"
        onClick={handleBackToOrder}
        className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
      >
        <FiArrowLeft size={14} /> Back to order
      </button>

      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h2 className="text-xl font-semibold text-slate-800 tracking-tight">Invoice Preview</h2>
        <div className="flex gap-3 flex-wrap">
          <Button
            variant="outline"
            size="md"
            onClick={handlePrint}
            className="border border-indigo-200 text-indigo-600 bg-white px-5 py-2 rounded-xl font-bold text-xs hover:bg-indigo-50/50 transition-all flex items-center gap-2 cursor-pointer"
          >
            <FiPrinter size={14} /> Print
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={handleDownloadPDF}
            className="border border-indigo-200 text-indigo-600 bg-white px-5 py-2 rounded-xl font-bold text-xs hover:bg-indigo-50/50 transition-all flex items-center gap-2 cursor-pointer"
          >
            <FiDownload size={14} /> Download PDF
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => setShowEmailModal(true)}
            className="bg-[#6366F1] px-5 py-2 rounded-xl font-bold text-xs shadow-md shadow-indigo-100 hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer"
          >
            <FiSend size={14} /> Send Email
          </Button>
        </div>
      </div>

      {/* Invoice Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-5">
        {/* Top: company + invoice meta */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-indigo-600">CRM Platform</h3>
            <p className="text-xs text-slate-400 mt-1">123 Business Ave, Suite 100</p>
            <p className="text-xs text-slate-400">
              billing@crm.io · +1 415 555 0100
            </p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-slate-800 tracking-tight">INVOICE</p>
            <p className="text-xs font-bold text-indigo-600 mt-1">{invoice.invoiceNumber}</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Date: {invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : 'N/A'}
            </p>
            <p className="text-[11px] text-slate-400">
              Due: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>

        <div className="h-[2px] bg-[#6366F1] rounded-full" />

        {/* Bill to + order ref */}
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Bill To</p>
            <p className="text-sm font-bold text-slate-700 mt-1">
              {orderData?.contactName || invoice.billTo?.name || 'N/A'}
            </p>
            <p className="text-xs text-slate-400">
              {orderData?.companyName || invoice.billTo?.company || 'N/A'} · {orderData?.contactEmail || invoice.billTo?.email || 'N/A'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">Order Ref</p>
            <p className="text-sm font-bold text-indigo-600 mt-1">
              {orderData?.orderNumber || invoice.orderId?.orderNumber || 'N/A'}
            </p>
            <span className={`inline-block mt-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${statusStyles[status] || statusStyles.INVOICED}`}>
              {status}
            </span>
          </div>
        </div>

        {/* Line items table */}
        <div className="rounded-xl overflow-hidden border border-gray-100">
          <table className="w-full">
            <thead className="bg-[#6366F1] text-white">
              <tr>
                <th className="px-6 py-3 text-left text-[10px] font-black uppercase tracking-[0.15em]">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-[0.15em]">
                  Qty
                </th>
                <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-[0.15em]">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-[0.15em]">
                  Disc.
                </th>
                <th className="px-6 py-3 text-right text-[10px] font-black uppercase tracking-[0.15em]">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/70 bg-white">
              {lineTotals.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50/40 transition-all">
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-slate-700">{item.productName}</p>
                    <p className="text-[11px] text-slate-400">{item.description || '-'}</p>
                  </td>
                  <td className="px-6 py-4 text-right text-xs font-medium text-slate-500">{item.quantity}</td>
                  <td className="px-6 py-4 text-right text-xs font-medium text-slate-500">
                    ${item.unitPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right text-xs font-medium">
                    {item.discount ? (
                      <span className="text-emerald-500">{item.discount}%</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-xs font-bold text-slate-700">
                    ${item.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-xs text-slate-400 font-medium">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400 font-medium">
              <span>Discount</span>
              <span className="text-red-400">-${totalDiscount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400 font-medium">
              <span>Tax ({invoice.taxRate || 15}%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between text-sm font-bold text-slate-800">
              <span>Total due</span>
              <span className="text-indigo-600">${(orderData?.totalAmount || totalDue).toFixed(2)}</span>
            </div>
            {orderData?.amountPaid > 0 && (
              <>
                <div className="flex justify-between text-xs font-medium text-emerald-600">
                  <span>Amount paid</span>
                  <span>${orderData.amountPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-amber-600">
                  <span>Balance due</span>
                  <span>${(orderData.totalAmount - orderData.amountPaid).toFixed(2)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bank transfer details */}
        <div className="bg-indigo-100 rounded-xl p-4">
          <p className="text-xs font-black text-indigo-600">Bank transfer details</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Bank: Chase Bank · Account: 1234567890 · Routing: 021000021 · Ref: {invoice.invoiceNumber}
          </p>
        </div>

        {/* Payment Status */}
        {orderData?.status === 'PAID' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
            <FiCheckCircle className="text-emerald-500 w-5 h-5" />
            <div>
              <p className="text-sm font-bold text-emerald-700">✅ Invoice Paid</p>
              <p className="text-xs text-emerald-600">
                This invoice has been fully paid. Thank you!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Send Email Modal */}
      <SendEmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        invoice={invoice}
        onSend={handleSendEmail}
      />
    </div>
  );
};

export default InvoicePreview;