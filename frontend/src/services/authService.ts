import { api } from "./api";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: "Admin" | "Sales" | "Warehouse" | "Accounts";
}

export interface LoginResponseData {
  user: UserProfile;
  token: string;
}

export const authService = {
  /**
   * Log in a user with email and password, returning their user profile and JWT token.
   */
  async login(email: string, password: string): Promise<LoginResponseData> {
    const res = await api.post<LoginResponseData>("/v1/auth/login", { email, password });
    return res.data;
  },
};
