import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { productService } from "../../services/productService";
import { ArrowLeft, Save, ShieldAlert } from "lucide-react";

export const ProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "Electronics",
    unit_price: "",
    current_stock: "",
    minimum_stock_alert_quantity: "5",
    location_warehouse: "Warehouse A",
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(isEditMode);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    const loadProduct = async () => {
      try {
        const prod = await productService.getProductById(id);
        setFormData({
          name: prod.name,
          sku: prod.sku,
          category: prod.category,
          unit_price: String(prod.unit_price),
          current_stock: String(prod.current_stock),
          minimum_stock_alert_quantity: String(prod.minimum_stock_alert_quantity),
          location_warehouse: prod.location_warehouse,
        });
      } catch (err: any) {
        setError(err.message || "Failed to load product details.");
      } finally {
        setFetching(false);
      }
    };
    loadProduct();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Product name is required.";
    if (!formData.sku.trim()) errors.sku = "SKU catalog number is required.";
    
    const priceNum = parseFloat(formData.unit_price);
    if (!formData.unit_price) {
      errors.unit_price = "Unit price is required.";
    } else if (isNaN(priceNum) || priceNum <= 0) {
      errors.unit_price = "Price must be a valid positive number.";
    }

    if (!isEditMode) {
      const stockNum = parseInt(formData.current_stock, 10);
      if (!formData.current_stock) {
        errors.current_stock = "Initial stock quantity is required.";
      } else if (isNaN(stockNum) || stockNum < 0) {
        errors.current_stock = "Initial stock cannot be negative.";
      }
    }

    const minNum = parseInt(formData.minimum_stock_alert_quantity, 10);
    if (!formData.minimum_stock_alert_quantity) {
      errors.minimum_stock_alert_quantity = "Minimum alert threshold is required.";
    } else if (isNaN(minNum) || minNum < 0) {
      errors.minimum_stock_alert_quantity = "Alert threshold cannot be negative.";
    }

    if (!formData.location_warehouse.trim()) errors.location_warehouse = "Warehouse location is required.";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    const payload = {
      name: formData.name.trim(),
      sku: formData.sku.trim().toUpperCase(),
      category: formData.category,
      unit_price: parseFloat(formData.unit_price),
      current_stock: parseInt(formData.current_stock, 10),
      minimum_stock_alert_quantity: parseInt(formData.minimum_stock_alert_quantity, 10),
      location_warehouse: formData.location_warehouse.trim(),
    };

    try {
      if (isEditMode && id) {
        // Exclude current_stock when updating
        const { current_stock, ...updatePayload } = payload;
        await productService.updateProduct(id, updatePayload);
      } else {
        await productService.createProduct(payload);
      }
      navigate("/products", { replace: true });
    } catch (err: any) {
      if (err.details && Array.isArray(err.details)) {
        const backendErrors: Record<string, string> = {};
        err.details.forEach((issue: any) => {
          backendErrors[issue.field] = issue.message;
        });
        setValidationErrors(backendErrors);
      } else {
        setError(err.message || "An unexpected error occurred while saving product.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div>
        <div className="skeleton skeleton-title" />
        <div className="card">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton skeleton-row" style={{ height: "40px" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      {/* Back Link */}
      <div style={{ marginBottom: "var(--spacing-md)" }}>
        <Link to="/products" className="flex items-center gap-xs text-muted" style={{ fontSize: "var(--font-size-sm)" }}>
          <ArrowLeft size={16} /> Back to Catalog
        </Link>
      </div>

      {/* Title */}
      <div style={{ marginBottom: "var(--spacing-xl)" }}>
        <h1 style={{ fontSize: "var(--font-size-xl)", fontWeight: "var(--font-weight-bold)" }}>
          {isEditMode ? "Modify Catalog Product" : "Add Product to Catalog"}
        </h1>
        <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
          Define product codes, unit prices, storage spaces, and low-stock warning metrics.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger">
          <ShieldAlert size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
        <div className="grid grid-cols-2 gap-md">
          {/* SKU */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              SKU Number <span className="required">*</span>
            </label>
            <input
              type="text"
              name="sku"
              className="form-input"
              placeholder="e.g. PRD-APP-001"
              value={formData.sku}
              onChange={handleChange}
              disabled={loading}
              style={{ textTransform: "uppercase" }}
            />
            {validationErrors.sku && <div className="error-message">{validationErrors.sku}</div>}
          </div>

          {/* Name */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              Product Name <span className="required">*</span>
            </label>
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder="e.g. Apple iPhone 15 Pro"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
            />
            {validationErrors.name && <div className="error-message">{validationErrors.name}</div>}
          </div>

          {/* Category */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Category</label>
            <select
              name="category"
              className="form-select"
              value={formData.category}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="Electronics">Electronics</option>
              <option value="Appliances">Appliances</option>
              <option value="Accessories">Accessories</option>
              <option value="Hardware">Hardware</option>
            </select>
          </div>

          {/* Unit Price */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              Unit Price (INR) <span className="required">*</span>
            </label>
            <input
              type="number"
              name="unit_price"
              className="form-input"
              placeholder="e.g. 999"
              value={formData.unit_price}
              onChange={handleChange}
              disabled={loading}
              min="0.01"
              step="0.01"
            />
            {validationErrors.unit_price && <div className="error-message">{validationErrors.unit_price}</div>}
          </div>

          {/* Initial Stock / Current Stock */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              Current Stock Quantity {!isEditMode && <span className="required">*</span>}
            </label>
            <input
              type="number"
              name="current_stock"
              className="form-input"
              placeholder={isEditMode ? "" : "e.g. 50"}
              value={formData.current_stock}
              onChange={handleChange}
              disabled={loading || isEditMode}
            />
            {validationErrors.current_stock && <div className="error-message">{validationErrors.current_stock}</div>}
            {isEditMode && (
              <span style={{ display: "block", fontSize: "0.6875rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
                * Stock is locked. Make stock adjustments in the Movements ledger to change quantity.
              </span>
            )}
          </div>

          {/* Min alert Quantity */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              Min Stock Alert Threshold <span className="required">*</span>
            </label>
            <input
              type="number"
              name="minimum_stock_alert_quantity"
              className="form-input"
              placeholder="e.g. 10"
              value={formData.minimum_stock_alert_quantity}
              onChange={handleChange}
              disabled={loading}
            />
            {validationErrors.minimum_stock_alert_quantity && (
              <div className="error-message">{validationErrors.minimum_stock_alert_quantity}</div>
            )}
          </div>

          {/* Warehouse location */}
          <div className="form-group" style={{ marginBottom: 0, gridColumn: "span 2" }}>
            <label className="form-label">
              Warehouse Storage Location <span className="required">*</span>
            </label>
            <input
              type="text"
              name="location_warehouse"
              className="form-input"
              placeholder="e.g. Warehouse A, Bay 4"
              value={formData.location_warehouse}
              onChange={handleChange}
              disabled={loading}
            />
            {validationErrors.location_warehouse && <div className="error-message">{validationErrors.location_warehouse}</div>}
          </div>
        </div>

        {/* Actions bar */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--spacing-md)", borderTop: "1px solid var(--color-border-light)", paddingTop: "var(--spacing-lg)", marginTop: "var(--spacing-md)" }}>
          <Link to="/products" className="btn btn-secondary" style={{ pointerEvents: loading ? "none" : "auto" }}>
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Save size={16} /> {loading ? "Saving product..." : isEditMode ? "Update Product" : "Save Product"}
          </button>
        </div>
      </form>
    </div>
  );
};
