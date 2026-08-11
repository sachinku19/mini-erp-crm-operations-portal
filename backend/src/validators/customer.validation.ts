import { z } from "zod";

const customerTypeSchema = z.enum(["RETAIL", "WHOLESALE", "DISTRIBUTOR"] as const);
const customerStatusSchema = z.enum(["LEAD", "ACTIVE", "INACTIVE"] as const);

export const createCustomerSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255),
  mobile: z
    .string()
    .min(1, "Mobile number is required")
    .max(50),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .max(255),
  business_name: z
    .string()
    .min(1, "Business name is required")
    .max(255),
  gst_number: z
    .string()
    .max(50)
    .nullable()
    .optional(),
  customer_type: customerTypeSchema,
  address: z
    .string()
    .min(1, "Address is required"),
  status: customerStatusSchema,
  follow_up_date: z
    .string()
    .datetime({ message: "Invalid ISO datetime string" })
    .nullable()
    .optional()
    .or(z.date().nullable().optional()),
  notes: z
    .string()
    .nullable()
    .optional(),
  follow_up_status: z.enum(["PENDING", "COMPLETED", "OVERDUE"] as const).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"] as const).optional(),
  last_interaction_date: z
    .string()
    .datetime({ message: "Invalid ISO datetime string" })
    .nullable()
    .optional()
    .or(z.date().nullable().optional()),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const customerParamsSchema = z.object({
  id: z.string().uuid("Invalid customer ID format. Must be a UUID."),
});

export const queryCustomerSchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) || parsed < 1 ? 1 : parsed;
    }),
  limit: z
    .string()
    .optional()
    .default("10")
    .transform((val) => {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) || parsed < 1 ? 10 : Math.min(parsed, 100);
    }),
  search: z.string().optional(),
  status: customerStatusSchema.optional(),
  customer_type: customerTypeSchema.optional(),
  follow_up_status: z.enum(["PENDING", "COMPLETED", "OVERDUE"] as const).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"] as const).optional(),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type QueryCustomerInput = z.infer<typeof queryCustomerSchema>;
