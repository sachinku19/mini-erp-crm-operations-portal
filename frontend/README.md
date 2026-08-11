---
description: Technology responsibilities and the frontend-backend organization.
---

# Technology Stack & Project Structure

## Technology Stack & Project Structure

| Layer           | Technology                       | Responsibility                                      |
| --------------- | -------------------------------- | --------------------------------------------------- |
| Web application | React and TypeScript             | Typed UI, application state, and protected routes   |
| Frontend build  | Vite                             | Local development and production frontend builds    |
| API runtime     | Node.js, Express, and TypeScript | REST endpoints, middleware, and business operations |
| Data platform   | PostgreSQL and Supabase          | Operational data and hosted database infrastructure |
| Authentication  | JWT                              | Stateless authenticated API requests                |
| Deployment      | Vercel, Render, and Supabase     | Frontend, backend, and database hosting             |

The frontend communicates with the backend through REST APIs. The backend owns authorization and database access.

### Project structure

```
mini-erp-crm/
├── frontend/src/
│   ├── assets/ components/ layouts/ pages/
│   ├── routes/ services/ hooks/ context/
│   ├── types/ utils/ constants/
│   ├── App.tsx             # Root application component
│   ├── main.tsx            # Application entry point
│   └── index.css           # Shared styles and design tokens
├── frontend/.env.example
├── frontend/vite.config.ts
└── backend/src/
    ├── config/             # Environment and database configuration
    ├── controllers/        # HTTP request and response handling
    ├── services/           # Business operations
    ├── routes/             # REST route definitions
    ├── middleware/         # Authentication, authorization, and errors
    ├── validators/         # Request validation
    ├── types/ utils/ constants/
    ├── app.ts              # Express application configuration
    └── server.ts           # HTTP server entry point
```

> **Boundary**
>
> UI code does not access PostgreSQL directly. All operational data flows through the Express API.
