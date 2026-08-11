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
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  Building2,
  X,
  Boxes,
  Check,
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
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div className="skeleton skeleton-title" style={{ width: "260px", marginBottom: "1.5rem" }} />
        <div className="card" style={{ padding: "2rem" }}>
          <div className="skeleton skeleton-row" style={{ height: "300px" }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1140px", margin: "0 auto", paddingBottom: "2.5rem" }}>
      {/* Header Toolbar */}
      <div className="flex justify-between items-center mb-lg" style={{ marginBottom: "1.25rem" }}>
        <div className="flex items-center gap-sm">
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              backgroundColor: "var(--color-primary-light)",
              color: "var(--color-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FileText size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: "1.35rem", fontWeight: "var(--font-weight-bold)", color: "var(--color-slate-900)", margin: 0 }}>
              Issue Delivery Challan
            </h1>
            <p style={{ fontSize: "11px", color: "var(--color-slate-500)", margin: 0 }}>
              Multi-step sales dispatch workflow and warehouse stock reservation.
            </p>
          </div>
        </div>

        <button className="btn btn-outline" onClick={() => navigate("/challans")} style={{ fontSize: "var(--font-size-xs)" }}>
          <X size={14} /> Cancel Dispatch
        </button>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="alert alert-danger mb-lg" style={{ marginBottom: "1.25rem" }}>
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Stepper Progress Bar Header */}
      <div className="card mb-lg" style={{ padding: "1.125rem 1.5rem", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
          {/* Step 1 */}
          <div
            onClick={() => setStep(1)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              zIndex: 2,
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: step === 1 ? "var(--color-primary)" : step > 1 ? "var(--color-success)" : "var(--color-slate-100)",
                color: step === 1 || step > 1 ? "#ffffff" : "var(--color-slate-500)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "var(--font-weight-bold)",
                fontSize: "12px",
                transition: "all 0.2s ease",
              }}
            >
              {step > 1 ? <Check size={16} /> : "01"}
            </div>
            <div>
              <div style={{ fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-bold)", color: step === 1 ? "var(--color-primary)" : "var(--color-slate-900)" }}>
                Select Customer
              </div>
              <div style={{ fontSize: "10px", color: "var(--color-slate-500)" }}>Consignee Account</div>
            </div>
          </div>

          <div style={{ flex: 1, height: "2px", backgroundColor: step > 1 ? "var(--color-success)" : "var(--color-border)", margin: "0 1.25rem" }} />

          {/* Step 2 */}
          <div
            onClick={() => customerId && setStep(2)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: customerId ? "pointer" : "not-allowed",
              opacity: customerId ? 1 : 0.6,
              zIndex: 2,
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: step === 2 ? "var(--color-primary)" : step > 2 ? "var(--color-success)" : "var(--color-slate-100)",
                color: step === 2 || step > 2 ? "#ffffff" : "var(--color-slate-500)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "var(--font-weight-bold)",
                fontSize: "12px",
                transition: "all 0.2s ease",
              }}
            >
              {step > 2 ? <Check size={16} /> : "02"}
            </div>
            <div>
              <div style={{ fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-bold)", color: step === 2 ? "var(--color-primary)" : "var(--color-slate-900)" }}>
                Add Product Items
              </div>
              <div style={{ fontSize: "10px", color: "var(--color-slate-500)" }}>SKUs & Quantities</div>
            </div>
          </div>

          <div style={{ flex: 1, height: "2px", backgroundColor: step > 2 ? "var(--color-success)" : "var(--color-border)", margin: "0 1.25rem" }} />

          {/* Step 3 */}
          <div
            onClick={() => customerId && items.length > 0 && setStep(3)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: customerId && items.length > 0 ? "pointer" : "not-allowed",
              opacity: customerId && items.length > 0 ? 1 : 0.6,
              zIndex: 2,
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: step === 3 ? "var(--color-primary)" : "var(--color-slate-100)",
                color: step === 3 ? "#ffffff" : "var(--color-slate-500)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "var(--font-weight-bold)",
                fontSize: "12px",
                transition: "all 0.2s ease",
              }}
            >
              03
            </div>
            <div>
              <div style={{ fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-bold)", color: step === 3 ? "var(--color-primary)" : "var(--color-slate-900)" }}>
                Review & Issue Dispatch
              </div>
              <div style={{ fontSize: "10px", color: "var(--color-slate-500)" }}>Confirmation & Reserve</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Form Steps (Left) vs Summary Panel (Right) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.25rem", alignItems: "stretch" }}>
        <style>{`
          @media (max-width: 960px) {
            div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
          }
        `}</style>

        {/* LEFT PANEL: Step Content Form Card */}
        <div className="card" style={{ padding: "1.5rem", minHeight: "420px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            {/* STEP 1: CUSTOMER SELECTION */}
            {step === 1 && (
              <div>
                <div className="flex items-center gap-sm mb-md" style={{ borderBottom: "1px solid var(--color-border-light)", paddingBottom: "0.75rem" }}>
                  <User size={18} style={{ color: "var(--color-primary)" }} />
                  <h3 style={{ fontSize: "var(--font-size-base)", fontWeight: "var(--font-weight-bold)", color: "var(--color-slate-900)", margin: 0 }}>
                    Step 1: Choose Customer Account
                  </h3>
                </div>

                <div className="form-group mb-lg">
                  <label className="form-label" style={{ fontWeight: "var(--font-weight-semibold)", color: "var(--color-slate-900)" }}>
                    Wholesale Customer Account *
                  </label>
                  <select
                    className="form-select"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    style={{ fontSize: "var(--font-size-sm)", padding: "0.625rem" }}
                  >
                    <option value="">-- Select Customer Account --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.business_name || "Personal Account"}) • {c.customer_type}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCustomer && (
                  <div
                    style={{
                      backgroundColor: "var(--color-slate-50)",
                      padding: "1.125rem",
                      borderRadius: "var(--border-radius-md)",
                      border: "1px solid var(--color-border)",
                      marginBottom: "1.5rem",
                    }}
                  >
                    <div className="flex items-center gap-xs mb-xs" style={{ fontWeight: "var(--font-weight-bold)", color: "var(--color-slate-900)", fontSize: "var(--font-size-sm)" }}>
                      <Building2 size={16} style={{ color: "var(--color-primary)" }} /> {selectedCustomer.business_name || selectedCustomer.name}
                    </div>
                    <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-slate-600)", lineHeight: 1.4 }}>
                      <div>Contact Person: <strong>{selectedCustomer.name}</strong> • Email: {selectedCustomer.email}</div>
                      <div>Mobile Phone: {selectedCustomer.mobile || "N/A"} • Tax GSTIN: {selectedCustomer.gst_number || "Unregistered"}</div>
                      {selectedCustomer.address && (
                        <div style={{ marginTop: "4px", color: "var(--color-slate-500)" }}>
                          Registered Address: {selectedCustomer.address}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: PRODUCT ITEMS SELECTION */}
            {step === 2 && (
              <div>
                <div className="flex items-center gap-sm mb-md" style={{ borderBottom: "1px solid var(--color-border-light)", paddingBottom: "0.75rem" }}>
                  <Package size={18} style={{ color: "var(--color-primary)" }} />
                  <h3 style={{ fontSize: "var(--font-size-base)", fontWeight: "var(--font-weight-bold)", color: "var(--color-slate-900)", margin: 0 }}>
                    Step 2: Add Inventory Product SKUs
                  </h3>
                </div>

                {/* Item Adder Inputs */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 100px auto",
                    gap: "0.75rem",
                    alignItems: "end",
                    backgroundColor: "var(--color-slate-50)",
                    padding: "1rem",
                    borderRadius: "var(--border-radius-md)",
                    border: "1px solid var(--color-border)",
                    marginBottom: "1.25rem",
                  }}
                >
                  <div>
                    <label className="form-label" style={{ fontWeight: "var(--font-weight-semibold)" }}>Select Product SKU *</label>
                    <select
                      className="form-select"
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      style={{ fontSize: "var(--font-size-xs)" }}
                    >
                      <option value="">-- Choose Catalog SKU Item --</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id} disabled={p.current_stock === 0}>
                          {p.name} ({p.sku}) • Stock: {p.current_stock} pcs • ₹{p.unit_price.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: "var(--font-weight-semibold)" }}>Qty *</label>
                    <input
                      type="number"
                      className="form-input"
                      min={1}
                      value={quantityInput}
                      onChange={(e) => setQuantityInput(parseInt(e.target.value, 10) || 1)}
                      style={{ fontSize: "var(--font-size-xs)" }}
                    />
                  </div>

                  <button className="btn btn-primary" onClick={handleAddItem} disabled={!selectedProductId} style={{ fontSize: "var(--font-size-xs)" }}>
                    <Plus size={15} /> Add Line
                  </button>
                </div>

                {/* Added Line Items Table */}
                <div className="table-container mb-md" style={{ boxShadow: "none", border: "1px solid var(--color-border)", borderRadius: "var(--border-radius-md)" }}>
                  <table className="table">
                    <thead style={{ backgroundColor: "var(--color-slate-50)" }}>
                      <tr>
                        <th>Product</th>
                        <th>SKU</th>
                        <th style={{ textAlign: "right" }}>Unit Price</th>
                        <th style={{ textAlign: "right" }}>Dispatch Qty</th>
                        <th style={{ textAlign: "right" }}>Subtotal</th>
                        <th style={{ textAlign: "right" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--color-slate-400)", fontSize: "var(--font-size-xs)" }}>
                            No product SKUs added yet. Select an item above and click "+ Add Line".
                          </td>
                        </tr>
                      ) : (
                        items.map((item, idx) => (
                          <tr key={item.product_id}>
                            <td style={{ fontWeight: "var(--font-weight-semibold)", color: "var(--color-slate-900)" }}>{item.product_name}</td>
                            <td style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--color-primary)" }}>{item.sku}</td>
                            <td style={{ textAlign: "right" }}>₹{item.unit_price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                            <td style={{ textAlign: "right" }}>
                              <input
                                type="number"
                                className="form-input"
                                min={1}
                                max={item.available_stock}
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value, 10) || 1)}
                                style={{ width: "70px", padding: "2px 6px", textAlign: "right", fontSize: "12px", display: "inline-block" }}
                              />
                            </td>
                            <td style={{ textAlign: "right", fontWeight: "var(--font-weight-bold)", color: "var(--color-slate-900)" }}>
                              ₹{(item.quantity * item.unit_price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <button
                                className="btn btn-ghost"
                                onClick={() => handleRemoveItem(idx)}
                                style={{ padding: "4px", color: "var(--color-danger)" }}
                                title="Remove Line Item"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* STEP 3: REVIEW & CONFIRMATION */}
            {step === 3 && (
              <div>
                <div className="flex items-center gap-sm mb-md" style={{ borderBottom: "1px solid var(--color-border-light)", paddingBottom: "0.75rem" }}>
                  <FileText size={18} style={{ color: "var(--color-primary)" }} />
                  <h3 style={{ fontSize: "var(--font-size-base)", fontWeight: "var(--font-weight-bold)", color: "var(--color-slate-900)", margin: 0 }}>
                    Step 3: Review Dispatch & Reserve Stocks
                  </h3>
                </div>

                <div style={{ backgroundColor: "var(--color-slate-50)", padding: "1rem", borderRadius: "var(--border-radius-md)", border: "1px solid var(--color-border)", marginBottom: "1.25rem" }}>
                  <div style={{ fontSize: "10px", fontWeight: "var(--font-weight-bold)", color: "var(--color-slate-500)", textTransform: "uppercase", marginBottom: "4px" }}>
                    Consignee Customer Account
                  </div>
                  <div style={{ fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-bold)", color: "var(--color-slate-900)" }}>
                    {selectedCustomer?.name} ({selectedCustomer?.business_name || "Personal"})
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--color-slate-500)" }}>
                    Email: {selectedCustomer?.email} • Mobile: {selectedCustomer?.mobile || "N/A"}
                  </div>
                </div>

                <div className="table-container mb-md" style={{ boxShadow: "none", border: "1px solid var(--color-border)", borderRadius: "var(--border-radius-md)" }}>
                  <table className="table">
                    <thead style={{ backgroundColor: "var(--color-slate-50)" }}>
                      <tr>
                        <th>Product Description</th>
                        <th>SKU</th>
                        <th style={{ textAlign: "right" }}>Qty</th>
                        <th style={{ textAlign: "right" }}>Unit Price</th>
                        <th style={{ textAlign: "right" }}>Line Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.product_id}>
                          <td style={{ fontWeight: "var(--font-weight-semibold)", color: "var(--color-slate-900)" }}>{item.product_name}</td>
                          <td style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--color-primary)" }}>{item.sku}</td>
                          <td style={{ textAlign: "right", fontWeight: "var(--font-weight-semibold)" }}>{item.quantity} units</td>
                          <td style={{ textAlign: "right" }}>₹{item.unit_price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                          <td style={{ textAlign: "right", fontWeight: "var(--font-weight-bold)", color: "var(--color-slate-900)" }}>
                            ₹{(item.quantity * item.unit_price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Action Footer */}
          <div style={{ borderTop: "1px solid var(--color-border-light)", paddingTop: "1rem", marginTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {step === 1 && (
              <div style={{ width: "100%", display: "flex", justifyContent: "flex-end" }}>
                <button
                  className="btn btn-primary"
                  disabled={!customerId}
                  onClick={() => setStep(2)}
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  Continue to Add Items <ArrowRight size={16} />
                </button>
              </div>
            )}

            {step === 2 && (
              <>
                <button className="btn btn-secondary" onClick={() => setStep(1)} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <ArrowLeft size={16} /> Back to Customer
                </button>
                <button className="btn btn-primary" disabled={items.length === 0} onClick={() => setStep(3)} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  Review & Confirm <ArrowRight size={16} />
                </button>
              </>
            )}

            {step === 3 && (
              <>
                <button className="btn btn-secondary" onClick={() => setStep(2)} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <ArrowLeft size={16} /> Back to Items
                </button>
                <div className="flex gap-sm">
                  <button className="btn btn-outline" disabled={submitting} onClick={() => handleSubmitChallan("DRAFT")}>
                    Save as DRAFT
                  </button>
                  <button className="btn btn-primary" disabled={submitting} onClick={() => handleSubmitChallan("CONFIRMED")} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {submitting ? "Issuing..." : "Confirm & Reserve Stocks"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Executive Dispatch Summary Card */}
        <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "1.25rem" }}>
          <div>
            <div className="flex items-center gap-sm mb-md" style={{ borderBottom: "1px solid var(--color-border-light)", paddingBottom: "0.75rem" }}>
              <Boxes size={18} style={{ color: "var(--color-primary)" }} />
              <h3 style={{ fontSize: "var(--font-size-sm)", fontWeight: "var(--font-weight-bold)", margin: 0, color: "var(--color-slate-900)" }}>
                Dispatch Order Summary
              </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <div className="flex justify-between items-center" style={{ fontSize: "var(--font-size-xs)" }}>
                <span style={{ color: "var(--color-slate-500)" }}>Consignee Account:</span>
                <span style={{ fontWeight: "var(--font-weight-bold)", color: selectedCustomer ? "var(--color-slate-900)" : "var(--color-slate-400)" }}>
                  {selectedCustomer?.name ? (selectedCustomer.name.length > 18 ? `${selectedCustomer.name.substring(0, 16)}...` : selectedCustomer.name) : "Not selected"}
                </span>
              </div>

              <div className="flex justify-between items-center" style={{ fontSize: "var(--font-size-xs)" }}>
                <span style={{ color: "var(--color-slate-500)" }}>Line Item SKUs:</span>
                <span className="badge badge-primary" style={{ fontSize: "10px" }}>
                  {items.length} SKUs Added
                </span>
              </div>

              <div className="flex justify-between items-center" style={{ fontSize: "var(--font-size-xs)" }}>
                <span style={{ color: "var(--color-slate-500)" }}>Total Quantity:</span>
                <span style={{ fontWeight: "var(--font-weight-bold)", color: "var(--color-slate-900)" }}>
                  {calculateTotalUnits()} pcs
                </span>
              </div>
            </div>
          </div>

          {/* Valuation Total Box */}
          <div style={{ marginTop: "1.5rem" }}>
            <div
              style={{
                backgroundColor: "var(--color-slate-50)",
                border: "1px solid var(--color-border-light)",
                borderRadius: "var(--border-radius-md)",
                padding: "1rem",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: "var(--font-weight-semibold)", color: "var(--color-slate-500)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px" }}>
                Total Dispatch Valuation
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: "var(--font-weight-bold)", color: "var(--color-primary)" }}>
                ₹{calculateTotalValuation().toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div style={{ fontSize: "10px", color: "var(--color-slate-400)", textAlign: "center", marginTop: "8px" }}>
              * Warehouse stocks will be reserved upon confirmation.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
