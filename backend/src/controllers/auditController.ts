import type { Request, Response, NextFunction } from "express";
import { auditRepository } from "../repositories/auditRepository.js";

/**
 * Get paginated list of append-only audit logs.
 * Restricted to Admin role.
 */
export const getAuditLogs = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = parseInt((req.query.page as string) || "1", 10);
    const limit = parseInt((req.query.limit as string) || "20", 10);
    const search = (req.query.search as string) || undefined;
    const action = (req.query.action as string) || undefined;
    const userEmail = (req.query.userEmail as string) || undefined;

    const { rows, total } = await auditRepository.query({
      page,
      limit,
      search,
      action,
      userEmail,
    });

    res.status(200).json({
      success: true,
      message: "Audit logs retrieved successfully",
      data: rows,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};
