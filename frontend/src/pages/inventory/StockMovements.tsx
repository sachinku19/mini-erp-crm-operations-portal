import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { productService } from "../../services/productService";
import type { StockMovement, Product } from "../../services/productService";
import { useAuth } from "../../context/AuthContext";
import {
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  ShieldAlert,
  History,
  Download,
} from "lucide-react";
import { exportToCsv } from "../../utils/csvExporter";

export const StockMovements: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role || "Warehouse";

  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const typeFilter = searchParams.get("type") || "";

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Manual Adjustment Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [productList, setProductList] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);

  // Form Fields
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [qtyChanged, setQtyChanged] = useState<string>("");
  const [moveType, setMoveType] = useState<"IN" | "OUT">("IN");
  const [reasonText, setReasonText] = useState<string>("");
  const [submittingAdjustment, setSubmittingAdjustment] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isWarehouseOrAdmin = ["Admin", "Warehouse"].includes(role);

  useEffect(() => {
    const fetchMovements = async () => {
      setLoading(true);
      setError(null);
      try {
        const query: any = {
          page,
          limit: 15,
        };
        if (typeFilter) query.movement_type = typeFilter;

        const res = await productService.getStockMovements(query);
        setMovements(res.data);
        setTotal(res.meta?.total ?? 0);
        setTotalPages(res.meta?.totalPages ?? 1);
      } catch (err: any) {
        setError(err.message || "Failed to load stock movements logs.");
      } finally {
        setLoading(false);
      }
    };
    fetchMovements();
  }, [page, typeFilter]);

  const updateFilters = (newFilters: { page?: number; type?: string }) => {
    const nextParams = new URLSearchParams(searchParams);

    if (newFilters.page !== undefined) {
      nextParams.set("page", String(newFilters.page));
    } else {
      nextParams.set("page", "1");
    }

    if (newFilters.type !== undefined) {
      if (newFilters.type) nextParams.set("type", newFilters.type);
      else nextParams.delete("type");
    }

    setSearchParams(nextParams);
  };

  const handleOpenModal = async () => {
    setIsModalOpen(true);
    setLoadingProducts(true);
    setFormError(null);
    try {
      const res = await productService.getProducts({ limit: 100 });
      setProductList(res.data);
      if (res.data.length > 0) {
        setSelectedProductId(res.data[0].id);
      }
    } catch (err: any) {
      setFormError("Failed to fetch product list for selection.");
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProductId("");
    setQtyChanged("");
    setMoveType("IN");
    setReasonText("");
    setFormError(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const qty = parseInt(qtyChanged, 10);
    if (!selectedProductId) {
      setFormError("Please select a product.");
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      setFormError("Quantity must be a valid positive integer.");
      return;
    }
    if (!reasonText.trim()) {
      setFormError("Please specify a reason for this audit adjustment.");
      return;
    }

    setSubmittingAdjustment(true);
    try {
      await productService.adjustStock({
        product_id: selectedProductId,
        quantity_changed: qty,
        movement_type: moveType,
        reason: reasonText.trim(),
      });

      // Refresh movements list and reset page to 1
      updateFilters({ page: 1 });
      handleCloseModal();
    } catch (err: any) {
      setFormError(err.message || "Failed to submit stock adjustment. Product stock might go negative.");
    } finally {
      setSubmittingAdjustment(false);
    }
  };

  return (
    <div>
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-md">
        <div>
          <h1 style={{ fontSize: "var(--font-size-xl)", fontWeight: "var(--font-weight-bold)" }}>
            Stock Movements
          </h1>
          <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
            Review historical warehouse stock adjustments, dispatches, and logs.
          </p>
        </div>
        <div className="flex gap-sm">
          <button className="btn btn-outline" onClick={() => exportToCsv("stock_movements_report", movements)} disabled={movements.length === 0}>
            <Download size={16} /> Export CSV
          </button>
          {isWarehouseOrAdmin && (
            <button className="btn btn-primary" onClick={handleOpenModal}>
              <Plus size={16} /> Record Stock Adjustment
            </button>
          )}
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="card" style={{ padding: "var(--spacing-md)", marginBottom: "var(--spacing-lg)" }}>
        <div className="flex" style={{ gap: "var(--spacing-md)", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: "0 0 160px" }}>
            <select
              className="form-select"
              value={typeFilter}
              onChange={(e) => updateFilters({ type: e.target.value })}
            >
              <option value="">All Movement Types</option>
              <option value="IN">IN (Incoming)</option>
              <option value="OUT">OUT (Outgoing)</option>
            </select>
          </div>
          <span style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
            * IN indicates stock increases. OUT indicates stock deductions.
          </span>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <ShieldAlert size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Datatable */}
      {loading ? (
        <div className="table-container">
          <div className="skeleton skeleton-row" style={{ height: "40px" }} />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton skeleton-row" />
          ))}
        </div>
      ) : movements.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "var(--spacing-xxl) var(--spacing-lg)" }}>
          <History size={40} style={{ color: "var(--color-text-disabled)", marginBottom: "var(--spacing-sm)" }} />
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-base)" }}>
            No stock movements found in this ledger.
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Reason</th>
                <th>Recorded By</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id}>
                  <td style={{ fontSize: "var(--font-size-xs)", whiteSpace: "nowrap" }}>
                    {new Date(m.created_at).toLocaleString()}
                  </td>
                  <td style={{ fontFamily: "monospace", fontSize: "0.75rem", fontWeight: "var(--font-weight-semibold)" }}>
                    {m.product_sku || "N/A"}
                  </td>
                  <td>{m.product_name || "N/A"}</td>
                  <td>
                    <span className={`badge ${m.movement_type === "IN" ? "badge-success" : "badge-danger"}`} style={{ padding: "3px 8px" }}>
                      <span className="flex items-center gap-xs">
                        {m.movement_type === "IN" ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                        {m.movement_type}
                      </span>
                    </span>
                  </td>
                  <td style={{ fontWeight: "var(--font-weight-bold)" }}>
                    {m.movement_type === "IN" ? "+" : "-"}{m.quantity_changed}
                  </td>
                  <td style={{ fontSize: "0.8125rem" }}>{m.reason}</td>
                  <td style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                    {m.user_name || "System"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination bar */}
          <div className="pagination">
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
              Showing {movements.length} of <strong>{total}</strong> entries
            </div>
            <div className="flex gap-sm">
              <button
                className="btn btn-secondary"
                disabled={page <= 1}
                onClick={() => updateFilters({ page: page - 1 })}
                style={{ padding: "4px 10px" }}
              >
                Previous
              </button>
              <span style={{ alignSelf: "center", fontSize: "var(--font-size-sm)", padding: "0 8px" }}>
                Page <strong>{page}</strong> of {totalPages}
              </span>
              <button
                className="btn btn-secondary"
                disabled={page >= totalPages}
                onClick={() => updateFilters({ page: page + 1 })}
                style={{ padding: "4px 10px" }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Stock Adjustment Modal Backdrop */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <form className="modal-content" onSubmit={handleFormSubmit} style={{ maxWidth: "550px" }}>
            <div className="modal-header">
              <h3 style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)" }}>
                <ArrowLeftRight size={20} /> Record Stock Adjustment
              </h3>
              <button type="button" className="btn btn-outline" style={{ padding: "4px", borderColor: "transparent" }} onClick={handleCloseModal}>
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
              {formError && (
                <div className="alert alert-danger" style={{ padding: "0.75rem 1rem", marginBottom: 0 }}>
                  <ShieldAlert size={18} style={{ flexShrink: 0 }} />
                  <span>{formError}</span>
                </div>
              )}

              {/* Product selector */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Target Inventory Product</label>
                {loadingProducts ? (
                  <div className="skeleton" style={{ height: "38px" }}></div>
                ) : (
                  <select
                    className="form-select"
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    required
                  >
                    {productList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku}) — Stock: {p.current_stock}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Grid: Quantity and Type */}
              <div className="grid grid-cols-2 gap-md">
                {/* Quantity */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Quantity Changed</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 10"
                    value={qtyChanged}
                    onChange={(e) => setQtyChanged(e.target.value)}
                    min="1"
                    required
                  />
                </div>

                {/* Type */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Adjustment Type</label>
                  <select
                    className="form-select"
                    value={moveType}
                    onChange={(e) => setMoveType(e.target.value as "IN" | "OUT")}
                  >
                    <option value="IN">IN (Receive Stock)</option>
                    <option value="OUT">OUT (Issue Stock)</option>
                  </select>
                </div>
              </div>

              {/* Reason */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Reason / Audit Comment</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Received fresh batch, Damaged goods write-off"
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleCloseModal} disabled={submittingAdjustment}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submittingAdjustment || loadingProducts}>
                {submittingAdjustment ? "Recording..." : "Record Adjustment"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
