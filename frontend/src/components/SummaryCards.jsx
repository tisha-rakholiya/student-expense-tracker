import { useState } from "react";
import { daysForAverage, rupees } from "../utils";

// Four stat cards plus the budget progress bar
export default function SummaryCards({ summary, budget, month, onSaveBudget }) {
  const [editingBudget, setEditingBudget] = useState(false);
  const [value, setValue] = useState("");

  const spent = summary.total;
  const left = budget - spent;
  const percent = budget > 0 ? Math.round((spent / budget) * 100) : 0;
  const status = budget === 0 ? "none" : percent >= 100 ? "over" : percent >= 80 ? "warn" : "ok";
  const perDay = spent / daysForAverage(month);

  async function save(e) {
    e.preventDefault();
    if (value === "" || Number(value) < 0) return;
    await onSaveBudget(Number(value));
    setEditingBudget(false);
  }

  return (
    <section className="summary">
      <div className="stat-grid">
        <div className="stat">
          <div className="stat-icon blue">💸</div>
          <div>
            <span className="stat-label">Total spent</span>
            <strong className="stat-value">{rupees(spent)}</strong>
            <span className="stat-sub">{summary.count} expenses</span>
          </div>
        </div>

        <div className="stat">
          <div className="stat-icon purple">🎯</div>
          <div>
            <span className="stat-label">Monthly budget</span>
            {editingBudget ? (
              <form onSubmit={save} className="budget-form">
                <input type="number" min="0" autoFocus value={value} onChange={(e) => setValue(e.target.value)} />
                <button className="btn primary small">Save</button>
                <button type="button" className="btn small" onClick={() => setEditingBudget(false)}>
                  ✕
                </button>
              </form>
            ) : (
              <>
                <strong className="stat-value">{budget > 0 ? rupees(budget) : "Not set"}</strong>
                <button
                  className="link"
                  onClick={() => {
                    setValue(budget || "");
                    setEditingBudget(true);
                  }}
                >
                  {budget > 0 ? "Edit budget" : "Set a budget"}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="stat">
          <div className={`stat-icon ${left < 0 ? "red" : "green"}`}>{left < 0 ? "⚠️" : "💰"}</div>
          <div>
            <span className="stat-label">{left < 0 ? "Over budget" : "Left to spend"}</span>
            <strong className={`stat-value ${left < 0 ? "text-red" : "text-green"}`}>
              {budget > 0 ? rupees(Math.abs(left)) : "-"}
            </strong>
            <span className="stat-sub">{budget > 0 ? `${Math.min(percent, 999)}% of budget used` : "Set a budget to track"}</span>
          </div>
        </div>

        <div className="stat">
          <div className="stat-icon orange">📅</div>
          <div>
            <span className="stat-label">Daily average</span>
            <strong className="stat-value">{rupees(Math.round(perDay))}</strong>
            <span className="stat-sub">per day this month</span>
          </div>
        </div>
      </div>

      {budget > 0 && (
        <div className={`budget-bar ${status}`}>
          <div className="budget-bar-top">
            <span>
              {status === "over"
                ? "You have crossed your budget for this month"
                : status === "warn"
                  ? "Careful, you are close to your budget"
                  : "You are within your budget"}
            </span>
            <span className="budget-bar-pct">{percent}%</span>
          </div>
          <div className="progress">
            <div className="bar" style={{ width: `${Math.min(100, percent)}%` }} />
          </div>
        </div>
      )}
    </section>
  );
}
