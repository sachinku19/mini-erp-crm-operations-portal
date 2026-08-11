import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { checkDatabaseConnection } from "./config/database.js";

// Import Versioned Routers
import authRouter from "./routes/authRoutes.js";
import customerRouter from "./routes/customerRoutes.js";
import { productsRouter, inventoryRouter } from "./routes/productRoutes.js";
import challanRouter from "./routes/challanRoutes.js";
import auditRouter from "./routes/auditRoutes.js";
import searchRouter from "./routes/searchRoutes.js";
import userRouter from "./routes/userRoutes.js";
import alertRouter from "./routes/alertRoutes.js";

const app = express();

// 1. Security Headers
app.use(helmet());

// 2. Configure CORS
app.use(
  cors({
    origin: config.CLIENT_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 3. Body parsing middleware (with standard size limit protection)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 4. Base API Routers
const apiRouter = express.Router();
app.use("/api", apiRouter);

// Standard API health check
apiRouter.get("/health", async (_req, res) => {
  const isConnected = await checkDatabaseConnection();
  res.status(isConnected ? 200 : 500).json({
    success: isConnected,
    message: isConnected ? "API is healthy" : "API is unhealthy",
    data: {
      database: isConnected ? "connected" : "disconnected",
    },
  });
});

// Database connection status check endpoint (used by frontend dashboard)
apiRouter.get("/db-check", async (_req, res) => {
  const isConnected = await checkDatabaseConnection();
  res.status(200).json({
    success: true,
    connected: isConnected,
    message: isConnected
      ? "Successfully connected to the database"
      : "Database connection failed or not configured",
  });
});

// 5. Versioned Router Mounts
const v1Router = express.Router();
apiRouter.use("/v1", v1Router);

v1Router.use("/auth", authRouter);
v1Router.use("/customers", customerRouter);
v1Router.use("/products", productsRouter);
v1Router.use("/inventory", inventoryRouter);
v1Router.use("/challans", challanRouter);
v1Router.use("/audit-logs", auditRouter);
v1Router.use("/search", searchRouter);
v1Router.use("/users", userRouter);
v1Router.use("/alerts", alertRouter);

// 6. 404 Route handler for unrecognized paths
app.use((_req, _res, next) => {
  const error = new Error("Resource not found");
  (error as any).statusCode = 404;
  (error as any).code = "NOT_FOUND";
  next(error);
});

// 7. Centralized Error Handling Middleware
app.use(errorHandler);

export default app;

