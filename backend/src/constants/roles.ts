export const ROLES = {
  ADMIN: "Admin",
  SALES: "Sales",
  WAREHOUSE: "Warehouse",
  ACCOUNTS: "Accounts",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];

export const STATUSES = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
} as const;
