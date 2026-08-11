import dotenv from "dotenv";

// Load environment variables
dotenv.config();

export interface EnvConfig {
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  CLIENT_URL: string;
  NODE_ENV: string;
}

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    console.warn(`[Config Warning]: Environment variable ${key} is not set.`);
    return "";
  }
  return value;
};

export const config: EnvConfig = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  DATABASE_URL: getEnv("DATABASE_URL"),
  JWT_SECRET: getEnv("JWT_SECRET", "development_secret_key_change_in_production"),
  CLIENT_URL: getEnv("CLIENT_URL", "http://localhost:5173"),
  NODE_ENV: getEnv("NODE_ENV", "development"),
};
