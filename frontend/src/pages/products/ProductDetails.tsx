import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { productService } from "../../services/productService";
import type { Product, StockMovement } from "../../services/productService";
import {
  ArrowLeft,
  Edit2,
  MapPin,
  History,
  ArrowUpRight,
  ArrowDownLeft,
  AlertCircle,
} from "lucide-react";

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const loadProductData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [prodData, movementsRes] = await Promise.all([
          productService.getProductById(id),
          productService.getStockMovements({ product_id: id, limit: 20 }),
        ]);
        setProduct(prodData);
        setMovements(movementsRes.data);
      } catch (err: any) {
        setError(err.message || "Failed to load product details or stock ledger.");
      } finally {
        setLoading(false);
      }
    };
    loadProductData();
  }, [id]);

  const isLowStock = (p: Product) => {
    return p.current_stock <= p.minimum_stock_alert_quantity;
  };

  if (loading) {
    return (
      <div>
        <div className="skeleton skeleton-title" style={{ width: "300px" }} />
        <div className="grid grid-cols-3 gap-md" style={{ marginBottom: "var(--spacing-xl)" }}>
          <div className="skeleton" style={{ height: "200px" }} />
          <div className="skeleton" style={{ height: "200px" }} />
          <div className="skeleton" style={{ height: "200px" }} />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ maxWidth: "600px", margin: "var(--spacing-xxl) auto", textAlign: "center" }}>
        <div className="alert alert-danger" style={{ display: "inline-flex", gap: "var(--spacing-md)", padding: "1.5rem" }}>
          <AlertCircle size={24} style={{ flexShrink: 0 }} />
          <div style={{ textAlign: "left" }}>
            <h3 style={{ marginBottom: "var(--spacing-xs)" }}>Error Loading Catalog Item</h3>
            <p>{error || "The requested product profile does not exist."}</p>
          </div>
        </div>
        <div style={{ marginTop: "var(--spacing-lg)" }}>
          <Link to="/products" className="btn btn-primary">
            <ArrowLeft size={16} style={{ marginRight: "var(--spacing-sm)" }} /> Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  const low = isLowStock(product);

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      {/* Header Back links */}
      <div className="flex justify-between items-center mb-md">
        <Link to="/products" className="flex items-center gap-xs text-muted" style={{ fontSize: "var(--font-size-sm)" }}>
          <ArrowLeft size={16} /> Back to Catalog
        </Link>
        <Link to={`/products/${product.id}/edit`} className="btn btn-primary">
          <Edit2 size={16} /> Edit Product
        </Link>
      </div>

      {/* Grid: Info Cards (Left) and Movements History Ledger (Right) */}
      <div className="grid grid-cols-3 gap-md" style={{ gridTemplateColumns: "1fr 2fr", alignItems: "start" }}>
        <style>{`
          @media (max-width: 768px) {
            .grid-cols-3 { grid-template-columns: 1fr !important; }
          }
        `}</style>
        
        {/* Left: Summary Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
          {/* Card 1: Core Stock */}
          <div className="card" style={{ borderColor: low ? "rgba(249, 171, 0, 0.4)" : "var(--color-border)" }}>
            <div style={{ borderBottom: "1px solid var(--color-border-light)", paddingBottom: "var(--spacing-sm)", marginBottom: "var(--spacing-md)" }}>
              {low && (
                <span className="badge badge-warning" style={{ float: "right" }}>
                  Low Stock
                </span>
              )}
              <h2 style={{ fontSize: "var(--font-size-lg)" }}>{product.name}</h2>
              <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", fontFamily: "monospace" }}>
                SKU: {product.sku}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-sm)" }}>
              <div>
                <span className="text-muted" style={{ display: "block", fontSize: "var(--font-size-xs)" }}>Inventory Balance</span>
                <span className={low ? "text-danger" : "text-success"} style={{ fontSize: "var(--font-size-xxl)", fontWeight: "var(--font-weight-bold)" }}>
                  {product.current_stock} <span style={{ fontSize: "var(--font-size-base)", fontWeight: "normal" }}>units</span>
                </span>
              </div>
              <div className="flex items-center gap-sm" style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                <MapPin size={16} />
                <span>{product.location_warehouse}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Catalog Pricing details */}
          <div className="card">
            <h3 style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--spacing-md)" }}>
              CATALOG SPECIFICATIONS
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)", fontSize: "var(--font-size-sm)" }}>
              <div>
                <span className="text-muted" style={{ display: "block", fontSize: "var(--font-size-xs)" }}>Wholesale Price</span>
                <strong style={{ fontSize: "var(--font-size-lg)" }}>₹{product.unit_price.toLocaleString()}</strong>
              </div>
              <div>
                <span className="text-muted" style={{ display: "block", fontSize: "var(--font-size-xs)" }}>Product Category</span>
                <span>{product.category}</span>
              </div>
              <div>
                <span className="text-muted" style={{ display: "block", fontSize: "var(--font-size-xs)" }}>Min Stock Alert Level</span>
                <span>Alert triggers at <strong>{product.minimum_stock_alert_quantity} units</strong> or below</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Audit Trail Movements */}
        <div className="card" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontSize: "var(--font-size-base)", borderBottom: "1px solid var(--color-border-light)", paddingBottom: "var(--spacing-sm)", marginBottom: "var(--spacing-md)" }}>
            Stock Audit Ledger (Last 20 updates)
          </h3>

          {movements.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "300px",
                color: "var(--color-text-muted)",
                gap: "var(--spacing-sm)",
              }}
            >
              <History size={40} style={{ color: "var(--color-text-disabled)" }} />
              <p>No historical inventory stock movements logged.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Qty</th>
                    <th>Audit Reason</th>
                    <th>Operator</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id}>
                      <td style={{ fontSize: "var(--font-size-xs)", whiteSpace: "nowrap" }}>
                        {new Date(m.created_at).toLocaleString()}
                      </td>
                      <td>
                        <span className={`badge ${m.movement_type === "IN" ? "badge-success" : "badge-danger"}`} style={{ padding: "2px 8px" }}>
                          <span className="flex items-center gap-xs">
                            {m.movement_type === "IN" ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                            {m.movement_type}
                          </span>
                        </span>
                      </td>
                      <td style={{ fontWeight: "var(--font-weight-medium)" }}>
                        {m.movement_type === "IN" ? "+" : "-"}{m.quantity_changed}
                      </td>
                      <td style={{ fontSize: "0.8125rem" }}>{m.reason}</td>
                      <td style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                        {m.user_name || "System"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
