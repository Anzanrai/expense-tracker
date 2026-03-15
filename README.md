# 💰 Spendly — Full-Stack Expense Tracker

A production-ready expense tracker built with **Node.js + Express + TypeScript** on the backend and **React + TypeScript + Vite** on the frontend, using **SQLite** as the database and **JWT** for authentication.

---

## ✨ Features

### Core
- 🔐 **JWT Authentication** — Register / Login with secure bcrypt password hashing
- 📂 **Categories & Subcategories** — Pre-loaded with 10 common categories (Housing, Food, Entertainment, Savings, etc.) and 40+ subcategories
- 💸 **Transactions** — Full CRUD for expenses, income, and savings with pagination and filtering
- 🎯 **Budgets** — Set monthly spending limits per category
- 🏦 **Savings Tracker** — Dedicated savings view with goal-based breakdown

### Dashboard & Charts (Recharts)
- 📈 **6-Month Spending Trend** — Area chart for income / expense / savings over time
- 🍩 **Category Breakdown** — Donut chart of expense distribution
- 📊 **Budget vs Actual** — Grouped bar chart comparing budget limits to real spending
- 📉 **Savings Progress** — Progress bars and pie chart per savings goal

---

## 🗂 Project Structure

```
spendly/
├── backend/                   # Express + TypeScript API
│   ├── src/
│   │   ├── controllers/       # Route handlers
│   │   │   ├── auth.controller.ts
│   │   │   ├── categories.controller.ts
│   │   │   ├── transactions.controller.ts
│   │   │   └── dashboard.controller.ts
│   │   ├── db/
│   │   │   └── database.ts    # SQLite connection + migrations
│   │   ├── middleware/
│   │   │   └── auth.ts        # JWT middleware
│   │   ├── routes/
│   │   │   └── index.ts       # All API routes
│   │   ├── types/
│   │   │   └── index.ts       # Shared TypeScript types
│   │   └── index.ts           # Express app entry point
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                  # React + TypeScript + Vite
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.ts      # Axios instance with interceptors
│   │   │   └── services.ts    # API service functions
│   │   ├── components/
│   │   │   ├── layout/        # Sidebar, AppLayout
│   │   │   ├── transactions/  # TransactionForm modal
│   │   │   └── ui/            # Modal, Input, Select, ProgressBar, etc.
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── TransactionsPage.tsx
│   │   │   ├── CategoriesPage.tsx
│   │   │   ├── BudgetsPage.tsx
│   │   │   ├── SavingsPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── types/index.ts
│   │   ├── utils/index.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── vite.config.ts
│
├── package.json               # Root workspace scripts
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** v18+ and **npm** v9+

### 1. Clone / extract the project
```bash
cd spendly
```

### 2. Install all dependencies
```bash
npm run install:all
# Or individually:
cd backend && npm install
cd ../frontend && npm install
```

### 3. Configure the backend environment
```bash
cd backend
cp .env.example .env
# Edit .env and set a strong JWT_SECRET
```

`.env` contents:
```env
PORT=5000
JWT_SECRET=change-this-to-a-long-random-string
JWT_EXPIRES_IN=7d
DB_PATH=./data/expense_tracker.db
NODE_ENV=development
```

### 4. Run both servers (from project root)
```bash
npm run dev
```

This starts:
- **Backend** → http://localhost:5000
- **Frontend** → http://localhost:3000

Or start them separately:
```bash
npm run dev:backend   # Terminal 1
npm run dev:frontend  # Terminal 2
```

### 5. Open the app
Visit **http://localhost:3000** → Register a new account → 10 categories and 40+ subcategories are auto-created for you!

---

## 📡 API Reference

All protected routes require `Authorization: Bearer <token>` header.

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register (returns token + user) |
| POST | `/api/auth/login` | Login (returns token + user) |
| GET  | `/api/auth/me` | Get current user 🔒 |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/transactions` | List (supports ?month, ?year, ?type, ?limit, ?offset) 🔒 |
| POST | `/api/transactions` | Create transaction 🔒 |
| PUT  | `/api/transactions/:id` | Update transaction 🔒 |
| DELETE | `/api/transactions/:id` | Delete transaction 🔒 |

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/categories` | List with subcategories 🔒 |
| POST | `/api/categories` | Create category 🔒 |
| PUT  | `/api/categories/:id` | Update category 🔒 |
| DELETE | `/api/categories/:id` | Delete category 🔒 |
| POST | `/api/subcategories` | Create subcategory 🔒 |
| DELETE | `/api/subcategories/:id` | Delete subcategory 🔒 |

### Dashboard & Budgets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/api/dashboard` | Dashboard data (?month, ?year) 🔒 |
| GET  | `/api/budgets` | List budgets 🔒 |
| POST | `/api/budgets` | Create/update budget 🔒 |
| DELETE | `/api/budgets/:id` | Delete budget 🔒 |

---

## 🗄 Database Schema

```sql
users          — id, name, email, password_hash, currency, created_at
categories     — id, user_id, name, icon, color, type (expense|income|saving)
subcategories  — id, category_id, user_id, name, icon
transactions   — id, user_id, category_id, subcategory_id, amount, type, description, date
budgets        — id, user_id, category_id, amount, month, year
```

The SQLite database is auto-created at `backend/data/expense_tracker.db` on first run.

---

## 🎨 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS v3, Custom CSS vars |
| Charts | Recharts |
| Routing | React Router v6 |
| HTTP | Axios |
| Dates | date-fns |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite (better-sqlite3) |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Validation | Zod |
| Dev | ts-node-dev, concurrently |

---

## 🔧 Extending the App

### Add a new currency
Edit `frontend/src/utils/index.ts` → `CURRENCIES` array.

### Add new default categories
Edit `backend/src/controllers/auth.controller.ts` → `DEFAULT_CATEGORIES` array.

### Change JWT expiry
Update `JWT_EXPIRES_IN` in `.env` (e.g. `30d`, `1h`).

### Production build
```bash
npm run build
# Backend: dist/ folder
# Frontend: frontend/dist/ folder (serve with nginx or express static)
```

---

## 📝 Notes

- All data is **per-user** — complete multi-user isolation via `user_id` foreign keys
- SQLite WAL mode enabled for better concurrent read performance
- Axios auto-redirects to `/login` on 401 responses
- Default categories are seeded **once** at registration — users can customize freely
