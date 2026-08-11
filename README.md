# Mini ERP + CRM Operations Portal

A professional, high-performance Mini ERP and CRM Operations Portal designed for enterprise workflows. This application provides secure role-based management across Admin, Sales, Warehouse, and Accounts teams.

## Technology Stack

### Backend
*   **Runtime & Language:** Node.js (v20+) with strict TypeScript
*   **Web Framework:** Express.js (v5 ESM)
*   **Database:** Supabase hosted PostgreSQL database
*   **Query Client:** Pool connection using the official `pg` package
*   **Authentication:** Stateless JWT (JSON Web Tokens)
*   **Tooling:** `tsx` for high-speed hot-reloading dev environment

### Frontend
*   **Framework & Language:** React (v18+) with strict TypeScript
*   **Bundler:** Vite
*   **Design & Theme:** Clean Google-style enterprise layout using responsive raw CSS variables & tokens

---

## Architecture Overview

```
                        +----------------------------+
                        |      React Frontend        |
                        |      (Vite + TS)           |
                        +--------------+-------------+
                                       | HTTP REST
                                       v
                        +--------------+-------------+
                        |      Express Backend       |
                        |      (Node.js + TS)        |
                        +--------------+-------------+
                                       | pg Pool
                                       v
                        +--------------+-------------+
                        |    PostgreSQL Database     |
                        |        (Supabase)          |
                        +----------------------------+
```

### Backend Separation of Concerns
1.  `server.ts` -> Entry point that solely handles starting the HTTP server.
2.  `app.ts` -> Boots Express, middleware setups (CORS, body parser), api routes integration, and error mapping.
3.  `routes/` -> Features routers defining specific REST endpoints.
4.  `controllers/` -> Handles HTTP deserialization, requests, and standard responses (no business logic).
5.  `services/` -> Executes core business logic and accesses the database connections pool.
6.  `middleware/` -> Reusable middleware for Auth checks, Role checks, validation results, and error traps.
7.  `validators/` -> Defines validation schemas for endpoints.
8.  `config/` -> Encapsulates validated environments and connections configuration.

---

## Folder Structure

```
mini-erp-crm/
├── backend/
│   ├── src/
│   │   ├── config/          # Env validations and Database configs
│   │   ├── controllers/     # HTTP Request handler functions
│   │   ├── services/        # Core business operations and DB access
│   │   ├── routes/          # REST Endpoint routes
│   │   ├── middleware/      # Authentication, Authorization, Error handlers
│   │   ├── validators/      # Payload structure and types assertions
│   │   ├── types/           # Type declarations
│   │   ├── utils/           # Shared utility helper methods
│   │   ├── constants/       # User Roles, Status values
│   │   ├── app.ts           # Configures middleware, routes, and errors
│   │   └── server.ts        # Starts the HTTP Listener
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── assets/          # Static elements
│   │   ├── components/      # Shared custom design blocks
│   │   ├── layouts/         # Page frames (Navbar, Sidebar, Grid)
│   │   ├── pages/           # Module Views (auth, dashboard, customers, etc.)
│   │   ├── routes/          # Routing config and Protected paths
│   │   ├── services/        # API Client utilities
│   │   ├── hooks/           # Shared React state hooks
│   │   ├── context/         # Centralized Session context (Auth state)
│   │   ├── types/           # Types interfaces
│   │   ├── utils/           # Client-side utility functions
│   │   ├── constants/       # Role permissions, API URIs
│   │   ├── App.tsx          # Root Component router
│   │   ├── main.tsx         # Virtual DOM Mounting
│   │   └── index.css        # Enterprise Design tokens and styles
│   ├── .env.example
│   ├── package.json
│   └── vite.config.ts
```

---

## Environment Variables

### Backend (`backend/.env`)
Create a `.env` file inside `backend/` with the following variables:
```ini
PORT=5000
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
JWT_SECRET=your_super_secure_jwt_secret_key
CLIENT_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)
Create a `.env` file inside `frontend/` with the following variables:
```ini
VITE_API_URL=http://localhost:5000/api
```

---

## Local Setup Instructions

1.  **Clone / Navigate to root workspace**
    ```bash
    cd s:/Full Stack Development/Infotech-fsd-project
    ```

2.  **Configure Environment Variables**
    *   Copy `backend/.env.example` to `backend/.env` and update variables.
    *   Copy `frontend/.env.example` to `frontend/.env` and update variables.

3.  **Install & Run Backend**
    ```bash
    cd backend
    npm install
    npm run dev
    ```

4.  **Install & Run Frontend**
    ```bash
    cd ../frontend
    npm install
    npm run dev
    ```

---

## Planned Modules
1.  **Authentication & Authorization:** Secure login with JWT. Role-based routing (Admin, Sales, Warehouse, Accounts).
2.  **Dashboard:** Responsive analytical overview of company health tailored to user's role permissions.
3.  **Customers Directory:** Profile management, engagement tracking, and business logs.
4.  **Products Catalog:** Inventory tracking, item pricing tiers, and stock management.
5.  **Challans & Orders:** Dispatch invoices, operations notes, delivery trackers, and ledger approvals.

---

## Deployment
*(Placeholder for deployment instructions and targets like Render, Supabase, Vercel, etc.)*
