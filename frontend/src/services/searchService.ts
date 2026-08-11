import { api } from "./api";

export interface SearchResultItem {
  type: "CUSTOMER" | "PRODUCT" | "CHALLAN";
  id: string;
  title: string;
  subtitle: string;
  url: string;
}

export const searchService = {
  async globalSearch(q: string) {
    if (!q.trim()) return { data: [] };
    return api.get<SearchResultItem[]>(`/v1/search?q=${encodeURIComponent(q)}`);
  },
};
