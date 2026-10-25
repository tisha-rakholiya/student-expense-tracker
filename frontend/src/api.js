import axios from "axios";

const TOKEN_KEY = "expense_tracker_token";

// ---------- Login token ----------
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

// If the server says 401 (not logged in / expired), the store logs the user out
let onUnauthorized = () => {};
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

// Create an Axios client that sends the JWT with every request:
//   Authorization: Bearer <token>
function createClient(baseURL) {
  const client = axios.create({ baseURL });

  client.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  client.interceptors.response.use(
    (res) => res,
    (err) => {
      const isLoginRequest = err.config?.url?.startsWith("/auth/login");
      if (err.response?.status === 401 && !isLoginRequest) onUnauthorized();
      return Promise.reject(err);
    }
  );
  return client;
}

// Express API (Node.js): auth, expenses, budget. Vite forwards /api to port 5000
const api = createClient("/api");

// FastAPI service (Python): insights and CSV export. Vite forwards /analytics to port 8000.
// For a production build, set VITE_ANALYTICS_URL (for example http://localhost:8000)
const analytics = createClient(
  import.meta.env.VITE_ANALYTICS_URL ? `${import.meta.env.VITE_ANALYTICS_URL}/analytics` : "/analytics"
);

// Turn server errors into a readable message
export function errorMessage(err) {
  // Express sends { message }, FastAPI sends { detail }
  return err.response?.data?.message || err.response?.data?.detail || "Could not reach the server. Is the backend running?";
}

// ---------- Auth ----------
export async function register(name, email, password) {
  const res = await api.post("/auth/register", { name, email, password });
  return res.data; // { token, user }
}

export async function login(email, password) {
  const res = await api.post("/auth/login", { email, password });
  return res.data; // { token, user }
}

export async function getMe() {
  const res = await api.get("/auth/me");
  return res.data.user;
}

// ---------- Expenses ----------
export async function getMeta() {
  const res = await api.get("/expenses/categories");
  return res.data;
}

export async function getExpenses(filters) {
  const res = await api.get("/expenses", { params: filters });
  return res.data;
}

export async function getSummary(month) {
  const res = await api.get("/expenses/summary", { params: { month } });
  return res.data;
}

export async function addExpense(expense) {
  const res = await api.post("/expenses", expense);
  return res.data;
}

export async function updateExpense(id, expense) {
  const res = await api.put(`/expenses/${id}`, expense);
  return res.data;
}

export async function deleteExpense(id) {
  const res = await api.delete(`/expenses/${id}`);
  return res.data;
}

// ---------- Budget ----------
export async function getBudget(month) {
  const res = await api.get(`/budget/${month}`);
  return res.data;
}

export async function saveBudget(month, amount) {
  const res = await api.put(`/budget/${month}`, { amount });
  return res.data;
}

// ---------- Insights (FastAPI) ----------
export async function getInsights(month) {
  const res = await analytics.get("/insights", { params: { month } });
  return res.data;
}

// Downloads the month's expenses as a CSV file
export async function downloadCsv(month) {
  const res = await analytics.get("/export", { params: { month }, responseType: "blob" });
  const url = URL.createObjectURL(res.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `expenses-${month}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
