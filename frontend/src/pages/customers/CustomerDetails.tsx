import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { customerService } from "../../services/customerService";
import type { Customer } from "../../services/customerService";
import { challanService } from "../../services/challanService";
import type { Challan } from "../../services/challanService";
import {
  ArrowLeft,
  Edit2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";

export const CustomerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const loadDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const [custData, challansRes] = await Promise.all([
          customerService.getCustomerById(id),
          challanService.getChallans({ customer_id: id, limit: 10 }),
        ]);
        setCustomer(custData);
        setChallans(challansRes.data);
      } catch (err: any) {
        setError(err.message || "Failed to load customer profile or order history.");
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [id]);

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

  if (loading) {
    return (
      <div>
        <div className="skeleton skeleton-title" style={{ width: "300px" }} />
        <div className="grid grid-cols-3 gap-md" style={{ marginBottom: "var(--spacing-xl)" }}>
          <div className="skeleton" style={{ height: "200px" }} />
          <div className="skeleton" style={{ height: "200px" }} />
          <div className="skeleton" style={{ height: "200px" }} />
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div style={{ maxWidth: "600px", margin: "var(--spacing-xxl) auto", textAlign: "center" }}>
        <div className="alert alert-danger" style={{ display: "inline-flex", gap: "var(--spacing-md)", padding: "1.5rem" }}>
          <AlertCircle size={24} style={{ flexShrink: 0 }} />
          <div style={{ textAlign: "left" }}>
            <h3 style={{ marginBottom: "var(--spacing-xs)" }}>Error Loading CRM Record</h3>
            <p>{error || "The requested customer profile does not exist."}</p>
          </div>
        </div>
        <div style={{ marginTop: "var(--spacing-lg)" }}>
          <Link to="/customers" className="btn btn-primary">
            <ArrowLeft size={16} style={{ marginRight: "var(--spacing-sm)" }} /> Back to CRM List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
      {/* Navigation & Actions Header */}
      <div className="flex justify-between items-center mb-md">
        <Link to="/customers" className="flex items-center gap-xs text-muted" style={{ fontSize: "var(--font-size-sm)" }}>
          <ArrowLeft size={16} /> Back to CRM List
        </Link>
        <Link to={`/customers/${customer.id}/edit`} className="btn btn-primary">
          <Edit2 size={16} /> Edit Profile
        </Link>
      </div>

      {/* Main Grid: Info Cards (Left) and Dispatch History (Right) */}
      <div className="grid grid-cols-3 gap-md" style={{ gridTemplateColumns: "1fr 2fr", alignItems: "start" }}>
        <style>{`
          @media (max-width: 768px) {
            .grid-cols-3 { grid-template-columns: 1fr !important; }
          }
        `}</style>
        
        {/* Left Side: Summary Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
          {/* Card 1: Core Profile */}
          <div className="card">
            <div style={{ borderBottom: "1px solid var(--color-border-light)", paddingBottom: "var(--spacing-sm)", marginBottom: "var(--spacing-md)" }}>
              <span className={`badge ${getStatusBadge(customer.status)}`} style={{ float: "right" }}>
                {customer.status}
              </span>
              <h2 style={{ fontSize: "var(--font-size-lg)" }}>{customer.name}</h2>
              <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: "var(--font-weight-semibold)" }}>
                {customer.customer_type} CLIENT
              </span>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-sm)", fontSize: "var(--font-size-sm)" }}>
              <div className="flex items-center gap-sm">
                <Briefcase size={16} style={{ color: "var(--color-text-secondary)" }} />
                <span>{customer.business_name}</span>
              </div>
              <div className="flex items-center gap-sm">
                <Phone size={16} style={{ color: "var(--color-text-secondary)" }} />
                <a href={`tel:${customer.mobile}`}>{customer.mobile}</a>
              </div>
              <div className="flex items-center gap-sm">
                <Mail size={16} style={{ color: "var(--color-text-secondary)" }} />
                <a href={`mailto:${customer.email}`}>{customer.email}</a>
              </div>
            </div>
          </div>

          {/* Card 2: Billing & GST */}
          <div className="card">
            <h3 style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--spacing-md)" }}>
              BUSINESS BILLING DETAILS
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)", fontSize: "var(--font-size-sm)" }}>
              <div>
                <span className="text-muted" style={{ display: "block", fontSize: "var(--font-size-xs)" }}>GSTIN</span>
                <strong style={{ textTransform: "uppercase" }}>{customer.gst_number || "NOT SPECIFIED"}</strong>
              </div>
              <div className="flex gap-sm">
                <MapPin size={16} style={{ color: "var(--color-text-secondary)", flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <span className="text-muted" style={{ display: "block", fontSize: "var(--font-size-xs)" }}>Address</span>
                  <span style={{ color: "var(--color-text-primary)" }}>{customer.address}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: CRM Follow-up & Notes */}
          <div className="card">
            <h3 style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--spacing-md)" }}>
              CRM TARGETS & NOTES
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)", fontSize: "var(--font-size-sm)" }}>
              <div className="flex items-center gap-sm">
                <Calendar size={16} style={{ color: "var(--color-text-secondary)" }} />
                <div>
                  <span className="text-muted" style={{ display: "block", fontSize: "var(--font-size-xs)" }}>Next Follow-up</span>
                  <strong style={{ color: customer.follow_up_date ? "var(--color-primary)" : "inherit" }}>
                    {customer.follow_up_date ? new Date(customer.follow_up_date).toLocaleDateString() : "No tasks scheduled"}
                  </strong>
                </div>
              </div>
              <div>
                <span className="text-muted" style={{ display: "block", fontSize: "var(--font-size-xs)", marginBottom: "var(--spacing-xs)" }}>
                  Internal Notes
                </span>
                <div
                  style={{
                    backgroundColor: "var(--color-bg-base)",
                    padding: "var(--spacing-sm)",
                    borderRadius: "var(--border-radius-sm)",
                    fontSize: "var(--font-size-xs)",
                    color: "var(--color-text-secondary)",
                    whiteSpace: "pre-wrap",
                    borderLeft: "3px solid var(--color-border)",
                  }}
                >
                  {customer.notes || "No notes registered."}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Dispatch/Challan History */}
        <div className="card" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontSize: "var(--font-size-base)", borderBottom: "1px solid var(--color-border-light)", paddingBottom: "var(--spacing-sm)", marginBottom: "var(--spacing-md)" }}>
            Challan History Ledger
          </h3>
          
          {challans.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "350px",
                color: "var(--color-text-muted)",
                gap: "var(--spacing-sm)",
              }}
            >
              <FileSpreadsheet size={40} style={{ color: "var(--color-text-disabled)" }} />
              <p>No dispatch dispatches recorded for this customer.</p>
              <Link to={`/challans/create?customer_id=${customer.id}`} className="btn btn-secondary" style={{ fontSize: "0.75rem" }}>
                Generate First Challan
              </Link>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Challan Number</th>
                    <th>Date Created</th>
                    <th>Total Qty</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {challans.map((ch) => (
                    <tr key={ch.id}>
                      <td>
                        <Link to={`/challans/${ch.id}`} style={{ fontWeight: "var(--font-weight-medium)" }}>
                          {ch.challan_number}
                        </Link>
                      </td>
                      <td style={{ fontSize: "var(--font-size-xs)" }}>
                        {new Date(ch.created_at).toLocaleDateString()}
                      </td>
                      <td>{ch.total_quantity} units</td>
                      <td>
                        <span className={`badge ${
                          ch.status === "CONFIRMED" ? "badge-success" : ch.status === "CANCELLED" ? "badge-danger" : "badge-info"
                        }`}>
                          {ch.status}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <Link to={`/challans/${ch.id}`} className="btn btn-outline" style={{ padding: "4px 8px", fontSize: "0.75rem" }}>
                          View Invoice
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
