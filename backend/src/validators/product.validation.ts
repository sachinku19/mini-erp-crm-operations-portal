import { z } from "zod";

export const createProductSchema = z.object({
  name: z
    .string()
    .min(1, "Product name is required")
    .max(255),
  sku: z
    .string()
    .min(1, "SKU is required")
    .max(100),
  category: z
    .string()
    .min(1, "Category is required")
    .max(255),
  unit_price: z
    .number()
    .min(0, "Unit price must be greater than or equal to 0"),
  current_stock: z
    .number()
    .int()
    .min(0, "Current stock must be greater than or equal to 0")
    .default(0),
  minimum_stock_alert_quantity: z
    .number()
    .int()
    .min(0, "Minimum stock alert quantity must be greater than or equal to 0")
    .default(0),
  location_warehouse: z
    .string()
    .min(1, "Location/Warehouse is required")
    .max(255),
});

export const updateProductSchema = createProductSchema.partial();

export const productParamsSchema = z.object({
  id: z.string().uuid("Invalid product ID format. Must be a UUID."),
});

export const queryProductSchema = z.object({
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
  category: z.string().optional(),
  low_stock: z
    .string()
    .optional()
    .transform((val) => val === "true"),
});

export const createStockMovementSchema = z.object({
  product_id: z.string().uuid("Invalid product ID. Must be a UUID."),
  quantity_changed: z
    .number()
    .int()
    .min(1, "Quantity must be greater than 0"),
  movement_type: z.enum(["IN", "OUT"] as const),
  reason: z
    .string()
    .min(1, "Reason is required"),
});

export const queryStockMovementSchema = z.object({
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
  product_id: z.string().uuid("Invalid product ID").optional(),
  movement_type: z.enum(["IN", "OUT"] as const).optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type QueryProductInput = z.infer<typeof queryProductSchema>;
export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>;
export type QueryStockMovementInput = z.infer<typeof queryStockMovementSchema>;
