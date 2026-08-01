// src/redux/slices/userSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  users: [],
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    userStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    setUsers: (state, action) => {
      state.users = action.payload;
    },
    userSuccess: (state) => {
      state.loading = false;
      state.error = null;
    },
    userFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const { userStart, setUsers, userSuccess, userFailure } = userSlice.actions;
export default userSlice.reducer;