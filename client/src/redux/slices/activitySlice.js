import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    timeline: [], // Useful for a unified list view
    notes: [],
    emails: [],
    calls: [],
    tasks: [],
    meetings: [],
    loading: false,
    error: null
};

const activitySlice = createSlice({
    name: "activity",
    initialState,
    reducers: {
        // Core handler to ingest the unified backend timeline array
        setLeadTimeline: (state, action) => {
            const allActivities = action.payload || [];
            state.timeline = allActivities;
            
            // Automatically categorize items by their type for your sub-tabs
            state.notes = allActivities.filter(act => act.type === "Note");
            state.emails = allActivities.filter(act => act.type === "Email");
            state.calls = allActivities.filter(act => act.type === "Call");
            state.tasks = allActivities.filter(act => act.type === "Task");
            state.meetings = allActivities.filter(act => act.type === "Meeting");
        },
        
        // Push a brand new activity instantly into both the timeline and its dedicated tab
        addLoggedActivity: (state, action) => {
            const newActivity = action.payload;
            state.timeline.unshift(newActivity); // Add to the top of the timeline feed

            // Push dynamically to target list based on activity type
            if (newActivity.type === "Note") state.notes.unshift(newActivity);
            if (newActivity.type === "Email") state.emails.unshift(newActivity);
            if (newActivity.type === "Call") state.calls.unshift(newActivity);
            if (newActivity.type === "Task") state.tasks.unshift(newActivity);
            if (newActivity.type === "Meeting") state.meetings.unshift(newActivity);
        },

        activityStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        activitySuccess: (state) => {
            state.loading = false;
        },
        activityFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        }
    }
});

export const {
    setLeadTimeline,
    addLoggedActivity,
    activityStart,
    activitySuccess,
    activityFailure,
} = activitySlice.actions;

export default activitySlice.reducer;






