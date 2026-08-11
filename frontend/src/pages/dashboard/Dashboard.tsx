import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { customerService } from "../../services/customerService";
import { productService } from "../../services/productService";
import type { Product } from "../../services/productService";
import { challanService } from "../../services/challanService";
import type { Challan } from "../../services/challanService";
import {
  Users,
  Package,
  AlertTriangle,
  FileText,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { Link } from "react-router-dom";

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role || "Sales";

  const [customerCount, setCustomerCount] = useState<number | null>(null);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [lowStockCount, setLowStockCount] = useState<number | null>(null);
  const [challanCount, setChallanCount] = useState<number | null>(null);
  const [recentChallans, setRecentChallans] = useState<Challan[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const canAccessCRM = ["Admin", "Sales"].includes(role);
  const canAccessInventory = ["Admin", "Warehouse"].includes(role);
  const canAccessChallans = ["Admin", "Sales", "Warehouse", "Accounts"].includes(role);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const promises: Promise<any>[] = [];

        // 1. Fetch CRM data if authorized
        if (canAccessCRM) {
          promises.push(
            customerService.getCustomers({ limit: 1 }).then((res) => {
              setCustomerCount(res.meta?.total ?? 0);
            })
          );
        }

        // 2. Fetch Product & Inventory data if authorized
        if (canAccessInventory) {
          promises.push(
            productService.getProducts({ limit: 1 }).then((res) => {
              setProductCount(res.meta?.total ?? 0);
            })
          );
          promises.push(
            productService.getProducts({ low_stock: true, limit: 5 }).then((res) => {
              setLowStockCount(res.meta?.total ?? 0);
              setLowStockProducts(res.data);
            })
          );
        }

        // 3. Fetch Challans if authorized
        if (canAccessChallans) {
          promises.push(
            challanService.getChallans({ limit: 5 }).then((res) => {
              setChallanCount(res.meta?.total ?? 0);
              setRecentChallans(res.data);
            })
          );
        }

        await Promise.all(promises);
      } catch (err: any) {
        console.error("Dashboard load failed:", err);
        setError("Failed to load dashboard metrics. Some panels may be unavailable.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [role, canAccessCRM, canAccessInventory, canAccessChallans]);

  if (loading) {
    return (
      <div>
        <div className="skeleton skeleton-title" style={{ width: "200px" }}></div>
        <div className="grid grid-cols-4 gap-md" style={{ marginBottom: "var(--spacing-xl)" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: "120px", borderRadius: "var(--border-radius-md)" }} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-md">
          <div className="skeleton" style={{ height: "300px", borderRadius: "var(--border-radius-md)" }} />
          <div className="skeleton" style={{ height: "300px", borderRadius: "var(--border-radius-md)" }} />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header and Welcome */}
      <div style={{ marginBottom: "var(--spacing-xl)" }}>
        <h1 style={{ fontSize: "var(--font-size-xl)", fontWeight: "var(--font-weight-bold)" }}>
          Dashboard Overview
        </h1>
        <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
          Welcome back, <strong>{user?.name}</strong>. Here is the operational summary for today.
        </p>
      </div>

      {error && (
        <div className="alert alert-warning">
          <ShieldAlert size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-4 gap-md" style={{ marginBottom: "var(--spacing-xl)" }}>
        {/* CRM Card */}
        {canAccessCRM && (
          <div className="card flex flex-col justify-between" style={{ minHeight: "120px" }}>
            <div className="flex justify-between items-start">
              <div className="card-title">CRM Customers</div>
              <Users size={20} style={{ color: "var(--color-primary)" }} />
            </div>
            <div>
              <div className="card-value">{customerCount ?? 0}</div>
              <div className="card-desc">Active business connections</div>
            </div>
          </div>
        )}

        {/* Catalog Card */}
        {canAccessInventory && (
          <div className="card flex flex-col justify-between" style={{ minHeight: "120px" }}>
            <div className="flex justify-between items-start">
              <div className="card-title">Products Catalog</div>
              <Package size={20} style={{ color: "var(--color-success)" }} />
            </div>
            <div>
              <div className="card-value">{productCount ?? 0}</div>
              <div className="card-desc">Unique catalog item SKUs</div>
            </div>
          </div>
        )}

        {/* Low Stock Alert */}
        {canAccessInventory && (
          <div className="card flex flex-col justify-between" style={{ minHeight: "120px", borderColor: (lowStockCount ?? 0) > 0 ? "rgba(249, 171, 0, 0.4)" : "var(--color-border)" }}>
            <div className="flex justify-between items-start">
              <div className="card-title">Low Stock Items</div>
              <AlertTriangle size={20} style={{ color: (lowStockCount ?? 0) > 0 ? "var(--color-warning)" : "var(--color-text-disabled)" }} />
            </div>
            <div>
              <div className="card-value" style={{ color: (lowStockCount ?? 0) > 0 ? "var(--color-warning-hover)" : "inherit" }}>
                {lowStockCount ?? 0}
              </div>
              <div className="card-desc">Items requiring reorder</div>
            </div>
          </div>
        )}

        {/* Challan Card */}
        {canAccessChallans && (
          <div className="card flex flex-col justify-between" style={{ minHeight: "120px" }}>
            <div className="flex justify-between items-start">
              <div className="card-title">Dispatches</div>
              <FileText size={20} style={{ color: "var(--color-primary)" }} />
            </div>
            <div>
              <div className="card-value">{challanCount ?? 0}</div>
              <div className="card-desc">Total Sales Challans created</div>
            </div>
          </div>
        )}
      </div>

      {/* Main Panels Grid */}
      <div className="grid grid-cols-2 gap-md">
        {/* Recent Challans Activity */}
        {canAccessChallans && (
          <div className="card" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div className="flex justify-between items-center" style={{ marginBottom: "var(--spacing-md)", borderBottom: "1px solid var(--color-border-light)", paddingBottom: "var(--spacing-sm)" }}>
              <h3 style={{ fontSize: "var(--font-size-base)" }}>Recent Activity & dispatches</h3>
              <Link to="/challans" className="btn btn-outline" style={{ padding: "4px 8px", fontSize: "0.75rem" }}>
                View All <ArrowRight size={14} style={{ marginLeft: "4px" }} />
              </Link>
            </div>
            
            {recentChallans.length === 0 ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "180px", color: "var(--color-text-muted)" }}>
                No dispatches created yet.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Challan No</th>
                      <th>Customer</th>
                      <th>Qty</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentChallans.map((ch) => (
                      <tr key={ch.id}>
                        <td>
                          <Link to={`/challans/${ch.id}`} style={{ fontWeight: "var(--font-weight-medium)" }}>
                            {ch.challan_number}
                          </Link>
                        </td>
                        <td>{ch.customer_name || "N/A"}</td>
                        <td>{ch.total_quantity} units</td>
                        <td>
                          <span className={`badge ${
                            ch.status === "CONFIRMED" ? "badge-success" : ch.status === "CANCELLED" ? "badge-danger" : "badge-info"
                          }`}>
                            {ch.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Low Stock Watchlist */}
        {canAccessInventory && (
          <div className="card" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div className="flex justify-between items-center" style={{ marginBottom: "var(--spacing-md)", borderBottom: "1px solid var(--color-border-light)", paddingBottom: "var(--spacing-sm)" }}>
              <h3 style={{ fontSize: "var(--font-size-base)", color: "var(--color-text-primary)" }}>
                Low Stock Alert list
              </h3>
              <Link to="/products?low_stock=true" className="btn btn-outline" style={{ padding: "4px 8px", fontSize: "0.75rem" }}>
                Inventory Management <ArrowRight size={14} style={{ marginLeft: "4px" }} />
              </Link>
            </div>

            {lowStockProducts.length === 0 ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "180px", color: "var(--color-text-success)", fontWeight: "var(--font-weight-medium)" }}>
                ✓ All inventory items are well-stocked.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Product</th>
                      <th>Stock</th>
                      <th>Min Alert</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProducts.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{p.sku}</td>
                        <td>
                          <Link to={`/products/${p.id}`} style={{ fontWeight: "var(--font-weight-medium)" }}>
                            {p.name}
                          </Link>
                        </td>
                        <td className="text-danger" style={{ fontWeight: "var(--font-weight-bold)" }}>
                          {p.current_stock}
                        </td>
                        <td style={{ color: "var(--color-text-secondary)" }}>{p.minimum_stock_alert_quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
