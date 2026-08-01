// redux/slices/leadSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    leads: [],
    selectedLead: null,
    loading: false,
    error: null
}

const leadSlice = createSlice({
    name: "leads",
    initialState: initialState,

    reducers: {
        setLeads: (state, action) => {
            state.leads = action.payload
            state.loading = false
            state.error = null
        },
        setSelectedLead: (state, action) => {
            state.selectedLead = action.payload
        },
        clearSelectedLead: (state) => {
            state.selectedLead = null;
        },
        addLead: (state, action) => {
            state.leads.push(action.payload)
        },
        updateLead: (state, action) => {
            if (!action.payload) return;

            const index = state.leads.findIndex(
                (lead) => (lead.id || lead._id) === (action.payload.id || action.payload._id)
            );

            if (index !== -1) {
                state.leads[index] = action.payload;
            }
        },
        deleteLead: (state, action) => {
            state.leads = state.leads.filter(
                (lead) => (lead.id || lead._id) !== action.payload
            );
        },
        leadStart: (state) => {
            state.loading = true,
            state.error = null;
        },
        leadSuccess: (state) => {
            state.loading = false
        },
        leadFailure: (state, action) => {
            state.loading = false,
            state.error = action.payload
        }
    }
})

export const { 
    setLeads,
    setSelectedLead,
    clearSelectedLead,
    addLead,
    updateLead,
    deleteLead,
    leadStart,
    leadSuccess,
    leadFailure 
} = leadSlice.actions

export default leadSlice.reducer;