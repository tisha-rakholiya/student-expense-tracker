import { categoryStyle, dateParts, rupees } from "../utils";

// List of expenses with search, category filter, edit and delete
export default function ExpenseList({ expenses, categories, filters, onFilterChange, onEdit, onDelete, loading }) {
  return (
    <section className="card">
      <div className="list-header">
        <h2 className="card-title">
          Transactions <span className="count">{expenses.length}</span>
        </h2>
        <div className="filters">
          <div className="search">
            <span>🔍</span>
            <input
              placeholder="Search expenses"
              value={filters.search}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            />
          </div>
          <select value={filters.category} onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}>
            <option value="All">All categories</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="empty">Loading...</p>
      ) : expenses.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🧾</div>
          <p>No expenses found</p>
          <span>Add your first expense using the form.</span>
        </div>
      ) : (
        <ul className="tx-list">
          {expenses.map((e) => {
            const style = categoryStyle(e.category);
            const d = dateParts(e.date);
            return (
              <li key={e._id} className="tx">
                <div className="tx-date">
                  <strong>{d.day}</strong>
                  <span>{d.month}</span>
                </div>
                <div className="tx-icon" style={{ "--c": style.color }}>
                  {style.icon}
                </div>
                <div className="tx-main">
                  <span className="tx-title">{e.title}</span>
                  <span className="tx-meta">
                    <span className="tag" style={{ "--c": style.color }}>
                      {e.category}
                    </span>
                    <span className="pay">{e.paymentMethod}</span>
                    {e.note && <span className="tx-note">· {e.note}</span>}
                  </span>
                </div>
                <div className="tx-amount">-{rupees(e.amount)}</div>
                <div className="tx-actions">
                  <button className="icon-btn" title="Edit" onClick={() => onEdit(e)}>
                    ✏️
                  </button>
                  <button className="icon-btn danger" title="Delete" onClick={() => onDelete(e)}>
                    🗑️
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
