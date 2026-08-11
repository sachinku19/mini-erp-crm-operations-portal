import express from "express";
import { challanController } from "../controllers/challanController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validation.js";
import {
  createChallanSchema,
  updateChallanSchema,
  challanParamsSchema,
  queryChallanSchema,
} from "../validators/challan.validation.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

// Apply authentication to all challan routes
router.use(authenticate);

/**
 * @route POST /api/v1/challans
 * @desc Create a new sales challan (draft or confirmed)
 * @access Admin, Sales, Warehouse
 */
router.post(
  "/",
  authorize(ROLES.ADMIN, ROLES.SALES, ROLES.WAREHOUSE),
  validate({ body: createChallanSchema }),
  challanController.create
);

/**
 * @route GET /api/v1/challans
 * @desc Retrieve list of challans
 * @access Admin, Sales, Warehouse, Accounts
 */
router.get(
  "/",
  authorize(ROLES.ADMIN, ROLES.SALES, ROLES.WAREHOUSE, ROLES.ACCOUNTS),
  validate({ query: queryChallanSchema }),
  challanController.list
);

/**
 * @route GET /api/v1/challans/:id
 * @desc Retrieve single challan details including items snapshot
 * @access Admin, Sales, Warehouse, Accounts
 */
router.get(
  "/:id",
  authorize(ROLES.ADMIN, ROLES.SALES, ROLES.WAREHOUSE, ROLES.ACCOUNTS),
  validate({ params: challanParamsSchema }),
  challanController.getOne
);

/**
 * @route PUT /api/v1/challans/:id
 * @desc Update details of an existing draft challan
 * @access Admin, Sales, Warehouse
 */
router.put(
  "/:id",
  authorize(ROLES.ADMIN, ROLES.SALES, ROLES.WAREHOUSE),
  validate({ params: challanParamsSchema, body: updateChallanSchema }),
  challanController.update
);

/**
 * @route POST /api/v1/challans/:id/confirm
 * @desc Confirm a draft challan, deducting stock
 * @access Admin, Sales, Warehouse
 */
router.post(
  "/:id/confirm",
  authorize(ROLES.ADMIN, ROLES.SALES, ROLES.WAREHOUSE),
  validate({ params: challanParamsSchema }),
  challanController.confirm
);

/**
 * @route POST /api/v1/challans/:id/cancel
 * @desc Cancel a challan, restoring stock if confirmed
 * @access Admin, Sales, Warehouse
 */
router.post(
  "/:id/cancel",
  authorize(ROLES.ADMIN, ROLES.SALES, ROLES.WAREHOUSE),
  validate({ params: challanParamsSchema }),
  challanController.cancel
);

export default router;
