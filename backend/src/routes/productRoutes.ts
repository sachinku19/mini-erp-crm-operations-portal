import express from "express";
import { productController } from "../controllers/productController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";
import {
  createProductSchema,
  updateProductSchema,
  productParamsSchema,
  queryProductSchema,
  createStockMovementSchema,
  queryStockMovementSchema,
} from "../validators/product.validation.js";
import { ROLES } from "../constants/roles.js";

// 1. Products Router (to be mounted at /api/v1/products)
export const productsRouter = express.Router();
productsRouter.use(authenticate);

productsRouter.post(
  "/",
  authorize(ROLES.ADMIN, ROLES.WAREHOUSE),
  validate({ body: createProductSchema }),
  productController.create
);

productsRouter.get(
  "/",
  authorize(ROLES.ADMIN, ROLES.SALES, ROLES.WAREHOUSE, ROLES.ACCOUNTS),
  validate({ query: queryProductSchema }),
  productController.list
);

productsRouter.get(
  "/:id",
  authorize(ROLES.ADMIN, ROLES.SALES, ROLES.WAREHOUSE, ROLES.ACCOUNTS),
  validate({ params: productParamsSchema }),
  productController.getOne
);

productsRouter.put(
  "/:id",
  authorize(ROLES.ADMIN, ROLES.WAREHOUSE),
  validate({ params: productParamsSchema, body: updateProductSchema }),
  productController.update
);

// 2. Inventory Router (to be mounted at /api/v1/inventory)
export const inventoryRouter = express.Router();
inventoryRouter.use(authenticate);

inventoryRouter.post(
  "/movement",
  authorize(ROLES.ADMIN, ROLES.WAREHOUSE),
  validate({ body: createStockMovementSchema }),
  productController.adjustStock
);

inventoryRouter.get(
  "/movement",
  authorize(ROLES.ADMIN, ROLES.SALES, ROLES.WAREHOUSE, ROLES.ACCOUNTS),
  validate({ query: queryStockMovementSchema }),
  productController.listMovements
);
