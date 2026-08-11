import pkg from "pg";
import { config } from "./env.js";

const { Pool } = pkg;

// Initialize connection pool
// Don't crash on boot if DATABASE_URL is missing, just log warnings.
export const pool = new Pool({
  connectionString: config.DATABASE_URL || undefined,
  ssl:
    config.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : undefined,
});

// Event listener for errors on idle clients
pool.on("error", (err: Error) => {
  console.error("Unexpected error on idle database client:", err);
});

// Clean wrapper query helper
export const query = async (text: string, params?: unknown[]) => {
  return pool.query(text, params);
};

// Verify database connection health
export const checkDatabaseConnection = async (): Promise<boolean> => {
  if (!config.DATABASE_URL) {
    console.warn(
      "[Database Warning]: DATABASE_URL is not set. Database integration features will be disabled."
    );
    return false;
  }

  try {
    const client = await pool.connect();
    client.release();
    console.log("[Database]: Connected successfully to Supabase PostgreSQL.");
    return true;
  } catch (err) {
    console.error(
      "[Database Warning]: Database connection test failed:",
      err instanceof Error ? err.message : String(err)
    );
    return false;
  }
};

export type TransactionCallback<T> = (client: pkg.PoolClient) => Promise<T>;

/**
 * Executes a callback within a single database transaction, ensuring the client is properly released
 * and rolled back on error.
 */
export const runInTransaction = async <T>(
  callback: TransactionCallback<T>
): Promise<T> => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

