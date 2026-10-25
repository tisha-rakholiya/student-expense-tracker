# Student Expense Tracker (MERN)

A web app for students to track daily expenses, set a monthly budget and see where their money goes.

**Tech stack**

| Part | Technology |
| --- | --- |
| Frontend | React (Vite), Redux Toolkit, React Router, Axios, Recharts |
| Backend | Node.js, Express.js (auth, expenses, budget) |
| Analytics service | Python FastAPI (insights, CSV export) |
| Database | MongoDB (Mongoose in Express, PyMongo in FastAPI) |
| Security | JWT (shared by both backends), bcrypt |

## Features

- **Register, log in and log out** (passwords hashed with bcrypt, login with JWT tokens)
- Each student sees only their own expenses and budget
- Add, edit and delete expenses (title, amount, category, payment method, date, note)
- Monthly view with a month picker
- Set a monthly budget, with a progress bar and an alert when it is crossed
- Total spent, number of expenses and money left
- Bar chart of spending by category (calculated with a MongoDB aggregation)
- Search by title and filter by category
- Form validation on both the frontend and the backend
- **Single Page Application** with React Router pages: `/login`, `/dashboard`, `/insights` (protected pages redirect to `/login`)
- **Redux Toolkit** store for login state (`auth`) and dashboard data (`expenses`)
- **Insights page** powered by Python FastAPI: projected month-end spending, daily chart, top category, payment-mode split, budget tips
- **Download CSV** of a month's expenses (FastAPI)
- Works on mobile screens

## Folder structure

```
expense-tracker/
├── backend/
│   ├── middleware/
│   │   └── auth.js         # Checks the login token (JWT)
│   ├── models/
│   │   ├── User.js         # User schema (hashed password)
│   │   ├── Expense.js      # Expense schema
│   │   └── Budget.js       # Monthly budget schema
│   ├── routes/
│   │   ├── auth.js         # Register, login, me
│   │   ├── expenses.js     # Expense CRUD + summary API
│   │   └── budget.js       # Budget API
│   ├── server.js           # Express server + MongoDB connection
│   ├── seed.js             # Adds sample data
│   └── .env.example
├── fastapi-service/        # Python FastAPI (insights + CSV export)
│   ├── main.py             # Routes: /health, /analytics/insights, /analytics/export
│   ├── auth.py             # Verifies the same JWT that Express creates
│   ├── analytics.py        # MongoDB aggregations + tips
│   ├── schemas.py          # Pydantic response models
│   ├── config.py, db.py
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── AuthPage.jsx    # Login / register screen
    │   │   ├── ProtectedRoute.jsx # Redirects to /login if not logged in
    │   │   ├── Navbar.jsx      # Page links + log out
    │   │   ├── Dashboard.jsx   # Main page after login
    │   │   ├── Insights.jsx    # Insights page (data from FastAPI)
    │   │   ├── ExpenseForm.jsx
    │   │   ├── ExpenseList.jsx
    │   │   ├── SummaryCards.jsx
    │   │   └── CategoryChart.jsx
    │   ├── store/
    │   │   ├── index.js        # Redux store
    │   │   ├── authSlice.js    # Login state + JWT token
    │   │   └── expensesSlice.js # Month, filters, expenses, summary, budget
    │   ├── api.js          # All calls to Express and FastAPI (Axios)
    │   ├── utils.js        # Rupee/date formatting, colours
    │   ├── App.jsx
    │   └── index.css
    └── vite.config.js      # Forwards /api to Express and /analytics to FastAPI
```

## What you need to install (once)

1. **Node.js** (LTS version): https://nodejs.org
2. **MongoDB Community Server**: https://www.mongodb.com/try/download/community
   During install, keep **"Install MongoD as a Service"** ticked so it starts automatically.
   Also tick **MongoDB Compass** to see your data visually.
   (Or use a free **MongoDB Atlas** cloud database instead, see below.)
3. **Python 3.10 or newer** (for the FastAPI service): https://www.python.org/downloads

## How to run

Open **three terminals**.

**Terminal 1: backend**

```
cd backend
npm install
copy .env.example .env      (on Mac/Linux: cp .env.example .env)
npm run seed                (creates demo account demo@student.com / demo123 with sample expenses)
npm run dev
```

You should see `Connected to MongoDB` and `Server running on http://localhost:5000`.

