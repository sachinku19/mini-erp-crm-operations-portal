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
  const { user } = useAuth();
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
          icon: <LayoutDashboard size={20} />,
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
          icon: <Users size={20} />,
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
          icon: <Package size={20} />,
          allowed: ["Admin", "Warehouse"],
        },
        {
          label: "Stock Movements",
          path: "/inventory",
          icon: <ArrowLeftRight size={20} />,
          allowed: ["Admin", "Warehouse"],
        },
      ],
    },
    {
      title: "Sales",
      items: [
        {
          label: "Challans",
          path: "/challans",
          icon: <FileText size={20} />,
          allowed: ["Admin", "Sales", "Warehouse", "Accounts"],
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
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            zIndex: 98,
          }}
        />
      )}

      <aside className={`sidebar ${isCollapsed ? "collapsed" : ""} ${isMobileOpen ? "mobile-open" : ""}`}>
        {/* Sidebar Header / Brand */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div
              style={{
                width: "32px",
                height: "32px",
                backgroundColor: "var(--color-primary)",
                borderRadius: "var(--border-radius-sm)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontWeight: "bold",
              }}
            >
              IE
            </div>
            {!isCollapsed && <span style={{ fontSize: "1.1rem" }}>Infotech ERP</span>}
          </div>
          <button
            className="sidebar-toggle-btn"
            style={{ display: "none" }} /* Hidden on mobile/desktop, managed by wrapper trigger */
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="sidebar-nav">
          {navigationItems.map((section, idx) => {
            // Filter section items by role
            const visibleItems = section.items.filter((item) => canAccess(item.allowed));
            if (visibleItems.length === 0) return null;

            return (
              <div key={idx} style={{ marginBottom: "var(--spacing-lg)" }}>
                <div className="nav-section-title">{section.title}</div>
                {visibleItems.map((item, itemIdx) => (
                  <NavLink
                    key={itemIdx}
                    to={item.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <div className="nav-item-icon">{item.icon}</div>
                    <span className="nav-item-label">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
};
