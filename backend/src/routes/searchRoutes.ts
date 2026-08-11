import express from "express";
import { globalSearch } from "../controllers/searchController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticate);

/**
 * @route GET /api/v1/search
 * @desc Search across Customers, Products, and Challans
 * @access Authenticated Users
 */
router.get("/", globalSearch);

export default router;
