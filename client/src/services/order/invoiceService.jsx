// services/invoiceService.js
import api from '../../api/axiosConfig';

const invoiceService = {
  /**
   * Generate invoice for an order (Step 4)
   * @param {string} orderId 
   * @param {string} paymentLink - Optional payment link URL
   */
  generateInvoice: async (orderId, paymentLink = null) => {
    try {
      const response = await api.post(`/invoices/generate/${orderId}`, { paymentLink });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Send invoice email to customer (Step 5)
   * @param {string} invoiceId 
   * @param {Object} data - { email, subject, message }
   */
  sendInvoiceEmail: async (invoiceId, data = {}) => {
    try {
      const response = await api.post(`/invoices/${invoiceId}/send-email`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get invoice by ID
   * @param {string} invoiceId 
   */
  getInvoiceById: async (invoiceId) => {
    try {
      const response = await api.get(`/invoices/${invoiceId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Get invoice by order ID
   * @param {string} orderId 
   */
  getInvoiceByOrder: async (orderId) => {
    try {
      const response = await api.get(`/invoices/order/${orderId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Preview invoice (returns invoice data for preview)
   * @param {string} invoiceId 
   */
  previewInvoice: async (invoiceId) => {
    try {
      const response = await api.get(`/invoices/${invoiceId}/preview`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Download invoice PDF
   * @param {string} invoiceId 
   */
  downloadInvoice: async (invoiceId) => {
    try {
      const response = await api.get(`/invoices/${invoiceId}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Print invoice (opens print dialog)
   * @param {string} invoiceId 
   */
  printInvoice: async (invoiceId) => {
    try {
      const invoice = await invoiceService.getInvoiceById(invoiceId);
      // Open print window with invoice data
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Invoice ${invoice.data.invoiceNumber}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 40px; }
                .header { text-align: center; border-bottom: 2px solid #4F46E5; padding-bottom: 20px; }
                .details { margin: 20px 0; }
                table { width: 100%; border-collapse: collapse; }
                th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                .total { font-size: 18px; font-weight: bold; color: #4F46E5; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>INVOICE</h1>
                <p>${invoice.data.invoiceNumber}</p>
              </div>
              <div class="details">
                <p><strong>Date:</strong> ${new Date(invoice.data.issueDate).toLocaleDateString()}</p>
                <p><strong>Due Date:</strong> ${new Date(invoice.data.dueDate).toLocaleDateString()}</p>
                <p><strong>Customer:</strong> ${invoice.data.orderId.contactName}</p>
                <p><strong>Company:</strong> ${invoice.data.orderId.companyName}</p>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoice.data.orderId.lineItems.map(item => `
                    <tr>
                      <td>${item.productName}</td>
                      <td>${item.quantity}</td>
                      <td>$${item.unitPrice.toFixed(2)}</td>
                      <td>$${item.lineTotal.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <div style="text-align: right; margin-top: 20px;">
                <p>Subtotal: $${invoice.data.orderId.subtotal.toFixed(2)}</p>
                <p>Tax (${invoice.data.orderId.taxRate}%): $${invoice.data.orderId.taxAmount.toFixed(2)}</p>
                <p class="total">Total: $${invoice.data.orderId.totalAmount.toFixed(2)}</p>
              </div>
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #666;">
                Thank you for your business!
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
      return invoice;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default invoiceService;