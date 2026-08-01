import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  companies: [],
  selectedCompany: null,
  loading: false,
  error: null,
};

const companySlice = createSlice({
  name: "company",
  initialState,

  reducers: {

    setCompanies: (state, action) => {
      state.companies = action.payload;
    },

    addCompany: (state, action) => {
      state.companies.unshift(action.payload); // Add to beginning for latest first
    },

    setSelectedCompany: (state, action) => {
      state.selectedCompany = action.payload;
    },

    clearSelectedCompany: (state) => {
      state.selectedCompany = null;
    },

    updateCompany: (state, action) => {
      state.companies = state.companies.map((company) =>
        company._id === action.payload._id ? action.payload : company
      );
    },

    deleteCompany: (state, action) => {
      state.companies = state.companies.filter(
        (company) => company._id !== action.payload
      );
    },

    companyStart: (state) => {
      state.loading = true;
      state.error = null;
    },

    companySuccess: (state) => {
      state.loading = false;
      state.error = null;
    },

    companyFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

  },
});

export const {
  setCompanies,
  addCompany,
  setSelectedCompany,
  clearSelectedCompany,
  updateCompany,
  deleteCompany,
  companyStart,
  companyFailure,
  companySuccess,
} = companySlice.actions;

export default companySlice.reducer;