import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import leadReducer from "./slices/leadSlice";
import activityReducer from "./slices/activitySlice";
import companyReducer from "./slices/companySlice";
import dealReducer from "./slices/dealSlice";
import ticketReducer from "./slices/ticketSlice";
import userReducer from "./slices/userSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    leads: leadReducer,
    activity: activityReducer,  
    company: companyReducer,
    deals: dealReducer,
    tickets: ticketReducer,

    users: userReducer
  },
});