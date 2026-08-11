import { pool } from "../config/database.js";
import type { UserRole } from "../constants/roles.js";

export interface UserRow {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export const userRepository = {
  /**
   * Find a user by their email address.
   */
  async findByEmail(email: string): Promise<UserRow | null> {
    const res = await pool.query(
      "SELECT id, email, name, role, password_hash, created_at, updated_at FROM users WHERE email = $1",
      [email.toLowerCase().trim()]
    );
    return res.rows[0] || null;
  },

  /**
   * Find a user by their unique ID.
   */
  async findById(id: string): Promise<Omit<UserRow, "password_hash"> | null> {
    const res = await pool.query(
      "SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = $1",
      [id]
    );
    return res.rows[0] || null;
  },
};
