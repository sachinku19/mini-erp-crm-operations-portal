import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { customerService } from "../../services/customerService";
import type { Customer } from "../../services/customerService";
import { Search, UserPlus, Eye, Edit2, Trash2, ShieldAlert } from "lucide-react";

export const Customers: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get search and pagination params from URL
  const page = parseInt(searchParams.get("page") || "1", 10);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const type = searchParams.get("type") || "";

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search input state (buffered before applying to URL)
  const [searchInput, setSearchInput] = useState<string>(search);

  // Deletion modal state
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      setError(null);
      try {
        const query: any = {
          page,
          limit: 10,
        };
        if (search) query.search = search;
        if (status) query.status = status;
        if (type) query.customer_type = type;

        const res = await customerService.getCustomers(query);
        setCustomers(res.data);
        setTotal(res.meta?.total ?? 0);
        setTotalPages(res.meta?.totalPages ?? 1);
      } catch (err: any) {
        setError(err.message || "Failed to load customers from server.");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [page, search, status, type]);

  // Update filters in search URL parameters
  const updateFilters = (newFilters: { page?: number; search?: string; status?: string; type?: string }) => {
    const nextParams = new URLSearchParams(searchParams);
    
    // Default to page 1 on search/filter changes
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

    if (newFilters.type !== undefined) {
      if (newFilters.type) nextParams.set("type", newFilters.type);
      else nextParams.delete("type");
    }

    setSearchParams(nextParams);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchInput });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await customerService.deleteCustomer(deleteTarget.id);
      setCustomers(customers.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err.message || "Failed to delete customer.");
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (custStatus: string) => {
    switch (custStatus) {
      case "ACTIVE":
        return "badge-success";
      case "LEAD":
        return "badge-info";
      case "INACTIVE":
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
            Customers CRM
          </h1>
          <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
            Manage wholesale/distributor clients, view contact details, and logs.
          </p>
        </div>
        <Link to="/customers/create" className="btn btn-primary">
          <UserPlus size={16} /> Add Customer
        </Link>
      </div>

      {/* Toolbar Filter panel */}
      <div className="card" style={{ padding: "var(--spacing-md)", marginBottom: "var(--spacing-lg)" }}>
        <form onSubmit={handleSearchSubmit} className="flex" style={{ gap: "var(--spacing-md)", flexWrap: "wrap" }}>
          {/* Search box */}
          <div style={{ position: "relative", flex: "1 1 250px" }}>
            <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-disabled)", display: "flex" }}>
              <Search size={16} />
            </span>
            <input
              type="text"
              className="form-input"
              placeholder="Search by name, email, or business..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ paddingLeft: "34px" }}
            />
          </div>

          {/* Type dropdown */}
          <div style={{ flex: "0 0 160px" }}>
            <select
              className="form-select"
              value={type}
              onChange={(e) => updateFilters({ type: e.target.value })}
            >
              <option value="">All Types</option>
              <option value="WHOLESALE">Wholesale</option>
              <option value="DISTRIBUTOR">Distributor</option>
              <option value="RETAIL">Retail</option>
            </select>
          </div>

          {/* Status dropdown */}
          <div style={{ flex: "0 0 160px" }}>
            <select
              className="form-select"
              value={status}
              onChange={(e) => updateFilters({ status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="LEAD">Lead</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {/* Reset Filters */}
          {(search || status || type) && (
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                setSearchInput("");
                setSearchParams({});
              }}
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Error alert */}
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
      ) : customers.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "var(--spacing-xxl) var(--spacing-lg)" }}>
          <p style={{ color: "var(--color-text-muted)", fontSize: "var(--font-size-base)", marginBottom: "var(--spacing-md)" }}>
            No customer profiles found matching these parameters.
          </p>
          <Link to="/customers/create" className="btn btn-primary">
            + Create Your First Customer
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Business Name</th>
                <th>Contact</th>
                <th>Type</th>
                <th>Status</th>
                <th>Next Follow-up</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/customers/${c.id}`} style={{ fontWeight: "var(--font-weight-medium)" }}>
                      {c.name}
                    </Link>
                  </td>
                  <td>{c.business_name}</td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", fontSize: "0.8125rem" }}>
                      <span style={{ color: "var(--color-text-primary)" }}>{c.mobile}</span>
                      <span style={{ color: "var(--color-text-secondary)", fontSize: "0.75rem" }}>{c.email}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-info" style={{ textTransform: "lowercase", fontSize: "0.7rem" }}>
                      {c.customer_type}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadge(c.status)}`}>{c.status}</span>
                  </td>
                  <td style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
                    {c.follow_up_date ? new Date(c.follow_up_date).toLocaleDateString() : "—"}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "var(--spacing-xs)" }}>
                      <Link to={`/customers/${c.id}`} className="btn btn-outline" style={{ padding: "6px" }} title="View details">
                        <Eye size={14} />
                      </Link>
                      <Link to={`/customers/${c.id}/edit`} className="btn btn-outline" style={{ padding: "6px" }} title="Edit profile">
                        <Edit2 size={14} />
                      </Link>
                      <button
                        className="btn btn-outline"
                        style={{ padding: "6px", color: "var(--color-danger)" }}
                        onClick={() => setDeleteTarget(c)}
                        title="Delete profile"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Simple Pagination bar */}
          <div className="pagination">
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>
              Showing {customers.length} of <strong>{total}</strong> entries
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

      {/* Delete Confirmation Modal Backdrop */}
      {deleteTarget && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ color: "var(--color-danger)" }}>Confirm Delete</h3>
              <button
                className="btn btn-outline"
                style={{ padding: "4px", borderColor: "transparent" }}
                onClick={() => setDeleteTarget(null)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-primary)" }}>
                Are you sure you want to delete the customer <strong>{deleteTarget.name}</strong> ({deleteTarget.business_name})?
              </p>
              <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-danger)", marginTop: "var(--spacing-sm)", fontWeight: "var(--font-weight-medium)" }}>
                ⚠️ WARNING: This action is permanent and cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDeleteConfirm} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete Customer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
