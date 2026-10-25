import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as api from "../api";

// Redux state for login: who is logged in, and the JWT token
const initialState = {
  user: null,
  token: api.getToken(),
  // "checking" = a saved token is being verified with the server
  status: api.getToken() ? "checking" : "idle", // "idle" | "checking" | "loading"
  error: "",
};

export const loginUser = createAsyncThunk("auth/login", async ({ email, password }, { rejectWithValue }) => {
  try {
    return await api.login(email, password); // { token, user }
  } catch (err) {
    return rejectWithValue(api.errorMessage(err));
  }
});

export const registerUser = createAsyncThunk("auth/register", async ({ name, email, password }, { rejectWithValue }) => {
  try {
    return await api.register(name, email, password); // { token, user }
  } catch (err) {
    return rejectWithValue(api.errorMessage(err));
  }
});

// On page reload: ask the server who the saved token belongs to
export const fetchMe = createAsyncThunk("auth/fetchMe", async (_, { rejectWithValue }) => {
  try {
    return await api.getMe();
  } catch (err) {
    return rejectWithValue(api.errorMessage(err));
  }
});

function loggedIn(state, action) {
  api.setToken(action.payload.token);
  state.token = action.payload.token;
  state.user = action.payload.user;
  state.status = "idle";
  state.error = "";
}

function failed(state, action) {
  state.status = "idle";
  state.error = action.payload || "Something went wrong";
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      api.setToken(null);
      state.user = null;
      state.token = null;
      state.status = "idle";
      state.error = "";
    },
    clearAuthError(state) {
      state.error = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(loginUser.fulfilled, loggedIn)
      .addCase(loginUser.rejected, failed)
      .addCase(registerUser.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(registerUser.fulfilled, loggedIn)
      .addCase(registerUser.rejected, failed)
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = "idle";
      })
      .addCase(fetchMe.rejected, (state) => {
        api.setToken(null);
        state.token = null;
        state.user = null;
        state.status = "idle";
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
