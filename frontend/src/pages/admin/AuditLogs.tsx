import React, { useEffect, useState } from "react";
import { auditService } from "../../services/auditService";
import type { AuditLog } from "../../services/auditService";
import { Search, Download, History, ShieldAlert, Eye } from "lucide-react";
import { exportToCsv } from "../../utils/csvExporter";

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Metadata modal state
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await auditService.getAuditLogs({
        page,
        limit: 15,
        search: search.trim() || undefined,
        action: actionFilter || undefined,
      });
      setLogs(res.data);
      if (res.meta) {
        setTotal(res.meta.total);
        setTotalPages(res.meta.totalPages);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load activity audit trail.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleExportCsv = () => {
    exportToCsv("audit_trail_report", logs);
  };

  const getActionBadgeClass = (action: string) => {
    if (action.includes("CREATED") || action.includes("CONFIRMED") || action === "LOGIN") {
      return "badge-success";
    }
    if (action.includes("UPDATED") || action.includes("CHANGED") || action.includes("IN")) {
      return "badge-primary";
    }
    if (action.includes("DELETED") || action.includes("CANCELLED") || action.includes("OUT")) {
      return "badge-danger";
    }
    return "badge-warning";
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-md" style={{ flexWrap: "wrap", gap: "var(--spacing-md)" }}>
        <div>
          <h1 style={{ fontSize: "var(--font-size-xl)", fontWeight: "var(--font-weight-bold)" }}>
            Append-Only System Audit Logs
          </h1>
          <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
            Immutable activity timeline of operational actions and system user events.
          </p>
        </div>

        <button className="btn btn-outline" onClick={handleExportCsv} disabled={logs.length === 0}>
          <Download size={16} /> Export Audit CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card mb-md">
        <form onSubmit={handleSearchSubmit} className="flex gap-md justify-between" style={{ flexWrap: "wrap" }}>
          <div className="flex gap-sm" style={{ flex: "1 1 300px" }}>
            <div style={{ position: "relative", width: "100%" }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-text-muted)",
                }}
              />
              <input
                type="text"
                className="form-input"
                placeholder="Search descriptions or emails..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: "36px" }}
              />
            </div>
            <button type="submit" className="btn btn-secondary">
              Search
            </button>
          </div>

          <div style={{ width: "200px" }}>
            <select
              className="form-select"
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Action Types</option>
              <option value="LOGIN">LOGIN</option>
              <option value="CUSTOMER_CREATED">CUSTOMER_CREATED</option>
              <option value="CUSTOMER_UPDATED">CUSTOMER_UPDATED</option>
              <option value="CUSTOMER_DELETED">CUSTOMER_DELETED</option>
              <option value="PRODUCT_CREATED">PRODUCT_CREATED</option>
              <option value="PRODUCT_UPDATED">PRODUCT_UPDATED</option>
              <option value="STOCK_IN">STOCK_IN</option>
              <option value="STOCK_OUT">STOCK_OUT</option>
              <option value="CHALLAN_CREATED">CHALLAN_CREATED</option>
              <option value="CHALLAN_CONFIRMED">CHALLAN_CONFIRMED</option>
              <option value="CHALLAN_CANCELLED">CHALLAN_CANCELLED</option>
              <option value="USER_CREATED">USER_CREATED</option>
              <option value="ROLE_CHANGED">ROLE_CHANGED</option>
            </select>
          </div>
        </form>
      </div>

      {/* Error alert */}
      {error && (
        <div className="alert alert-danger mb-md">
          <ShieldAlert size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Table Content */}
      {loading ? (
        <div className="card">
          <div className="skeleton skeleton-title" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton skeleton-row" style={{ height: "45px" }} />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="card text-center" style={{ padding: "var(--spacing-xl)" }}>
          <History size={40} className="text-muted" style={{ margin: "0 auto var(--spacing-md)" }} />
          <h3>No audit log entries recorded</h3>
          <p className="text-muted" style={{ fontSize: "var(--font-size-sm)" }}>
            Try adjusting your search criteria or action filters.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor Email</th>
                <th>Action</th>
                <th>Target Entity</th>
                <th>Description</th>
                <th style={{ textAlign: "right" }}>Metadata</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: "var(--font-size-xs)", whiteSpace: "nowrap" }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td style={{ fontWeight: "var(--font-weight-medium)" }}>{log.user_email}</td>
                  <td>
                    <span className={`badge ${getActionBadgeClass(log.action)}`}>{log.action}</span>
                  </td>
                  <td>
                    {log.entity_type ? (
                      <span className="badge" style={{ fontSize: "11px" }}>
                        {log.entity_type}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td style={{ fontSize: "var(--font-size-sm)", maxWidth: "350px" }}>{log.description}</td>
                  <td style={{ textAlign: "right" }}>
                    {log.metadata ? (
                      <button
                        className="btn btn-outline"
                        style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye size={12} /> Inspect Payload
                      </button>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
              Showing {logs.length} of <strong>{total}</strong> audit entries
            </div>
            <div className="flex gap-sm">
              <button
                className="btn btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
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
                onClick={() => setPage((p) => p + 1)}
                style={{ padding: "4px 10px" }}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metadata Inspector Modal */}
      {selectedLog && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h3>Audit Event Payload Inspector</h3>
              <button
                className="btn btn-outline"
                style={{ padding: "4px", borderColor: "transparent" }}
                onClick={() => setSelectedLog(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)", marginBottom: "var(--spacing-sm)" }}>
                Action: <strong>{selectedLog.action}</strong> • User: {selectedLog.user_email}
              </div>
              <pre
                style={{
                  backgroundColor: "var(--color-bg-base)",
                  padding: "var(--spacing-md)",
                  borderRadius: "var(--border-radius-md)",
                  fontSize: "12px",
                  overflowX: "auto",
                  border: "1px solid var(--color-border-light)",
                }}
              >
                {JSON.stringify(selectedLog.metadata, null, 2)}
              </pre>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedLog(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
