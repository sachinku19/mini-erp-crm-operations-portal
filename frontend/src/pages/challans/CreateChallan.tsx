import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { challanService } from "../../services/challanService";
import { customerService } from "../../services/customerService";
import type { Customer } from "../../services/customerService";
import { productService } from "../../services/productService";
import type { Product } from "../../services/productService";
import {
  FileText,
  User,
  Package,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  Building2,
} from "lucide-react";

interface SelectedItem {
  product_id: string;
  product_name: string;
  sku: string;
  unit_price: number;
  available_stock: number;
  quantity: number;
}

export const CreateChallan: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(1); // Step 1: Customer, Step 2: Items, Step 3: Review

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Form State
  const [customerId, setCustomerId] = useState<string>("");
  const [items, setItems] = useState<SelectedItem[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Current item picker inputs
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantityInput, setQuantityInput] = useState<number>(1);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [custRes, prodRes] = await Promise.all([
          customerService.getCustomers({ limit: 100 }),
          productService.getProducts({ limit: 100 }),
        ]);
        setCustomers(custRes.data);
        setProducts(prodRes.data);
      } catch (err: any) {
        setError("Failed to load customer and product records.");
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, []);

  const selectedCustomer = customers.find((c) => c.id === customerId);

  const handleAddItem = () => {
    if (!selectedProductId) return;
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    if (quantityInput <= 0) {
      alert("Quantity must be at least 1.");
      return;
    }

    if (quantityInput > prod.current_stock) {
      alert(`Cannot add more than available stock (${prod.current_stock} units).`);
      return;
    }

    // Check if item already exists
    const existingIndex = items.findIndex((i) => i.product_id === prod.id);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity += quantityInput;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          product_id: prod.id,
          product_name: prod.name,
          sku: prod.sku,
          unit_price: prod.unit_price,
          available_stock: prod.current_stock,
          quantity: quantityInput,
        },
      ]);
    }

    setSelectedProductId("");
    setQuantityInput(1);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (index: number, newQty: number) => {
    if (newQty <= 0) return;
    const item = items[index];
    if (newQty > item.available_stock) {
      alert(`Maximum stock available: ${item.available_stock}`);
      return;
    }
    const updated = [...items];
    updated[index].quantity = newQty;
    setItems(updated);
  };

  const calculateTotalValuation = () => {
    return items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  };

  const calculateTotalUnits = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleSubmitChallan = async (status: "DRAFT" | "CONFIRMED") => {
    if (!customerId) {
      setError("Please select a customer.");
      setStep(1);
      return;
    }
    if (items.length === 0) {
      setError("Please add at least one product item.");
      setStep(2);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const created = await challanService.createChallan({
        customer_id: customerId,
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        status,
      });
      navigate(`/challans/${created.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to issue sales challan.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="card">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-row" style={{ height: "200px" }} />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-lg">
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "var(--font-weight-bold)", color: "var(--color-slate-900)" }}>
            Issue Delivery Challan
          </h1>
          <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-slate-500)" }}>
            Multi-step sales dispatch workflow and warehouse stock reservation.
          </p>
        </div>

        <button className="btn btn-outline" onClick={() => navigate("/challans")}>
          Cancel
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div className="alert alert-danger mb-lg">
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Stepper Progress Bar Header */}
      <div className="card mb-xl" style={{ padding: "1rem 1.5rem" }}>
        <div className="stepper-container" style={{ margin: 0 }}>
          <div className={`stepper-item ${step === 1 ? "active" : step > 1 ? "completed" : ""}`}>
            <div className="stepper-circle">{step > 1 ? <CheckCircle2 size={16} /> : "01"}</div>
            <div className="stepper-label">Select Customer</div>
          </div>

          <div style={{ flex: 1, height: "2px", backgroundColor: "var(--color-slate-200)", margin: "0 1rem" }} />

          <div className={`stepper-item ${step === 2 ? "active" : step > 2 ? "completed" : ""}`}>
            <div className="stepper-circle">{step > 2 ? <CheckCircle2 size={16} /> : "02"}</div>
            <div className="stepper-label">Select Product Items</div>
          </div>

          <div style={{ flex: 1, height: "2px", backgroundColor: "var(--color-slate-200)", margin: "0 1rem" }} />

          <div className={`stepper-item ${step === 3 ? "active" : ""}`}>
            <div className="stepper-circle">03</div>
            <div className="stepper-label">Review & Issue Dispatch</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Form Steps (Left) vs Summary Invoice (Right) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem", alignItems: "start" }}>
        <style>{`
          @media (max-width: 900px) {
            div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
          }
        `}</style>

        {/* LEFT PANEL: Form Steps */}
        <div>
          {/* STEP 1: CUSTOMER SELECTION */}
          {step === 1 && (
            <div className="card">
              <div className="flex items-center gap-sm mb-lg" style={{ borderBottom: "1px solid var(--color-border-light)", paddingBottom: "0.75rem" }}>
                <User size={18} style={{ color: "var(--color-primary)" }} />
                <h3 style={{ fontSize: "var(--font-size-base)", fontWeight: "var(--font-weight-semibold)", margin: 0 }}>
                  Step 1: Choose Customer Account
                </h3>
              </div>

              <div className="form-group">
                <label className="form-label">Wholesale Customer Account *</label>
                <select
                  className="form-select"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  style={{ fontSize: "var(--font-size-sm)" }}
                >
                  <option value="">-- Select Customer Account --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.business_name || "Personal"}) • {c.customer_type}
                    </option>
                  ))}
                </select>
              </div>

              {selectedCustomer && (
                <div
                  style={{
                    backgroundColor: "var(--color-slate-50)",
                    padding: "1rem",
                    borderRadius: "var(--border-radius-md)",
                    border: "1px solid var(--color-border)",
                    marginBottom: "1.5rem",
                  }}
                >
                  <div className="flex items-center gap-xs mb-xs" style={{ fontWeight: "var(--font-weight-semibold)", color: "var(--color-slate-900)" }}>
                    <Building2 size={16} /> {selectedCustomer.business_name || selectedCustomer.name}
                  </div>
                  <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-slate-600)" }}>
                    Contact Person: {selectedCustomer.name} • Email: {selectedCustomer.email} • Mobile: {selectedCustomer.mobile || "N/A"}
                  </div>
                  {selectedCustomer.address && (
                    <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-slate-500)", marginTop: "4px" }}>
                      Address: {selectedCustomer.address}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end mt-lg">
                <button
                  className="btn btn-primary"
                  disabled={!customerId}
                  onClick={() => setStep(2)}
                >
                  Continue to Add Items <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PRODUCT ITEMS SELECTION */}
          {step === 2 && (
            <div className="card">
              <div className="flex items-center gap-sm mb-lg" style={{ borderBottom: "1px solid var(--color-border-light)", paddingBottom: "0.75rem" }}>
                <Package size={18} style={{ color: "var(--color-primary)" }} />
                <h3 style={{ fontSize: "var(--font-size-base)", fontWeight: "var(--font-weight-semibold)", margin: 0 }}>
                  Step 2: Add Inventory Product Items
                </h3>
              </div>

              {/* Item Adder Inputs */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 110px auto",
                  gap: "0.75rem",
                  alignItems: "end",
                  backgroundColor: "var(--color-slate-50)",
                  padding: "1rem",
                  borderRadius: "var(--border-radius-md)",
                  border: "1px solid var(--color-border)",
                  marginBottom: "1.5rem",
                }}
              >
                <div>
                  <label className="form-label">Select Catalog Product *</label>
                  <select
                    className="form-select"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                  >
                    <option value="">-- Choose Item SKU --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id} disabled={p.current_stock === 0}>
                        {p.name} ({p.sku}) • Stock: {p.current_stock} pcs • ₹{p.unit_price.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Quantity *</label>
                  <input
                    type="number"
                    className="form-input"
                    min={1}
                    value={quantityInput}
                    onChange={(e) => setQuantityInput(parseInt(e.target.value, 10) || 1)}
                  />
                </div>

                <button className="btn btn-primary" onClick={handleAddItem} disabled={!selectedProductId}>
                  <Plus size={16} /> Add Item
                </button>
              </div>

              {/* Added Line Items Table */}
              <div className="table-container mb-lg">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Unit Price</th>
                      <th>Dispatch Qty</th>
                      <th>Subtotal</th>
                      <th style={{ textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--color-slate-400)" }}>
                          No product items added yet. Use the selector above to add dispatch items.
                        </td>
                      </tr>
                    ) : (
                      items.map((item, idx) => (
                        <tr key={item.product_id}>
                          <td style={{ fontWeight: "var(--font-weight-semibold)" }}>{item.product_name}</td>
                          <td style={{ fontFamily: "monospace", fontSize: "var(--font-size-xs)" }}>{item.sku}</td>
                          <td>₹{item.unit_price.toFixed(2)}</td>
                          <td>
                            <input
                              type="number"
                              className="form-input"
                              min={1}
                              max={item.available_stock}
                              value={item.quantity}
                              onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value, 10) || 1)}
                              style={{ width: "80px", padding: "2px 6px" }}
                            />
                          </td>
                          <td style={{ fontWeight: "var(--font-weight-semibold)", color: "var(--color-slate-900)" }}>
                            ₹{(item.quantity * item.unit_price).toFixed(2)}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              className="btn btn-ghost"
                              onClick={() => handleRemoveItem(idx)}
                              style={{ padding: "4px", color: "var(--color-danger)" }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center">
                <button className="btn btn-secondary" onClick={() => setStep(1)}>
                  <ArrowLeft size={16} /> Back to Customer
                </button>
                <button className="btn btn-primary" disabled={items.length === 0} onClick={() => setStep(3)}>
                  Review & Confirm <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW & CONFIRMATION */}
          {step === 3 && (
            <div className="card">
              <div className="flex items-center gap-sm mb-lg" style={{ borderBottom: "1px solid var(--color-border-light)", paddingBottom: "0.75rem" }}>
                <FileText size={18} style={{ color: "var(--color-primary)" }} />
                <h3 style={{ fontSize: "var(--font-size-base)", fontWeight: "var(--font-weight-semibold)", margin: 0 }}>
                  Step 3: Review Dispatch & Reserve Stocks
                </h3>
              </div>

              <div style={{ backgroundColor: "var(--color-slate-50)", padding: "1rem", borderRadius: "var(--border-radius-md)", border: "1px solid var(--color-border)", marginBottom: "1.5rem" }}>
                <div style={{ fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-bold)", color: "var(--color-slate-500)", textTransform: "uppercase", marginBottom: "4px" }}>
                  Customer Account
                </div>
                <div style={{ fontSize: "var(--font-size-md)", fontWeight: "var(--font-weight-semibold)", color: "var(--color-slate-900)" }}>
                  {selectedCustomer?.name} ({selectedCustomer?.business_name})
                </div>
                <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-slate-500)" }}>
                  Email: {selectedCustomer?.email} • Mobile: {selectedCustomer?.mobile || "N/A"}
                </div>
              </div>

              <div className="table-container mb-lg">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.product_id}>
                        <td style={{ fontWeight: "var(--font-weight-semibold)" }}>{item.product_name}</td>
                        <td style={{ fontFamily: "monospace", fontSize: "var(--font-size-xs)" }}>{item.sku}</td>
                        <td>{item.quantity} units</td>
                        <td>₹{item.unit_price.toFixed(2)}</td>
                        <td style={{ fontWeight: "var(--font-weight-semibold)" }}>₹{(item.quantity * item.unit_price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center">
                <button className="btn btn-secondary" onClick={() => setStep(2)}>
                  <ArrowLeft size={16} /> Back to Items
                </button>
                <div className="flex gap-sm">
                  <button className="btn btn-outline" disabled={submitting} onClick={() => handleSubmitChallan("DRAFT")}>
                    Save as DRAFT
                  </button>
                  <button className="btn btn-primary" disabled={submitting} onClick={() => handleSubmitChallan("CONFIRMED")}>
                    {submitting ? "Issuing..." : "Confirm & Reserve Stocks"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Sticky Dispatch Invoice Summary Card */}
        <div className="card" style={{ position: "sticky", top: "80px" }}>
          <div style={{ borderBottom: "1px solid var(--color-border-light)", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-semibold)", margin: 0, color: "var(--color-slate-900)" }}>
              Dispatch Order Summary
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "var(--font-size-sm)" }}>
            <div className="flex justify-between text-muted" style={{ fontSize: "var(--font-size-xs)" }}>
              <span>Customer:</span>
              <span style={{ fontWeight: "var(--font-weight-semibold)", color: "var(--color-slate-900)" }}>
                {selectedCustomer?.name || "Not selected"}
              </span>
            </div>

            <div className="flex justify-between text-muted" style={{ fontSize: "var(--font-size-xs)" }}>
              <span>Item SKUs:</span>
              <span style={{ fontWeight: "var(--font-weight-semibold)", color: "var(--color-slate-900)" }}>
                {items.length} items
              </span>
            </div>

            <div className="flex justify-between text-muted" style={{ fontSize: "var(--font-size-xs)" }}>
              <span>Total Units:</span>
              <span style={{ fontWeight: "var(--font-weight-semibold)", color: "var(--color-slate-900)" }}>
                {calculateTotalUnits()} pcs
              </span>
            </div>

            <div style={{ borderTop: "1px solid var(--color-border-light)", paddingTop: "0.75rem" }} className="flex justify-between items-center">
              <span style={{ fontWeight: "var(--font-weight-semibold)", color: "var(--color-slate-700)" }}>Total Valuation:</span>
              <span style={{ fontSize: "1.25rem", fontWeight: "var(--font-weight-bold)", color: "var(--color-primary)" }}>
                ₹{calculateTotalValuation().toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
