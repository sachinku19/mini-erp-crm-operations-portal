import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { customerService } from "../../services/customerService";
import { ArrowLeft, Save, ShieldAlert } from "lucide-react";

export const CustomerForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();

  // Form fields state
  const [formData, setFormData] = useState({
    name: "",
    business_name: "",
    mobile: "",
    email: "",
    gst_number: "",
    customer_type: "WHOLESALE" as "WHOLESALE" | "DISTRIBUTOR" | "RETAIL",
    address: "",
    status: "LEAD" as "LEAD" | "ACTIVE" | "INACTIVE",
    follow_up_date: "",
    notes: "",
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(isEditMode);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    const loadCustomer = async () => {
      try {
        const cust = await customerService.getCustomerById(id);
        setFormData({
          name: cust.name,
          business_name: cust.business_name,
          mobile: cust.mobile,
          email: cust.email,
          gst_number: cust.gst_number || "",
          customer_type: cust.customer_type,
          address: cust.address,
          status: cust.status,
          follow_up_date: cust.follow_up_date ? cust.follow_up_date.split("T")[0] : "",
          notes: cust.notes || "",
        });
      } catch (err: any) {
        setError(err.message || "Failed to load customer profile details.");
      } finally {
        setFetching(false);
      }
    };
    loadCustomer();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Customer name is required.";
    if (!formData.business_name.trim()) errors.business_name = "Business name is required.";
    if (!formData.mobile.trim()) {
      errors.mobile = "Mobile number is required.";
    } else if (!/^\d{10}$/.test(formData.mobile.trim())) {
      errors.mobile = "Mobile must be exactly 10 digits.";
    }
    if (!formData.email.trim()) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "Invalid email address format.";
    }
    if (!formData.address.trim()) errors.address = "Billing address is required.";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    // Format optional properties
    const payload = {
      ...formData,
      gst_number: formData.gst_number.trim() || null,
      follow_up_date: formData.follow_up_date ? new Date(formData.follow_up_date).toISOString() : null,
      notes: formData.notes.trim() || null,
    };

    try {
      if (isEditMode && id) {
        await customerService.updateCustomer(id, payload);
      } else {
        await customerService.createCustomer(payload);
      }
      navigate("/customers", { replace: true });
    } catch (err: any) {
      if (err.details && Array.isArray(err.details)) {
        const backendErrors: Record<string, string> = {};
        err.details.forEach((issue: any) => {
          backendErrors[issue.field] = issue.message;
        });
        setValidationErrors(backendErrors);
      } else {
        setError(err.message || "An unexpected error occurred while saving.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div>
        <div className="skeleton skeleton-title" />
        <div className="card">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton skeleton-row" style={{ height: "40px" }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      {/* Breadcrumb Back link */}
      <div style={{ marginBottom: "var(--spacing-md)" }}>
        <Link to="/customers" className="flex items-center gap-xs text-muted" style={{ fontSize: "var(--font-size-sm)" }}>
          <ArrowLeft size={16} /> Back to CRM List
        </Link>
      </div>

      {/* Page Title */}
      <div style={{ marginBottom: "var(--spacing-xl)" }}>
        <h1 style={{ fontSize: "var(--font-size-xl)", fontWeight: "var(--font-weight-bold)" }}>
          {isEditMode ? "Edit Customer Details" : "Create Customer Profile"}
        </h1>
        <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
          Fill in business credentials, billing addresses, and follow-up reminders.
        </p>
      </div>

      {error && (
        <div className="alert alert-danger">
          <ShieldAlert size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
        {/* Double-column grid for basic info */}
        <div className="grid grid-cols-2 gap-md">
          {/* Customer Name */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              Customer Name <span className="required">*</span>
            </label>
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder="e.g. John Doe"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
            />
            {validationErrors.name && <div className="error-message">{validationErrors.name}</div>}
          </div>

          {/* Business Name */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              Registered Business Name <span className="required">*</span>
            </label>
            <input
              type="text"
              name="business_name"
              className="form-input"
              placeholder="e.g. Doe Enterprises Ltd"
              value={formData.business_name}
              onChange={handleChange}
              disabled={loading}
            />
            {validationErrors.business_name && <div className="error-message">{validationErrors.business_name}</div>}
          </div>

          {/* Mobile */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              Contact Mobile <span className="required">*</span>
            </label>
            <input
              type="text"
              name="mobile"
              className="form-input"
              placeholder="e.g. 9876543210 (10 digits)"
              value={formData.mobile}
              onChange={handleChange}
              disabled={loading}
            />
            {validationErrors.mobile && <div className="error-message">{validationErrors.mobile}</div>}
          </div>

          {/* Email */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              Email Address <span className="required">*</span>
            </label>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="e.g. purchasing@company.com"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />
            {validationErrors.email && <div className="error-message">{validationErrors.email}</div>}
          </div>

          {/* GST Number */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">GST Number (Optional)</label>
            <input
              type="text"
              name="gst_number"
              className="form-input"
              placeholder="e.g. 27AAAAA1111A1Z1"
              value={formData.gst_number}
              onChange={handleChange}
              disabled={loading}
              style={{ textTransform: "uppercase" }}
            />
            {validationErrors.gst_number && <div className="error-message">{validationErrors.gst_number}</div>}
          </div>

          {/* Customer Type */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Customer Type</label>
            <select
              name="customer_type"
              className="form-select"
              value={formData.customer_type}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="WHOLESALE">Wholesale</option>
              <option value="DISTRIBUTOR">Distributor</option>
              <option value="RETAIL">Retail</option>
            </select>
          </div>
        </div>

        {/* Full width Address */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">
            Billing & Delivery Address <span className="required">*</span>
          </label>
          <textarea
            name="address"
            className="form-textarea"
            placeholder="Complete warehouse or office address..."
            value={formData.address}
            onChange={handleChange}
            disabled={loading}
            rows={3}
          />
          {validationErrors.address && <div className="error-message">{validationErrors.address}</div>}
        </div>

        {/* Double column for operational status & date */}
        <div className="grid grid-cols-2 gap-md">
          {/* Status */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Lead Status</label>
            <select
              name="status"
              className="form-select"
              value={formData.status}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="LEAD">Lead (Cold/Warm)</option>
              <option value="ACTIVE">Active Partner</option>
              <option value="INACTIVE">Inactive / Blocked</option>
            </select>
          </div>

          {/* Next Follow-up Date */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Next CRM Follow-up Date</label>
            <input
              type="date"
              name="follow_up_date"
              className="form-input"
              value={formData.follow_up_date}
              onChange={handleChange}
              disabled={loading}
            />
          </div>
        </div>

        {/* Full width Notes */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">CRM Notes & Credit Information</label>
          <textarea
            name="notes"
            className="form-textarea"
            placeholder="Add relevant history, preferred payment terms (e.g. Net-30), discounts etc..."
            value={formData.notes}
            onChange={handleChange}
            disabled={loading}
            rows={4}
          />
        </div>

        {/* Form Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--spacing-md)", borderTop: "1px solid var(--color-border-light)", paddingTop: "var(--spacing-lg)", marginTop: "var(--spacing-md)" }}>
          <Link to="/customers" className="btn btn-secondary" style={{ pointerEvents: loading ? "none" : "auto" }}>
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Save size={16} /> {loading ? "Saving changes..." : isEditMode ? "Update Customer" : "Save Customer"}
          </button>
        </div>
      </form>
    </div>
  );
};
