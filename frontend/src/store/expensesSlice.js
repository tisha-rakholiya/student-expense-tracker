import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import * as api from "../api";
import { currentMonth } from "../utils";
import { logout } from "./authSlice";

// Redux state for the dashboard: month, filters, expenses, summary and budget
const initialState = {
  month: currentMonth(),
  filters: { search: "", category: "All" },
  meta: { categories: [], paymentMethods: [] },
  expenses: [],
  summary: { total: 0, count: 0, byCategory: [] },
  budget: 0,
  editing: null, // the expense being edited (or null)
  loading: true,
  error: "",
};

export const loadMeta = createAsyncThunk("expenses/loadMeta", async (_, { rejectWithValue }) => {
  try {
    return await api.getMeta();
  } catch (err) {
    return rejectWithValue(api.errorMessage(err));
  }
});

// Loads the list, summary and budget for the selected month and filters
export const loadData = createAsyncThunk("expenses/loadData", async (_, { getState, rejectWithValue }) => {
  const { month, filters } = getState().expenses;
  try {
    const [expenses, summary, budget] = await Promise.all([
      api.getExpenses({ month, category: filters.category, search: filters.search }),
      api.getSummary(month),
      api.getBudget(month),
    ]);
    return { expenses, summary, budget: budget.amount };
  } catch (err) {
    return rejectWithValue(api.errorMessage(err));
  }
});

// Adds a new expense, or updates the one being edited, then reloads the data
export const saveExpense = createAsyncThunk("expenses/save", async (data, { getState, dispatch, rejectWithValue }) => {
  const { editing } = getState().expenses;
  try {
    if (editing) await api.updateExpense(editing._id, data);
    else await api.addExpense(data);
  } catch (err) {
    return rejectWithValue(api.errorMessage(err));
  }
  await dispatch(loadData());
});

export const removeExpense = createAsyncThunk("expenses/remove", async (id, { dispatch, rejectWithValue }) => {
  try {
    await api.deleteExpense(id);
  } catch (err) {
    return rejectWithValue(api.errorMessage(err));
  }
  await dispatch(loadData());
  return id;
});

export const saveBudget = createAsyncThunk("expenses/saveBudget", async (amount, { getState, rejectWithValue }) => {
  try {
    await api.saveBudget(getState().expenses.month, amount);
    return amount;
  } catch (err) {
    return rejectWithValue(api.errorMessage(err));
  }
});

const expensesSlice = createSlice({
  name: "expenses",
  initialState,
  reducers: {
    setMonth(state, action) {
      state.month = action.payload;
    },
    setFilters(state, action) {
      state.filters = action.payload;
    },
    setEditing(state, action) {
      state.editing = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Forget everything when the user logs out
      .addCase(logout, () => initialState)
      .addCase(loadMeta.fulfilled, (state, action) => {
        state.meta = action.payload;
      })
      .addCase(loadMeta.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(loadData.fulfilled, (state, action) => {
        state.expenses = action.payload.expenses;
        state.summary = action.payload.summary;
        state.budget = action.payload.budget;
        state.error = "";
        state.loading = false;
      })
      .addCase(loadData.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      .addCase(saveExpense.fulfilled, (state) => {
        state.editing = null;
      })
      .addCase(removeExpense.fulfilled, (state, action) => {
        if (state.editing?._id === action.payload) state.editing = null;
      })
      .addCase(removeExpense.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(saveBudget.fulfilled, (state, action) => {
        state.budget = action.payload;
      })
      .addCase(saveBudget.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { setMonth, setFilters, setEditing } = expensesSlice.actions;
export default expensesSlice.reducer;
