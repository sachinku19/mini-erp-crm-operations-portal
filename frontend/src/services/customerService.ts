import { api } from "./api";

export interface Customer {
  id: string;
  name: string;
  mobile: string;
  email: string;
  business_name: string;
  gst_number: string | null;
  customer_type: "RETAIL" | "WHOLESALE" | "DISTRIBUTOR";
  address: string;
  status: "LEAD" | "ACTIVE" | "INACTIVE";
  follow_up_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface GetCustomersQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: "LEAD" | "ACTIVE" | "INACTIVE";
  customer_type?: "RETAIL" | "WHOLESALE" | "DISTRIBUTOR";
}

export const customerService = {
  /**
   * Get a list of customers, applying search filters and pagination.
   */
  async getCustomers(query: GetCustomersQuery = {}) {
    const params = new URLSearchParams();
    if (query.page !== undefined) params.append("page", String(query.page));
    if (query.limit !== undefined) params.append("limit", String(query.limit));
    if (query.search) params.append("search", query.search);
    if (query.status) params.append("status", query.status);
    if (query.customer_type) params.append("customer_type", query.customer_type);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const res = await api.get<Customer[]>(`/v1/customers${queryString}`);
    return res;
  },

  /**
   * Fetch details of a single customer by ID.
   */
  async getCustomerById(id: string) {
    const res = await api.get<Customer>(`/v1/customers/${id}`);
    return res.data;
  },

  /**
   * Create a new customer record.
   */
  async createCustomer(customer: Omit<Customer, "id" | "created_at" | "updated_at">) {
    const res = await api.post<Customer>("/v1/customers", customer);
    return res.data;
  },

  /**
   * Update an existing customer record.
   */
  async updateCustomer(id: string, customer: Partial<Omit<Customer, "id" | "created_at" | "updated_at">>) {
    const res = await api.put<Customer>(`/v1/customers/${id}`, customer);
    return res.data;
  },

  /**
   * Delete a customer record by ID.
   */
  async deleteCustomer(id: string) {
    const res = await api.delete<{}>(`/v1/customers/${id}`);
    return res;
  },
};
