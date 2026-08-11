import type { Request, Response, NextFunction } from "express";
import { authService } from "../services/authService.js";

export const authController = {
  /**
   * POST /api/v1/auth/login
   * Authenticate a user and return user info + JWT token.
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },
};
