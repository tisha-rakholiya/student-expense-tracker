import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import * as api from "../api";
import { setMonth } from "../store/expensesSlice";
import { categoryStyle, monthLabel, rupees } from "../utils";

const STATUS = {
  no_budget: { text: "No budget set", color: "var(--muted)" },
  on_track: { text: "On track for your budget", color: "var(--green)" },
  over_pace: { text: "Above your budget pace", color: "var(--orange)" },
  over_budget: { text: "Budget crossed", color: "var(--red)" },
};

// Insights page. The numbers come from the Python FastAPI service (not from Express).
export default function Insights() {
  const dispatch = useDispatch();
  const month = useSelector((state) => state.expenses.month); // same month as the Dashboard
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getInsights(month)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setError("");
      })
      .catch((err) => !cancelled && setError(api.errorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [month]);

  async function handleDownload() {
    setDownloading(true);
    try {
      await api.downloadCsv(month);
    } catch (err) {
      setError(api.errorMessage(err));
    } finally {
      setDownloading(false);
    }
  }

  const status = data ? STATUS[data.budget_status] : null;

  return (
    <div className="app">
      <header className="page-head">
        <div>
          <h1>Spending insights 📈</h1>
          <p className="muted">Analysis for {monthLabel(month)}, calculated by the FastAPI service</p>
        </div>
        <div className="head-actions">
          <label className="month-picker">
            <span>Month</span>
            <input type="month" value={month} onChange={(e) => e.target.value && dispatch(setMonth(e.target.value))} />
          </label>
          <button className="btn primary" onClick={handleDownload} disabled={downloading || !data}>
            {downloading ? "Preparing..." : "⬇ Download CSV"}
          </button>
        </div>
      </header>

      {error && <div className="banner">⚠️ {error} (is the FastAPI service running on port 8000?)</div>}
      {loading && !data && <p className="muted">Loading insights...</p>}

      {data && (
        <>
          <div className="stat-grid">
            <div className="stat">
              <div className="stat-icon purple">🔮</div>
              <div>
                <span className="stat-label">Projected by month end</span>
                <strong className="stat-value">{rupees(data.projected_total)}</strong>
                <span className="stat-sub" style={{ color: status.color }}>
                  {status.text}
                </span>
              </div>
            </div>
            <div className="stat">
              <div className="stat-icon blue">📅</div>
              <div>
                <span className="stat-label">Daily average</span>
                <strong className="stat-value">{rupees(Math.round(data.daily_average))}</strong>
                <span className="stat-sub">{data.days_left > 0 ? `${data.days_left} days left` : "full month"}</span>
              </div>
            </div>
            <div className="stat">
              <div className="stat-icon orange">{data.top_category ? categoryStyle(data.top_category.category).icon : "🏷️"}</div>
              <div>
                <span className="stat-label">Top category</span>
                <strong className="stat-value small">{data.top_category ? data.top_category.category : "None yet"}</strong>
                <span className="stat-sub">
                  {data.top_category ? `${rupees(data.top_category.total)} · ${data.top_category.share}%` : "no expenses"}
                </span>
              </div>
            </div>
            <div className="stat">
              <div className="stat-icon red">🧾</div>
              <div>
                <span className="stat-label">Biggest expense</span>
                <strong className="stat-value">{data.biggest_expense ? rupees(data.biggest_expense.amount) : "₹0"}</strong>
                <span className="stat-sub">{data.biggest_expense ? data.biggest_expense.title : "no expenses"}</span>
              </div>
            </div>
          </div>

          <div className="insights-grid">
            <section className="card">
              <h2 className="card-title">Spending per day</h2>
              {data.count === 0 ? (
                <p className="empty-small">No expenses this month yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.daily} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6e9f2" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(v) => [rupees(v), "Spent"]} labelFormatter={(d) => `Day ${d}`} />
                    <Bar dataKey="total" fill="#4f46e5" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </section>

            <div className="side">
              <section className="card">
                <h2 className="card-title">Paid with</h2>
                {data.by_payment_method.length === 0 ? (
                  <p className="empty-small">No expenses this month yet.</p>
                ) : (
                  data.by_payment_method.map((p) => (
                    <div className="pay-row" key={p.method}>
                      <div className="pay-top">
                        <strong>{p.method}</strong>
                        <span>
                          {rupees(p.total)} <small className="muted">({p.count})</small>
                        </span>
                      </div>
                      <div className="pay-track">
                        <div className="pay-bar" style={{ width: `${(p.total / data.total) * 100}%` }} />
                      </div>
                    </div>
                  ))
                )}
              </section>

              <section className="card">
                <h2 className="card-title">Tips for you</h2>
                <ul className="tips">
                  {data.tips.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
