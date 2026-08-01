// context/OrderContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import orderService from '../services/order/orderService';
import invoiceService from '../services/order/invoiceService'; 
import paymentService from '../services/order/paymentService'; 
import notificationService from '../services/order/notificationService';

// Initial state
const initialState = {
  orders: [],
  currentOrder: null,
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  orderStatus: null,
  stats: {
    total: 0,
    awaitingPayment: 0,
    paidThisMonth: 0,
    revenueCollected: 0,
  },
};

// Reducer
const orderReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_ORDERS':
      return { ...state, orders: action.payload };
    case 'SET_CURRENT_ORDER':
      return { ...state, currentOrder: action.payload };
    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload };
    case 'SET_UNREAD_COUNT':
      return { ...state, unreadCount: action.payload };
    case 'SET_ORDER_STATUS':
      return { ...state, orderStatus: action.payload };
    case 'SET_STATS':
      return { ...state, stats: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

// Context
const OrderContext = createContext();

// Provider
export const OrderProvider = ({ children }) => {
  const [state, dispatch] = useReducer(orderReducer, initialState);

  // Load initial data
  useEffect(() => {
    fetchOrders();
    fetchNotifications();
  }, []);
// Calculate stats from orders
const calculateStats = (orders) => {
  const total = orders.length;
  const awaitingPayment = orders.filter(
    (o) => o.status === 'INVOICED' || o.status === 'PARTIAL'
  ).length;
  
  const now = new Date();
  const paidThisMonth = orders.filter((o) => {
    if (o.status !== 'PAID' || !o.paidAt) return false;
    const paidDate = new Date(o.paidAt);
    return paidDate.getMonth() === now.getMonth() &&
           paidDate.getFullYear() === now.getFullYear();
  }).length;

  // ── FIX: Added Math.round to clear out floating point trailing errors ──
  const rawRevenue = orders
    .filter((o) => o.status === 'PAID')
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  
  const revenueCollected = Math.round((rawRevenue + Number.EPSILON) * 100) / 100;

  dispatch({ 
    type: 'SET_STATS', 
    payload: { total, awaitingPayment, paidThisMonth, revenueCollected }
  });
};

  // Fetch all orders
  const fetchOrders = async (params = {}) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await orderService.getOrders(params);

      // Handle several possible API response shapes:
      //   { data: { orders: [...] } }
      //   { data: { data: { orders: [...] } } }   (nested "data" wrapper)
      //   { data: { data: [...] } }
      //   { data: [...] }
      //   [...]                                    (bare array)
      // Each candidate is checked in order; the first one that is
      // actually an array wins. Previously this only checked
      // response.data?.orders || response.data, so a response nested one
      // level deeper (very common with { success, data: { orders } }
      // wrappers) fell through to response.data itself — a non-array
      // object — which silently broke stats (revenueCollected, chart
      // "Closed Deal Value") without ever hitting the "no orders found"
      // warning below, since .length on an object is undefined, not 0.
      const candidates = [
        response?.data?.orders,
        response?.data?.data?.orders,
        response?.data?.data,
        response?.data,
        response,
      ];
      const orders = candidates.find(Array.isArray) || [];

      if (orders.length === 0) {
        console.warn(
          'No orders found in response. Check the API response structure. Raw response:',
          response
        );
      }

      dispatch({ type: 'SET_ORDERS', payload: orders });
      calculateStats(orders);
      dispatch({ type: 'SET_ERROR', payload: null });
      return orders;
    } catch (error) {
      console.error('Fetch orders error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to fetch orders' });
      return [];
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Refresh orders (alias for fetchOrders)
  const refreshOrders = async () => {
    return await fetchOrders();
  };

  // Fetch single order
  const fetchOrderById = async (orderId) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await orderService.getOrderById(orderId);
      dispatch({ type: 'SET_CURRENT_ORDER', payload: response.data });
      dispatch({ type: 'SET_ERROR', payload: null });
      return response.data;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to fetch order' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Fetch notifications
  const fetchNotifications = async (params = {}) => {
    try {
      const response = await notificationService.getNotifications(params);
      const notifications = response.data?.notifications || [];
      const unreadCount = response.data?.unreadCount || 0;
      dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications });
      dispatch({ type: 'SET_UNREAD_COUNT', payload: unreadCount });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  // Mark notification as read
  const markNotificationRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllNotificationsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Confirm order (Step 3)
  const confirmOrder = async (orderId, sendEmail = false) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await orderService.confirmOrder(orderId, sendEmail);
      dispatch({ type: 'SET_ORDER_STATUS', payload: 'CONFIRMED' });
      await fetchOrderById(orderId);
      await refreshOrders();
      dispatch({ type: 'SET_ERROR', payload: null });
      return response.data;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to confirm order' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Generate invoice (Step 4)
  const generateInvoice = async (orderId, paymentLink = null) => {
    if (!orderId) {
      console.error('Invalid orderId in generateInvoice:', orderId);
      throw new Error('Order ID is required');
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await invoiceService.generateInvoice(orderId, paymentLink);
      dispatch({ type: 'SET_ORDER_STATUS', payload: 'INVOICED' });
      await fetchOrderById(orderId);
      await fetchOrders();
      dispatch({ type: 'SET_ERROR', payload: null });
      return response.data;
    } catch (error) {
      console.error('Generate invoice error:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to generate invoice' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Record payment (Step 7)
  const recordPayment = async (paymentData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await paymentService.recordPayment(paymentData);
      await fetchOrderById(paymentData.orderId);
      await refreshOrders();
      dispatch({ type: 'SET_ERROR', payload: null });
      return response.data;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to record payment' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Cancel order
  const cancelOrder = async (orderId) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await orderService.cancelOrder(orderId);
      await fetchOrderById(orderId);
      await refreshOrders();
      dispatch({ type: 'SET_ERROR', payload: null });
      return response.data;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to cancel order' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Get payment summary for an order
  const getPaymentSummary = async (orderId) => {
    try {
      const response = await orderService.getPaymentSummary(orderId);
      return response.data;
    } catch (error) {
      console.error('Failed to get payment summary:', error);
      return null;
    }
  };

  const markOrderCompleted = async (orderId) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await orderService.markOrderCompleted(orderId);
      await refreshOrders();
      dispatch({ type: 'SET_ERROR', payload: null });
      return response.data;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to mark order as completed' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    fetchOrders,
    refreshOrders,
    fetchOrderById,
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    confirmOrder,
    generateInvoice,
    recordPayment,
    cancelOrder,
    getPaymentSummary,
    clearError,
    markOrderCompleted
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

// Hook
export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};