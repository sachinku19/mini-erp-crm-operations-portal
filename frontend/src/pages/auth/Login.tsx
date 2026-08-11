import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { AlertCircle, Lock, Mail } from "lucide-react";

export const Login: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const expired = searchParams.get("expired") === "true";
  
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // If already authenticated, redirect to dashboard immediately
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    } else if (expired) {
      setError("Your session has expired. Please sign in again.");
    }
  }, [isAuthenticated, expired, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      // Redirect back to path requested before login, or dashboard
      const from = (location.state as any)?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    setError(null);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "var(--color-bg-base)",
        padding: "var(--spacing-lg)",
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: "420px",
          width: "100%",
          padding: "var(--spacing-xxl)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Brand/Header */}
        <div style={{ textAlign: "center", marginBottom: "var(--spacing-xl)" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              backgroundColor: "var(--color-primary)",
              color: "#ffffff",
              borderRadius: "var(--border-radius-md)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: "var(--font-size-xl)",
              marginBottom: "var(--spacing-sm)",
            }}
          >
            IE
          </div>
          <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: "var(--font-weight-bold)" }}>
            Welcome Back
          </h2>
          <p style={{ fontSize: "var(--font-size-sm)", marginTop: "var(--spacing-xs)" }}>
            Sign in to Infotech Operations Portal
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger" style={{ padding: "0.75rem 1rem", marginBottom: "var(--spacing-lg)" }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-text-disabled)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Mail size={16} />
              </span>
              <input
                type="email"
                className="form-input"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                style={{ paddingLeft: "38px" }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: "relative" }}>
              <span
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--color-text-disabled)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Lock size={16} />
              </span>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                style={{ paddingLeft: "38px" }}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={loading} style={{ height: "42px", marginTop: "var(--spacing-md)" }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>

      {/* Quick Access Credentials Sandbox Helper */}
      <div
        className="card"
        style={{
          maxWidth: "420px",
          width: "100%",
          marginTop: "var(--spacing-lg)",
          padding: "var(--spacing-lg)",
          borderColor: "var(--color-border)",
          boxShadow: "none",
        }}
      >
        <span style={{ fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-bold)", color: "var(--color-text-secondary)", display: "block", marginBottom: "var(--spacing-sm)" }}>
          QUICK ACCESS DEMO ACCOUNTS (CLICK TO AUTOFILL)
        </span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-sm)" }}>
          {[
            { label: "Admin Role", email: "admin@infotech.com", pass: "admin123" },
            { label: "Sales Role", email: "sales@infotech.com", pass: "sales123" },
            { label: "Warehouse Role", email: "warehouse@infotech.com", pass: "warehouse123" },
            { label: "Accounts Role", email: "accounts@infotech.com", pass: "accounts123" },
          ].map((demo, idx) => (
            <button
              key={idx}
              className="btn btn-secondary"
              onClick={() => handleQuickLogin(demo.email, demo.pass)}
              style={{
                padding: "6px",
                fontSize: "0.75rem",
                textAlign: "left",
                justifyContent: "flex-start",
                lineHeight: "1.2",
              }}
              type="button"
            >
              <div className="flex flex-col">
                <strong style={{ fontSize: "0.75rem" }}>{demo.label}</strong>
                <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>{demo.email}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
