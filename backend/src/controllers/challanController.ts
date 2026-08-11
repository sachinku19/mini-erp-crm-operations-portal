import type { Request, Response, NextFunction } from "express";
import { challanService } from "../services/challanService.js";

export const challanController = {
  /**
   * POST /api/v1/challans
   * Create a new sales challan (draft or confirmed).
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const challan = await challanService.createChallan(userId, req.body);

      res.status(201).json({
        success: true,
        message: "Challan created successfully",
        data: challan,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/challans
   * Retrieve list of challans (with page, limit, status, customer_id, and search filters).
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, status, customer_id, search } = req.query as any;
      const result = await challanService.getChallans({
        page,
        limit,
        status,
        customer_id,
        search,
      });

      res.status(200).json({
        success: true,
        message: "Challans fetched successfully",
        data: result.rows,
        meta: result.meta,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/challans/:id
   * Retrieve single challan details including items snapshot.
   */
  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const challan = await challanService.getChallanById(id);

      res.status(200).json({
        success: true,
        message: "Challan fetched successfully",
        data: challan,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/v1/challans/:id
   * Update details of an existing draft challan.
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const userId = req.user!.id;
      const challan = await challanService.updateChallan(id, userId, req.body);

      res.status(200).json({
        success: true,
        message: "Challan updated successfully",
        data: challan,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/challans/:id/confirm
   * Transition a draft challan to CONFIRMED, reducing stocks.
   */
  async confirm(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const userId = req.user!.id;
      const challan = await challanService.confirmChallan(id, userId);

      res.status(200).json({
        success: true,
        message: "Challan confirmed and stock deducted successfully",
        data: challan,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/challans/:id/cancel
   * Transition a draft or confirmed challan to CANCELLED (returns stock if previously confirmed).
   */
  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const userId = req.user!.id;
      const challan = await challanService.cancelChallan(id, userId);

      res.status(200).json({
        success: true,
        message: "Challan cancelled and stock restored successfully",
        data: challan,
      });
    } catch (err) {
      next(err);
    }
  },
};
