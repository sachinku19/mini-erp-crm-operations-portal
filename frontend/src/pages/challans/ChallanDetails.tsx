import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { challanService } from "../../services/challanService";
import type { Challan } from "../../services/challanService";
import { useAuth } from "../../context/AuthContext";
import {
  ArrowLeft,
  Check,
  Ban,
  Printer,
  ShieldAlert,
  AlertCircle,
} from "lucide-react";

export const ChallanDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const role = user?.role || "Sales";

  const [challan, setChallan] = useState<Challan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Transaction confirmations
  const [confirmTargetAction, setConfirmTargetAction] = useState<"CONFIRM" | "CANCEL" | null>(null);
  const [updating, setUpdating] = useState<boolean>(false);

  const canModify = ["Admin", "Sales", "Warehouse"].includes(role);

  useEffect(() => {
    if (!id) return;
    const loadChallan = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await challanService.getChallanById(id);
        setChallan(data);
      } catch (err: any) {
        setError(err.message || "Failed to load challan invoice details.");
      } finally {
        setLoading(false);
      }
    };
    loadChallan();
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

  const getStatusBadge = (chStatus: string) => {
    switch (chStatus) {
      case "CONFIRMED":
        return "badge-success";
      case "DRAFT":
        return "badge-info";
      case "CANCELLED":
        return "badge-danger";
      default:
        return "badge-info";
    }
  };

  if (loading) {
    return (
      <div>
        <div className="skeleton skeleton-title" style={{ width: "250px" }} />
        <div className="card">
          <div className="skeleton skeleton-row" style={{ height: "150px" }} />
          <div className="skeleton skeleton-row" style={{ height: "200px" }} />
        </div>
      </div>
    );
  }

  if (error && !challan) {
    return (
      <div style={{ maxWidth: "600px", margin: "var(--spacing-xxl) auto", textAlign: "center" }}>
        <div className="alert alert-danger" style={{ display: "inline-flex", gap: "var(--spacing-md)", padding: "1.5rem" }}>
          <AlertCircle size={24} style={{ flexShrink: 0 }} />
          <div style={{ textAlign: "left" }}>
            <h3 style={{ marginBottom: "var(--spacing-xs)" }}>Error Loading Challan Invoice</h3>
            <p>{error}</p>
          </div>
        </div>
        <div style={{ marginTop: "var(--spacing-lg)" }}>
          <Link to="/challans" className="btn btn-primary">
            <ArrowLeft size={16} style={{ marginRight: "var(--spacing-sm)" }} /> Back to Challans
          </Link>
        </div>
      </div>
    );
  }

  if (!challan) return null;

  // Calculate totals
  const subtotalAmount = challan.items?.reduce((sum, item) => sum + (item.unit_price ?? 0) * item.quantity, 0) || 0;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      {/* Print Overrides Style Block */}
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .sidebar, .topbar, .no-print, .btn, .breadcrumb-back {
            display: none !important;
          }
          .main-wrapper {
            margin-left: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }
          .page-container {
            padding: 0 !important;
            background-color: #ffffff !important;
            overflow: visible !important;
          }
          .card {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin-bottom: var(--spacing-xl) !important;
          }
          .invoice-box {
            border: 1px solid #000000 !important;
            padding: var(--spacing-lg) !important;
          }
        }
      `}</style>

      {/* Navigation and Toolbar */}
      <div className="flex justify-between items-center mb-md no-print breadcrumb-back">
        <Link to="/challans" className="flex items-center gap-xs text-muted" style={{ fontSize: "var(--font-size-sm)" }}>
          <ArrowLeft size={16} /> Back to Challans List
        </Link>

        <div className="flex gap-sm">
          {/* Print button */}
          <button className="btn btn-outline" onClick={handlePrint}>
            <Printer size={16} /> Print / Export PDF
          </button>

          {/* Action triggers depending on status */}
          {canModify && challan.status === "DRAFT" && (
            <button className="btn btn-primary" onClick={() => setConfirmTargetAction("CONFIRM")}>
              <Check size={16} /> Confirm Dispatch
            </button>
          )}

          {canModify && (challan.status === "DRAFT" || challan.status === "CONFIRMED") && (
            <button className="btn btn-danger" onClick={() => setConfirmTargetAction("CANCEL")}>
              <Ban size={16} /> Cancel Challan
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger no-print">
          <ShieldAlert size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* The Printable Invoice Box */}
      <div className="invoice-box" style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-xl)" }}>
        
        {/* Invoice Header */}
        <div className="card" style={{ padding: "var(--spacing-xl)", margin: 0 }}>
          <div className="flex justify-between" style={{ borderBottom: "1px solid var(--color-border-light)", paddingBottom: "var(--spacing-md)", marginBottom: "var(--spacing-md)" }}>
            <div>
              <span className={`badge ${getStatusBadge(challan.status)}`} style={{ marginBottom: "var(--spacing-sm)" }}>
                {challan.status} DELIVERY
              </span>
              <h1 style={{ fontSize: "var(--font-size-xl)", fontWeight: "var(--font-weight-bold)" }}>
                Delivery Challan
              </h1>
              <span style={{ fontFamily: "monospace", fontSize: "1rem", color: "var(--color-primary)", fontWeight: "var(--font-weight-semibold)" }}>
                {challan.challan_number}
              </span>
            </div>
            
            <div style={{ textAlign: "right", fontSize: "var(--font-size-sm)" }}>
              <strong style={{ display: "block", fontSize: "var(--font-size-base)" }}>Infotech Distributors Ltd</strong>
              <span className="text-muted">GSTIN: 27INFOTECH8888Z1</span>
              <span style={{ display: "block", marginTop: "var(--spacing-xs)" }}>
                Date: <strong>{new Date(challan.created_at).toLocaleDateString()}</strong>
              </span>
            </div>
          </div>

          {/* Customer & Creator Meta Info */}
          <div className="grid grid-cols-2 gap-lg" style={{ marginTop: "var(--spacing-md)" }}>
            {/* Consignee Billing details */}
            <div>
              <span className="text-muted" style={{ display: "block", fontSize: "var(--font-size-xs)", textTransform: "uppercase", fontWeight: "var(--font-weight-bold)", marginBottom: "4px" }}>
                Consignee (Bill To)
              </span>
              <strong style={{ fontSize: "var(--font-size-base)", color: "var(--color-text-primary)" }}>
                {challan.customer_name || "N/A"}
              </strong>
              <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginTop: "4px", lineHeight: "1.4" }}>
                <div>Business: {challan.customer_business_name}</div>
                <div>GSTIN: {challan.items?.[0] ? "See customer register" : "N/A"}</div>
                <div style={{ marginTop: "4px" }}>Address: {challan.items?.[0] ? "Stored in directory" : "N/A"}</div>
              </div>
            </div>

            {/* Creator / Auditor Meta */}
            <div style={{ textAlign: "right" }}>
              <span className="text-muted" style={{ display: "block", fontSize: "var(--font-size-xs)", textTransform: "uppercase", fontWeight: "var(--font-weight-bold)", marginBottom: "4px" }}>
                Dispatched By
              </span>
              <strong>{challan.created_by_name || "System operator"}</strong>
              <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginTop: "4px" }}>
                <div>Role: {challan.status === "CONFIRMED" ? "Authorized Auditor" : "Sales Representative"}</div>
                <div>Authorized Signatory Required at Delivery</div>
              </div>
            </div>
          </div>
        </div>

        {/* Ordered Items Table */}
        <div className="card" style={{ padding: "var(--spacing-lg)", margin: 0 }}>
          <h3 style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", textTransform: "uppercase", marginBottom: "var(--spacing-md)" }}>
            Ordered Product dispatches list
          </h3>

          <div className="table-container" style={{ boxShadow: "none", border: "none" }}>
            <table className="data-table">
              <thead style={{ borderBottom: "2px solid var(--color-border)" }}>
                <tr>
                  <th>#</th>
                  <th>SKU</th>
                  <th>Product Description</th>
                  <th style={{ textAlign: "right" }}>Unit Rate</th>
                  <th style={{ textAlign: "right" }}>Quantity</th>
                  <th style={{ textAlign: "right" }}>Line Total</th>
                </tr>
              </thead>
              <tbody>
                {challan.items?.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td>{idx + 1}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{item.sku}</td>
                    <td>{item.product_name}</td>
                    <td style={{ textAlign: "right" }}>₹{(item.unit_price ?? 0).toLocaleString()}</td>
                    <td style={{ textAlign: "right", fontWeight: "var(--font-weight-semibold)" }}>{item.quantity} units</td>
                    <td style={{ textAlign: "right", fontWeight: "var(--font-weight-semibold)" }}>
                      ₹{((item.unit_price ?? 0) * item.quantity).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Invoice Summary Totals */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              borderTop: "2px solid var(--color-border)",
              paddingTop: "var(--spacing-lg)",
              marginTop: "var(--spacing-md)",
              fontSize: "var(--font-size-sm)",
            }}
          >
            <div style={{ width: "280px", display: "flex", flexDirection: "column", gap: "var(--spacing-sm)" }}>
              <div className="flex justify-between">
                <span className="text-muted">Total Quantity Dispatched:</span>
                <strong>{challan.total_quantity} units</strong>
              </div>
              <div className="flex justify-between" style={{ borderTop: "1px solid var(--color-border-light)", paddingTop: "var(--spacing-sm)", fontSize: "var(--font-size-base)" }}>
                <span style={{ fontWeight: "var(--font-weight-medium)" }}>Grand Total Valuation:</span>
                <strong style={{ color: "var(--color-primary)" }}>₹{subtotalAmount.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Footer Disclaimer */}
        <div style={{ textAlign: "center", color: "var(--color-text-disabled)", fontSize: "var(--font-size-xs)", marginTop: "var(--spacing-xl)" }}>
          <p>This is a computer-generated delivery challan representing stock release for transport.</p>
          <p>Please inspect goods at delivery. All disputes subject to jurisdiction limits.</p>
        </div>
      </div>

      {/* Confirmation Dialog Modals */}
      {confirmTargetAction && (
        <div className="modal-backdrop no-print">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ color: confirmTargetAction === "CONFIRM" ? "var(--color-success)" : "var(--color-danger)" }}>
                {confirmTargetAction === "CONFIRM" ? "Confirm Dispatch Release" : "Cancel Challan Dispatch"}
              </h3>
              <button
                className="btn btn-outline"
                style={{ padding: "4px", borderColor: "transparent" }}
                onClick={() => setConfirmTargetAction(null)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              {confirmTargetAction === "CONFIRM" ? (
                <>
                  <p style={{ fontSize: "var(--font-size-sm)" }}>
                    Are you sure you want to transition Challan <strong>{challan.challan_number}</strong> to <strong>CONFIRMED</strong>?
                  </p>
                  <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-warning-hover)", marginTop: "var(--spacing-sm)", fontWeight: "var(--font-weight-medium)" }}>
                    ⚠️ CRITICAL: Enforcing this confirmation will immediately deduct the required items from warehouse inventories. This action cannot be reversed.
                  </p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: "var(--font-size-sm)" }}>
                    Are you sure you want to transition Challan <strong>{challan.challan_number}</strong> to <strong>CANCELLED</strong>?
                  </p>
                  {challan.status === "CONFIRMED" ? (
                    <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-success)", marginTop: "var(--spacing-sm)", fontWeight: "var(--font-weight-medium)" }}>
                      ✓ NOTE: Since the challan is currently confirmed, cancelling it will automatically restore the previously deducted items back into inventory balance.
                    </p>
                  ) : (
                    <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", marginTop: "var(--spacing-sm)" }}>
                      * The draft document will be locked. No inventory movements will be recorded.
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="modal-footer">
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
