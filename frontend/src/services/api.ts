import { API_URL } from "../constants/index.js";

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: {
    code: string;
    details?: any;
  };
}

export class ApiError extends Error {
  public code: string;
  public details?: any;

  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}

let isRedirectingToLogin = false;

export const api = {
  getToken(): string | null {
    return localStorage.getItem("token");
  },

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers = new Headers(options.headers || {});

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    // Set a 30-second timeout if signal is not already provided
    if (!options.signal && typeof AbortSignal !== "undefined" && "timeout" in AbortSignal) {
      config.signal = AbortSignal.timeout(30000);
    }

    const url = `${API_URL}${endpoint}`;

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        localStorage.removeItem("token");
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
        
        if (!window.location.pathname.startsWith("/login") && !isRedirectingToLogin) {
          isRedirectingToLogin = true;
          setTimeout(() => {
            window.location.href = "/login?expired=true";
          }, 100);
        }
        throw new ApiError("Session expired. Please log in again.", "UNAUTHORIZED");
      }

      const data = await response.json() as ApiResponse<T>;

      if (!response.ok || !data.success) {
        throw new ApiError(
          data.message || "Something went wrong",
          data.error?.code || "UNKNOWN_ERROR",
          data.error?.details
        );
      }

      return data;
    } catch (err: any) {
      if (err instanceof ApiError) {
        throw err;
      }
      if (err.name === "AbortError" || err.name === "TimeoutError") {
        throw new ApiError("API request timed out after 30 seconds.", "TIMEOUT_ERROR");
      }
      throw new ApiError(
        err instanceof Error ? err.message : "Network error occurred",
        "NETWORK_ERROR"
      );
    }
  },

  get<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  },

  post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(endpoint: string, body?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  },
};
