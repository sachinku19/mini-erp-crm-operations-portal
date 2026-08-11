import React from "react";
import { useAuth } from "../context/AuthContext";
import { Menu, LogOut, User, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "react-router-dom";

interface TopbarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  setIsMobileOpen: (open: boolean) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  isCollapsed,
  setIsCollapsed,
  setIsMobileOpen,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Get semantic page title based on path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith("/dashboard")) return "Dashboard Overview";
    if (path.startsWith("/customers")) return "Customers CRM";
    if (path.startsWith("/products")) return "Products Catalog";
    if (path.startsWith("/inventory")) return "Stock Movements";
    if (path.startsWith("/challans")) return "Sales Challans";
    return "Operations Portal";
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "Admin":
        return "badge-danger";
      case "Sales":
        return "badge-info";
      case "Warehouse":
        return "badge-warning";
      case "Accounts":
        return "badge-success";
      default:
        return "badge-info";
    }
  };

  return (
    <header className="topbar">
      {/* Sidebar toggle buttons */}
      <div className="flex items-center gap-sm">
        {/* Mobile menu toggle */}
        <button
          className="sidebar-toggle-btn"
          style={{ display: "none" }} /* Styled responsively in css */
          onClick={() => setIsMobileOpen(true)}
          title="Open Menu"
        >
          <Menu size={20} />
        </button>
        <style>{`
          @media (max-width: 768px) {
            .sidebar-toggle-btn { display: block !important; }
            .desktop-toggle-btn { display: none !important; }
          }
        `}</style>

        {/* Desktop toggle collapse */}
        <button
          className="sidebar-toggle-btn desktop-toggle-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>

        {/* Dynamic Header title */}
        <h2 style={{ fontSize: "var(--font-size-base)", fontWeight: "var(--font-weight-semibold)", marginLeft: "var(--spacing-sm)" }}>
          {getPageTitle()}
        </h2>
      </div>

      {/* Profile menu & Logout */}
      <div className="flex items-center gap-md">
        {/* User Info Card */}
        {user && (
          <div className="flex items-center gap-sm" style={{ paddingRight: "var(--spacing-md)", borderRight: "1px solid var(--color-border-light)" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "var(--color-primary-light)",
                color: "var(--color-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "var(--font-weight-semibold)",
              }}
            >
              <User size={16} />
            </div>
            <div className="flex flex-col" style={{ gap: "2px" }}>
              <span style={{ fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-medium)", color: "var(--color-text-primary)", lineHeight: 1.2 }}>
                {user.name}
              </span>
              <span className={`badge ${getRoleBadgeClass(user.role)}`} style={{ alignSelf: "flex-start", padding: "1px 6px", fontSize: "0.6875rem" }}>
                {user.role}
              </span>
            </div>
          </div>
        )}

        {/* Logout button */}
        <button
          className="btn btn-outline"
          onClick={logout}
          style={{ padding: "var(--spacing-sm)", color: "var(--color-danger)", borderColor: "transparent" }}
          title="Sign Out"
        >
          <LogOut size={18} />
          <span style={{ display: "none" }} className="desktop-logout-text">Sign Out</span>
        </button>
        <style>{`
          @media (min-width: 768px) {
            .desktop-logout-text { display: inline !important; }
          }
        `}</style>
      </div>
    </header>
  );
};
