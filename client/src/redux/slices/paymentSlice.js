// client/src/redux/slices/paymentSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  payments: [],
  loading: false,
  error: null,
};

const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {
    paymentStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    paymentSuccess: (state) => {
      state.loading = false;
      state.error = null;
    },
    paymentFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    setPayments: (state, action) => {
      state.payments = action.payload;
    },
    addPayment: (state, action) => {
      state.payments.unshift(action.payload);
    },
    updatePayment: (state, action) => {
      const idx = state.payments.findIndex((p) => p._id === action.payload._id);
      if (idx !== -1) state.payments[idx] = action.payload;
    },
    removePayment: (state, action) => {
      state.payments = state.payments.filter((p) => p._id !== action.payload);
    },
    clearPayments: (state) => {
      state.payments = [];
    },
  },
});

export const {
  paymentStart,
  paymentSuccess,
  paymentFailure,
  setPayments,
  addPayment,
  updatePayment,
  removePayment,
  clearPayments,
} = paymentSlice.actions;

export default paymentSlice.reducer;