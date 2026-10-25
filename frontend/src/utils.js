// Format a number as Indian rupees, e.g. 3500 -> "₹3,500"
export function rupees(amount) {
  return "₹" + Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

// Current month as "YYYY-MM"
export function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Today's date as "YYYY-MM-DD" for date inputs
export function today() {
  const d = new Date();
  return `${currentMonth()}-${String(d.getDate()).padStart(2, "0")}`;
}

// "2026-10" -> "October 2026"
export function monthLabel(month) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
}

// Number of days in the month (or days passed so far if it's the current month)
export function daysForAverage(month) {
  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  return month === currentMonth() ? new Date().getDate() : daysInMonth;
}

// Date from the server -> { day: "14", month: "Oct" }
export function dateParts(value) {
  const d = new Date(value);
  return {
    day: d.getUTCDate(),
    month: d.toLocaleString("en-IN", { month: "short", timeZone: "UTC" }),
  };
}

// Colour and icon for each category
export const CATEGORY_STYLE = {
  Food: { color: "#f76707", icon: "🍔" },
  Travel: { color: "#1c7ed6", icon: "🚌" },
  "Books & Stationery": { color: "#7048e8", icon: "📚" },
  "Rent & Hostel": { color: "#2f9e44", icon: "🏠" },
  "Recharge & Internet": { color: "#1098ad", icon: "📱" },
  Entertainment: { color: "#e64980", icon: "🎬" },
  Shopping: { color: "#f59f00", icon: "🛍️" },
  Health: { color: "#e03131", icon: "💊" },
  Other: { color: "#868e96", icon: "📦" },
};

export function categoryStyle(category) {
  return CATEGORY_STYLE[category] || CATEGORY_STYLE.Other;
}
