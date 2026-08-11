import { runInTransaction } from "../config/database.js";
import { productRepository } from "../repositories/productRepository.js";
import type { ProductRow } from "../repositories/productRepository.js";
import { inventoryRepository } from "../repositories/inventoryRepository.js";
import type { StockMovementRow } from "../repositories/inventoryRepository.js";
import type {
  CreateProductInput,
  QueryProductInput,
  CreateStockMovementInput,
  QueryStockMovementInput,
} from "../validators/product.validation.js";
import { NotFoundError, ConflictError, BadRequestError } from "../utils/errors.js";

export interface PaginatedProducts {
  rows: ProductRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginatedMovements {
  rows: StockMovementRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const productService = {
  /**
   * Create a new product.
   */
  async createProduct(input: CreateProductInput): Promise<ProductRow> {
    const existing = await productRepository.findBySku(input.sku);
    if (existing) {
      throw new ConflictError("A product with this SKU already exists.", "DUPLICATE_SKU");
    }
    return productRepository.create(input);
  },

  /**
   * Retrieve a paginated list of products.
   */
  async getProducts(query: any): Promise<PaginatedProducts> {
    const { rows, total } = await productRepository.findAll({
      page: query.page,
      limit: query.limit,
      search: query.search,
      category: query.category,
      low_stock: query.low_stock,
      location_warehouse: query.location_warehouse,
      stock_status: query.stock_status,
      min_price: query.min_price,
      max_price: query.max_price,
    });

    const totalPages = Math.ceil(total / query.limit);

    return {
      rows,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    };
  },

  /**
   * Retrieve a single product by ID.
   */
  async getProductById(id: string): Promise<ProductRow> {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new NotFoundError("Product not found.", "PRODUCT_NOT_FOUND");
    }
    return product;
  },

  /**
   * Update details of an existing product, verifying that any changed SKU is unique.
   */
  async updateProduct(id: string, updates: Partial<CreateProductInput>): Promise<ProductRow> {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new NotFoundError("Product not found.", "PRODUCT_NOT_FOUND");
    }

    if (updates.sku && updates.sku.toUpperCase().trim() !== product.sku) {
      const existing = await productRepository.findBySku(updates.sku, id);
      if (existing) {
        throw new ConflictError("A product with this SKU already exists.", "DUPLICATE_SKU");
      }
    }

    const updated = await productRepository.update(id, updates);
    if (!updated) {
      throw new NotFoundError("Product not found.", "PRODUCT_NOT_FOUND");
    }
    return updated;
  },

  /**
   * Manually adjust stock levels for a product inside a database transaction,
   * enforcing the business rule that stock levels cannot drop below 0.
   */
  async adjustStock(
    userId: string,
    input: CreateStockMovementInput
  ): Promise<{ product: ProductRow; movement: StockMovementRow }> {
    return runInTransaction(async (client) => {
      // 1. Lock the product row
      const product = await productRepository.lockStock(input.product_id, client);
      if (!product) {
        throw new NotFoundError("Product not found.", "PRODUCT_NOT_FOUND");
      }

      // 2. Validate quantity check
      const quantityDelta =
        input.movement_type === "IN" ? input.quantity_changed : -input.quantity_changed;

      if (input.movement_type === "OUT" && product.current_stock < input.quantity_changed) {
        throw new BadRequestError(
          `Insufficient stock. Available stock for '${product.name}' is ${product.current_stock}, but requested change was -${input.quantity_changed}.`,
          "INSUFFICIENT_STOCK"
        );
      }

      // 3. Update stock count
      const updatedProduct = await productRepository.updateStock(
        input.product_id,
        quantityDelta,
        client
      );

      // 4. Record stock movement
      const movement = await inventoryRepository.create(
        {
          product_id: input.product_id,
          quantity_changed: input.quantity_changed,
          movement_type: input.movement_type,
          reason: input.reason,
          created_by: userId,
        },
        client
      );

      return {
        product: updatedProduct,
        movement,
      };
    });
  },

  /**
   * Retrieve stock movements logs with pagination and filters.
   */
  async getStockMovements(query: QueryStockMovementInput): Promise<PaginatedMovements> {
    const { rows, total } = await inventoryRepository.findAll({
      page: query.page,
      limit: query.limit,
      product_id: query.product_id,
      movement_type: query.movement_type,
    });

    const totalPages = Math.ceil(total / query.limit);

    return {
      rows,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
    };
  },
};
