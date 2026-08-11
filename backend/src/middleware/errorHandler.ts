import type { Request, Response, NextFunction } from "express";

// Custom error class to represent API errors
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    // Set prototype chain explicitly to preserve instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// Global express error handler middleware
export const errorHandler = (
  err: Error & { statusCode?: number },
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Log full stack details in development/error cases
  console.error(`[Express Error Handler] (${statusCode}):`, err);

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
};
