// client/src/redux/slices/orderSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  orders: [],
  loading: false,
  error: null,
};

const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    orderStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    orderSuccess: (state) => {
      state.loading = false;
      state.error = null;
    },
    orderFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setOrders: (state, action) => {
      state.orders = action.payload;
    },
    addOrder: (state, action) => {
      state.orders.unshift(action.payload);
    },
    updateOrder: (state, action) => {
      const idx = state.orders.findIndex((o) => o._id === action.payload._id);
      if (idx !== -1) state.orders[idx] = action.payload;
    },
    removeOrder: (state, action) => {
      state.orders = state.orders.filter((o) => o._id !== action.payload);
    },
    clearOrders: (state) => {
      state.orders = [];
    },
  },
});

export const {
  orderStart,
  orderSuccess,
  orderFailure,
  setOrders,
  addOrder,
  updateOrder,
  removeOrder,
  clearOrders,
} = orderSlice.actions;

export default orderSlice.reducer;