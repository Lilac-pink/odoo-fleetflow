# FleetFlow

A centralized fleet management web app for tracking vehicle lifecycles, dispatching trips with load validation, monitoring driver compliance and safety scores, and analyzing fuel spend and operational ROI across your delivery fleet.

## Tech Stack

| Layer      | Stack |
|-----------|--------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Query, React Router, Recharts, Framer Motion |
| **Backend**  | Node.js, Express 5, Prisma 7, PostgreSQL |
| **Auth**     | JWT, bcrypt |
| **Realtime** | Socket.io |

## Features

- **Dashboard** – Overview KPIs and fleet status
- **Vehicle Registry** – Manage vehicles (capacity, odometer, status, acquisition cost)
- **Trip Dispatcher** – Create and dispatch trips with load validation; link vehicles and drivers
- **Maintenance** – Log repairs and track status (New, In Progress, Completed)
- **Expenses & Fuel** – Record fuel logs and expenses by vehicle, trip, or driver
- **Driver Performance** – Driver roster, license expiry, safety score, completion rate, duty status
- **Analytics** – Operational and financial insights

Role-based access is enforced for: **Fleet Manager**, **Dispatcher**, **Safety Officer**, and **Financial Analyst**.

## Project Structure

```
odoo-fleetflow/
├── frontend/          # React + Vite app
│   ├── src/
│   │   ├── components/  # UI (shadcn) + app components
│   │   ├── contexts/    # FleetContext (auth + API)
│   │   ├── lib/        # api, utils, adapters
│   │   ├── pages/      # Dashboard, Vehicles, Trips, etc.
│   │   └── types/      # fleet.ts
│   └── package.json
├── backend/           # Express API
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/     # auth, vehicles, trips, drivers, maintenance, fuel-logs, expenses, analytics, resources
│   │   ├── middleware/ # auth
│   │   ├── prismaClient.js
│   │   └── server.js
│   ├── prisma/        # schema, migrations, seed
│   └── package.json
└── prisma/            # Root Prisma config (if used)
```

## Prerequisites

- **Node.js** (v18+)
- **PostgreSQL**
- **npm** or **yarn**

## Setup

### 1. Clone and install

```bash
git clone https://github.com/<your-org>/odoo-fleetflow.git
cd odoo-fleetflow
```

### 2. Backend

```bash
cd backend
npm install
```

Create a `.env` in `backend/` with:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
PORT=5000
JWT_SECRET="your-secret-key"
```

Generate Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

Optional – seed demo data:

```bash
node prisma/seed.js
```

Start the API:

```bash
npm run dev
# or: node src/server.js
```

Backend runs at **http://localhost:5000**.

### 3. Frontend

```bash
cd frontend
npm install
```

Create a `.env` in `frontend/` if the app expects an API base URL:

```env
VITE_API_URL=http://localhost:5000
```

Start the dev server:

```bash
npm run dev
```

Frontend runs at **http://localhost:5173** (or the port Vite prints).

### 4. Default login (after seeding)

- **Admin:** `admin@fleetflow.local` / `password123`
- **Dispatcher:** `dispatcher@fleetflow.local` / `password123`

## API Overview

| Base path        | Purpose |
|------------------|--------|
| `/api/auth`      | Login, register, session |
| `/api/vehicles`  | CRUD vehicles |
| `/api/trips`     | CRUD trips, dispatch |
| `/api/drivers`   | CRUD drivers |
| `/api/maintenance` | Maintenance logs |
| `/api/fuel-logs` | Fuel logs |
| `/api/expenses`  | Expenses |
| `/api/dashboard` | Dashboard aggregates |
| `/api/analytics` | Analytics data |
| `/api/resources` | Shared resources (e.g. dropdowns) |

## Scripts

**Backend** (`backend/`)

- `npm run dev` – run with nodemon (if configured)
- `npx prisma migrate dev` – apply migrations
- `npx prisma studio` – open Prisma Studio

**Frontend** (`frontend/`)

- `npm run dev` – Vite dev server
- `npm run build` – production build
- `npm run preview` – preview production build
- `npm run test` – run Vitest tests
- `npm run lint` – ESLint

## License

ISC
