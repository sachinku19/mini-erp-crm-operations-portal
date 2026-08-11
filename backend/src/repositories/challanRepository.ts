import { pool } from "../config/database.js";
import pkg from "pg";

export interface ChallanRow {
  id: string;
  challan_number: string;
  customer_id: string;
  customer_name?: string;
  customer_business_name?: string;
  total_quantity: number;
  status: "DRAFT" | "CONFIRMED" | "CANCELLED";
  created_by: string;
  created_by_name?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ChallanItemRow {
  id: string;
  challan_id: string;
  product_id: string | null;
  product_name: string;
  sku: string;
  unit_price: number;
  quantity: number;
}

export const challanRepository = {
  /**
   * Helper to resolve the database query context (transaction client vs general pool).
   */
  getQueryable(client?: pkg.PoolClient) {
    return client || pool;
  },

  /**
   * Create a new sales challan document record.
   */
  async create(
    challan: {
      challan_number: string;
      customer_id: string;
      total_quantity: number;
      status: "DRAFT" | "CONFIRMED" | "CANCELLED";
      created_by: string;
    },
    client?: pkg.PoolClient
  ): Promise<ChallanRow> {
    const q = this.getQueryable(client);
    const sql = `
      INSERT INTO challans (
        challan_number, customer_id, total_quantity, status, created_by
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [
      challan.challan_number,
      challan.customer_id,
      challan.total_quantity,
      challan.status,
      challan.created_by,
    ];

    const res = await q.query(sql, values);
    return res.rows[0];
  },

  /**
   * Insert an item snapshot linked to a challan.
   */
  async createItem(
    item: {
      challan_id: string;
      product_id: string;
      product_name: string;
      sku: string;
      unit_price: number;
      quantity: number;
    },
    client?: pkg.PoolClient
  ): Promise<ChallanItemRow> {
    const q = this.getQueryable(client);
    const sql = `
      INSERT INTO challan_items (
        challan_id, product_id, product_name, sku, unit_price, quantity
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      item.challan_id,
      item.product_id,
      item.product_name,
      item.sku,
      item.unit_price,
      item.quantity,
    ];

    const res = await q.query(sql, values);
    const row = res.rows[0];
    if (row) row.unit_price = parseFloat(row.unit_price);
    return row;
  },

  /**
   * Find a challan by ID, joining with customer and user tables.
   */
  async findById(id: string, client?: pkg.PoolClient): Promise<ChallanRow | null> {
    const q = this.getQueryable(client);
    const sql = `
      SELECT c.*, cust.name as customer_name, cust.business_name as customer_business_name, u.name as created_by_name
      FROM challans c
      JOIN customers cust ON c.customer_id = cust.id
      JOIN users u ON c.created_by = u.id
      WHERE c.id = $1
    `;
    const res = await q.query(sql, [id]);
    return res.rows[0] || null;
  },

  /**
   * Fetch all items linked to a specific challan.
   */
  async findItemsByChallanId(challanId: string, client?: pkg.PoolClient): Promise<ChallanItemRow[]> {
    const q = this.getQueryable(client);
    const res = await q.query(
      `SELECT * FROM challan_items WHERE challan_id = $1`,
      [challanId]
    );
    return res.rows.map((row) => {
      row.unit_price = parseFloat(row.unit_price);
      return row;
    });
  },

  /**
   * Count the number of challans created today to construct sequence numbers.
   */
  async getTodayCount(client?: pkg.PoolClient): Promise<number> {
    const q = this.getQueryable(client);
    const res = await q.query(
      `SELECT COUNT(*) FROM challans WHERE created_at >= CURRENT_DATE`
    );
    return parseInt(res.rows[0].count, 10);
  },

  /**
   * Query challans with pagination, status filter, customer filter, and search by number.
   */
  async findAll(query: {
    page: number;
    limit: number;
    status?: string | undefined;
    customer_id?: string | undefined;
    search?: string | undefined;
  }): Promise<{ rows: ChallanRow[]; total: number }> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (query.status) {
      params.push(query.status);
      conditions.push(`c.status = $${params.length}`);
    }

    if (query.customer_id) {
      params.push(query.customer_id);
      conditions.push(`c.customer_id = $${params.length}`);
    }

    if (query.search) {
      params.push(`%${query.search.trim()}%`);
      conditions.push(`c.challan_number ILIKE $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // 1. Get count
    const countSql = `
      SELECT COUNT(*) 
      FROM challans c 
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
      SELECT c.*, cust.name as customer_name, cust.business_name as customer_business_name, u.name as created_by_name
      FROM challans c
      JOIN customers cust ON c.customer_id = cust.id
      JOIN users u ON c.created_by = u.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `;

    const rowRes = await pool.query(selectSql, rowParams);
    return {
      rows: rowRes.rows,
      total,
    };
  },

  /**
   * Update details of an existing challan.
   */
  async update(
    id: string,
    updates: {
      customer_id?: string | undefined;
      total_quantity?: number | undefined;
      status?: "DRAFT" | "CONFIRMED" | "CANCELLED" | undefined;
    },
    client?: pkg.PoolClient
  ): Promise<ChallanRow | null> {
    const fields = Object.keys(updates) as Array<keyof typeof updates>;
    if (fields.length === 0) {
      return this.findById(id, client);
    }

    const setClauses = fields.map((field, idx) => `"${field}" = $${idx + 1}`);
    const values = fields.map((field) => updates[field]);
    values.push(id);

    const sql = `
      UPDATE challans 
      SET ${setClauses.join(", ")}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $${values.length} 
      RETURNING *
    `;

    const q = this.getQueryable(client);
    const res = await q.query(sql, values);
    return res.rows[0] || null;
  },

  /**
   * Delete item records linked to a challan.
   */
  async deleteItems(challanId: string, client?: pkg.PoolClient): Promise<void> {
    const q = this.getQueryable(client);
    await q.query("DELETE FROM challan_items WHERE challan_id = $1", [challanId]);
  },

  /**
   * Lock a challan row inside a transaction context (SELECT FOR UPDATE).
   */
  async lockChallan(id: string, client: pkg.PoolClient): Promise<ChallanRow | null> {
    const res = await client.query(
      `SELECT * FROM challans WHERE id = $1 FOR UPDATE`,
      [id]
    );
    return res.rows[0] || null;
  },
};
