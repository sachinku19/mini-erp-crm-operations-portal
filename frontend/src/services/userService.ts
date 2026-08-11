import { api } from "./api";

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: "Admin" | "Sales" | "Warehouse" | "Accounts";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GetUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CreateUserPayload {
  email: string;
  name: string;
  role: string;
  password?: string;
}

export const userService = {
  async getUsers(query: GetUsersQuery = {}) {
    const params = new URLSearchParams();
    if (query.page) params.append("page", String(query.page));
    if (query.limit) params.append("limit", String(query.limit));
    if (query.search) params.append("search", query.search);

    const queryString = params.toString() ? `?${params.toString()}` : "";
    return api.get<UserAccount[]>(`/v1/users${queryString}`);
  },

  async createUser(payload: CreateUserPayload) {
    return api.post<UserAccount>("/v1/users", payload);
  },

  async updateRole(id: string, role: string) {
    return api.put<UserAccount>(`/v1/users/${id}/role`, { role });
  },

  async updateStatus(id: string, is_active: boolean) {
    return api.put<UserAccount>(`/v1/users/${id}/status`, { is_active });
  },
};
