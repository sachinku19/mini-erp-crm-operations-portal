import { pool } from "../config/database.js";
import pkg from "pg";

export interface StockMovementRow {
  id: string;
  product_id: string;
  quantity_changed: number;
  movement_type: "IN" | "OUT";
  reason: string;
  created_by: string;
  created_at: Date;
  product_name?: string;
  product_sku?: string;
  user_name?: string;
}

export const inventoryRepository = {
  /**
   * Resolve database context (transaction client vs pool).
   */
  getQueryable(client?: pkg.PoolClient) {
    return client || pool;
  },

  /**
   * Create a new stock movement log record.
   */
  async create(
    movement: {
      product_id: string;
      quantity_changed: number;
      movement_type: "IN" | "OUT";
      reason: string;
      created_by: string;
    },
    client?: pkg.PoolClient
  ): Promise<StockMovementRow> {
    const q = this.getQueryable(client);
    const sql = `
      INSERT INTO stock_movements (
        product_id, quantity_changed, movement_type, reason, created_by
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [
      movement.product_id,
      movement.quantity_changed,
      movement.movement_type,
      movement.reason.trim(),
      movement.created_by,
    ];

    const res = await q.query(sql, values);
    return res.rows[0];
  },

  /**
   * Retrieve stock movements with pagination, product filter, and type filter.
   */
  async findAll(query: {
    page: number;
    limit: number;
    product_id?: string | undefined;
    movement_type?: "IN" | "OUT" | undefined;
  }): Promise<{ rows: StockMovementRow[]; total: number }> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (query.product_id) {
      params.push(query.product_id);
      conditions.push(`sm.product_id = $${params.length}`);
    }

    if (query.movement_type) {
      params.push(query.movement_type);
      conditions.push(`sm.movement_type = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // 1. Get count
    const countSql = `
      SELECT COUNT(*) 
      FROM stock_movements sm
      ${whereClause}
    `;
    const countRes = await pool.query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    // 2. Fetch rows
    const rowParams = [...params];
    rowParams.push(query.limit);
    const limitIndex = rowParams.length;
    rowParams.push((query.page - 1) * query.limit);
    const offsetIndex = rowParams.length;

    const selectSql = `
      SELECT sm.*, p.name as product_name, p.sku as product_sku, u.name as user_name
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      JOIN users u ON sm.created_by = u.id
      ${whereClause}
      ORDER BY sm.created_at DESC
      LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `;

    const rowRes = await pool.query(selectSql, rowParams);
    return {
      rows: rowRes.rows,
      total,
    };
  },
};
