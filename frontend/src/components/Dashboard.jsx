import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import ExpenseForm from "./ExpenseForm";
import ExpenseList from "./ExpenseList";
import SummaryCards from "./SummaryCards";
import CategoryChart from "./CategoryChart";
import { monthLabel } from "../utils";
import {
  loadData,
  loadMeta,
  removeExpense,
  saveBudget,
  saveExpense,
  setEditing,
  setFilters,
  setMonth,
} from "../store/expensesSlice";

// The main page after logging in. All its data lives in the Redux store.
export default function Dashboard() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const { month, meta, expenses, summary, budget, filters, editing, loading, error } = useSelector(
    (state) => state.expenses
  );

  const firstName = user.name.split(" ")[0];

  // Load categories and payment methods once
  useEffect(() => {
    dispatch(loadMeta());
  }, [dispatch]);

  // Reload when month or filters change (small delay so search doesn't fire on every key)
  useEffect(() => {
    const t = setTimeout(() => dispatch(loadData()), 250);
    return () => clearTimeout(t);
  }, [dispatch, month, filters]);

  // The form shows the error message itself, so this throws it back to the form
  async function handleSave(data) {
    try {
      await dispatch(saveExpense(data)).unwrap();
    } catch (message) {
      throw new Error(message);
    }
  }

  function handleDelete(expense) {
    if (!window.confirm(`Delete "${expense.title}"?`)) return;
    dispatch(removeExpense(expense._id));
  }

  return (
    <div className="app">
      <header className="page-head">
        <div>
          <h1>Hi {firstName}, here's your spending 👋</h1>
          <p className="muted">Overview for {monthLabel(month)}</p>
        </div>
        <label className="month-picker">
          <span>Month</span>
          <input type="month" value={month} onChange={(e) => e.target.value && dispatch(setMonth(e.target.value))} />
        </label>
      </header>

      {error && <div className="banner">⚠️ {error}</div>}

      <SummaryCards summary={summary} budget={budget} month={month} onSaveBudget={(amount) => dispatch(saveBudget(amount))} />

      <div className="grid">
        <div className="side">
          <ExpenseForm
            categories={meta.categories}
            paymentMethods={meta.paymentMethods}
            editing={editing}
            onSave={handleSave}
            onCancel={() => dispatch(setEditing(null))}
          />
          <CategoryChart data={summary.byCategory} total={summary.total} />
        </div>
        <ExpenseList
          expenses={expenses}
          categories={meta.categories}
          filters={filters}
          onFilterChange={(f) => dispatch(setFilters(f))}
          onEdit={(e) => {
            dispatch(setEditing(e));
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onDelete={handleDelete}
          loading={loading}
        />
      </div>

      <footer>Built with MongoDB · Express · React · Redux · Node.js · FastAPI</footer>
    </div>
  );
}
