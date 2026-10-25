import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { categoryStyle, rupees } from "../utils";

// Donut chart + legend: share of spending per category this month
export default function CategoryChart({ data, total }) {
  return (
    <section className="card">
      <h2 className="card-title">Spending by category</h2>
      {data.length === 0 ? (
        <p className="empty-small">No expenses this month yet.</p>
      ) : (
        <>
          <div className="donut">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="total"
                  nameKey="category"
                  innerRadius={62}
                  outerRadius={90}
                  paddingAngle={2}
                  stroke="none"
                  isAnimationActive={false}
                >
                  {data.map((d) => (
                    <Cell key={d.category} fill={categoryStyle(d.category).color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, name) => [rupees(v), name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <span>Total</span>
              <strong>{rupees(total)}</strong>
            </div>
          </div>

          <ul className="legend">
            {data.map((d) => {
              const pct = total > 0 ? Math.round((d.total / total) * 100) : 0;
              return (
                <li key={d.category}>
                  <span className="dot" style={{ background: categoryStyle(d.category).color }} />
                  <span className="legend-name">{d.category}</span>
                  <span className="legend-pct">{pct}%</span>
                  <span className="legend-amt">{rupees(d.total)}</span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
