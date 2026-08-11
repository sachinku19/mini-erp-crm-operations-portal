import express from "express";
import { userController } from "../controllers/userController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

router.use(authenticate);
router.use(authorize(ROLES.ADMIN));

/**
 * @route GET /api/v1/users
 * @desc Get all employee users
 * @access Admin
 */
router.get("/", userController.list);

/**
 * @route POST /api/v1/users
 * @desc Create new employee user account
 * @access Admin
 */
router.post("/", userController.create);

/**
 * @route PUT /api/v1/users/:id/role
 * @desc Change user role
 * @access Admin
 */
router.put("/:id/role", userController.updateRole);

/**
 * @route PUT /api/v1/users/:id/status
 * @desc Activate or deactivate user account
 * @access Admin
 */
router.put("/:id/status", userController.updateStatus);

export default router;
