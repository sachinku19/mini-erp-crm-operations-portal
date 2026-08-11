import { api } from "./api";

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit_price: number;
  current_stock: number;
  minimum_stock_alert_quantity: number;
  location_warehouse: string;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  quantity_changed: number;
  movement_type: "IN" | "OUT";
  reason: string;
  created_by: string;
  created_at: string;
  product_name?: string;
  product_sku?: string;
  user_name?: string;
}

export interface GetProductsQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  low_stock?: boolean;
}

export interface GetMovementsQuery {
  page?: number;
  limit?: number;
  product_id?: string;
  movement_type?: "IN" | "OUT";
}

export const productService = {
  /**
   * Get a list of products, applying search terms and filters.
   */
  async getProducts(query: GetProductsQuery = {}) {
    const params = new URLSearchParams();
    if (query.page !== undefined) params.append("page", String(query.page));
    if (query.limit !== undefined) params.append("limit", String(query.limit));
    if (query.search) params.append("search", query.search);
    if (query.category) params.append("category", query.category);
    if (query.low_stock) params.append("low_stock", "true");

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const res = await api.get<Product[]>(`/v1/products${queryString}`);
    return res;
  },

  /**
   * Get details of a single product by ID.
   */
  async getProductById(id: string) {
    const res = await api.get<Product>(`/v1/products/${id}`);
    return res.data;
  },

  /**
   * Create a new product record.
   */
  async createProduct(product: Omit<Product, "id" | "created_at" | "updated_at">) {
    const res = await api.post<Product>("/v1/products", product);
    return res.data;
  },

  /**
   * Update details of a product.
   */
  async updateProduct(id: string, product: Partial<Omit<Product, "id" | "created_at" | "updated_at">>) {
    const res = await api.put<Product>(`/v1/products/${id}`, product);
    return res.data;
  },

  /**
   * Record a manual inventory stock adjustment (IN or OUT).
   */
  async adjustStock(adjustment: {
    product_id: string;
    quantity_changed: number;
    movement_type: "IN" | "OUT";
    reason: string;
  }) {
    const res = await api.post<{ product: Product; movement: StockMovement }>(
      "/v1/inventory/movement",
      adjustment
    );
    return res.data;
  },

  /**
   * Retrieve list of stock movement logs.
   */
  async getStockMovements(query: GetMovementsQuery = {}) {
    const params = new URLSearchParams();
    if (query.page !== undefined) params.append("page", String(query.page));
    if (query.limit !== undefined) params.append("limit", String(query.limit));
    if (query.product_id) params.append("product_id", query.product_id);
    if (query.movement_type) params.append("movement_type", query.movement_type);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const res = await api.get<StockMovement[]>(`/v1/inventory/movement${queryString}`);
    return res;
  },
};
