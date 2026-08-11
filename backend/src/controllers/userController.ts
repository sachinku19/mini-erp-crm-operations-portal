import type { Request, Response, NextFunction } from "express";
import { pool } from "../config/database.js";
import bcrypt from "bcryptjs";
import { auditRepository } from "../repositories/auditRepository.js";
import { ConflictError, NotFoundError, BadRequestError } from "../utils/errors.js";

export const userController = {
  /**
   * GET /api/v1/users
   * List system users with pagination and search. (Admin only)
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt((req.query.page as string) || "1", 10);
      const limit = parseInt((req.query.limit as string) || "20", 10);
      const search = (req.query.search as string) || "";
      const offset = (page - 1) * limit;

      const params: any[] = [];
      let whereClause = "";

      if (search.trim()) {
        params.push(`%${search.trim()}%`);
        whereClause = `WHERE (name ILIKE $1 OR email ILIKE $1 OR role ILIKE $1)`;
      }

      const countSql = `SELECT COUNT(*) FROM users ${whereClause}`;
      const countRes = await pool.query(countSql, params);
      const total = parseInt(countRes.rows[0].count, 10);

      const rowParams = [...params];
      rowParams.push(limit);
      const limitIdx = rowParams.length;
      rowParams.push(offset);
      const offsetIdx = rowParams.length;

      const selectSql = `
        SELECT id, email, name, role, is_active, created_at, updated_at
        FROM users
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${limitIdx} OFFSET $${offsetIdx}
      `;

      const rowRes = await pool.query(selectSql, rowParams);

      res.status(200).json({
        success: true,
        message: "Users fetched successfully",
        data: rowRes.rows,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/users
   * Create a new employee user account. (Admin only)
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password, name, role } = req.body;

      if (!email || !password || !name || !role) {
        throw new BadRequestError("All fields (email, password, name, role) are required.");
      }

      const validRoles = ["Admin", "Sales", "Warehouse", "Accounts"];
      if (!validRoles.includes(role)) {
        throw new BadRequestError(`Invalid role. Allowed roles: ${validRoles.join(", ")}`);
      }

      // Check duplicate email
      const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase().trim()]);
      if (existing.rows.length > 0) {
        throw new ConflictError("A user with this email address already exists.", "DUPLICATE_EMAIL");
      }

      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(password, salt);

      const insertSql = `
        INSERT INTO users (email, password_hash, name, role, is_active)
        VALUES ($1, $2, $3, $4, TRUE)
        RETURNING id, email, name, role, is_active, created_at, updated_at
      `;

      const insertRes = await pool.query(insertSql, [
        email.toLowerCase().trim(),
        passwordHash,
        name.trim(),
        role,
      ]);

      const newUser = insertRes.rows[0];

      // Audit log
      await auditRepository.log({
        userId: req.user!.id,
        userEmail: req.user!.email,
        action: "USER_CREATED",
        entityType: "USER",
        entityId: newUser.id,
        description: `Created new user account '${newUser.name}' with role '${newUser.role}'.`,
        metadata: { name: newUser.name, role: newUser.role, email: newUser.email },
      });

      res.status(201).json({
        success: true,
        message: "User account created successfully",
        data: newUser,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/v1/users/:id/role
   * Update a user's assigned operational role. (Admin only)
   */
  async updateRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const { role } = req.body;

      const validRoles = ["Admin", "Sales", "Warehouse", "Accounts"];
      if (!validRoles.includes(role)) {
        throw new BadRequestError(`Invalid role. Allowed roles: ${validRoles.join(", ")}`);
      }

      const targetRes = await pool.query("SELECT id, name, role FROM users WHERE id = $1", [id]);
      if (targetRes.rows.length === 0) {
        throw new NotFoundError("User account not found.");
      }

      const oldRole = targetRes.rows[0].role;
      const userName = targetRes.rows[0].name;

      const updateRes = await pool.query(
        "UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, name, role, is_active, updated_at",
        [role, id]
      );

      const updatedUser = updateRes.rows[0];

      // Audit log
      await auditRepository.log({
        userId: req.user!.id,
        userEmail: req.user!.email,
        action: "ROLE_CHANGED",
        entityType: "USER",
        entityId: id,
        description: `Changed ${userName}'s role from '${oldRole}' to '${role}'.`,
        metadata: { old_role: oldRole, new_role: role, name: userName },
      });

      res.status(200).json({
        success: true,
        message: "User role updated successfully",
        data: updatedUser,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/v1/users/:id/status
   * Toggle active/inactive status of a user account. (Admin only)
   */
  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const { is_active } = req.body;

      if (typeof is_active !== "boolean") {
        throw new BadRequestError("is_active must be a boolean value.");
      }

      const targetRes = await pool.query("SELECT id, name, is_active FROM users WHERE id = $1", [id]);
      if (targetRes.rows.length === 0) {
        throw new NotFoundError("User account not found.");
      }

      const userName = targetRes.rows[0].name;

      const updateRes = await pool.query(
        "UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, email, name, role, is_active, updated_at",
        [is_active, id]
      );

      const updatedUser = updateRes.rows[0];

      // Audit log
      await auditRepository.log({
        userId: req.user!.id,
        userEmail: req.user!.email,
        action: "USER_STATUS_CHANGED",
        entityType: "USER",
        entityId: id,
        description: `${userName}'s account set to ${is_active ? "ACTIVE" : "INACTIVE"}.`,
        metadata: { is_active, name: userName },
      });

      res.status(200).json({
        success: true,
        message: `User account ${is_active ? "activated" : "deactivated"} successfully`,
        data: updatedUser,
      });
    } catch (err) {
      next(err);
    }
  },
};
