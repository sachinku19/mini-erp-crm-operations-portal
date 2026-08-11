import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Search,
  Bell,
  Menu,
  User,
  Shield,
  LogOut,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ExternalLink,
  X,
  Mail,
  Building2,
} from "lucide-react";
import { useLocation, Link } from "react-router-dom";
import { alertService } from "../services/alertService";
import type { OperationalAlert } from "../services/alertService";

interface TopbarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  setIsMobileOpen: (open: boolean) => void;
}

export const Topbar: React.FC<TopbarProps> = ({ setIsMobileOpen }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Dropdown UI states
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showSecurityModal, setShowSecurityModal] = useState<boolean>(false);
  const [showProfileOverviewModal, setShowProfileOverviewModal] = useState<boolean>(false);

  // Alerts data
  const [alerts, setAlerts] = useState<OperationalAlert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState<boolean>(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch operational alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      setLoadingAlerts(true);
      try {
        const res = await alertService.getAlerts();
        setAlerts(res.data);
      } catch (err) {
        console.error("Failed to load alerts:", err);
      } finally {
        setLoadingAlerts(false);
      }
    };
    fetchAlerts();
  }, [location.pathname]);

  // Derive human-readable page title
  const getPageTitle = (pathname: string) => {
    if (pathname.startsWith("/dashboard")) return "Operations Command Center";
    if (pathname.startsWith("/customers/create")) return "Register New Customer";
    if (pathname.startsWith("/customers")) return "CRM Customer Directory";
    if (pathname.startsWith("/products/create")) return "Add Catalog SKU";
    if (pathname.startsWith("/products")) return "Inventory Product Catalog";
    if (pathname.startsWith("/inventory")) return "Warehouse Stock Movements";
    if (pathname.startsWith("/challans/create")) return "Issue Sales Challan";
    if (pathname.startsWith("/challans")) return "Sales Challan Log";
    if (pathname.startsWith("/users")) return "Admin User Directory";
    if (pathname.startsWith("/audit-logs")) return "System Audit Trail";
    return "Operations Workspace";
  };

  const triggerGlobalSearch = () => {
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "k",
        ctrlKey: true,
        bubbles: true,
      })
    );
  };

  return (
    <>
      <header className="topbar">
        <div className="flex items-center gap-md">
          {/* Mobile Drawer Trigger */}
          <button
            className="btn btn-ghost"
            onClick={() => setIsMobileOpen(true)}
            style={{ padding: "6px", display: "none" }}
            id="mobile-drawer-toggle"
          >
            <Menu size={20} />
          </button>
          <style>{`
            @media (max-width: 768px) {
              #mobile-drawer-toggle { display: inline-flex !important; }
            }
          `}</style>

          {/* Breadcrumb Title */}
          <div>
            <div style={{ fontSize: "11px", color: "var(--color-slate-500)", fontWeight: 500 }}>
              Mini ERP & CRM / Admin Portal
            </div>
            <h2 style={{ fontSize: "var(--font-size-base)", fontWeight: "var(--font-weight-semibold)", margin: 0, color: "var(--color-slate-900)" }}>
              {getPageTitle(location.pathname)}
            </h2>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-md">
          {/* Global Search Bar (Ctrl + K) */}
          <button
            onClick={triggerGlobalSearch}
            className="btn btn-secondary"
            style={{
              padding: "0.375rem 0.75rem",
              fontSize: "var(--font-size-xs)",
              color: "var(--color-slate-500)",
              display: "flex",
              alignItems: "center",
              gap: "var(--spacing-sm)",
              borderRadius: "var(--border-radius-md)",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-slate-50)",
            }}
          >
            <Search size={14} style={{ color: "var(--color-slate-400)" }} />
            <span>Search workspace...</span>
            <kbd
              style={{
                backgroundColor: "var(--color-bg-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "3px",
                padding: "1px 5px",
                fontSize: "10px",
                fontWeight: "var(--font-weight-semibold)",
                color: "var(--color-slate-600)",
                marginLeft: "var(--spacing-md)",
              }}
            >
              Ctrl K
            </kbd>
          </button>

          {/* Notifications Dropdown Toggle */}
          <div ref={notificationsRef} style={{ position: "relative" }}>
            <button
              className="btn btn-ghost"
              style={{ padding: "8px", position: "relative", color: "var(--color-slate-600)" }}
              title="Operational Alerts & Notifications"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
            >
              <Bell size={18} />
              {alerts.length > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "6px",
                    right: "6px",
                    width: "8px",
                    height: "8px",
                    backgroundColor: "var(--color-danger)",
                    borderRadius: "50%",
                    border: "2px solid #ffffff",
                  }}
                />
              )}
            </button>

            {/* Notifications Overlay Panel */}
            {showNotifications && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 8px)",
                  width: "340px",
                  backgroundColor: "#ffffff",
                  borderRadius: "var(--border-radius-lg)",
                  border: "1px solid var(--color-border)",
                  boxShadow: "var(--shadow-xl)",
                  zIndex: 100,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "0.75rem 1rem",
                    borderBottom: "1px solid var(--color-border-light)",
                    backgroundColor: "var(--color-slate-50)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-bold)", color: "var(--color-slate-900)" }}>
                    System Operational Alerts ({alerts.length})
                  </span>
                  <span className="badge badge-warning" style={{ fontSize: "10px" }}>
                    Live Feeds
                  </span>
                </div>

                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                  {loadingAlerts ? (
                    <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--color-slate-400)", fontSize: "var(--font-size-xs)" }}>
                      Checking operational status...
                    </div>
                  ) : alerts.length === 0 ? (
                    <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--color-success)", fontSize: "var(--font-size-xs)" }}>
                      <CheckCircle2 size={24} style={{ margin: "0 auto 6px" }} />
                      <div>All system reserves are healthy!</div>
                    </div>
                  ) : (
                    alerts.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          padding: "0.75rem 1rem",
                          borderBottom: "1px solid var(--color-border-light)",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "0.75rem",
                          backgroundColor: "#ffffff",
                        }}
                      >
                        <AlertTriangle
                          size={16}
                          style={{
                            color: item.alert_type?.includes("STOCK") ? "var(--color-danger)" : "var(--color-warning)",
                            flexShrink: 0,
                            marginTop: "2px",
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-slate-900)" }}>
                            {item.title}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--color-slate-500)", marginTop: "2px" }}>
                            {item.message}
                          </div>
                          <Link
                            to={item.url}
                            onClick={() => setShowNotifications(false)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                              fontSize: "11px",
                              fontWeight: "var(--font-weight-semibold)",
                              color: "var(--color-primary)",
                              textDecoration: "none",
                              marginTop: "4px",
                            }}
                          >
                            Resolve Item <ExternalLink size={10} />
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{ height: "20px", width: "1px", backgroundColor: "var(--color-border)" }} />

          {/* User Profile Pill & Dropdown Menu */}
          <div ref={profileRef} style={{ position: "relative" }}>
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px 6px",
                borderRadius: "var(--border-radius-md)",
              }}
            >
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  backgroundColor: "var(--color-primary-light)",
                  color: "var(--color-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "var(--font-weight-bold)",
                  fontSize: "var(--font-size-xs)",
                  border: "1px solid var(--color-primary-border)",
                }}
              >
                <User size={18} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                <span style={{ fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-slate-900)", lineHeight: 1.1 }}>
                  {user?.name || "Admin User"}
                </span>
                <span style={{ fontSize: "10px", color: "var(--color-slate-500)", display: "flex", alignItems: "center", gap: "3px" }}>
                  <Shield size={9} /> {user?.role || "Admin"}
                </span>
              </div>

              <ChevronDown size={14} style={{ color: "var(--color-slate-400)", marginLeft: "2px" }} />
            </button>

            {/* Profile Contextual Menu */}
            {showProfileMenu && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 8px)",
                  width: "220px",
                  backgroundColor: "#ffffff",
                  borderRadius: "var(--border-radius-lg)",
                  border: "1px solid var(--color-border)",
                  boxShadow: "var(--shadow-xl)",
                  zIndex: 100,
                  padding: "6px 0",
                }}
              >
                <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--color-border-light)" }}>
                  <div style={{ fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-bold)", color: "var(--color-slate-900)" }}>
                    {user?.name}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--color-slate-500)" }}>{user?.email}</div>
                  <span className="badge badge-primary" style={{ marginTop: "4px", fontSize: "9px" }}>
                    {user?.role} Role Access
                  </span>
                </div>

                <button
                  className="btn btn-ghost"
                  style={{ width: "100%", justifyContent: "flex-start", borderRadius: 0, padding: "8px 12px", fontSize: "var(--font-size-xs)" }}
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowProfileOverviewModal(true);
                  }}
                >
                  <User size={14} /> Profile Overview
                </button>

                <button
                  className="btn btn-ghost"
                  style={{ width: "100%", justifyContent: "flex-start", borderRadius: 0, padding: "8px 12px", fontSize: "var(--font-size-xs)" }}
                  onClick={() => {
                    setShowProfileMenu(false);
                    setShowSecurityModal(true);
                  }}
                >
                  <Lock size={14} /> Security & JWT Token
                </button>

                <div style={{ borderTop: "1px solid var(--color-border-light)", margin: "4px 0" }} />

                <button
                  className="btn btn-ghost"
                  style={{ width: "100%", justifyContent: "flex-start", borderRadius: 0, padding: "8px 12px", fontSize: "var(--font-size-xs)", color: "var(--color-danger)" }}
                  onClick={logout}
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* CUSTOM PROFILE OVERVIEW MODAL POPUP */}
      {showProfileOverviewModal && (
        <div className="modal-backdrop" onClick={() => setShowProfileOverviewModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "440px",
              borderRadius: "16px",
              backgroundColor: "#ffffff",
              border: "1px solid var(--color-border)",
              boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
              overflow: "hidden",
              padding: 0,
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
                  <User size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: "var(--font-size-base)", fontWeight: "var(--font-weight-bold)", color: "var(--color-slate-900)", margin: 0 }}>
                    Employee Profile Overview
                  </h3>
                  <p style={{ fontSize: "11px", color: "var(--color-slate-500)", margin: 0 }}>
                    Authenticated user credentials & authorization summary.
                  </p>
                </div>
              </div>
              <button
                className="btn btn-ghost"
                onClick={() => setShowProfileOverviewModal(false)}
                style={{ padding: "6px", color: "var(--color-slate-400)" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Profile Content Body */}
            <div style={{ padding: "1.5rem", backgroundColor: "#ffffff" }}>
              {/* User Avatar Card Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "1rem",
                  backgroundColor: "var(--color-slate-50)",
                  borderRadius: "var(--border-radius-md)",
                  border: "1px solid var(--color-border-light)",
                  marginBottom: "1.25rem",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: "var(--color-primary-light)",
                    color: "var(--color-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "var(--font-weight-bold)",
                    fontSize: "1.25rem",
                    border: "2px solid var(--color-primary-border)",
                  }}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div>
                  <div style={{ fontSize: "var(--font-size-md)", fontWeight: "var(--font-weight-bold)", color: "var(--color-slate-900)" }}>
                    {user?.name || "Employee User"}
                  </div>
                  <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-slate-500)", display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                    <Mail size={12} /> {user?.email}
                  </div>
                </div>
              </div>

              {/* Data Field Breakdown */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "var(--font-size-xs)" }}>
                <div className="flex justify-between items-center" style={{ padding: "6px 0", borderBottom: "1px solid var(--color-border-light)" }}>
                  <span style={{ color: "var(--color-slate-600)", fontWeight: "var(--font-weight-medium)" }}>Account Status:</span>
                  <span className="badge badge-success" style={{ fontSize: "10px" }}>
                    <CheckCircle2 size={11} /> Active Account
                  </span>
                </div>

                <div className="flex justify-between items-center" style={{ padding: "6px 0", borderBottom: "1px solid var(--color-border-light)" }}>
                  <span style={{ color: "var(--color-slate-600)", fontWeight: "var(--font-weight-medium)" }}>Assigned Role:</span>
                  <span className="badge badge-primary" style={{ fontSize: "10px" }}>
                    <Shield size={10} /> {user?.role || "Sales"}
                  </span>
                </div>

                <div className="flex justify-between items-center" style={{ padding: "6px 0", borderBottom: "1px solid var(--color-border-light)" }}>
                  <span style={{ color: "var(--color-slate-600)", fontWeight: "var(--font-weight-medium)" }}>Organization:</span>
                  <span style={{ fontWeight: "var(--font-weight-semibold)", color: "var(--color-slate-900)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Building2 size={12} /> Infotech ERP
                  </span>
                </div>

                <div className="flex justify-between items-center" style={{ padding: "6px 0" }}>
                  <span style={{ color: "var(--color-slate-600)", fontWeight: "var(--font-weight-medium)" }}>Session Security:</span>
                  <span style={{ fontWeight: "var(--font-weight-semibold)", color: "var(--color-slate-900)" }}>
                    JWT Encrypted
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: "0.875rem 1.5rem",
                backgroundColor: "var(--color-slate-50)",
                borderTop: "1px solid var(--color-border-light)",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <button className="btn btn-primary" onClick={() => setShowProfileOverviewModal(false)}>
                Close Overview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Info Modal */}
      {showSecurityModal && (
        <div className="modal-backdrop" onClick={() => setShowSecurityModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "440px", borderRadius: "16px", backgroundColor: "#ffffff", padding: "1.5rem" }}
          >
            <div className="flex justify-between items-center mb-md" style={{ borderBottom: "1px solid var(--color-border-light)", paddingBottom: "0.75rem" }}>
              <div className="flex items-center gap-sm">
                <Lock size={18} style={{ color: "var(--color-primary)" }} />
                <h3 style={{ fontSize: "var(--font-size-base)", fontWeight: "var(--font-weight-semibold)", margin: 0 }}>
                  Security & Session Context
                </h3>
              </div>
              <button className="btn btn-ghost" onClick={() => setShowSecurityModal(false)} style={{ padding: "4px" }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "var(--font-size-xs)" }}>
              <div>
                <strong>Authentication Protocol:</strong> Standard JWT (JSON Web Token)
              </div>
              <div>
                <strong>Active Role Level:</strong> {user?.role}
              </div>
              <div>
                <strong>Authorization Header:</strong> <code>Bearer &lt;token&gt;</code>
              </div>
              <div>
                <strong>Session State:</strong> Persisted in <code>localStorage</code> with auto-expiry check.
              </div>
            </div>

            <div className="flex justify-end mt-lg">
              <button className="btn btn-primary" onClick={() => setShowSecurityModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
