import express from "express";
import cors from "cors";
import { config } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { checkDatabaseConnection } from "./config/database.js";

const app = express();

// Configure CORS
app.use(
  cors({
    origin: config.CLIENT_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Modular routing mount
const router = express.Router();
app.use("/api", router);

// Health Check Endpoint
router.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "ERP CRM API is running",
    timestamp: new Date().toISOString(),
  });
});

// Database connection status check endpoint
router.get("/db-check", async (_req, res) => {
  const isConnected = await checkDatabaseConnection();
  res.status(200).json({
    success: true,
    connected: isConnected,
    message: isConnected
      ? "Successfully connected to the database"
      : "Database connection failed or not configured",
  });
});

// 404 Route handler for unrecognized paths
app.use((_req, _res, next) => {
  const error = new Error("Resource not found");
  (error as any).statusCode = 404;
  next(error);
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
