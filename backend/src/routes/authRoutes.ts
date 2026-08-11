import express from "express";
import { authController } from "../controllers/authController.js";
import { validate } from "../middleware/validation.js";
import { loginSchema } from "../validators/auth.validation.js";

const router = express.Router();

/**
 * @route POST /api/v1/auth/login
 * @desc Authenticate user and return token
 * @access Public
 */
router.post("/login", validate({ body: loginSchema }), authController.login);

export default router;
