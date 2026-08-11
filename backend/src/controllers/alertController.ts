import type { Request, Response, NextFunction } from "express";
import { pool, checkDatabaseConnection } from "../config/database.js";

export const alertController = {
  /**
   * GET /api/v1/alerts
   * Returns active system alerts (low stock, out of stock, pending follow-ups, draft challans).
   */
  async getAlerts(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. Check Low Stock & Out of Stock products
      const prodRes = await pool.query(`
        SELECT id, name, sku, current_stock, minimum_stock_alert_quantity
        FROM products
        WHERE is_archived = FALSE AND current_stock <= minimum_stock_alert_quantity
        ORDER BY current_stock ASC
      `);

      const alerts: Array<{
        id: string;
        alert_type: "LOW_STOCK" | "OUT_OF_STOCK" | "OVERDUE_FOLLOWUP" | "PENDING_CHALLAN";
        title: string;
        message: string;
        entity_type: string;
        entity_id: string;
        created_at: string;
        url: string;
      }> = [];

      prodRes.rows.forEach((p) => {
        const isOutOfStock = p.current_stock === 0;
        alerts.push({
          id: `prod-${p.id}`,
          alert_type: isOutOfStock ? "OUT_OF_STOCK" : "LOW_STOCK",
          title: isOutOfStock ? `Out of Stock: ${p.name}` : `Low Stock Warning: ${p.name}`,
          message: `${p.name} (SKU: ${p.sku}) stock is ${p.current_stock} (Minimum alert: ${p.minimum_stock_alert_quantity}).`,
          entity_type: "PRODUCT",
          entity_id: p.id,
          created_at: new Date().toISOString(),
          url: `/products/${p.id}`,
        });
      });

      // 2. Check Overdue CRM Follow-ups
      const custRes = await pool.query(`
        SELECT id, name, business_name, follow_up_date
        FROM customers
        WHERE is_archived = FALSE
          AND follow_up_date IS NOT NULL
          AND follow_up_date <= CURRENT_TIMESTAMP
          AND follow_up_status = 'PENDING'
        ORDER BY follow_up_date ASC
        LIMIT 10
      `);

      custRes.rows.forEach((c) => {
        alerts.push({
          id: `cust-${c.id}`,
          alert_type: "OVERDUE_FOLLOWUP",
          title: `Follow-up Overdue: ${c.name}`,
          message: `Customer follow-up for ${c.business_name} was due on ${new Date(c.follow_up_date).toLocaleDateString()}.`,
          entity_type: "CUSTOMER",
          entity_id: c.id,
          created_at: c.follow_up_date,
          url: `/customers/${c.id}`,
        });
      });

      // 3. Check Pending Draft Challans
      const challanRes = await pool.query(`
        SELECT id, challan_number, created_at, total_quantity
        FROM challans
        WHERE status = 'DRAFT'
        ORDER BY created_at DESC
        LIMIT 5
      `);

      challanRes.rows.forEach((ch) => {
        alerts.push({
          id: `ch-${ch.id}`,
          alert_type: "PENDING_CHALLAN",
          title: `Draft Dispatch Pending: ${ch.challan_number}`,
          message: `Delivery challan ${ch.challan_number} (${ch.total_quantity} items) is awaiting confirmation.`,
          entity_type: "CHALLAN",
          entity_id: ch.id,
          created_at: ch.created_at,
          url: `/challans/${ch.id}`,
        });
      });

      res.status(200).json({
        success: true,
        message: "Operational alerts retrieved",
        data: alerts,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/alerts/system-health
   * Monitor database and backend API runtime health. (Admin only)
   */
  async getSystemHealth(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isDbConnected = await checkDatabaseConnection();
      
      const healthData = {
        api_status: "HEALTHY",
        database_status: isDbConnected ? "CONNECTED" : "DISCONNECTED",
        version: "v1.2.0-enterprise",
        timestamp: new Date().toISOString(),
        uptime_seconds: process.uptime(),
        memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      };

      res.status(200).json({
        success: true,
        message: "System health metrics retrieved",
        data: healthData,
      });
    } catch (err) {
      next(err);
    }
  },
};
