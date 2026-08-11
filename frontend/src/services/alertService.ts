import { api } from "./api";

export interface OperationalAlert {
  id: string;
  alert_type: "LOW_STOCK" | "OUT_OF_STOCK" | "OVERDUE_FOLLOWUP" | "PENDING_CHALLAN";
  title: string;
  message: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
  url: string;
}

export interface SystemHealthData {
  api_status: string;
  database_status: string;
  version: string;
  timestamp: string;
  uptime_seconds: number;
  memory_usage_mb: number;
}

export const alertService = {
  async getAlerts() {
    return api.get<OperationalAlert[]>("/v1/alerts");
  },

  async getSystemHealth() {
    return api.get<SystemHealthData>("/v1/alerts/system-health");
  },
};
