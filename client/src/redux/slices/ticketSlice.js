// src/redux/slices/ticketSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  tickets: [],
  selectedTicket: null,
  loading: false,
  error: null,
  totalItems: 0,
};

const ticketSlice = createSlice({
  name: "tickets",
  initialState,
  reducers: {
    setTickets: (state, action) => {
      state.tickets = action.payload;
      state.totalItems = action.payload.length;
    },
    addTicket: (state, action) => {
      state.tickets.unshift(action.payload);
      state.totalItems += 1;
    },
    setSelectedTicket: (state, action) => {
      state.selectedTicket = action.payload;
    },
    clearSelectedTicket: (state) => {
      state.selectedTicket = null;
    },
    updateTicket: (state, action) => {
      const index = state.tickets.findIndex(t => t._id === action.payload._id);
      if (index !== -1) {
        state.tickets[index] = action.payload;
      }
      // ✅ ADDED: Also update selectedTicket if it's the same ticket
      if (state.selectedTicket?._id === action.payload._id) {
        state.selectedTicket = action.payload;
      }
    },
    deleteTicket: (state, action) => {
      state.tickets = state.tickets.filter(t => t._id !== action.payload);
      state.totalItems -= 1;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setTickets,
  addTicket,
  setSelectedTicket,
  clearSelectedTicket,
  updateTicket,
  deleteTicket,
  setLoading,
  setError,
} = ticketSlice.actions;

export default ticketSlice.reducer;