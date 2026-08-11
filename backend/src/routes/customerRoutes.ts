import express from "express";
import { customerController } from "../controllers/customerController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerParamsSchema,
  queryCustomerSchema,
} from "../validators/customer.validation.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

// Apply authentication to all customer routes
router.use(authenticate);

/**
 * @route POST /api/v1/customers
 * @desc Create a new customer
 * @access Admin, Sales
 */
router.post(
  "/",
  authorize(ROLES.ADMIN, ROLES.SALES),
  validate({ body: createCustomerSchema }),
  customerController.create
);

/**
 * @route GET /api/v1/customers
 * @desc Retrieve list of customers
 * @access Admin, Sales, Warehouse, Accounts
 */
router.get(
  "/",
  authorize(ROLES.ADMIN, ROLES.SALES, ROLES.WAREHOUSE, ROLES.ACCOUNTS),
  validate({ query: queryCustomerSchema }),
  customerController.list
);

/**
 * @route GET /api/v1/customers/:id
 * @desc Retrieve single customer by ID
 * @access Admin, Sales, Warehouse, Accounts
 */
router.get(
  "/:id",
  authorize(ROLES.ADMIN, ROLES.SALES, ROLES.WAREHOUSE, ROLES.ACCOUNTS),
  validate({ params: customerParamsSchema }),
  customerController.getOne
);

/**
 * @route PUT /api/v1/customers/:id
 * @desc Update customer details by ID
 * @access Admin, Sales
 */
router.put(
  "/:id",
  authorize(ROLES.ADMIN, ROLES.SALES),
  validate({ params: customerParamsSchema, body: updateCustomerSchema }),
  customerController.update
);

/**
 * @route DELETE /api/v1/customers/:id
 * @desc Delete customer by ID
 * @access Admin (Only Admin is authorized to delete)
 */
router.delete(
  "/:id",
  authorize(ROLES.ADMIN),
  validate({ params: customerParamsSchema }),
  customerController.delete
);

export default router;
