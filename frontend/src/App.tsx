import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { AppShell } from "./layouts/AppShell";
import { Login } from "./pages/auth/Login";
import { Dashboard } from "./pages/dashboard/Dashboard";

// CRM Customer Pages
import { Customers } from "./pages/customers/Customers";
import { CustomerForm } from "./pages/customers/CustomerForm";
import { CustomerDetails } from "./pages/customers/CustomerDetails";

// Product & Inventory Pages
import { Products } from "./pages/products/Products";
import { ProductForm } from "./pages/products/ProductForm";
import { ProductDetails } from "./pages/products/ProductDetails";
import { StockMovements } from "./pages/inventory/StockMovements";

// Challan Pages
import { Challans } from "./pages/challans/Challans";
import { CreateChallan } from "./pages/challans/CreateChallan";
import { ChallanDetails } from "./pages/challans/ChallanDetails";

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Login View */}
          <Route path="/login" element={<Login />} />

          {/* Protected Main Application Shell */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            {/* Default Landing redirect */}
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            {/* Dashboard available to all authenticated roles */}
            <Route path="dashboard" element={<Dashboard />} />

            {/* Customer CRM Module - Restricted to Admin and Sales */}
            <Route
              path="customers"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Sales"]}>
                  <Customers />
                </ProtectedRoute>
              }
            />
            <Route
              path="customers/create"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Sales"]}>
                  <CustomerForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="customers/:id"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Sales"]}>
                  <CustomerDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="customers/:id/edit"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Sales"]}>
                  <CustomerForm />
                </ProtectedRoute>
              }
            />

            {/* Product & Inventory Catalog - Restricted to Admin and Warehouse */}
            <Route
              path="products"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Warehouse"]}>
                  <Products />
                </ProtectedRoute>
              }
            />
            <Route
              path="products/create"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Warehouse"]}>
                  <ProductForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="products/:id"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Warehouse"]}>
                  <ProductDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="products/:id/edit"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Warehouse"]}>
                  <ProductForm />
                </ProtectedRoute>
              }
            />

            {/* Stock Movements Log - Restricted to Admin and Warehouse */}
            <Route
              path="inventory"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Warehouse"]}>
                  <StockMovements />
                </ProtectedRoute>
              }
            />

            {/* Sales Challan Module */}
            <Route
              path="challans"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Sales", "Warehouse", "Accounts"]}>
                  <Challans />
                </ProtectedRoute>
              }
            />
            <Route
              path="challans/create"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Sales", "Warehouse"]}>
                  <CreateChallan />
                </ProtectedRoute>
              }
            />
            <Route
              path="challans/:id"
              element={
                <ProtectedRoute allowedRoles={["Admin", "Sales", "Warehouse", "Accounts"]}>
                  <ChallanDetails />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Wildcard Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
