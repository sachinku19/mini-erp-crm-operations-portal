import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { challanService } from "../../services/challanService";
import type { Challan } from "../../services/challanService";
import { customerService } from "../../services/customerService";
import type { Customer } from "../../services/customerService";
import { useAuth } from "../../context/AuthContext";
import {
  ArrowLeft,
  Check,
  Ban,
  Printer,
  ShieldAlert,
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
} from "lucide-react";

export const ChallanDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const role = user?.role || "Sales";

  const [challan, setChallan] = useState<Challan | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Transaction confirmations
  const [confirmTargetAction, setConfirmTargetAction] = useState<"CONFIRM" | "CANCEL" | null>(null);
  const [updating, setUpdating] = useState<boolean>(false);

  const canModify = ["Admin", "Sales", "Warehouse"].includes(role);

  useEffect(() => {
    if (!id) return;
    const loadChallanDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await challanService.getChallanById(id);
        setChallan(data);

        // Load rich customer profile if available
        if (data.customer_id) {
          try {
            const custData = await customerService.getCustomerById(data.customer_id);
            setCustomer(custData);
          } catch (custErr) {
            console.log("Could not load extended customer profile details:", custErr);
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to load delivery challan details.");
      } finally {
        setLoading(false);
      }
    };
    loadChallanDetails();
  }, [id]);

  const handleActionExecute = async () => {
    if (!challan || !confirmTargetAction) return;
    setUpdating(true);
    setError(null);

    try {
      if (confirmTargetAction === "CONFIRM") {
        await challanService.confirmChallan(challan.id);
      } else {
        await challanService.cancelChallan(challan.id);
      }

      // Reload details from server
      const reloaded = await challanService.getChallanById(challan.id);
      setChallan(reloaded);
      setConfirmTargetAction(null);
    } catch (err: any) {
      setError(err.message || `Failed to transition challan to ${confirmTargetAction}.`);
      setConfirmTargetAction(null);
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "840px", margin: "2rem auto" }}>
        <div className="skeleton skeleton-title" style={{ width: "250px", marginBottom: "1.5rem" }} />
        <div className="card" style={{ padding: "2rem" }}>
          <div className="skeleton skeleton-row" style={{ height: "120px", marginBottom: "1rem" }} />
          <div className="skeleton skeleton-row" style={{ height: "200px" }} />
        </div>
      </div>
    );
  }

  if (error && !challan) {
    return (
      <div style={{ maxWidth: "600px", margin: "3rem auto", textAlign: "center" }}>
        <div className="alert alert-danger" style={{ display: "inline-flex", gap: "1rem", padding: "1.5rem" }}>
          <AlertCircle size={24} style={{ flexShrink: 0 }} />
          <div style={{ textAlign: "left" }}>
            <h3 style={{ marginBottom: "0.5rem", fontSize: "1rem", fontWeight: "bold" }}>Error Loading Delivery Challan</h3>
            <p style={{ margin: 0, fontSize: "0.875rem" }}>{error}</p>
          </div>
        </div>
        <div style={{ marginTop: "1.5rem" }}>
          <Link to="/challans" className="btn btn-primary">
            <ArrowLeft size={16} style={{ marginRight: "0.5rem" }} /> Back to Delivery Challans
          </Link>
        </div>
      </div>
    );
  }

  if (!challan) return null;

  // Calculate monetary totals
  const subtotalAmount = challan.items?.reduce((sum, item) => sum + (item.unit_price ?? 0) * item.quantity, 0) || 0;
  const totalQuantityCount = challan.total_quantity || challan.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // Format currency helpers
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Printable CSS Media Overrides & A4 Page Definitions */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 12mm 12mm 15mm 12mm;
        }

        @media print {
          html, body {
            background-color: #ffffff !important;
            color: #0f172a !important;
            font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print, .topbar, .sidebar, .breadcrumb-back, button, header, aside {
            display: none !important;
          }
          .main-wrapper, .page-container {
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          .challan-print-document {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          thead {
            display: table-header-group !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .print-keep-together {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }

        /* Web Interactive Hover styles for document preview */
        .challan-print-document {
          background-color: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08);
          padding: 2.5rem;
          color: #0f172a;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }
      `}</style>

      {/* Action Toolbar Header (Hidden on Print) */}
      <div className="flex justify-between items-center mb-lg no-print breadcrumb-back" style={{ marginBottom: "1.5rem" }}>
        <Link to="/challans" className="flex items-center gap-xs text-muted" style={{ fontSize: "var(--font-size-sm)", color: "var(--color-slate-600)", textDecoration: "none" }}>
          <ArrowLeft size={16} /> Back to Delivery Challans
        </Link>

        <div className="flex items-center gap-sm">
          {/* Print / PDF Button */}
          <button className="btn btn-outline" onClick={handlePrint} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Printer size={16} /> Print / Export A4 PDF
          </button>

          {/* Action triggers depending on status */}
          {canModify && challan.status === "DRAFT" && (
            <button className="btn btn-primary" onClick={() => setConfirmTargetAction("CONFIRM")} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Check size={16} /> Confirm Dispatch
            </button>
          )}

          {canModify && (challan.status === "DRAFT" || challan.status === "CONFIRMED") && (
            <button className="btn btn-danger" onClick={() => setConfirmTargetAction("CANCEL")} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Ban size={16} /> Cancel Challan
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger no-print mb-lg" style={{ marginBottom: "1rem" }}>
          <ShieldAlert size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* OFFICIAL A4 CORPORATE DELIVERY CHALLAN DOCUMENT (Printable Surface) */}
      {/* ========================================================================= */}
      <div className="challan-print-document">

        {/* 1. CORPORATE HEADER BLOCK */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "2px solid #0f172a", paddingBottom: "1.25rem", marginBottom: "1.5rem" }}>
          {/* Left: Company Brand & HQ Details */}
          <div style={{ flex: 1, paddingRight: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  backgroundColor: "#4f46e5",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  boxShadow: "0 2px 4px rgba(79, 70, 229, 0.3)",
                }}
              >
                <Building2 size={20} />
              </div>
              <div>
                <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1.1 }}>
                  Infotech ERP Operations Ltd
                </h1>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "#4f46e5", letterSpacing: "0.02em" }}>
                  Industrial Logistics & Wholesale Dispatches Division
                </span>
              </div>
            </div>

            <div style={{ fontSize: "11px", color: "#475569", lineHeight: "1.45", marginTop: "6px" }}>
              <div>Plot 42, Tech Park, MIDC Industrial Zone, Navi Mumbai, MH - 400701</div>
              <div><strong>GSTIN:</strong> 27INFOTECH8888Z1 | <strong>CIN:</strong> U72200MH2026PTC109823</div>
              <div><strong>Logistics Desk:</strong> +91 22 8888 9999 | <strong>Email:</strong> logistics@infotech.com</div>
            </div>
          </div>

          {/* Right: Document Identity & Status */}
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#1e293b", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "4px" }}>
              DELIVERY CHALLAN
            </div>

            <div style={{ fontFamily: "monospace", fontSize: "1.1rem", fontWeight: 800, color: "#4f46e5", marginBottom: "6px" }}>
              {challan.challan_number}
            </div>

            <div style={{ fontSize: "12px", color: "#334155", marginBottom: "8px" }}>
              Date: <strong>{new Date(challan.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</strong>
            </div>

            {/* Restrained Status Badge */}
            <div>
              {challan.status === "CONFIRMED" && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "3px 10px",
                    borderRadius: "4px",
                    backgroundColor: "#dcfce7",
                    color: "#166534",
                    border: "1px solid #bbf7d0",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                  }}
                >
                  <CheckCircle2 size={12} /> CONFIRMED DISPATCH
                </span>
              )}
              {challan.status === "DRAFT" && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "3px 10px",
                    borderRadius: "4px",
                    backgroundColor: "#fef3c7",
                    color: "#92400e",
                    border: "1px solid #fde68a",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                  }}
                >
                  <Clock size={12} /> DRAFT DISPATCH
                </span>
              )}
              {challan.status === "CANCELLED" && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "3px 10px",
                    borderRadius: "4px",
                    backgroundColor: "#fee2e2",
                    color: "#991b1b",
                    border: "1px solid #fca5a5",
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                  }}
                >
                  <Ban size={12} /> CANCELLED DISPATCH
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 2. CUSTOMER & METADATA SECTION (Side-by-Side Corporate Cards) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.5rem" }}>
          {/* Consignee / Bill To Customer Details */}
          <div
            style={{
              padding: "1rem 1.125rem",
              borderRadius: "8px",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
              Consignee (Delivery Destination)
            </div>

            <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", marginBottom: "2px" }}>
              {customer?.name || challan.customer_name || "N/A"}
            </div>

            <div style={{ fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
              {customer?.business_name || challan.customer_business_name || "Retail Customer Account"}
            </div>

            <div style={{ fontSize: "11px", color: "#475569", lineHeight: "1.4" }}>
              <div><strong>Address:</strong> {customer?.address || "Registered Client Warehouse Address"}</div>
              <div><strong>GSTIN / Tax Ref:</strong> {customer?.gst_number || "27ABCDE1234F1Z9 (Standard Registered Consignee)"}</div>
              <div><strong>Contact Phone:</strong> {customer?.mobile || "+91 98765 43210"}</div>
              <div><strong>Email:</strong> {customer?.email || "billing@clientcorp.com"}</div>
            </div>
          </div>

          {/* Transaction Metadata & Logistics Details */}
          <div
            style={{
              padding: "1rem 1.125rem",
              borderRadius: "8px",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
            }}
          >
            <div style={{ fontSize: "10px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
              Dispatch & Logistics Metadata
            </div>

            <div style={{ fontSize: "11px", color: "#334155", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: "4px" }}>
                <span style={{ color: "#64748b" }}>Dispatched By:</span>
                <strong style={{ color: "#0f172a" }}>{challan.created_by_name || "System Operator"}</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: "4px" }}>
                <span style={{ color: "#64748b" }}>Authorization Level:</span>
                <strong style={{ color: "#0f172a" }}>{challan.status === "CONFIRMED" ? "Authorized Auditor" : "Sales Operations"}</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", paddingBottom: "4px" }}>
                <span style={{ color: "#64748b" }}>Transport Mode:</span>
                <strong style={{ color: "#0f172a" }}>Road Freight Cargo</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Stock Status:</span>
                <strong style={{ color: challan.status === "CONFIRMED" ? "#15803d" : "#b45309" }}>
                  {challan.status === "CONFIRMED" ? "Deducted & Reserved" : challan.status === "CANCELLED" ? "Released / Unreserved" : "Pending Commitment"}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* 3. ENTERPRISE ITEM TABLE */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "11px", fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
            Dispatched Line Items Breakdown
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <thead>
              <tr style={{ backgroundColor: "#1e293b", color: "#ffffff" }}>
                <th style={{ padding: "8px 12px", textAlign: "center", width: "40px", fontWeight: 700 }}>#</th>
                <th style={{ padding: "8px 12px", textAlign: "left", width: "120px", fontWeight: 700 }}>SKU CODE</th>
                <th style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700 }}>PRODUCT DESCRIPTION</th>
                <th style={{ padding: "8px 12px", textAlign: "right", width: "80px", fontWeight: 700 }}>QTY</th>
                <th style={{ padding: "8px 12px", textAlign: "right", width: "110px", fontWeight: 700 }}>UNIT RATE</th>
                <th style={{ padding: "8px 12px", textAlign: "right", width: "130px", fontWeight: 700 }}>LINE AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {challan.items?.map((item, idx) => {
                const lineTotal = (item.unit_price ?? 0) * item.quantity;
                return (
                  <tr
                    key={item.id || idx}
                    style={{
                      borderBottom: "1px solid #e2e8f0",
                      backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
                    }}
                  >
                    <td style={{ padding: "8px 12px", textAlign: "center", color: "#64748b" }}>{idx + 1}</td>
                    <td style={{ padding: "8px 12px", fontFamily: "monospace", fontWeight: 700, color: "#2563eb" }}>{item.sku}</td>
                    <td style={{ padding: "8px 12px", color: "#0f172a", fontWeight: 600 }}>{item.product_name}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                      {item.quantity} units
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "right", color: "#334155" }}>
                      {formatCurrency(item.unit_price ?? 0)}
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                      {formatCurrency(lineTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 4. TOTALS SECTION & DECLARATION */}
        <div className="print-keep-together" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "2rem", marginBottom: "2rem" }}>
          {/* Left: Declaration & Terms Notes */}
          <div style={{ flex: 1, fontSize: "11px", color: "#475569", padding: "10px 14px", backgroundColor: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontWeight: 800, color: "#0f172a", textTransform: "uppercase", marginBottom: "4px" }}>
              Declaration & Dispatch Terms
            </div>
            <p style={{ margin: "0 0 4px 0", lineHeight: "1.4" }}>
              1. Goods received in good condition. All items subject to standard company warranty policies.
            </p>
            <p style={{ margin: 0, lineHeight: "1.4" }}>
              2. This is a computer-generated delivery challan representing verified stock transfer for transport.
            </p>
          </div>

          {/* Right: Summary Valuation Block */}
          <div style={{ width: "300px", flexShrink: 0 }}>
            <div style={{ padding: "12px 16px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#475569", marginBottom: "6px" }}>
                <span>Total Line Items:</span>
                <strong>{challan.items?.length || 0} SKUs</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#475569", marginBottom: "6px" }}>
                <span>Total Quantity Dispatched:</span>
                <strong>{totalQuantityCount} units</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#334155", paddingTop: "6px", borderTop: "1px solid #e2e8f0", marginBottom: "8px" }}>
                <span>Subtotal Valuation:</span>
                <strong>{formatCurrency(subtotalAmount)}</strong>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "14px",
                  fontWeight: 800,
                  color: "#0f172a",
                  paddingTop: "8px",
                  borderTop: "2px solid #0f172a",
                }}
              >
                <span>Grand Total Valuation:</span>
                <span style={{ color: "#4f46e5" }}>{formatCurrency(subtotalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. ACKNOWLEDGEMENT & SIGNATURE AREA */}
        <div className="print-keep-together" style={{ marginTop: "2.5rem", paddingTop: "1.5rem", borderTop: "1px dashed #cbd5e1" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem" }}>
            {/* Customer Receiver Signature */}
            <div style={{ border: "1px solid #e2e8f0", padding: "1rem", borderRadius: "8px" }}>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.5rem" }}>
                CUSTOMER / CONSIGNEE ACKNOWLEDGEMENT
              </div>
              <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "2rem" }}>
                Received the above mentioned goods in good condition & intact quantity.
              </div>

              <div style={{ borderBottom: "1px solid #94a3b8", marginBottom: "6px" }} />
              <div style={{ fontSize: "11px", color: "#475569", display: "flex", justifyContent: "space-between" }}>
                <span>Receiver Signature & Stamp</span>
                <span>Date: ____________</span>
              </div>
              <div style={{ fontSize: "11px", color: "#475569", marginTop: "4px" }}>
                Printed Name: __________________________________
              </div>
            </div>

            {/* Infotech ERP Authorized Signatory */}
            <div style={{ border: "1px solid #e2e8f0", padding: "1rem", borderRadius: "8px" }}>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1.5rem" }}>
                FOR INFOTECH ERP OPERATIONS LTD
              </div>
              <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "2rem" }}>
                Authorized Dispatch Manager & Stock Auditor Clearance
              </div>

              <div style={{ borderBottom: "1px solid #94a3b8", marginBottom: "6px" }} />
              <div style={{ fontSize: "11px", color: "#475569", display: "flex", justifyContent: "space-between" }}>
                <span>Authorized Signatory</span>
                <span>Date: {new Date(challan.created_at).toLocaleDateString("en-IN")}</span>
              </div>
              <div style={{ fontSize: "11px", color: "#475569", marginTop: "4px" }}>
                Auditor: <strong>{challan.created_by_name || "System Operator"}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* 6. CORPORATE FOOTER */}
        <div
          style={{
            marginTop: "2rem",
            paddingTop: "1rem",
            borderTop: "1px solid #e2e8f0",
            fontSize: "10px",
            color: "#94a3b8",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>Infotech ERP • Operations & CRM Portal — Computer Generated Official Delivery Document</span>
          <span>Challan Ref: {challan.challan_number}</span>
          <span>Page 1 of 1</span>
        </div>

      </div>

      {/* Confirmation Dialog Modals (Hidden on Print) */}
      {confirmTargetAction && (
        <div className="modal-backdrop no-print" onClick={() => setConfirmTargetAction(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px", borderRadius: "16px", padding: "1.5rem", backgroundColor: "#ffffff" }}>
            <div className="flex justify-between items-center mb-md" style={{ borderBottom: "1px solid var(--color-border-light)", paddingBottom: "0.75rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "bold", color: confirmTargetAction === "CONFIRM" ? "var(--color-success)" : "var(--color-danger)" }}>
                {confirmTargetAction === "CONFIRM" ? "Confirm Delivery Dispatch" : "Cancel Delivery Challan"}
              </h3>
              <button
                className="btn btn-ghost"
                style={{ padding: "4px" }}
                onClick={() => setConfirmTargetAction(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-slate-700)", marginBottom: "1.5rem" }}>
              {confirmTargetAction === "CONFIRM" ? (
                <>
                  <p style={{ margin: "0 0 0.5rem 0" }}>
                    Are you sure you want to transition Challan <strong>{challan.challan_number}</strong> to <strong>CONFIRMED</strong>?
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--color-warning)", marginTop: "0.5rem", fontWeight: "var(--font-weight-semibold)", backgroundColor: "rgba(245, 158, 11, 0.1)", padding: "8px", borderRadius: "6px" }}>
                    ⚠️ CRITICAL: Enforcing this confirmation will immediately deduct the required items from warehouse inventories. This action cannot be reversed.
                  </p>
                </>
              ) : (
                <>
                  <p style={{ margin: "0 0 0.5rem 0" }}>
                    Are you sure you want to transition Challan <strong>{challan.challan_number}</strong> to <strong>CANCELLED</strong>?
                  </p>
                  {challan.status === "CONFIRMED" ? (
                    <p style={{ fontSize: "12px", color: "var(--color-success)", marginTop: "0.5rem", fontWeight: "var(--font-weight-semibold)", backgroundColor: "rgba(34, 197, 94, 0.1)", padding: "8px", borderRadius: "6px" }}>
                      ✓ NOTE: Since the challan is currently confirmed, cancelling it will automatically restore the previously deducted items back into inventory balance.
                    </p>
                  ) : (
                    <p style={{ fontSize: "12px", color: "var(--color-slate-500)", marginTop: "0.5rem" }}>
                      * The draft document will be locked. No inventory movements will be recorded.
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end gap-sm">
              <button className="btn btn-secondary" onClick={() => setConfirmTargetAction(null)} disabled={updating}>
                No, Back
              </button>
              <button
                className={confirmTargetAction === "CONFIRM" ? "btn btn-primary" : "btn btn-danger"}
                onClick={handleActionExecute}
                disabled={updating}
              >
                {updating ? "Executing..." : confirmTargetAction === "CONFIRM" ? "Confirm and Deduct Stock" : "Cancel Challan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
