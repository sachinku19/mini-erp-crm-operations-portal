import type { Request, Response, NextFunction } from "express";
import { productService } from "../services/productService.js";

export const productController = {
  /**
   * POST /api/v1/products
   * Create a new product.
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.createProduct(req.body);
      res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: product,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/products
   * Retrieve list of products (with search, category, and low stock filters).
   */
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, search, category, low_stock } = req.query as any;
      const result = await productService.getProducts({
        page,
        limit,
        search,
        category,
        low_stock,
      });

      res.status(200).json({
        success: true,
        message: "Products fetched successfully",
        data: result.rows,
        meta: result.meta,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/products/:id
   * Retrieve single product by ID.
   */
  async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const product = await productService.getProductById(id);

      res.status(200).json({
        success: true,
        message: "Product fetched successfully",
        data: product,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/v1/products/:id
   * Update product details.
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const product = await productService.updateProduct(id, req.body);

      res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data: product,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/v1/inventory/movement
   * Manually adjust product stock levels.
   */
  async adjustStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // req.user is guaranteed by authenticate middleware
      const userId = req.user!.id;
      const result = await productService.adjustStock(userId, req.body);

      res.status(200).json({
        success: true,
        message: "Inventory stock adjusted successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/v1/inventory/movement
   * Retrieve lists of inventory stock movement logs.
   */
  async listMovements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, product_id, movement_type } = req.query as any;
      const result = await productService.getStockMovements({
        page,
        limit,
        product_id,
        movement_type,
      });

      res.status(200).json({
        success: true,
        message: "Inventory stock movements fetched successfully",
        data: result.rows,
        meta: result.meta,
      });
    } catch (err) {
      next(err);
    }
  },
};
