import { useEffect, useState } from "react";
import { categoryStyle, today } from "../utils";

const EMPTY = { title: "", amount: "", category: "Food", paymentMethod: "UPI", date: today(), note: "" };

// Form used both to add a new expense and to edit an existing one
export default function ExpenseForm({ categories, paymentMethods, editing, onSave, onCancel }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // When the user clicks "Edit", fill the form with that expense
  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title,
        amount: editing.amount,
        category: editing.category,
        paymentMethod: editing.paymentMethod,
        date: editing.date.slice(0, 10),
        note: editing.note || "",
      });
    } else {
      setForm(EMPTY);
    }
    setError("");
  }, [editing]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return setError("Please enter what you spent on.");
    if (!form.amount || Number(form.amount) <= 0) return setError("Please enter an amount greater than 0.");

    setSaving(true);
    setError("");
    try {
      await onSave({ ...form, amount: Number(form.amount) });
      if (!editing) setForm({ ...EMPTY, date: form.date, category: form.category });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className={`card form ${editing ? "is-editing" : ""}`} onSubmit={handleSubmit}>
      <div className="form-head">
        <h2 className="card-title">{editing ? "Edit expense" : "Add new expense"}</h2>
        {editing && <span className="editing-badge">Editing</span>}
      </div>

      <label>
        Title
        <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Canteen lunch" maxLength={60} />
      </label>

      <label>
        Amount
        <div className="amount-input">
          <span>₹</span>
          <input name="amount" type="number" min="1" step="any" value={form.amount} onChange={handleChange} placeholder="0" />
        </div>
      </label>

      <div className="row">
        <label>
          Category
          <select name="category" value={form.category} onChange={handleChange}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {categoryStyle(c).icon} {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          Date
          <input name="date" type="date" value={form.date} onChange={handleChange} />
        </label>
      </div>

      <div className="field">
        <span className="field-label">Paid with</span>
        <div className="segmented">
          {paymentMethods.map((p) => (
            <button
              type="button"
              key={p}
              className={form.paymentMethod === p ? "active" : ""}
              onClick={() => setForm({ ...form, paymentMethod: p })}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <label>
        <span>
          Note <em>(optional)</em>
        </span>
        <input name="note" value={form.note} onChange={handleChange} placeholder="Any details" maxLength={200} />
      </label>

      {error && <p className="error">{error}</p>}

      <div className="form-actions">
        <button className="btn primary block" disabled={saving}>
          {saving ? "Saving..." : editing ? "Save changes" : "+ Add expense"}
        </button>
        {editing && (
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
