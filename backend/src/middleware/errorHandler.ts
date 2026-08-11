import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";

// Global express error handler middleware
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = "Internal Server Error";
  let code = "INTERNAL_SERVER_ERROR";
  let details: unknown = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
    details = err.details;
  } else {
    // Check for PostgreSQL specific errors
    const pgErr = err as { code?: string; detail?: string; table?: string };
    if (pgErr.code === "23505") {
      statusCode = 409;
      message = pgErr.detail || "A record with this unique identifier already exists.";
      code = "CONFLICT";
    } else if (pgErr.code === "23503") {
      statusCode = 400;
      message = "Reference check failed: associated record not found.";
      code = "FOREIGN_KEY_VIOLATION";
    } else {
      if (process.env.NODE_ENV !== "production") {
        message = err.message || message;
        details = err.stack;
      }
    }
  }

  // Log full stack details in development/error cases
  console.error(`[Express Error Handler] (${statusCode}):`, err);

  res.status(statusCode).json({
    success: false,
    message,
    error: {
      code,
      ...(details !== undefined && { details }),
    },
  });
};
