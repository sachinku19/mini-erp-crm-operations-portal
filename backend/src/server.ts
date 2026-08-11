import app from "./app.js";
import { config } from "./config/env.js";
import { checkDatabaseConnection } from "./config/database.js";

const PORT = config.PORT;

const startServer = async () => {
  // Test connection to Supabase on boot (non-blocking)
  await checkDatabaseConnection();

  app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`🚀 ERP CRM API is running on port ${PORT}`);
    console.log(`🌍 Environment: ${config.NODE_ENV}`);
    console.log(`========================================`);
  });
};

startServer().catch((err) => {
  console.error("Critical error starting server:", err);
  process.exit(1);
});