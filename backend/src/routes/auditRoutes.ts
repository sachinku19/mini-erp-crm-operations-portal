import express from "express";
import { getAuditLogs } from "../controllers/auditController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { ROLES } from "../constants/roles.js";

const router = express.Router();

router.use(authenticate);

/**
 * @route GET /api/v1/audit-logs
 * @desc Get append-only system activity logs
 * @access Admin
 */
router.get("/", authorize(ROLES.ADMIN), getAuditLogs);

export default router;
