import { pool } from "../config/database.js";
import type pkg from "pg";

export interface AuditLogInput {
  userId: string | null;
  userEmail: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  description: string;
  metadata?: any | null;
}

export interface AuditLogQuery {
  page: number;
  limit: number;
  search?: string | undefined;
  action?: string | undefined;
  userEmail?: string | undefined;
}

export const auditRepository = {
  /**
   * Insert a new append-only audit log entry.
   */
  async log(input: AuditLogInput, client?: pkg.PoolClient): Promise<void> {
    const db = client || pool;
    const sql = `
      INSERT INTO audit_logs (user_id, user_email, action, entity_type, entity_id, description, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    await db.query(sql, [
      input.userId,
      input.userEmail,
      input.action,
      input.entityType || null,
      input.entityId || null,
      input.description,
      input.metadata ? JSON.stringify(input.metadata) : null,
    ]);
  },

  /**
   * Query audit logs with server-side filters and pagination.
   */
  async query(q: AuditLogQuery) {
    const offset = (q.page - 1) * q.limit;
    const conditions: string[] = [];
    const params: any[] = [];

    if (q.search) {
      params.push(`%${q.search}%`);
      conditions.push(`(description ILIKE $${params.length} OR action ILIKE $${params.length} OR user_email ILIKE $${params.length})`);
    }

    if (q.action) {
      params.push(q.action);
      conditions.push(`action = $${params.length}`);
    }

    if (q.userEmail) {
      params.push(q.userEmail);
      conditions.push(`user_email = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // 1. Get total count
    const countSql = `SELECT COUNT(*) FROM audit_logs ${whereClause}`;
    const countRes = await pool.query(countSql, params);
    const total = parseInt(countRes.rows[0].count, 10);

    // 2. Fetch rows
    const selectParams = [...params];
    selectParams.push(q.limit);
    const limitIndex = selectParams.length;
    selectParams.push(offset);
    const offsetIndex = selectParams.length;

    const selectSql = `
      SELECT * FROM audit_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `;

    const rowRes = await pool.query(selectSql, selectParams);
    return {
      rows: rowRes.rows,
      total,
    };
  },
};
