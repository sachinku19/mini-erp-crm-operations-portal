import React, { useEffect, useState } from "react";
import { userService } from "../../services/userService";
import type { UserAccount, CreateUserPayload } from "../../services/userService";
import { UserPlus, ShieldAlert, Download, CheckCircle, XCircle } from "lucide-react";
import { exportToCsv } from "../../utils/csvExporter";

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // New user modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [formData, setFormData] = useState<CreateUserPayload>({
    name: "",
    email: "",
    role: "Sales",
    password: "",
  });
  const [modalSubmitting, setModalSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userService.getUsers({ limit: 50 });
      setUsers(res.data);
    } catch (err: any) {
      setError(err.message || "Failed to load employee directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await userService.updateRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole as any } : u))
      );
    } catch (err: any) {
      alert(err.message || "Failed to update role.");
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    try {
      await userService.updateStatus(userId, !currentStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !currentStatus } : u))
      );
    } catch (err: any) {
      alert(err.message || "Failed to update status.");
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setModalError("Please fill out all required fields.");
      return;
    }

    setModalSubmitting(true);
    setModalError(null);
    try {
      await userService.createUser(formData);
      setShowCreateModal(false);
      setFormData({ name: "", email: "", role: "Sales", password: "" });
      fetchUsers();
    } catch (err: any) {
      setModalError(err.message || "Failed to create user account.");
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleExportCsv = () => {
    exportToCsv("employee_users_report", users);
  };



  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-md" style={{ flexWrap: "wrap", gap: "var(--spacing-md)" }}>
        <div>
          <h1 style={{ fontSize: "var(--font-size-xl)", fontWeight: "var(--font-weight-bold)" }}>
            Employee User Management
          </h1>
          <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
            Admin portal for managing employee roles, active permissions, and user accounts.
          </p>
        </div>

        <div className="flex gap-sm">
          <button className="btn btn-outline" onClick={handleExportCsv} disabled={users.length === 0}>
            <Download size={16} /> Export Users CSV
          </button>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <UserPlus size={16} /> Add Employee User
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="alert alert-danger mb-md">
          <ShieldAlert size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* User Table */}
      {loading ? (
        <div className="card">
          <div className="skeleton skeleton-title" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton skeleton-row" style={{ height: "45px" }} />
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Email Address</th>
                <th>Assigned Role</th>
                <th>Account Status</th>
                <th>Created Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: "var(--font-weight-semibold)" }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      className="form-select"
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      style={{ padding: "2px 8px", fontSize: "var(--font-size-xs)", width: "auto" }}
                    >
                      <option value="Admin">Admin</option>
                      <option value="Sales">Sales</option>
                      <option value="Warehouse">Warehouse</option>
                      <option value="Accounts">Accounts</option>
                    </select>
                  </td>
                  <td>
                    {u.is_active ? (
                      <span className="badge badge-success flex items-center gap-xs" style={{ width: "fit-content" }}>
                        <CheckCircle size={12} /> Active
                      </span>
                    ) : (
                      <span className="badge badge-danger flex items-center gap-xs" style={{ width: "fit-content" }}>
                        <XCircle size={12} /> Inactive
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: "var(--font-size-xs)" }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className={`btn ${u.is_active ? "btn-outline" : "btn-primary"}`}
                      onClick={() => handleStatusToggle(u.id, u.is_active)}
                      style={{ padding: "4px 8px", fontSize: "0.75rem" }}
                    >
                      {u.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: "450px" }}>
            <div className="modal-header">
              <h3>Register New Employee User</h3>
              <button
                className="btn btn-outline"
                style={{ padding: "4px", borderColor: "transparent" }}
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body flex flex-col gap-md">
                {modalError && (
                  <div className="alert alert-danger">
                    <ShieldAlert size={16} />
                    <span>{modalError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Work Email Address *</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="rahul@infotech.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned Role *</label>
                  <select
                    className="form-select"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="Sales">Sales</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Accounts">Accounts</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Temporary Password *</label>
                  <input
                    type="password"
                    className="form-input"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={modalSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={modalSubmitting}>
                  {modalSubmitting ? "Creating Account..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
