import type { Request, Response, NextFunction } from "express";
import { authService } from "../services/authService.js";
import { auditRepository } from "../repositories/auditRepository.js";

export const authController = {
  /**
   * POST /api/v1/auth/login
   * Authenticate a user and return user info + JWT token.
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      // Log the login audit event
      await auditRepository.log({
        userId: result.user.id,
        userEmail: result.user.email,
        action: "LOGIN",
        entityType: "USER",
        entityId: result.user.id,
        description: `User ${result.user.name} (${result.user.role}) logged in successfully.`,
      });

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
