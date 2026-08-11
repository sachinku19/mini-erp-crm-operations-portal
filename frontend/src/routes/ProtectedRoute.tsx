import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<"Admin" | "Sales" | "Warehouse" | "Accounts">;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        className="flex items-center justify-center w-full"
        style={{ minHeight: "100vh", backgroundColor: "var(--color-bg-base)" }}
      >
        {/* Simple inline spinner */}
        <div
          style={{
            width: "36px",
            height: "36px",
            border: "3px solid var(--color-border)",
            borderTopColor: "var(--color-primary)",
            borderRadius: "50%",
            animation: "spinnerRotate 0.8s linear infinite",
          }}
        />
        <style>{`
          @keyframes spinnerRotate {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page and preserve requested path location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // If role check fails, redirect back to primary dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
