---
description: Implemented roles and the authorization model.
---

# User Roles & Permissions

## User Roles & Permissions

The portal implements four business roles: **Admin**, **Sales**, **Warehouse**, and **Accounts**. Authorization is enforced at the backend.

### Role responsibilities

#### Admin

Admin oversees the operational system and administrative operations. Admin participates across the business workflow where administrative access is granted.

#### Sales

Sales manages customer-facing work. Sales participates from customer selection through challan preparation and dispatch review.

#### Warehouse

Warehouse manages the stock-facing stages of operations. Warehouse participates in availability checks, stock movements, dispatch, and inventory updates.

#### Accounts

Accounts uses business records for financial and operational reconciliation. Accounts participates after sales and dispatch records are created.

### Permission matrix

The current implementation confirms role-based authorization and these operational areas. The source material does not define a role-by-module grant matrix. Do not infer access from job titles.

| Module                    | Authorization status                   |
| ------------------------- | -------------------------------------- |
| Customers                 | Protected by application authorization |
| Products                  | Protected by application authorization |
| Inventory                 | Protected by application authorization |
| Stock Movements           | Protected by application authorization |
| Sales Challans            | Protected by application authorization |
| Dashboard                 | Role-aware access control applies      |
| Administrative Operations | Restricted through role authorization  |

> **Implementation-controlled grants**
>
> The deployed role middleware is the authoritative source for allowed and restricted operations. No unverified create, edit, delete, confirm, or cancel grant is documented here.

### Workflow position

Sales initiates customer and challan activity. Warehouse validates and executes stock-affecting dispatch activity. Accounts uses resulting business records. Admin provides operational oversight.

This separation supports controlled handoffs. It does not replace backend permission checks.
