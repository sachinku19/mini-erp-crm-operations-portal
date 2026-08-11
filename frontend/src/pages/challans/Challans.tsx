import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { challanService } from "../../services/challanService";
import type { Challan } from "../../services/challanService";
import { useAuth } from "../../context/AuthContext";
import { Search, Plus, Eye, ShieldAlert, FileSpreadsheet, Download } from "lucide-react";
import { exportToCsv } from "../../utils/csvExporter";

export const Challans: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role || "Sales";

  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1", 10);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  const [challans, setChallans] = useState<Challan[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search input state
  const [searchInput, setSearchInput] = useState<string>(search);

  // Only Admin, Sales, and Warehouse roles can generate new dispatches
  const canCreate = ["Admin", "Sales", "Warehouse"].includes(role);

  useEffect(() => {
    const fetchChallans = async () => {
      setLoading(true);
      setError(null);
      try {
        const query: any = {
          page,
          limit: 10,
        };
        if (search) query.search = search;
        if (status) query.status = status;

        const res = await challanService.getChallans(query);
        setChallans(res.data);
        setTotal(res.meta?.total ?? 0);
        setTotalPages(res.meta?.totalPages ?? 1);
      } catch (err: any) {
        setError(err.message || "Failed to load dispatches.");
      } finally {
        setLoading(false);
      }
    };
    fetchChallans();
  }, [page, search, status]);

  const updateFilters = (newFilters: { page?: number; search?: string; status?: string }) => {
    const nextParams = new URLSearchParams(searchParams);

    if (newFilters.page !== undefined) {
      nextParams.set("page", String(newFilters.page));
    } else {
      nextParams.set("page", "1");
    }

    if (newFilters.search !== undefined) {
      if (newFilters.search) nextParams.set("search", newFilters.search);
      else nextParams.delete("search");
    }

    if (newFilters.status !== undefined) {
      if (newFilters.status) nextParams.set("status", newFilters.status);
      else nextParams.delete("status");
    }

    setSearchParams(nextParams);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput });
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

  return (
    <div>
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-md">
        <div>
          <h1 style={{ fontSize: "var(--font-size-xl)", fontWeight: "var(--font-weight-bold)" }}>
            Sales Challans
          </h1>
          <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
            Create and track customer delivery challans, audit stock reserves, and log details.
          </p>
        </div>
        <div className="flex gap-sm">
          <button className="btn btn-outline" onClick={() => exportToCsv("challans_report", challans)} disabled={challans.length === 0}>
            <Download size={16} /> Export CSV
          </button>
          {canCreate && (
            <Link to="/challans/create" className="btn btn-primary">
              <Plus size={16} /> Create Challan
            </Link>
          )}
        </div>
      </div>

      {/* Toolbar Filters */}
      <div className="card" style={{ padding: "var(--spacing-md)", marginBottom: "var(--spacing-lg)" }}>
        <form onSubmit={handleSearchSubmit} className="flex" style={{ gap: "var(--spacing-md)", flexWrap: "wrap", alignItems: "center" }}>
          {/* Search by Challan Number or Customer */}
          <div style={{ position: "relative", flex: "1 1 250px" }}>
            <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-disabled)", display: "flex" }}>
              <Search size={16} />
            </span>
            <input
              type="text"
              className="form-input"
              placeholder="Search by challan number or customer..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ paddingLeft: "34px" }}
            />
          </div>

          {/* Status dropdown */}
          <div style={{ flex: "0 0 160px" }}>
            <select
              className="form-select"
              value={status}
              onChange={(e) => updateFilters({ status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Reset Filters */}
          {(search || status) && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setSearchInput("");
                setSearchParams({});
              }}
              style={{ marginLeft: "auto" }}
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {error && (
        <div className="alert alert-danger">
          <ShieldAlert size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Datatable */}
      {loading ? (
        <div className="table-container">
          <div className="skeleton skeleton-row" style={{ height: "40px" }} />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton skeleton-row" />
          ))}
        </div>
      ) : challans.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "var(--spacing-xxl) var(--spacing-lg)" }}>
          <FileSpreadsheet size={40} style={{ color: "var(--color-text-disabled)", marginBottom: "var(--spacing-sm)" }} />
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-base)", marginBottom: "var(--spacing-md)" }}>
            No sales dispatches found matching these filters.
          </p>
          {canCreate && (
            <Link to="/challans/create" className="btn btn-primary">
              + Generate Your First Challan
            </Link>
          )}
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Challan Number</th>
                <th>Customer Business</th>
                <th>Created Date</th>
                <th>Total Quantity</th>
                <th>Status</th>
                <th>Created By</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {challans.map((ch) => (
                <tr key={ch.id}>
                  <td style={{ fontFamily: "monospace", fontWeight: "var(--font-weight-semibold)" }}>
                    <Link to={`/challans/${ch.id}`}>{ch.challan_number}</Link>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <strong style={{ fontSize: "var(--font-size-sm)" }}>{ch.customer_name || "N/A"}</strong>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                        {ch.customer_business_name}
                      </span>
                    </div>
                  </td>
                  <td style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
                    {new Date(ch.created_at).toLocaleDateString()}
                  </td>
                  <td>{ch.total_quantity} units</td>
                  <td>
                    <span className={`badge ${getStatusBadge(ch.status)}`}>{ch.status}</span>
                  </td>
                  <td style={{ fontSize: "0.8125rem", color: "var(--color-text-secondary)" }}>
                    {ch.created_by_name || "System"}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <Link to={`/challans/${ch.id}`} className="btn btn-outline flex items-center justify-center" style={{ padding: "6px", display: "inline-flex" }} title="View details">
                      <Eye size={14} /> <span style={{ fontSize: "0.75rem", marginLeft: "4px" }}>View Invoice</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination control footer */}
          <div className="pagination">
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
              Showing {challans.length} of <strong>{total}</strong> entries
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
    </div>
  );
};
