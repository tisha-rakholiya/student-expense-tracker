import { configureStore } from "@reduxjs/toolkit";
import authReducer, { logout } from "./authSlice";
import expensesReducer from "./expensesSlice";
import { setUnauthorizedHandler } from "../api";

// One global Redux store with two slices: auth (login) and expenses (dashboard data)
export const store = configureStore({
  reducer: {
    auth: authReducer,
    expenses: expensesReducer,
  },
});

// If the server rejects our token (expired or invalid), log out. React Router then
// redirects to /login because ProtectedRoute sees that there is no user.
setUnauthorizedHandler(() => store.dispatch(logout()));
