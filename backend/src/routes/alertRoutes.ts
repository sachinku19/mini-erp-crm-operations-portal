import express from "express";
import { alertController } from "../controllers/alertController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

router.use(authenticate);

/**
 * @route GET /api/v1/alerts
 * @desc Get active operational alert items
 * @access Authenticated Users
 */
router.get("/", alertController.getAlerts);

/**
 * @route GET /api/v1/alerts/system-health
 * @desc Get backend and database health status
 * @access Admin
 */
router.get("/system-health", authorize(ROLES.ADMIN), alertController.getSystemHealth);

export default router;
