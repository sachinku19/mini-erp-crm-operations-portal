import type { Request, Response, NextFunction } from "express";
import { customerService } from "../services/customerService.js";

export const customerController = {
  /**
   * POST /api/v1/customers
   * Create a new customer.
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customer = await customerService.createCustomer(req.body);
      res.status(201).json({
        success: true,
        message: "Customer created successfully",
        data: customer,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/customers
   * Retrieve list of customers (with searching, filtering, and pagination).
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Query fields are already coerced/parsed by Zod middleware
      const { page, limit, search, status, customer_type } = req.query as any;
      const result = await customerService.getCustomers({
        page,
        limit,
        search,
        status,
        customer_type,
      });

      res.status(200).json({
        success: true,
        message: "Customers fetched successfully",
        data: result.rows,
        meta: result.meta,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/customers/:id
   * Retrieve customer details by ID.
   */
  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const customer = await customerService.getCustomerById(id);

      res.status(200).json({
        success: true,
        message: "Customer fetched successfully",
        data: customer,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/v1/customers/:id
   * Update details of a customer.
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const customer = await customerService.updateCustomer(id, req.body);

      res.status(200).json({
        success: true,
        message: "Customer updated successfully",
        data: customer,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/v1/customers/:id
   * Delete a customer.
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      await customerService.deleteCustomer(id);

      res.status(200).json({
        success: true,
        message: "Customer deleted successfully",
        data: {},
      });
    } catch (err) {
      next(err);
    }
  },
};
