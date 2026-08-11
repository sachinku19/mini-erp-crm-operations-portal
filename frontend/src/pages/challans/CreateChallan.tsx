import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { customerService } from "../../services/customerService";
import type { Customer } from "../../services/customerService";
import { productService } from "../../services/productService";
import type { Product } from "../../services/productService";
import { challanService } from "../../services/challanService";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Check,
  ShieldAlert,
  AlertCircle,
} from "lucide-react";

interface SelectedItem {
  product_id: string;
  quantity: number;
}

export const CreateChallan: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlCustomerId = searchParams.get("customer_id") || "";

  // Data directories loaded from server
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(urlCustomerId);
  const [items, setItems] = useState<SelectedItem[]>([{ product_id: "", quantity: 1 }]);
  const [saveStatus, setSaveStatus] = useState<"DRAFT" | "CONFIRMED">("DRAFT");
  
  // Triggers & indicators
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<string | null>(null);

  // Load directories
  useEffect(() => {
    const loadDirectories = async () => {
      setLoadingData(true);
      setError(null);
      try {
        const [custRes, prodRes] = await Promise.all([
          customerService.getCustomers({ limit: 100 }),
          productService.getProducts({ limit: 100 }),
        ]);
        setCustomers(custRes.data);
        setProducts(prodRes.data);

        // Pre-fill fields if customer is not specified
        if (!selectedCustomerId && custRes.data.length > 0) {
          setSelectedCustomerId(custRes.data[0].id);
        }
        if (prodRes.data.length > 0) {
          setItems([{ product_id: prodRes.data[0].id, quantity: 1 }]);
        }
      } catch (err: any) {
        setError("Failed to load customer or product registries for selection.");
      } finally {
        setLoadingData(false);
      }
    };
    loadDirectories();
  }, []);

  const handleAddItemRow = () => {
    const defaultProductId = products[0]?.id || "";
    setItems((prev) => [...prev, { product_id: defaultProductId, quantity: 1 }]);
  };

  const handleRemoveItemRow = (idx: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, itemIdx) => itemIdx !== idx));
  };

  const handleItemChange = (idx: number, field: keyof SelectedItem, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  // Live calculations
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalAmount = items.reduce((sum, item) => {
    const prod = products.find((p) => p.id === item.product_id);
    const rate = prod ? prod.unit_price : 0;
    return sum + rate * (item.quantity || 0);
  }, 0);

  const validateForm = () => {
    setFormErrors(null);
    if (!selectedCustomerId) {
      setFormErrors("Please select a customer.");
      return false;
    }
    if (items.length === 0) {
      setFormErrors("Please add at least one product item row.");
      return false;
    }
    
    // Check for duplicate products in lines
    const productIds = items.map((i) => i.product_id);
    const duplicates = productIds.filter((id, index) => productIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      const duplicateProd = products.find((p) => p.id === duplicates[0]);
      setFormErrors(`Duplicate lines: '${duplicateProd?.name}' is added multiple times. Please group quantities instead.`);
      return false;
    }

    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      if (!row.product_id) {
        setFormErrors(`Line ${i + 1}: Please select a product.`);
        return false;
      }
      if (isNaN(row.quantity) || row.quantity <= 0) {
        setFormErrors(`Line ${i + 1}: Quantity must be a valid positive integer.`);
        return false;
      }

      // Check stock limits if creating confirmed
      if (saveStatus === "CONFIRMED") {
        const prod = products.find((p) => p.id === row.product_id);
        if (prod && row.quantity > prod.current_stock) {
          setFormErrors(
            `Line ${i + 1}: Insufficient stock for '${prod.name}'. Available: ${prod.current_stock}, Requested: ${row.quantity}`
          );
          return false;
        }
      }
    }
    return true;
  };

  const handleTriggerSave = (status: "DRAFT" | "CONFIRMED") => {
    setSaveStatus(status);
    // Timeout to allow state change before validation
    setTimeout(() => {
      if (status === "CONFIRMED") {
        setShowConfirmModal(true);
      } else {
        executeSave("DRAFT");
      }
    }, 50);
  };

  const executeSave = async (status: "DRAFT" | "CONFIRMED") => {
    if (!validateForm()) {
      setShowConfirmModal(false);
      return;
    }

    setSubmitting(true);
    setFormErrors(null);
    setShowConfirmModal(false);

    try {
      const payload = {
        customer_id: selectedCustomerId,
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
        })),
        status,
      };

      const created = await challanService.createChallan(payload);
      navigate(`/challans/${created.id}`, { replace: true });
    } catch (err: any) {
      setFormErrors(err.message || "Failed to save challan. Verify warehouse stocks.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div>
        <div className="skeleton skeleton-title" style={{ width: "250px" }} />
        <div className="card">
          <div className="skeleton skeleton-row" style={{ height: "100px" }} />
          <div className="skeleton skeleton-row" style={{ height: "200px" }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      {/* Back link */}
      <div style={{ marginBottom: "var(--spacing-md)" }}>
        <Link to="/challans" className="flex items-center gap-xs text-muted" style={{ fontSize: "var(--font-size-sm)" }}>
          <ArrowLeft size={16} /> Back to Challans
        </Link>
      </div>

      {/* Header Title */}
      <div style={{ marginBottom: "var(--spacing-xl)" }}>
        <h1 style={{ fontSize: "var(--font-size-xl)", fontWeight: "var(--font-weight-bold)" }}>
          Generate Delivery Challan
        </h1>
        <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
          Draft dispatches, choose target products, and commit dispatches.
        </p>
      </div>

      {/* Global alert boxes */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: "var(--spacing-lg)" }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {formErrors && (
        <div className="alert alert-danger" style={{ marginBottom: "var(--spacing-lg)" }}>
          <ShieldAlert size={20} style={{ flexShrink: 0 }} />
          <span>{formErrors}</span>
        </div>
      )}

      {/* Main Grid: Item Form (Left) & Live Summary (Right) */}
      <div className="grid grid-cols-3 gap-md" style={{ gridTemplateColumns: "2fr 1fr", alignItems: "start" }}>
        <style>{`
          @media (max-width: 768px) {
            .grid-cols-3 { grid-template-columns: 1fr !important; }
          }
        `}</style>
        
        {/* Left: Creator Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
          
          {/* Card 1: Consignee selection */}
          <div className="card">
            <h3 style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", textTransform: "uppercase", marginBottom: "var(--spacing-md)" }}>
              Step 1: Select Customer
            </h3>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Client Consignee</label>
              <select
                className="form-select"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                disabled={submitting}
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.business_name} ({c.customer_type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Card 2: Items line editor */}
          <div className="card">
            <div className="flex justify-between items-center" style={{ marginBottom: "var(--spacing-md)", borderBottom: "1px solid var(--color-border-light)", paddingBottom: "var(--spacing-sm)" }}>
              <h3 style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
                Step 2: Add Product Items
              </h3>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleAddItemRow}
                style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                disabled={submitting}
              >
                <Plus size={14} /> Add Line Item
              </button>
            </div>

            {/* Line items editor lists */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
              {items.map((item, idx) => {
                const prod = products.find((p) => p.id === item.product_id);
                const rate = prod ? prod.unit_price : 0;
                const available = prod ? prod.current_stock : 0;
                const subtotal = rate * (item.quantity || 0);

                return (
                  <div
                    key={idx}
                    className="flex"
                    style={{
                      gap: "var(--spacing-sm)",
                      alignItems: "flex-start",
                      paddingBottom: "var(--spacing-md)",
                      borderBottom: "1px solid var(--color-border-light)",
                      flexWrap: "wrap",
                    }}
                  >
                    {/* Product Selection */}
                    <div style={{ flex: "1 1 250px" }}>
                      <label className="form-label" style={{ fontSize: "var(--font-size-xs)", marginBottom: "4px" }}>Product</label>
                      <select
                        className="form-select"
                        value={item.product_id}
                        onChange={(e) => handleItemChange(idx, "product_id", e.target.value)}
                        disabled={submitting}
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku}) — Stock: {p.current_stock}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Stock Alert Info */}
                    <div style={{ flex: "0 0 100px" }}>
                      <label className="form-label" style={{ fontSize: "var(--font-size-xs)", marginBottom: "4px" }}>Available</label>
                      <input
                        type="text"
                        className="form-input"
                        value={`${available} units`}
                        style={{ backgroundColor: "var(--color-bg-base)", border: "none" }}
                        disabled
                      />
                    </div>

                    {/* Rate info */}
                    <div style={{ flex: "0 0 100px" }}>
                      <label className="form-label" style={{ fontSize: "var(--font-size-xs)", marginBottom: "4px" }}>Rate (INR)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={`₹${rate.toLocaleString()}`}
                        style={{ backgroundColor: "var(--color-bg-base)", border: "none" }}
                        disabled
                      />
                    </div>

                    {/* Quantity input */}
                    <div style={{ flex: "0 0 80px" }}>
                      <label className="form-label" style={{ fontSize: "var(--font-size-xs)", marginBottom: "4px" }}>Qty</label>
                      <input
                        type="number"
                        className="form-input"
                        value={item.quantity || ""}
                        onChange={(e) => handleItemChange(idx, "quantity", parseInt(e.target.value, 10))}
                        min="1"
                        disabled={submitting}
                      />
                    </div>

                    {/* Subtotal */}
                    <div style={{ flex: "0 0 100px" }}>
                      <label className="form-label" style={{ fontSize: "var(--font-size-xs)", marginBottom: "4px" }}>Subtotal</label>
                      <input
                        type="text"
                        className="form-input"
                        value={`₹${subtotal.toLocaleString()}`}
                        style={{ backgroundColor: "var(--color-bg-base)", border: "none", fontWeight: "var(--font-weight-semibold)" }}
                        disabled
                      />
                    </div>

                    {/* Remove button */}
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => handleRemoveItemRow(idx)}
                      style={{
                        alignSelf: "flex-end",
                        padding: "var(--spacing-sm)",
                        color: "var(--color-danger)",
                        borderColor: "transparent",
                        marginTop: "20px",
                      }}
                      disabled={items.length <= 1 || submitting}
                      title="Remove Row"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Live Summary Card */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)", position: "sticky", top: "var(--spacing-md)" }}>
          <div className="card">
            <h3 style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", textTransform: "uppercase", marginBottom: "var(--spacing-md)" }}>
              Dispatch Summary
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)", fontSize: "var(--font-size-sm)" }}>
              <div className="flex justify-between">
                <span className="text-muted">Total Line Items:</span>
                <span>{items.length} lines</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Total Quantity:</span>
                <strong>{totalQuantity} units</strong>
              </div>
              <div className="flex justify-between" style={{ borderTop: "1px solid var(--color-border-light)", paddingTop: "var(--spacing-md)" }}>
                <span style={{ fontWeight: "var(--font-weight-medium)" }}>Valuation Total:</span>
                <strong style={{ fontSize: "var(--font-size-lg)", color: "var(--color-primary)" }}>
                  ₹{totalAmount.toLocaleString()}
                </strong>
              </div>
            </div>

            {/* Actions Bar */}
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-sm)", marginTop: "var(--spacing-xl)" }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleTriggerSave("CONFIRMED")}
                disabled={submitting}
              >
                <Check size={16} /> Confirm and Release Stock
              </button>
              
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => handleTriggerSave("DRAFT")}
                disabled={submitting}
                style={{ backgroundColor: "var(--color-bg-base)" }}
              >
                <Save size={16} /> Save as Draft
              </button>
              
              <Link to="/challans" className="btn btn-secondary" style={{ pointerEvents: submitting ? "none" : "auto" }}>
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm stock deduction modal */}
      {showConfirmModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ color: "var(--color-success)" }}>Release Dispatches confirmation</h3>
              <button
                className="btn btn-outline"
                style={{ padding: "4px", borderColor: "transparent" }}
                onClick={() => setShowConfirmModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: "var(--font-size-sm)" }}>
                Are you sure you want to create and **CONFIRM** this delivery challan immediately?
              </p>
              <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-warning-hover)", marginTop: "var(--spacing-sm)", fontWeight: "var(--font-weight-medium)" }}>
                ⚠️ WARNING: Stock balances will be immediately deducted for the {totalQuantity} units on this order. This action cannot be undone.
              </p>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowConfirmModal(false)} disabled={submitting}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={() => executeSave("CONFIRMED")} disabled={submitting}>
                {submitting ? "Confirming..." : "Confirm and Deduct"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
