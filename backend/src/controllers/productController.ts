import type { Request, Response, NextFunction } from "express";
import { productService } from "../services/productService.js";
import { auditRepository } from "../repositories/auditRepository.js";

export const productController = {
  /**
   * POST /api/v1/products
   * Create a new product.
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.createProduct(req.body);

      // Log the create event
      await auditRepository.log({
        userId: (req as any).user?.id || null,
        userEmail: (req as any).user?.email || "system",
        action: "PRODUCT_CREATED",
        entityType: "PRODUCT",
        entityId: product.id,
        description: `Product '${product.name}' (SKU: ${product.sku}) created.`,
        metadata: { sku: product.sku, initial_stock: product.current_stock },
      });

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

      // Log the update event
      await auditRepository.log({
        userId: (req as any).user?.id || null,
        userEmail: (req as any).user?.email || "system",
        action: "PRODUCT_UPDATED",
        entityType: "PRODUCT",
        entityId: product.id,
        description: `Product '${product.name}' (SKU: ${product.sku}) details updated.`,
        metadata: { sku: product.sku, updates: Object.keys(req.body) },
      });

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
      const prod = await productService.getProductById(req.body.product_id);
      const action = req.body.movement_type === "IN" ? "STOCK_IN" : "STOCK_OUT";

      // Log the stock adjustment event
      await auditRepository.log({
        userId: userId,
        userEmail: req.user!.email,
        action,
        entityType: "PRODUCT",
        entityId: req.body.product_id,
        description: `Manual stock adjustment (${req.body.movement_type}) for '${prod.name}' by ${req.body.quantity_changed} units. Reason: ${req.body.reason}`,
        metadata: { quantity: req.body.quantity_changed, reason: req.body.reason },
      });

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
