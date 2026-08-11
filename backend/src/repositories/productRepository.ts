import { pool } from "../config/database.js";
import pkg from "pg";
import type { CreateProductInput } from "../validators/product.validation.js";

export interface ProductRow {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit_price: number;
  current_stock: number;
  minimum_stock_alert_quantity: number;
  location_warehouse: string;
  created_at: Date;
  updated_at: Date;
}

export const productRepository = {
  /**
   * Helper to resolve the database query context (transaction client vs general pool).
   */
  getQueryable(client?: pkg.PoolClient) {
    return client || pool;
  },

  /**
   * Create a new product.
   */
  async create(input: CreateProductInput): Promise<ProductRow> {
    const sql = `
      INSERT INTO products (
        name, sku, category, unit_price, current_stock, minimum_stock_alert_quantity, location_warehouse
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      input.name.trim(),
      input.sku.toUpperCase().trim(),
      input.category.trim(),
      input.unit_price,
      input.current_stock,
      input.minimum_stock_alert_quantity,
      input.location_warehouse.trim(),
    ];

    const res = await pool.query(sql, values);
    const row = res.rows[0];
    if (row) row.unit_price = parseFloat(row.unit_price);
    return row;
  },

  /**
   * Find a product by ID.
   */
  async findById(id: string, client?: pkg.PoolClient): Promise<ProductRow | null> {
    const q = this.getQueryable(client);
    const res = await q.query("SELECT * FROM products WHERE id = $1", [id]);
    const row = res.rows[0];
    if (row) row.unit_price = parseFloat(row.unit_price);
    return row || null;
  },

  /**
   * Find a product by SKU (excluding a specific ID).
   */
  async findBySku(sku: string, excludeId?: string): Promise<ProductRow | null> {
    let sql = "SELECT * FROM products WHERE sku = $1";
    const values = [sku.toUpperCase().trim()];
    if (excludeId) {
      sql += " AND id != $2";
      values.push(excludeId);
    }
    const res = await pool.query(sql, values);
    const row = res.rows[0];
    if (row) row.unit_price = parseFloat(row.unit_price);
    return row || null;
  },

  /**
   * Find products with pagination, search, category, and low stock alert filtering.
   */
  async findAll(query: {
    page: number;
    limit: number;
    search?: string | undefined;
    category?: string | undefined;
    low_stock?: boolean | undefined;
  }): Promise<{ rows: ProductRow[]; total: number }> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (query.search) {
      params.push(`%${query.search.trim()}%`);
      conditions.push(
        `(name ILIKE $${params.length} OR sku ILIKE $${params.length} OR category ILIKE $${params.length})`
      );
    }

    if (query.category) {
      params.push(query.category.trim());
      conditions.push(`category = $${params.length}`);
    }

    if (query.low_stock) {
      conditions.push(`current_stock <= minimum_stock_alert_quantity`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // 1. Get count
    const countSql = `SELECT COUNT(*) FROM products ${whereClause}`;
    const countRes = await pool.query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    // 2. Fetch rows
    const rowParams = [...params];
    rowParams.push(query.limit);
    const limitIndex = rowParams.length;
    rowParams.push((query.page - 1) * query.limit);
    const offsetIndex = rowParams.length;

    const selectSql = `
      SELECT * FROM products 
      ${whereClause} 
      ORDER BY name ASC 
      LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `;

    const rowRes = await pool.query(selectSql, rowParams);
    const rows = rowRes.rows.map((row) => {
      row.unit_price = parseFloat(row.unit_price);
      return row;
    });

    return { rows, total };
  },

  /**
   * Update fields of a product (accepts transaction client context).
   */
  async update(
    id: string,
    updates: Partial<CreateProductInput>,
    client?: pkg.PoolClient
  ): Promise<ProductRow | null> {
    const fields = Object.keys(updates) as Array<keyof typeof updates>;
    if (fields.length === 0) {
      return this.findById(id, client);
    }

    const setClauses = fields.map((field, idx) => `"${field}" = $${idx + 1}`);
    const values = fields.map((field) => {
      const val = updates[field];
      if (field === "sku" && typeof val === "string") return val.toUpperCase().trim();
      if (typeof val === "string") return val.trim();
      return val;
    });

    values.push(id);
    const sql = `
      UPDATE products 
      SET ${setClauses.join(", ")}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $${values.length} 
      RETURNING *
    `;

    const q = this.getQueryable(client);
    const res = await q.query(sql, values);
    const row = res.rows[0];
    if (row) row.unit_price = parseFloat(row.unit_price);
    return row || null;
  },

  /**
   * Locks the product row for updates inside a transaction (SELECT FOR UPDATE).
   */
  async lockStock(id: string, client: pkg.PoolClient): Promise<ProductRow | null> {
    const res = await client.query(
      `SELECT id, name, sku, category, unit_price, current_stock, minimum_stock_alert_quantity, location_warehouse, created_at, updated_at 
       FROM products 
       WHERE id = $1 FOR UPDATE`,
      [id]
    );
    const row = res.rows[0];
    if (row) row.unit_price = parseFloat(row.unit_price);
    return row || null;
  },

  /**
   * Update stock count by quantity delta (+/-) inside transaction.
   */
  async updateStock(id: string, quantityChange: number, client: pkg.PoolClient): Promise<ProductRow> {
    const res = await client.query(
      `UPDATE products 
       SET current_stock = current_stock + $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [quantityChange, id]
    );
    const row = res.rows[0];
    if (row) row.unit_price = parseFloat(row.unit_price);
    return row;
  },
};
