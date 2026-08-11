---
description: JWT session lifecycle and the application security boundary.
---

# Authentication & Authorization

## Authentication & Authorization

Authentication identifies the user. Authorization determines whether that user can access a protected resource.

### Authentication flow

```
Login
  → Credential Validation
  → JWT Issued
  → Token Stored
  → Authenticated API Request
  → JWT Verification
  → Role Authorization
  → Protected Resource
```

1. The user submits credentials to `POST /api/v1/auth/login`.
2. The backend validates the credentials.
3. A successful login issues a JWT.
4. The client stores the token and restores session state when available.
5. Authenticated requests send the token in the authorization header.

```http
Authorization: Bearer <token>
```

### Session lifecycle

The frontend restores an existing authenticated session from its stored token. Protected routes use this state to avoid exposing restricted screens.

JWT expiration ends the authenticated session. A `401 Unauthorized` response requires the client to clear invalid session state and return the user to authentication.

> **Security boundary**
>
> Frontend route guards improve navigation and user experience. Backend JWT verification and role authorization are the final security boundary.

### Backend controls

Authentication middleware reads and verifies the JWT before protected handlers run. Authorization middleware then checks the authenticated role against the endpoint requirement.

The backend rejects missing, invalid, or expired tokens. It rejects authenticated users without the required role with `403 Forbidden`.

### Security responsibilities

| Layer    | Responsibility                                                                   |
| -------- | -------------------------------------------------------------------------------- |
| Frontend | Store session state, attach the bearer token, restore sessions, and guard routes |
| Backend  | Validate credentials, issue and verify JWTs, enforce roles, and protect data     |

Never rely on hidden frontend controls for access control. Every protected API operation must pass backend authorization.
