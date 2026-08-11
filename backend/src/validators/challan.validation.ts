import { z } from "zod";

const challanStatusSchema = z.enum(["DRAFT", "CONFIRMED", "CANCELLED"] as const);

export const challanItemSchema = z.object({
  product_id: z.string().uuid("Product ID must be a valid UUID."),
  quantity: z
    .number()
    .int()
    .min(1, "Quantity must be at least 1"),
});

export const createChallanSchema = z.object({
  customer_id: z.string().uuid("Customer ID must be a valid UUID."),
  status: challanStatusSchema.optional().default("DRAFT"),
  items: z
    .array(challanItemSchema)
    .min(1, "Challan must contain at least one item."),
});

export const updateChallanSchema = z.object({
  customer_id: z.string().uuid("Customer ID must be a valid UUID.").optional(),
  status: challanStatusSchema.optional(),
  items: z.array(challanItemSchema).min(1).optional(),
});

export const challanParamsSchema = z.object({
  id: z.string().uuid("Invalid Challan ID. Must be a UUID."),
});

export const queryChallanSchema = z.object({
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
  status: challanStatusSchema.optional(),
  customer_id: z.string().uuid("Invalid customer ID").optional(),
  search: z.string().optional(), // search by challan number
});

export type CreateChallanInput = z.infer<typeof createChallanSchema>;
export type UpdateChallanInput = z.infer<typeof updateChallanSchema>;
export type QueryChallanInput = z.infer<typeof queryChallanSchema>;