**Terminal 2: FastAPI service (Python)**

```
cd fastapi-service
python -m venv .venv
.venv\Scripts\activate        (on Mac/Linux: source .venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env         (on Mac/Linux: cp .env.example .env)
uvicorn main:app --reload --port 8000
```

Open `fastapi-service/.env` and set `JWT_SECRET` to **exactly the same value as in `backend/.env`**. The FastAPI service verifies the login tokens that Express creates, so the secret must match.
API docs (Swagger) are at http://localhost:8000/docs

**Terminal 3: frontend**

```
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

## Using MongoDB Atlas instead of a local database

1. Create a free cluster at https://www.mongodb.com/atlas
2. Create a database user and allow your IP address (Network Access).
3. Click **Connect → Drivers** and copy the connection string.
4. In `backend/.env`, set `MONGO_URI=` to that string, with `/student_expense_tracker` before the `?`.

## API endpoints

All `/api/expenses` and `/api/budget` routes need the header `Authorization: Bearer <token>`.

| Method | Endpoint | What it does |
| --- | --- | --- |
| POST | `/api/auth/register` | Create an account `{ name, email, password }` → `{ token, user }` |
| POST | `/api/auth/login` | Log in `{ email, password }` → `{ token, user }` |
| GET | `/api/auth/me` | The logged-in user |
| GET | `/api/expenses?month=2026-10&category=Food&search=pizza` | List expenses (filters optional) |
| POST | `/api/expenses` | Add an expense |
| PUT | `/api/expenses/:id` | Update an expense |
| DELETE | `/api/expenses/:id` | Delete an expense |
| GET | `/api/expenses/summary?month=2026-10` | Total, count and total per category |
| GET | `/api/expenses/categories` | Allowed categories and payment methods |
| GET | `/api/budget/:month` | Get the budget for a month |
| PUT | `/api/budget/:month` | Set the budget for a month |
| GET | `/api/health` | Server and database status |

Example body for POST/PUT `/api/expenses`:

```json
{
  "title": "Canteen lunch",
  "amount": 80,
  "category": "Food",
  "paymentMethod": "UPI",
  "date": "2026-10-20",
  "note": "with friends"
}
```

## FastAPI endpoints (port 8000)

Both routes need the header `Authorization: Bearer <token>` (the same token from `/api/auth/login`).

| Method | Endpoint | What it does |
| --- | --- | --- |
| GET | `/health` | Service and database status |
| GET | `/analytics/insights?month=2026-10` | Total, daily average, projected month-end spending, top category, biggest expense, payment-mode split, daily totals, budget status and tips |
| GET | `/analytics/export?month=2026-10` | Download the month's expenses as a CSV file |

## How the pages and state work

- **React Router** (`App.jsx`): `/login` is public. `/dashboard` and `/insights` are wrapped in `ProtectedRoute`, which redirects to `/login` when there is no logged-in user.
- **Redux Toolkit** (`src/store`): `authSlice` keeps the user and the JWT token (login, register, fetch current user, logout). `expensesSlice` keeps the selected month, filters, expenses, summary and budget, and has thunks that call the Express API with Axios.
- **Axios** (`src/api.js`): one client for Express (`/api`) and one for FastAPI (`/analytics`). Both add `Authorization: Bearer <token>` automatically and log the user out on a 401 response.

## Run as one app (optional)

```
cd frontend
npm run build
cd ../backend
npm start
```

Then open http://localhost:5000. The backend serves the built React app.
The FastAPI service still runs separately on port 8000. Before `npm run build`, create `frontend/.env.production` with `VITE_ANALYTICS_URL=http://localhost:8000` so the built app can reach it (and add that address to `CORS_ORIGINS` in `fastapi-service/.env`).

## Common problems

- **"Could not connect to MongoDB"**: MongoDB isn't running. On Windows, open **Services**, find **MongoDB Server**, click **Start**. Or check your Atlas connection string.
- **"Could not reach the server"** in the app: the backend terminal isn't running. Start it with `npm run dev`.
- **"is the FastAPI service running on port 8000?"** on the Insights page: start Terminal 2. If you get "Your session has expired" there, the `JWT_SECRET` in `fastapi-service/.env` does not match `backend/.env`.
- **Port already in use**: close the other terminal running the app, or change `PORT` in `.env`.
