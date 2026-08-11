---
description: >-
  Enterprise operations management across customer, sales, warehouse, and
  accounts workflows.
---

# Mini ERP + CRM Operations Portal

## Mini ERP + CRM Operations Portal

The Mini ERP + CRM Operations Portal unifies customer management and operational control. Teams use one system for customers, products, inventory, sales challans, and dispatch records.

It connects customer activity with stock availability and dispatch execution. This reduces handoffs across sales and warehouse operations.

### System at a glance

| Area       | Capability                                                      |
| ---------- | --------------------------------------------------------------- |
| Identity   | JWT authentication and role-based access control                |
| CRM        | Customer profiles, follow-up, search, filtering, and pagination |
| Operations | Products, inventory, stock movements, challans, and dispatch    |
| Visibility | Dashboard metrics and operational lists                         |
| Documents  | Professional PDF challan generation                             |
| Delivery   | Production deployment on Vercel, Render, and Supabase           |

### Why ERP and CRM are combined

CRM captures the customer context behind each sale. ERP controls products, stock, movements, and dispatch.

This shared workflow keeps a challan connected to its customer and inventory effect. It supports traceable operations from customer selection to stock update.

### Major modules

* **Authentication and access control** protect routes and API resources.
* **Customer CRM** manages customer profiles and follow-up activity.
* **Product and inventory management** tracks stock and stock movements.
* **Sales challans and dispatch** validate stock and record dispatch.
* **Dashboard and discovery** provide metrics, search, filtering, and pagination.

### Business value

The portal creates a shared operating record for sales, warehouse, accounts, and administration. Stock movement records support inventory traceability. Challan workflows connect dispatch decisions with stock changes.

### Target users

The application supports **Admin**, **Sales**, **Warehouse**, and **Accounts** users. Role-based authorization controls access for each role.

***

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

1. `server.ts` -> Entry point that solely handles starting the HTTP server.
2. `app.ts` -> Boots Express, middleware setups (CORS, body parser), api routes integration, and error mapping.
3. `routes/` -> Features routers defining specific REST endpoints.
4. `controllers/` -> Handles HTTP deserialization, requests, and standard responses (no business logic).
5. `services/` -> Executes core business logic and accesses the database connections pool.
6. `middleware/` -> Reusable middleware for Auth checks, Role checks, validation results, and error traps.
7. `validators/` -> Defines validation schemas for endpoints.
8. `config/` -> Encapsulates validated environments and connections configuration.

***

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

***

## Environment Variables

### Backend (`backend/.env`)

Create a `.env` file inside `backend/` with the following variables:

```ini
PORT=5000
DATABASE_URL=<your-database-url>
JWT_SECRET=<your-jwt-secret>
CLIENT_URL=<your-frontend-url>
```

### Frontend (`frontend/.env`)

Create a `.env` file inside `frontend/` with the following variables:

```ini
VITE_API_URL=<your-api-url>
```

***

## Local Setup Instructions

1.  **Clone / Navigate to root workspace**

    ```bash
    cd s:/Full Stack Development/Infotech-fsd-project
    ```
2. **Configure Environment Variables**
   * Copy `backend/.env.example` to `backend/.env` and update variables.
   * Copy `frontend/.env.example` to `frontend/.env` and update variables.
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

***

## Implemented capabilities

1. **Authentication & Authorization:** Secure login with JWT. Role-based routing (Admin, Sales, Warehouse, Accounts).
2. **Dashboard:** Responsive analytical overview of company health tailored to user's role permissions.
3. **Customers Directory:** Profile management, engagement tracking, and business logs.
4. **Products Catalog:** Inventory tracking, item pricing tiers, and stock management.
5. **Challans & Orders:** Dispatch invoices, operations notes, delivery trackers, and ledger approvals.

***

## Deployment

The frontend deploys to Vercel. The Express backend deploys to Render. PostgreSQL runs on Supabase.

See [Deployment & Setup](deployment-and-setup.md) for production configuration and verification.
