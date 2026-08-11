import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  ArrowLeftRight,
  FileText,
  ChevronLeft,
  ChevronRight,
  History,
  Shield,
  LogOut,
  Building2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const { user, logout } = useAuth();
  const role = user?.role || "Sales";

  // Role permissions checking helper
  const canAccess = (allowed: string[]) => allowed.includes(role);

  const navigationItems = [
    {
      title: "Core",
      items: [
        {
          label: "Dashboard",
          path: "/dashboard",
          icon: <LayoutDashboard size={18} />,
          allowed: ["Admin", "Sales", "Warehouse", "Accounts"],
        },
      ],
    },
    {
      title: "CRM",
      items: [
        {
          label: "Customers",
          path: "/customers",
          icon: <Users size={18} />,
          allowed: ["Admin", "Sales"],
        },
      ],
    },
    {
      title: "Inventory",
      items: [
        {
          label: "Products",
          path: "/products",
          icon: <Package size={18} />,
          allowed: ["Admin", "Warehouse"],
        },
        {
          label: "Stock Movements",
          path: "/inventory",
          icon: <ArrowLeftRight size={18} />,
          allowed: ["Admin", "Warehouse"],
        },
      ],
    },
    {
      title: "Sales & Dispatch",
      items: [
        {
          label: "Challans",
          path: "/challans",
          icon: <FileText size={18} />,
          allowed: ["Admin", "Sales", "Warehouse", "Accounts"],
        },
      ],
    },
    {
      title: "Administration",
      items: [
        {
          label: "User Directory",
          path: "/users",
          icon: <Shield size={18} />,
          allowed: ["Admin"],
        },
        {
          label: "Audit Logs",
          path: "/audit-logs",
          icon: <History size={18} />,
          allowed: ["Admin"],
        },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(2px)",
            zIndex: 98,
          }}
        />
      )}

      <aside className={`sidebar ${isCollapsed ? "collapsed" : ""} ${isMobileOpen ? "mobile-open" : ""}`}>
        {/* Sidebar Header / Brand */}
        <div className="sidebar-header">
          <div
            className="sidebar-logo"
            onClick={() => isCollapsed && setIsCollapsed(false)}
            style={{ cursor: isCollapsed ? "pointer" : "default" }}
            title={isCollapsed ? "Click to expand sidebar" : undefined}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                backgroundColor: "var(--color-primary)",
                borderRadius: "var(--border-radius-md)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 2px 4px rgba(79, 70, 229, 0.4)",
                flexShrink: 0,
              }}
            >
              <Building2 size={18} />
            </div>
            {!isCollapsed && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "0.95rem", fontWeight: "var(--font-weight-bold)", lineHeight: 1.2 }}>
                  Infotech ERP
                </span>
                <span style={{ fontSize: "10px", color: "#64748b", fontWeight: "var(--font-weight-medium)" }}>
                  Operations v1.4.0
                </span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              className="sidebar-toggle-btn"
              onClick={() => setIsCollapsed(true)}
              title="Collapse Sidebar"
            >
              <ChevronLeft size={14} />
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <div className="sidebar-nav">
          {navigationItems.map((section, idx) => {
            const visibleItems = section.items.filter((item) => canAccess(item.allowed));
            if (visibleItems.length === 0) return null;

            return (
              <div key={idx} style={{ marginBottom: "var(--spacing-md)" }}>
                {!isCollapsed && <div className="nav-section-title">{section.title}</div>}
                {visibleItems.map((item, itemIdx) => (
                  <NavLink
                    key={itemIdx}
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className="nav-item-icon">{item.icon}</div>
                    {!isCollapsed && <span className="nav-item-label">{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </div>

        {/* User Profile / Expand Footer */}
        {isCollapsed ? (
          <div
            style={{
              padding: "0.75rem 0",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <button
              className="sidebar-toggle-btn"
              onClick={() => setIsCollapsed(false)}
              title="Expand Sidebar"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        ) : (
          <div
            style={{
              padding: "var(--spacing-md) var(--spacing-lg)",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              backgroundColor: "rgba(15, 23, 42, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <span style={{ fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-semibold)", color: "#f8fafc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.name || "Employee User"}
              </span>
              <span className="badge badge-primary" style={{ marginTop: "2px", width: "fit-content", padding: "1px 5px", fontSize: "9px" }}>
                {role}
              </span>
            </div>
            <button
              onClick={logout}
              className="btn btn-ghost"
              style={{ padding: "6px", color: "#94a3b8" }}
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </aside>
    </>
  );
};
