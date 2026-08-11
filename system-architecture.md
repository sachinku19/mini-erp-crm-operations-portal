---
description: Layered browser-to-database architecture and request flow.
---

# System Architecture

## System Architecture

The portal uses a layered web architecture. React provides the user interface. Express exposes REST APIs. PostgreSQL stores operational records through Supabase.

```
React + TypeScript + Vite
          ↓
       REST API
          ↓
Express + TypeScript
          ↓
Controllers → Services → Repositories
          ↓
      PostgreSQL
          ↓
       Supabase
```

### Layers

| Layer        | Responsibility                                             |
| ------------ | ---------------------------------------------------------- |
| Frontend     | Renders views, manages session state, and calls REST APIs  |
| API          | Receives HTTP requests and returns standard HTTP responses |
| Controllers  | Deserialize requests and coordinate responses              |
| Services     | Apply business logic and workflow rules                    |
| Repositories | Isolate data-access operations                             |
| Database     | Persists customer, product, inventory, and challan data    |

### Request flow

1. The browser sends an API request. Protected requests include a JWT.
2. Authentication middleware verifies the token.
3. Authorization middleware checks the required role.
4. The controller passes valid input to a service.
5. The service applies business rules and accesses data through the repository layer.
6. The controller returns the result or an error response.

### Cross-cutting controls

Configuration is supplied through environment variables. This includes database connectivity, JWT signing, allowed client origin, and API URLs.

Authentication middleware protects identity. Authorization middleware protects role-restricted operations. Error middleware maps failures to HTTP responses without exposing configuration or secrets.

> **Data boundary**
>
> PostgreSQL access stays behind the backend. Browser clients do not receive database credentials.
