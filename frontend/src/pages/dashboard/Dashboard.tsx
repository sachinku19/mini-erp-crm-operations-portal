import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { customerService } from "../../services/customerService";
import { productService } from "../../services/productService";
import { challanService } from "../../services/challanService";
import type { Challan } from "../../services/challanService";
import { alertService } from "../../services/alertService";
import type { OperationalAlert } from "../../services/alertService";
import { auditService } from "../../services/auditService";
import type { AuditLog } from "../../services/auditService";
import {
  Users,
  Package,
  AlertTriangle,
  FileText,
  ArrowRight,
  ShieldAlert,
  Bell,
  TrendingUp,
  Activity,
  Layers,
  Plus,
  ArrowLeftRight,
  Clock,
  X,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || "Sales";

  // Data states
  const [customerCount, setCustomerCount] = useState<number | null>(null);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [lowStockCount, setLowStockCount] = useState<number | null>(null);
  const [outOfStockCount, setOutOfStockCount] = useState<number | null>(null);
  const [healthyStockCount, setHealthyStockCount] = useState<number | null>(null);

  const [challanCount, setChallanCount] = useState<number | null>(null);
  const [draftChallanCount, setDraftChallanCount] = useState<number>(0);
  const [confirmedChallanCount, setConfirmedChallanCount] = useState<number>(0);
  const [cancelledChallanCount, setCancelledChallanCount] = useState<number>(0);

  const [recentChallans, setRecentChallans] = useState<Challan[]>([]);
  const [alerts, setAlerts] = useState<OperationalAlert[]>([]);
  const [recentAuditLogs, setRecentAuditLogs] = useState<AuditLog[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showQuickActionModal, setShowQuickActionModal] = useState<boolean>(false);
  const [isAttentionCollapsed, setIsAttentionCollapsed] = useState<boolean>(true);

  const canAccessCRM = ["Admin", "Sales"].includes(role);
  const canAccessInventory = ["Admin", "Warehouse"].includes(role);
  const canAccessChallans = ["Admin", "Sales", "Warehouse", "Accounts"].includes(role);
  const canAccessAudit = ["Admin"].includes(role);

  // Time of day greeting helper
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const promises: Promise<any>[] = [];

        // 1. Operational alerts
        promises.push(
          alertService.getAlerts().then((res: any) => {
            setAlerts(res.data);
          })
        );

        // 2. CRM Customers count
        if (canAccessCRM) {
          promises.push(
            customerService.getCustomers({ limit: 1 }).then((res: any) => {
              setCustomerCount(res.meta?.total ?? 0);
            })
          );
        }

        // 3. Products & Stock Health Distribution
        if (canAccessInventory) {
          promises.push(
            productService.getProducts({ limit: 100 }).then((res: any) => {
              const allProducts = res.data;
              setProductCount(res.meta?.total ?? allProducts.length);

              const out = allProducts.filter((p: any) => p.current_stock === 0).length;
              const low = allProducts.filter(
                (p: any) => p.current_stock > 0 && p.current_stock <= p.minimum_stock_alert_quantity
              ).length;
              const healthy = allProducts.filter(
                (p: any) => p.current_stock > p.minimum_stock_alert_quantity
              ).length;

              setOutOfStockCount(out);
              setLowStockCount(low);
              setHealthyStockCount(healthy);
            })
          );
        }

        // 4. Challans Breakdown
        if (canAccessChallans) {
          promises.push(
            challanService.getChallans({ limit: 100 }).then((res: any) => {
              const allChallans = res.data;
              setChallanCount(res.meta?.total ?? allChallans.length);
              setDraftChallanCount(allChallans.filter((c: any) => c.status === "DRAFT").length);
              setConfirmedChallanCount(allChallans.filter((c: any) => c.status === "CONFIRMED").length);
              setCancelledChallanCount(allChallans.filter((c: any) => c.status === "CANCELLED").length);
              setRecentChallans(allChallans.slice(0, 5));
            })
          );
        }

        // 5. Audit logs for Admin
        if (canAccessAudit) {
          promises.push(
            auditService.getAuditLogs({ limit: 5 }).then((res: any) => {
              setRecentAuditLogs(res.data);
            })
          );
        }

        await Promise.allSettled(promises);
      } catch (err: any) {
        console.error("Dashboard load failed:", err);
        setError("Failed to load dashboard metrics. Some panels may be unavailable.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [role, canAccessCRM, canAccessInventory, canAccessChallans, canAccessAudit]);

  if (loading) {
    return (
      <div>
        <div className="skeleton skeleton-title" style={{ width: "260px" }}></div>
        <div
          className="grid grid-cols-4 gap-md"
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: "110px", borderRadius: "var(--border-radius-lg)" }} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-md" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div className="skeleton" style={{ height: "340px", borderRadius: "var(--border-radius-lg)" }} />
          <div className="skeleton" style={{ height: "340px", borderRadius: "var(--border-radius-lg)" }} />
        </div>
      </div>
    );
  }

  const getChallanStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <span className="badge badge-success"><span className="badge-dot" /> CONFIRMED</span>;
      case "DRAFT":
        return <span className="badge badge-warning"><span className="badge-dot" /> DRAFT</span>;
      case "CANCELLED":
        return <span className="badge badge-danger"><span className="badge-dot" /> CANCELLED</span>;
      default:
        return <span className="badge badge-neutral">{status}</span>;
    }
  };

  const totalCalculatedProducts = (healthyStockCount || 0) + (lowStockCount || 0) + (outOfStockCount || 0);

  return (
    <div>
      {/* Admin Operations Mission Control Header */}
      <div
        className="flex justify-between items-center mb-xl"
        style={{ flexWrap: "wrap", gap: "var(--spacing-md)", marginBottom: "1.5rem" }}
      >
        <div>
          <div className="flex items-center gap-sm mb-xs">
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: "var(--font-weight-bold)",
                color: "var(--color-slate-900)",
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              {getGreeting()}, {user?.name?.split(" ")[0] || "Admin"}
            </h1>
            <span className="badge badge-primary">{role} Command View</span>
          </div>
          <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-slate-500)", margin: 0 }}>
            Here's what's happening across your business operations today.
          </p>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-md">
          {/* Quick Action Button */}
          <button
            className="btn btn-primary"
            onClick={() => setShowQuickActionModal(true)}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={16} /> Quick Action
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="alert alert-danger mb-lg">
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 1: ATTENTION CENTER ("Needs Your Attention") */}
      <div className="card mb-xl" style={{ padding: "1.25rem 1.5rem", marginBottom: "1.5rem" }}>
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{
            borderBottom: isAttentionCollapsed ? "none" : "1px solid var(--color-border-light)",
            paddingBottom: isAttentionCollapsed ? 0 : "0.75rem",
            marginBottom: isAttentionCollapsed ? 0 : "1rem",
          }}
        >
          <div className="flex items-center gap-sm">
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                backgroundColor: "rgba(245, 158, 11, 0.12)",
                color: "var(--color-warning)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Zap size={16} />
            </div>
            <div>
              <h2 style={{ fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--color-slate-900)", margin: 0, letterSpacing: "-0.01em" }}>
                Needs Your Attention
              </h2>
              <p style={{ fontSize: "11px", color: "var(--color-slate-500)", margin: 0 }}>
                Actionable operational items requiring immediate review.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-sm">
            <span className="badge badge-warning" style={{ fontSize: "11px" }}>
              {(lowStockCount && lowStockCount > 0 ? 1 : 0) + (draftChallanCount > 0 ? 1 : 0) + (alerts.length > 0 ? 1 : 0)} Pending Action Items
            </span>

            {/* Accordion Minimize / Expand Toggle Button */}
            <button
              onClick={() => setIsAttentionCollapsed(!isAttentionCollapsed)}
              title={isAttentionCollapsed ? "Expand Attention Center" : "Minimize Attention Center"}
              style={{
                padding: "4px 10px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "11px",
                fontWeight: "var(--font-weight-semibold)",
                color: "var(--color-slate-700)",
                backgroundColor: "var(--color-slate-100)",
                borderRadius: "var(--border-radius-md)",
                border: "1px solid var(--color-border-light)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {isAttentionCollapsed ? (
                <>
                  Expand <ChevronDown size={14} />
                </>
              ) : (
                <>
                  Minimize <ChevronUp size={14} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Items List */}
        {!isAttentionCollapsed && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {/* Action Item 1: Low Stock Warnings */}
          <div
            style={{
              padding: "0.875rem 1.125rem",
              borderRadius: "var(--border-radius-md)",
              backgroundColor: "var(--color-slate-50)",
              border: "1px solid var(--color-border-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <div className="flex items-center gap-md" style={{ flex: 1, minWidth: "260px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(220, 38, 38, 0.1)",
                  color: "var(--color-danger)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={18} />
              </div>

              <div>
                <div className="flex items-center gap-sm">
                  <span style={{ fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-bold)", color: "var(--color-slate-900)" }}>
                    Low Stock Reserve Warning
                  </span>
                  <span className="badge badge-danger" style={{ fontSize: "10px", padding: "1px 6px" }}>
                    {lowStockCount || 0} Low Stock SKUs
                  </span>
                </div>
                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-slate-500)", marginTop: "2px" }}>
                  {lowStockCount && lowStockCount > 0
                    ? `${lowStockCount} catalog items are below their minimum stock alert threshold.`
                    : "All inventory product balances are currently healthy."}
                </div>
              </div>
            </div>

            {canAccessInventory && (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => navigate("/products?low_stock=true")}
                style={{ fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-medium)" }}
              >
                View Low Stock Inventory <ArrowRight size={13} />
              </button>
            )}
          </div>

          {/* Action Item 2: Pending Draft Challans */}
          <div
            style={{
              padding: "0.875rem 1.125rem",
              borderRadius: "var(--border-radius-md)",
              backgroundColor: "var(--color-slate-50)",
              border: "1px solid var(--color-border-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <div className="flex items-center gap-md" style={{ flex: 1, minWidth: "260px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(217, 119, 6, 0.1)",
                  color: "var(--color-warning)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Clock size={18} />
              </div>

              <div>
                <div className="flex items-center gap-sm">
                  <span style={{ fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-bold)", color: "var(--color-slate-900)" }}>
                    Pending Sales Dispatches
                  </span>
                  <span className="badge badge-warning" style={{ fontSize: "10px", padding: "1px 6px" }}>
                    {draftChallanCount} Draft Dispatches
                  </span>
                </div>
                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-slate-500)", marginTop: "2px" }}>
                  {draftChallanCount > 0
                    ? `${draftChallanCount} sales challans are in DRAFT status awaiting stock reservation.`
                    : "All issued sales dispatches are confirmed."}
                </div>
              </div>
            </div>

            {canAccessChallans && (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => navigate("/challans")}
                style={{ fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-medium)" }}
              >
                Review Pending Challans <ArrowRight size={13} />
              </button>
            )}
          </div>

          {/* Action Item 3: Operational System Alerts */}
          <div
            style={{
              padding: "0.875rem 1.125rem",
              borderRadius: "var(--border-radius-md)",
              backgroundColor: "var(--color-slate-50)",
              border: "1px solid var(--color-border-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <div className="flex items-center gap-md" style={{ flex: 1, minWidth: "260px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(79, 70, 229, 0.1)",
                  color: "var(--color-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Bell size={18} />
              </div>

              <div>
                <div className="flex items-center gap-sm">
                  <span style={{ fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-bold)", color: "var(--color-slate-900)" }}>
                    Operational System Alert Feeds
                  </span>
                  <span className="badge badge-primary" style={{ fontSize: "10px", padding: "1px 6px" }}>
                    {alerts.length} Active Feeds
                  </span>
                </div>
                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-slate-500)", marginTop: "2px" }}>
                  {alerts.length > 0
                    ? `${alerts.length} automated operational alert notifications require review.`
                    : "Zero system alert warnings active."}
                </div>
              </div>
            </div>

            <button
              className="btn btn-outline btn-sm"
              onClick={() => window.scrollTo({ top: 500, behavior: "smooth" })}
              style={{ fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-medium)" }}
            >
              View System Feeds <ArrowRight size={13} />
            </button>
          </div>
        </div>
        )}
      </div>

      {/* SECTION 2: SOPHISTICATED KPI CARDS GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        {/* Customer CRM Metric */}
        {canAccessCRM && (
          <div className="card stat-card">
            <div>
              <div className="card-title">Customer Directory</div>
              <div className="card-value">{customerCount ?? "—"}</div>
              <div className="card-desc flex items-center gap-xs text-muted" style={{ fontSize: "11px" }}>
                <Users size={12} style={{ color: "var(--color-primary)" }} /> Active CRM Accounts
              </div>
            </div>
            <div className="stat-icon-wrapper" style={{ backgroundColor: "var(--color-primary-light)", color: "var(--color-primary)" }}>
              <Users size={20} />
            </div>
          </div>
        )}

        {/* Catalog Products Metric */}
        {canAccessInventory && (
          <div className="card stat-card">
            <div>
              <div className="card-title">Catalog Inventory</div>
              <div className="card-value">{productCount ?? "—"}</div>
              <div className="card-desc flex items-center gap-xs text-muted" style={{ fontSize: "11px" }}>
                <Layers size={12} style={{ color: "var(--color-info)" }} /> Tracked Product SKUs
              </div>
            </div>
            <div className="stat-icon-wrapper" style={{ backgroundColor: "var(--color-info-light)", color: "var(--color-info)" }}>
              <Package size={20} />
            </div>
          </div>
        )}

        {/* Low Stock Alerts Metric */}
        {canAccessInventory && (
          <div className="card stat-card">
            <div>
              <div className="card-title">Low Stock Items</div>
              <div className="card-value" style={{ color: (lowStockCount || 0) > 0 ? "var(--color-danger)" : "inherit" }}>
                {lowStockCount ?? "—"}
              </div>
              <div className="card-desc flex items-center gap-xs" style={{ fontSize: "11px", color: (lowStockCount || 0) > 0 ? "var(--color-danger)" : "var(--color-slate-500)" }}>
                <AlertTriangle size={12} /> Below Minimum Threshold
              </div>
            </div>
            <div
              className="stat-icon-wrapper"
              style={{
                backgroundColor: (lowStockCount || 0) > 0 ? "var(--color-danger-light)" : "var(--color-slate-100)",
                color: (lowStockCount || 0) > 0 ? "var(--color-danger)" : "var(--color-slate-500)",
              }}
            >
              <AlertTriangle size={20} />
            </div>
          </div>
        )}

        {/* Delivery Challans Metric */}
        {canAccessChallans && (
          <div className="card stat-card">
            <div>
              <div className="card-title">Sales Dispatches</div>
              <div className="card-value">{challanCount ?? "—"}</div>
              <div className="card-desc flex items-center gap-xs" style={{ fontSize: "11px", color: "var(--color-success)" }}>
                <TrendingUp size={12} /> Total Issued Challans
              </div>
            </div>
            <div className="stat-icon-wrapper" style={{ backgroundColor: "var(--color-success-light)", color: "var(--color-success)" }}>
              <FileText size={20} />
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: INVENTORY HEALTH & TRANSACTION OVERVIEWS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          gap: "1.25rem",
          marginBottom: "1.5rem",
        }}
      >
        {/* Inventory Health Bar Distribution Card */}
        {canAccessInventory && (
          <div className="card">
            <div className="flex justify-between items-center mb-md" style={{ borderBottom: "1px solid var(--color-border-light)", paddingBottom: "0.75rem" }}>
              <div className="flex items-center gap-sm">
                <Package size={16} style={{ color: "var(--color-primary)" }} />
                <h3 style={{ fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-semibold)", margin: 0 }}>
                  Inventory Stock Distribution
                </h3>
              </div>
              <Link to="/products" className="btn btn-ghost btn-sm" style={{ fontSize: "var(--font-size-xs)" }}>
                View Catalog <ArrowRight size={12} />
              </Link>
            </div>

            {/* Visual Distribution Progress Bar */}
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ display: "flex", height: "12px", borderRadius: "6px", overflow: "hidden", backgroundColor: "var(--color-slate-100)" }}>
                <div
                  style={{
                    width: totalCalculatedProducts > 0 ? `${((healthyStockCount || 0) / totalCalculatedProducts) * 100}%` : "100%",
                    backgroundColor: "var(--color-success)",
                  }}
                  title={`Healthy: ${healthyStockCount || 0}`}
                />
                <div
                  style={{
                    width: totalCalculatedProducts > 0 ? `${((lowStockCount || 0) / totalCalculatedProducts) * 100}%` : "0%",
                    backgroundColor: "var(--color-warning)",
                  }}
                  title={`Low Stock: ${lowStockCount || 0}`}
                />
                <div
                  style={{
                    width: totalCalculatedProducts > 0 ? `${((outOfStockCount || 0) / totalCalculatedProducts) * 100}%` : "0%",
                    backgroundColor: "var(--color-danger)",
                  }}
                  title={`Out of Stock: ${outOfStockCount || 0}`}
                />
              </div>
            </div>

            {/* Breakdown Indicators */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
              <div
                style={{
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "var(--color-slate-50)",
                  borderRadius: "var(--border-radius-md)",
                  border: "1px solid var(--color-border-light)",
                }}
              >
                <div className="flex items-center gap-xs mb-xs" style={{ fontSize: "11px", color: "var(--color-slate-500)" }}>
                  <span className="badge-dot" style={{ backgroundColor: "var(--color-success)" }} /> Healthy
                </div>
                <div style={{ fontSize: "var(--font-size-md)", fontWeight: "var(--font-weight-bold)", color: "var(--color-slate-900)" }}>
                  {healthyStockCount ?? 0} SKUs
                </div>
              </div>

              <div
                style={{
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "var(--color-slate-50)",
                  borderRadius: "var(--border-radius-md)",
                  border: "1px solid var(--color-border-light)",
                }}
              >
                <div className="flex items-center gap-xs mb-xs" style={{ fontSize: "11px", color: "var(--color-slate-500)" }}>
                  <span className="badge-dot" style={{ backgroundColor: "var(--color-warning)" }} /> Low Reserve
                </div>
                <div style={{ fontSize: "var(--font-size-md)", fontWeight: "var(--font-weight-bold)", color: "var(--color-warning)" }}>
                  {lowStockCount ?? 0} SKUs
                </div>
              </div>

              <div
                style={{
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "var(--color-slate-50)",
                  borderRadius: "var(--border-radius-md)",
                  border: "1px solid var(--color-border-light)",
                }}
              >
                <div className="flex items-center gap-xs mb-xs" style={{ fontSize: "11px", color: "var(--color-slate-500)" }}>
                  <span className="badge-dot" style={{ backgroundColor: "var(--color-danger)" }} /> Out of Stock
                </div>
                <div style={{ fontSize: "var(--font-size-md)", fontWeight: "var(--font-weight-bold)", color: "var(--color-danger)" }}>
                  {outOfStockCount ?? 0} SKUs
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Challans Transactional Status Card */}
        {canAccessChallans && (
          <div className="card">
            <div className="flex justify-between items-center mb-md" style={{ borderBottom: "1px solid var(--color-border-light)", paddingBottom: "0.75rem" }}>
              <div className="flex items-center gap-sm">
                <FileText size={16} style={{ color: "var(--color-primary)" }} />
                <h3 style={{ fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-semibold)", margin: 0 }}>
                  Sales Challans Overview
                </h3>
              </div>
              <Link to="/challans" className="btn btn-ghost btn-sm" style={{ fontSize: "var(--font-size-xs)" }}>
                View Dispatches <ArrowRight size={12} />
              </Link>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
              <div
                style={{
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "var(--color-slate-50)",
                  borderRadius: "var(--border-radius-md)",
                  border: "1px solid var(--color-border-light)",
                }}
              >
                <div className="flex items-center gap-xs mb-xs" style={{ fontSize: "11px", color: "var(--color-slate-500)" }}>
                  <span className="badge-dot" style={{ backgroundColor: "var(--color-warning)" }} /> Draft
                </div>
                <div style={{ fontSize: "var(--font-size-md)", fontWeight: "var(--font-weight-bold)", color: "var(--color-slate-900)" }}>
                  {draftChallanCount}
                </div>
              </div>

              <div
                style={{
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "var(--color-slate-50)",
                  borderRadius: "var(--border-radius-md)",
                  border: "1px solid var(--color-border-light)",
                }}
              >
                <div className="flex items-center gap-xs mb-xs" style={{ fontSize: "11px", color: "var(--color-slate-500)" }}>
                  <span className="badge-dot" style={{ backgroundColor: "var(--color-success)" }} /> Confirmed
                </div>
                <div style={{ fontSize: "var(--font-size-md)", fontWeight: "var(--font-weight-bold)", color: "var(--color-success)" }}>
                  {confirmedChallanCount}
                </div>
              </div>

              <div
                style={{
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "var(--color-slate-50)",
                  borderRadius: "var(--border-radius-md)",
                  border: "1px solid var(--color-border-light)",
                }}
              >
                <div className="flex items-center gap-xs mb-xs" style={{ fontSize: "11px", color: "var(--color-slate-500)" }}>
                  <span className="badge-dot" style={{ backgroundColor: "var(--color-danger)" }} /> Cancelled
                </div>
                <div style={{ fontSize: "var(--font-size-md)", fontWeight: "var(--font-weight-bold)", color: "var(--color-danger)" }}>
                  {cancelledChallanCount}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/challans/create" className="btn btn-outline btn-sm" style={{ fontSize: "11px" }}>
                + Issue New Challan
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: INSIGHTS TABLES & REAL AUDIT FEED */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "1.25rem",
          alignItems: "start",
        }}
      >
        {/* Panel 1: Recent Sales Challans Table */}
        {canAccessChallans && (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                padding: "1rem 1.25rem",
                borderBottom: "1px solid var(--color-border-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "var(--color-slate-50)",
              }}
            >
              <div className="flex items-center gap-sm">
                <Activity size={16} style={{ color: "var(--color-primary)" }} />
                <h3 style={{ fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-semibold)", margin: 0 }}>
                  Recent Dispatch Activity
                </h3>
              </div>
              <Link to="/challans" className="btn btn-ghost btn-sm" style={{ fontSize: "var(--font-size-xs)" }}>
                View Log <ArrowRight size={12} />
              </Link>
            </div>

            {recentChallans.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-slate-500)", fontSize: "var(--font-size-sm)" }}>
                No dispatches created yet.
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Challan No</th>
                    <th>Status</th>
                    <th>Units</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentChallans.map((ch) => (
                    <tr key={ch.id}>
                      <td>
                        <Link to={`/challans/${ch.id}`} style={{ fontWeight: "var(--font-weight-semibold)", color: "var(--color-primary)", textDecoration: "none" }}>
                          {ch.challan_number}
                        </Link>
                      </td>
                      <td>{getChallanStatusBadge(ch.status)}</td>
                      <td style={{ fontWeight: "var(--font-weight-medium)" }}>{ch.total_quantity} pcs</td>
                      <td style={{ fontSize: "var(--font-size-xs)", color: "var(--color-slate-500)" }}>
                        {new Date(ch.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Panel 2: Real Audit Activity Feed (Admin Only) */}
        {canAccessAudit && (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                padding: "1rem 1.25rem",
                borderBottom: "1px solid var(--color-border-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "var(--color-slate-50)",
              }}
            >
              <div className="flex items-center gap-sm">
                <Clock size={16} style={{ color: "var(--color-primary)" }} />
                <h3 style={{ fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-semibold)", margin: 0 }}>
                  Real System Audit Trail
                </h3>
              </div>
              <Link to="/audit-logs" className="btn btn-ghost btn-sm" style={{ fontSize: "var(--font-size-xs)" }}>
                Full Trail <ArrowRight size={12} />
              </Link>
            </div>

            {recentAuditLogs.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-slate-500)", fontSize: "var(--font-size-sm)" }}>
                No recent system activity recorded.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {recentAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: "0.75rem 1.25rem",
                      borderBottom: "1px solid var(--color-border-light)",
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      fontSize: "var(--font-size-xs)",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "var(--font-weight-semibold)", color: "var(--color-slate-900)" }}>
                        {log.user_email}
                      </div>
                      <div style={{ color: "var(--color-slate-600)", marginTop: "2px" }}>
                        <span className="badge badge-neutral" style={{ fontSize: "9px", padding: "1px 5px", marginRight: "4px" }}>
                          {log.action}
                        </span>
                        {log.description}
                      </div>
                    </div>
                    <div style={{ fontSize: "10px", color: "var(--color-slate-400)", whiteSpace: "nowrap" }}>
                      {new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* QUICK ACTION COMMAND PALETTE MODAL */}
      {showQuickActionModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowQuickActionModal(false)}
          style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "540px",
              padding: 0,
              overflow: "hidden",
              borderRadius: "16px",
              border: "1px solid var(--color-border)",
              boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid var(--color-border-light)",
                backgroundColor: "var(--color-slate-50)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div className="flex items-center gap-sm">
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    backgroundColor: "var(--color-primary-light)",
                    color: "var(--color-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Zap size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: "var(--font-size-base)", fontWeight: "var(--font-weight-bold)", color: "var(--color-slate-900)", margin: 0 }}>
                    Quick Operations Command
                  </h3>
                  <p style={{ fontSize: "11px", color: "var(--color-slate-500)", margin: 0 }}>
                    Select an operational workflow to execute instantly.
                  </p>
                </div>
              </div>
              <button
                className="btn btn-ghost"
                onClick={() => setShowQuickActionModal(false)}
                style={{ padding: "6px", color: "var(--color-slate-400)" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Action Cards List Grid */}
            <div style={{ padding: "1.25rem 1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.875rem" }}>
              {canAccessCRM && (
                <button
                  onClick={() => {
                    setShowQuickActionModal(false);
                    navigate("/customers/create");
                  }}
                  style={{
                    padding: "1rem",
                    borderRadius: "var(--border-radius-md)",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "8px",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  className="quick-action-tile"
                >
                  <div className="flex justify-between items-center" style={{ width: "100%" }}>
                    <div
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "8px",
                        backgroundColor: "rgba(79, 70, 229, 0.1)",
                        color: "var(--color-primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Users size={18} />
                    </div>
                    <span style={{ fontSize: "10px", fontWeight: "var(--font-weight-semibold)", color: "var(--color-slate-400)", backgroundColor: "var(--color-slate-100)", padding: "1px 5px", borderRadius: "3px" }}>
                      Alt C
                    </span>
                  </div>
                  <div>
                    <div style={{ fontWeight: "var(--font-weight-bold)", fontSize: "var(--font-size-xs)", color: "var(--color-slate-900)" }}>
                      Add Customer
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--color-slate-500)", marginTop: "2px" }}>
                      Register new wholesale client
                    </div>
                  </div>
                </button>
              )}

              {canAccessInventory && (
                <button
                  onClick={() => {
                    setShowQuickActionModal(false);
                    navigate("/products/create");
                  }}
                  style={{
                    padding: "1rem",
                    borderRadius: "var(--border-radius-md)",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "8px",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  className="quick-action-tile"
                >
                  <div className="flex justify-between items-center" style={{ width: "100%" }}>
                    <div
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "8px",
                        backgroundColor: "rgba(2, 132, 199, 0.1)",
                        color: "var(--color-info)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Package size={18} />
                    </div>
                    <span style={{ fontSize: "10px", fontWeight: "var(--font-weight-semibold)", color: "var(--color-slate-400)", backgroundColor: "var(--color-slate-100)", padding: "1px 5px", borderRadius: "3px" }}>
                      Alt P
                    </span>
                  </div>
                  <div>
                    <div style={{ fontWeight: "var(--font-weight-bold)", fontSize: "var(--font-size-xs)", color: "var(--color-slate-900)" }}>
                      Add Product SKU
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--color-slate-500)", marginTop: "2px" }}>
                      Add new item to catalog
                    </div>
                  </div>
                </button>
              )}

              {canAccessChallans && (
                <button
                  onClick={() => {
                    setShowQuickActionModal(false);
                    navigate("/challans/create");
                  }}
                  style={{
                    padding: "1rem",
                    borderRadius: "var(--border-radius-md)",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "8px",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  className="quick-action-tile"
                >
                  <div className="flex justify-between items-center" style={{ width: "100%" }}>
                    <div
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "8px",
                        backgroundColor: "rgba(5, 150, 105, 0.1)",
                        color: "var(--color-success)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FileText size={18} />
                    </div>
                    <span style={{ fontSize: "10px", fontWeight: "var(--font-weight-semibold)", color: "var(--color-slate-400)", backgroundColor: "var(--color-slate-100)", padding: "1px 5px", borderRadius: "3px" }}>
                      Alt D
                    </span>
                  </div>
                  <div>
                    <div style={{ fontWeight: "var(--font-weight-bold)", fontSize: "var(--font-size-xs)", color: "var(--color-slate-900)" }}>
                      Issue Challan
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--color-slate-500)", marginTop: "2px" }}>
                      Create sales delivery dispatch
                    </div>
                  </div>
                </button>
              )}

              {canAccessInventory && (
                <button
                  onClick={() => {
                    setShowQuickActionModal(false);
                    navigate("/inventory");
                  }}
                  style={{
                    padding: "1rem",
                    borderRadius: "var(--border-radius-md)",
                    border: "1px solid var(--color-border)",
                    backgroundColor: "#ffffff",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "8px",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  className="quick-action-tile"
                >
                  <div className="flex justify-between items-center" style={{ width: "100%" }}>
                    <div
                      style={{
                        width: "34px",
                        height: "34px",
                        borderRadius: "8px",
                        backgroundColor: "rgba(217, 119, 6, 0.1)",
                        color: "var(--color-warning)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ArrowLeftRight size={18} />
                    </div>
                    <span style={{ fontSize: "10px", fontWeight: "var(--font-weight-semibold)", color: "var(--color-slate-400)", backgroundColor: "var(--color-slate-100)", padding: "1px 5px", borderRadius: "3px" }}>
                      Alt S
                    </span>
                  </div>
                  <div>
                    <div style={{ fontWeight: "var(--font-weight-bold)", fontSize: "var(--font-size-xs)", color: "var(--color-slate-900)" }}>
                      Stock Entry
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--color-slate-500)", marginTop: "2px" }}>
                      Inward / outward stock entry
                    </div>
                  </div>
                </button>
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "var(--color-slate-50)",
                borderTop: "1px solid var(--color-border-light)",
                fontSize: "11px",
                color: "var(--color-slate-500)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>Click outside or press <strong>ESC</strong> to dismiss modal.</span>
              <span className="badge badge-neutral" style={{ fontSize: "9px" }}>
                Command Drawer
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

