import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { productService } from "../../services/productService";
import type { Product } from "../../services/productService";
import { Search, Plus, Eye, Edit2, ShieldAlert, AlertTriangle, Download } from "lucide-react";
import { exportToCsv } from "../../utils/csvExporter";

export const Products: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get filter params from url query string
  const page = parseInt(searchParams.get("page") || "1", 10);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const lowStock = searchParams.get("low_stock") === "true";

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search input state
  const [searchInput, setSearchInput] = useState<string>(search);


  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const query: any = {
          page,
          limit: 10,
        };
        if (search) query.search = search;
        if (category) query.category = category;
        if (lowStock) query.low_stock = true;

        const res = await productService.getProducts(query);
        setProducts(res.data);
        setTotal(res.meta?.total ?? 0);
        setTotalPages(res.meta?.totalPages ?? 1);
      } catch (err: any) {
        setError(err.message || "Failed to load product list.");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [page, search, category, lowStock]);

  const updateFilters = (newFilters: { page?: number; search?: string; category?: string; low_stock?: boolean }) => {
    const nextParams = new URLSearchParams(searchParams);

    if (newFilters.page !== undefined) {
      nextParams.set("page", String(newFilters.page));
    } else {
      nextParams.set("page", "1");
    }

    if (newFilters.search !== undefined) {
      if (newFilters.search) nextParams.set("search", newFilters.search);
      else nextParams.delete("search");
    }

    if (newFilters.category !== undefined) {
      if (newFilters.category) nextParams.set("category", newFilters.category);
      else nextParams.delete("category");
    }

    if (newFilters.low_stock !== undefined) {
      if (newFilters.low_stock) nextParams.set("low_stock", "true");
      else nextParams.delete("low_stock");
    }

    setSearchParams(nextParams);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput });
  };


  const isLowStock = (p: Product) => {
    return p.current_stock <= p.minimum_stock_alert_quantity;
  };

  return (
    <div>
      {/* Header Panel */}
      <div className="flex justify-between items-center mb-md">
        <div>
          <h1 style={{ fontSize: "var(--font-size-xl)", fontWeight: "var(--font-weight-bold)" }}>
            Inventory Catalog
          </h1>
          <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
            Monitor product SKUs, warehouse storage allocations, prices, and stock counts.
          </p>
        </div>
        <div className="flex gap-sm">
          <button className="btn btn-outline" onClick={() => exportToCsv("products_report", products)} disabled={products.length === 0}>
            <Download size={16} /> Export CSV
          </button>
          <Link to="/products/create" className="btn btn-primary">
            <Plus size={16} /> Add Product
          </Link>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="card" style={{ padding: "var(--spacing-md)", marginBottom: "var(--spacing-lg)" }}>
        <form onSubmit={handleSearchSubmit} className="flex" style={{ gap: "var(--spacing-md)", flexWrap: "wrap", alignItems: "center" }}>
          {/* Search box */}
          <div style={{ position: "relative", flex: "1 1 250px" }}>
            <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-disabled)", display: "flex" }}>
              <Search size={16} />
            </span>
            <input
              type="text"
              className="form-input"
              placeholder="Search by name or SKU..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ paddingLeft: "34px" }}
            />
          </div>

          {/* Category dropdown */}
          <div style={{ flex: "0 0 160px" }}>
            <select
              className="form-select"
              value={category}
              onChange={(e) => updateFilters({ category: e.target.value })}
            >
              <option value="">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Appliances">Appliances</option>
              <option value="Accessories">Accessories</option>
            </select>
          </div>

          {/* Low Stock checkbox filter */}
          <label className="flex items-center gap-sm" style={{ cursor: "pointer", fontSize: "var(--font-size-sm)", color: "var(--color-text-primary)" }}>
            <input
              type="checkbox"
              checked={lowStock}
              onChange={(e) => updateFilters({ low_stock: e.target.checked })}
              style={{ width: "16px", height: "16px", cursor: "pointer" }}
            />
            <span className="flex items-center gap-xs" style={{ color: lowStock ? "var(--color-warning-hover)" : "inherit", fontWeight: lowStock ? "var(--font-weight-semibold)" : "normal" }}>
              <AlertTriangle size={16} style={{ color: "var(--color-warning)" }} /> Low Stock Alert Only
            </span>
          </label>

          {/* Reset Filters */}
          {(search || category || lowStock) && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setSearchInput("");
                setSearchParams({});
              }}
              style={{ marginLeft: "auto" }}
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {error && (
        <div className="alert alert-danger">
          <ShieldAlert size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Datatable */}
      {loading ? (
        <div className="table-container">
          <div className="skeleton skeleton-row" style={{ height: "40px" }} />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton skeleton-row" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "var(--spacing-xxl) var(--spacing-lg)" }}>
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-base)", marginBottom: "var(--spacing-md)" }}>
            No products found matching these filters.
          </p>
          <Link to="/products/create" className="btn btn-primary">
            + Add Product to Catalog
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Unit Price</th>
                <th>Current Stock</th>
                <th>Min Alert Threshold</th>
                <th>Warehouse Location</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const low = isLowStock(p);
                return (
                  <tr key={p.id} style={{ backgroundColor: low ? "rgba(249, 171, 0, 0.03)" : "inherit" }}>
                    <td style={{ fontFamily: "monospace", fontSize: "0.75rem", fontWeight: "var(--font-weight-semibold)" }}>{p.sku}</td>
                    <td>
                      <Link to={`/products/${p.id}`} style={{ fontWeight: "var(--font-weight-medium)" }}>
                        {p.name}
                      </Link>
                    </td>
                    <td>{p.category}</td>
                    <td>₹{p.unit_price.toLocaleString()}</td>
                    <td>
                      <div className="flex items-center gap-xs" style={{ fontWeight: low ? "var(--font-weight-bold)" : "normal" }}>
                        <span className={low ? "text-danger" : "text-success"}>
                          {p.current_stock} units
                        </span>
                        {low && (
                          <span className="badge badge-warning" style={{ padding: "2px 6px", fontSize: "0.625rem" }}>
                            Low
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ color: "var(--color-text-secondary)" }}>{p.minimum_stock_alert_quantity} units</td>
                    <td style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>{p.location_warehouse}</td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "var(--spacing-xs)" }}>
                        <Link to={`/products/${p.id}`} className="btn btn-outline" style={{ padding: "6px" }} title="View details">
                          <Eye size={14} />
                        </Link>
                        <Link to={`/products/${p.id}/edit`} className="btn btn-outline" style={{ padding: "6px" }} title="Edit details">
                          <Edit2 size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination control footer */}
          <div className="pagination">
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
              Showing {products.length} of <strong>{total}</strong> entries
            </div>
            <div className="flex gap-sm">
              <button
                className="btn btn-secondary"
                disabled={page <= 1}
                onClick={() => updateFilters({ page: page - 1 })}
                style={{ padding: "4px 10px" }}
              >
                Previous
              </button>
              <span style={{ alignSelf: "center", fontSize: "var(--font-size-sm)", padding: "0 8px" }}>
                Page <strong>{page}</strong> of {totalPages}
              </span>
              <button
                className="btn btn-secondary"
                disabled={page >= totalPages}
                onClick={() => updateFilters({ page: page + 1 })}
                style={{ padding: "4px 10px" }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
