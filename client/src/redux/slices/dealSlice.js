// src/redux/slices/dealSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  deals: [],
  selectedDeal: null,
  loading: false,
  error: null
};

const dealsSlice = createSlice({
  name: "deals",
  initialState,
  reducers: {
    setDeals: (state, action) => {
      state.deals = action.payload;
    },

    addDeal: (state, action) => {
      state.deals.unshift(action.payload); // Add to beginning
    },

    setSelectedDeal: (state, action) => {
      state.selectedDeal = action.payload;
    },

    clearSelectedDeal: (state) => {
      state.selectedDeal = null;
    },

    updateDeal: (state, action) => {
      const index = state.deals.findIndex((deal) => deal._id === action.payload._id);
      if (index !== -1) {
        state.deals[index] = action.payload;
      }
    },

    deleteDeal: (state, action) => {
      state.deals = state.deals.filter((deal) => deal._id !== action.payload);
    },

    dealStart: (state) => {
      state.loading = true;
      state.error = null;
    },

    dealSuccess: (state) => {
      state.loading = false;
      state.error = null;
    },

    dealFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    }
  }
});

export const {
  setDeals,
  addDeal,
  setSelectedDeal,
  clearSelectedDeal,
  updateDeal,
  deleteDeal,
  dealStart,
  dealSuccess,
  dealFailure
} = dealsSlice.actions;

export default dealsSlice.reducer;