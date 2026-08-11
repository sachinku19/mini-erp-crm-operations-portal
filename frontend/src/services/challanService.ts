import { api } from "./api";

export interface ChallanItem {
  id?: string;
  product_id: string;
  product_name?: string;
  sku?: string;
  unit_price?: number;
  quantity: number;
}

export interface Challan {
  id: string;
  challan_number: string;
  customer_id: string;
  customer_name?: string;
  customer_business_name?: string;
  total_quantity: number;
  status: "DRAFT" | "CONFIRMED" | "CANCELLED";
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  items?: ChallanItem[];
}

export interface GetChallansQuery {
  page?: number;
  limit?: number;
  status?: "DRAFT" | "CONFIRMED" | "CANCELLED";
  customer_id?: string;
  search?: string;
}

export const challanService = {
  /**
   * Get list of sales challans with filters and search.
   */
  async getChallans(query: GetChallansQuery = {}) {
    const params = new URLSearchParams();
    if (query.page !== undefined) params.append("page", String(query.page));
    if (query.limit !== undefined) params.append("limit", String(query.limit));
    if (query.status) params.append("status", query.status);
    if (query.customer_id) params.append("customer_id", query.customer_id);
    if (query.search) params.append("search", query.search);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const res = await api.get<Challan[]>(`/v1/challans${queryString}`);
    return res;
  },

  /**
   * Get detailed view of a challan by ID, including items.
   */
  async getChallanById(id: string) {
    const res = await api.get<Challan>(`/v1/challans/${id}`);
    return res.data;
  },

  /**
   * Create a new sales challan (draft or confirmed).
   */
  async createChallan(challan: {
    customer_id: string;
    items: ChallanItem[];
    status?: "DRAFT" | "CONFIRMED";
  }) {
    const res = await api.post<Challan>("/v1/challans", challan);
    return res.data;
  },

  /**
   * Update an existing draft challan.
   */
  async updateChallan(
    id: string,
    updates: {
      customer_id?: string;
      items?: ChallanItem[];
      status?: "DRAFT" | "CONFIRMED";
    }
  ) {
    const res = await api.put<Challan>(`/v1/challans/${id}`, updates);
    return res.data;
  },

  /**
   * Transition draft challan to CONFIRMED.
   */
  async confirmChallan(id: string) {
    const res = await api.post<Challan>(`/v1/challans/${id}/confirm`);
    return res.data;
  },

  /**
   * Cancel an existing challan.
   */
  async cancelChallan(id: string) {
    const res = await api.post<Challan>(`/v1/challans/${id}/cancel`);
    return res.data;
  },
};
