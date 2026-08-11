import { pool } from "../config/database.js";
import type { CreateCustomerInput } from "../validators/customer.validation.js";

export interface CustomerRow {
  id: string;
  name: string;
  mobile: string;
  email: string;
  business_name: string;
  gst_number: string | null;
  customer_type: "RETAIL" | "WHOLESALE" | "DISTRIBUTOR";
  address: string;
  status: "LEAD" | "ACTIVE" | "INACTIVE";
  follow_up_date: Date | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CustomerListResult {
  rows: CustomerRow[];
  total: number;
}

export const customerRepository = {
  /**
   * Create a new customer record.
   */
  async create(input: CreateCustomerInput): Promise<CustomerRow> {
    const sql = `
      INSERT INTO customers (
        name, mobile, email, business_name, gst_number, customer_type, address, status, follow_up_date, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const values = [
      input.name.trim(),
      input.mobile.trim(),
      input.email.toLowerCase().trim(),
      input.business_name.trim(),
      input.gst_number ? input.gst_number.trim() : null,
      input.customer_type,
      input.address.trim(),
      input.status,
      input.follow_up_date ? new Date(input.follow_up_date) : null,
      input.notes ? input.notes.trim() : null,
    ];

    const res = await pool.query(sql, values);
    return res.rows[0];
  },

  /**
   * Find a customer by ID.
   */
  async findById(id: string): Promise<CustomerRow | null> {
    const res = await pool.query("SELECT * FROM customers WHERE id = $1", [id]);
    return res.rows[0] || null;
  },

  /**
   * Check if a customer exists with a specific mobile number (excluding a specific ID).
   */
  async findByMobile(mobile: string, excludeId?: string): Promise<CustomerRow | null> {
    let sql = "SELECT * FROM customers WHERE mobile = $1";
    const values = [mobile.trim()];
    if (excludeId) {
      sql += " AND id != $2";
      values.push(excludeId);
    }
    const res = await pool.query(sql, values);
    return res.rows[0] || null;
  },

  /**
   * Find customers with pagination, full-text search, and filtering options.
   */
  async findAll(query: {
    page: number;
    limit: number;
    search?: string | undefined;
    status?: string | undefined;
    customer_type?: string | undefined;
  }): Promise<CustomerListResult> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (query.search) {
      params.push(`%${query.search.trim()}%`);
      conditions.push(
        `(name ILIKE $${params.length} OR email ILIKE $${params.length} OR mobile ILIKE $${params.length} OR business_name ILIKE $${params.length})`
      );
    }

    if (query.status) {
      params.push(query.status);
      conditions.push(`status = $${params.length}`);
    }

    if (query.customer_type) {
      params.push(query.customer_type);
      conditions.push(`customer_type = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // 1. Get total count
    const countSql = `SELECT COUNT(*) FROM customers ${whereClause}`;
    const countRes = await pool.query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    // 2. Fetch rows with limit and offset
    const rowParams = [...params];
    rowParams.push(query.limit);
    const limitIndex = rowParams.length;
    rowParams.push((query.page - 1) * query.limit);
    const offsetIndex = rowParams.length;

    const selectSql = `
      SELECT * FROM customers 
      ${whereClause} 
      ORDER BY name ASC 
      LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `;

    const rowRes = await pool.query(selectSql, rowParams);

    return {
      rows: rowRes.rows,
      total,
    };
  },

  /**
   * Update fields of an existing customer record.
   */
  async update(id: string, updates: Partial<CreateCustomerInput>): Promise<CustomerRow | null> {
    const fields = Object.keys(updates) as Array<keyof typeof updates>;
    if (fields.length === 0) {
      return this.findById(id);
    }

    const setClauses = fields.map((field, idx) => `"${field}" = $${idx + 1}`);
    const values = fields.map((field) => {
      const val = updates[field];
      if (field === "email" && typeof val === "string") return val.toLowerCase().trim();
      if (field === "follow_up_date" && val) return new Date(val);
      if (typeof val === "string") return val.trim();
      return val;
    });

    values.push(id);
    const sql = `
      UPDATE customers 
      SET ${setClauses.join(", ")}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $${values.length} 
      RETURNING *
    `;

    const res = await pool.query(sql, values);
    return res.rows[0] || null;
  },

  /**
   * Delete a customer by ID.
   */
  async delete(id: string): Promise<boolean> {
    const res = await pool.query("DELETE FROM customers WHERE id = $1 RETURNING id", [id]);
    return (res.rowCount ?? 0) > 0;
  },
};
