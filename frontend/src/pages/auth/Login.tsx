import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Hexagon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  ShieldCheck,
  ShieldAlert,
  TrendingUp,
  Package,
  FileText,
  Users,
  AlertTriangle,
  Zap,
  Activity,
} from "lucide-react";

export const Login: React.FC = () => {
  const [email, setEmail] = useState<string>("admin@infotech.com");
  const [password, setPassword] = useState<string>("admin123");
  const [selectedRole, setSelectedRole] = useState<string>("Admin");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const expired = searchParams.get("expired") === "true";
  const from = (location.state as any)?.from?.pathname || "/dashboard";

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    } else if (expired) {
      setError("Your session has expired. Please sign in again.");
    }
  }, [isAuthenticated, expired, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both your email address and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || "Invalid credentials. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  // Quick Role Auto-Fill Handler
  const handleRoleSelect = (roleName: string, demoEmail: string, demoPass: string) => {
    setSelectedRole(roleName);
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        backgroundColor: "#eef2f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1rem",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Main Widescreen Card Container (Matching Image Proportions) */}
      <div
        style={{
          width: "100%",
          maxWidth: "1060px",
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.16), 0 0 1px 1px rgba(15, 23, 42, 0.05)",
          display: "grid",
          gridTemplateColumns: "1fr 1.1fr",
          overflow: "hidden",
          position: "relative",
        }}
        className="login-card-responsive"
      >
        <style>{`
          @media (max-width: 900px) {
            .login-card-responsive {
              grid-template-columns: 1fr !important;
              max-width: 460px !important;
            }
            .login-right-showcase, .notebook-spiral-spine {
              display: none !important;
            }
          }
        `}</style>

        {/* Notebook Spiral Wire Binding Spine Divider */}
        <div
          className="notebook-spiral-spine"
          style={{
            position: "absolute",
            left: "47.6%",
            top: "12px",
            bottom: "12px",
            transform: "translateX(-50%)",
            width: "32px",
            zIndex: 35,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            pointerEvents: "none",
          }}
        >
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: "relative",
                width: "32px",
                height: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Left hole punch shadow */}
              <div
                style={{
                  position: "absolute",
                  left: "3px",
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor: "#cbd5e1",
                  boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.4)",
                }}
              />
              {/* Right hole punch shadow */}
              <div
                style={{
                  position: "absolute",
                  right: "3px",
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  backgroundColor: "#020617",
                  boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.8)",
                }}
              />
              {/* Metallic Silver 3D Spiral Wire Loop */}
              <div
                style={{
                  width: "28px",
                  height: "8px",
                  borderRadius: "4px",
                  background:
                    "linear-gradient(135deg, #ffffff 0%, #cbd5e1 35%, #64748b 70%, #334155 100%)",
                  boxShadow:
                    "0 2px 5px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.9)",
                  transform: "rotate(-6deg)",
                  border: "1px solid rgba(255, 255, 255, 0.4)",
                }}
              />
            </div>
          ))}
        </div>

        {/* LEFT COLUMN: Clean White Sign-In Panel */}
        <div style={{ padding: "2.5rem 2.25rem", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            {/* Logo Header */}
            <div className="flex items-center gap-sm mb-xl" style={{ marginBottom: "2rem" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  backgroundColor: "#2563eb",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  boxShadow: "0 4px 10px rgba(37, 99, 235, 0.3)",
                }}
              >
                <Hexagon size={20} fill="#ffffff" style={{ color: "#2563eb" }} />
              </div>
              <div>
                <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>
                  Mini ERP
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}>
                  Operations & CRM Portal
                </div>
              </div>
            </div>

            {/* Main Welcome Heading */}
            <div style={{ marginBottom: "1.75rem" }}>
              <h1
                style={{
                  fontSize: "2.2rem",
                  fontWeight: 800,
                  color: "#0f172a",
                  letterSpacing: "-0.02em",
                  margin: "0 0 6px 0",
                  lineHeight: 1.15,
                }}
              >
                Welcome Back
              </h1>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: 1.4 }}>
                Sign in to continue managing your business operations seamlessly.
              </p>
            </div>

            {/* QUICK ROLE SIGN-IN BAR (4 Cards) */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#64748b",
                  letterSpacing: "0.05em",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                }}
              >
                QUICK ROLE SIGN-IN
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                {/* Admin Role Card */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect("Admin", "admin@infotech.com", "admin123")}
                  style={{
                    padding: "10px 4px",
                    borderRadius: "10px",
                    border: selectedRole === "Admin" ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                    backgroundColor: selectedRole === "Admin" ? "#eff6ff" : "#ffffff",
                    color: selectedRole === "Admin" ? "#1d4ed8" : "#475569",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Shield size={16} style={{ color: selectedRole === "Admin" ? "#2563eb" : "#64748b" }} />
                  <span style={{ fontSize: "11px", fontWeight: 600 }}>Admin</span>
                </button>

                {/* Sales Role Card */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect("Sales", "sales@infotech.com", "sales123")}
                  style={{
                    padding: "10px 4px",
                    borderRadius: "10px",
                    border: selectedRole === "Sales" ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                    backgroundColor: selectedRole === "Sales" ? "#eff6ff" : "#ffffff",
                    color: selectedRole === "Sales" ? "#1d4ed8" : "#475569",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <TrendingUp size={16} style={{ color: selectedRole === "Sales" ? "#2563eb" : "#64748b" }} />
                  <span style={{ fontSize: "11px", fontWeight: 600 }}>Sales</span>
                </button>

                {/* Warehouse Role Card */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect("Warehouse", "warehouse@infotech.com", "warehouse123")}
                  style={{
                    padding: "10px 4px",
                    borderRadius: "10px",
                    border: selectedRole === "Warehouse" ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                    backgroundColor: selectedRole === "Warehouse" ? "#eff6ff" : "#ffffff",
                    color: selectedRole === "Warehouse" ? "#1d4ed8" : "#475569",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Package size={16} style={{ color: selectedRole === "Warehouse" ? "#2563eb" : "#64748b" }} />
                  <span style={{ fontSize: "11px", fontWeight: 600 }}>Warehouse</span>
                </button>

                {/* Accounts Role Card */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect("Accounts", "accounts@infotech.com", "accounts123")}
                  style={{
                    padding: "10px 4px",
                    borderRadius: "10px",
                    border: selectedRole === "Accounts" ? "1.5px solid #2563eb" : "1px solid #e2e8f0",
                    backgroundColor: selectedRole === "Accounts" ? "#eff6ff" : "#ffffff",
                    color: selectedRole === "Accounts" ? "#1d4ed8" : "#475569",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <FileText size={16} style={{ color: selectedRole === "Accounts" ? "#2563eb" : "#64748b" }} />
                  <span style={{ fontSize: "11px", fontWeight: 600 }}>Accounts</span>
                </button>
              </div>
            </div>

            {/* Error Feedback */}
            {error && (
              <div
                style={{
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#dc2626",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  fontSize: "12px",
                  marginBottom: "1.25rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <ShieldAlert size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Email Address Field */}
              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Email Address
                </label>
                <div style={{ position: "relative" }}>
                  <Mail size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: "100%",
                      height: "44px",
                      paddingLeft: "42px",
                      paddingRight: "14px",
                      fontSize: "13px",
                      color: "#0f172a",
                      backgroundColor: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "10px",
                      outline: "none",
                    }}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <Lock size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: "100%",
                      height: "44px",
                      paddingLeft: "42px",
                      paddingRight: "64px",
                      fontSize: "13px",
                      color: "#0f172a",
                      backgroundColor: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "10px",
                      outline: "none",
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      fontSize: "12px",
                      color: "#64748b",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />} {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                <div style={{ textAlign: "right", marginTop: "6px" }}>
                  <span style={{ fontSize: "12px", color: "#2563eb", fontWeight: 600, cursor: "pointer" }}>
                    Forgot password?
                  </span>
                </div>
              </div>

              {/* Solid Blue Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  height: "46px",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 600,
                  border: "none",
                  borderRadius: "10px",
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
                }}
              >
                <Lock size={16} />
                <span>{loading ? "Signing in..." : "Sign In"}</span>
                <ArrowRight size={16} />
              </button>
            </form>
          </div>

          {/* Footer Security Notes */}
          <div style={{ marginTop: "2rem", textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", marginBottom: "4px" }}>
              <ShieldCheck size={14} style={{ color: "#2563eb" }} /> Secure login protected by industry standard encryption
            </div>
            <div style={{ fontSize: "11px", color: "#64748b" }}>
              Need help? <span style={{ color: "#2563eb", fontWeight: 600, cursor: "pointer" }}>Contact your administrator</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Dark Navy Showcase Panel (Matching Reference Screenshot) */}
        <div
          className="login-right-showcase"
          style={{
            backgroundColor: "#0b1736",
            padding: "2.5rem",
            color: "#ffffff",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Top Headline Header */}
          <div style={{ position: "relative", zIndex: 10 }}>
            <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#ffffff", lineHeight: 1.2, margin: 0 }}>
              One Platform.<br />Complete Control.
            </h2>
            <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "8px", maxWidth: "340px", lineHeight: 1.5 }}>
              Manage customers, inventory, sales and operations from a single powerful platform.
            </p>
          </div>

          {/* Center 3D Isometric Warehouse Graphic */}
          <div
            style={{
              position: "relative",
              margin: "1rem 0",
              width: "100%",
              height: "260px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src="/assets/warehouse_dark_navy_3d.png"
              alt="3D Warehouse Operations"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />

            {/* FLOATING STAT CARD 1: TOP RIGHT (Total Sales) */}
            <div
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                backgroundColor: "rgba(15, 23, 42, 0.85)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "12px",
                padding: "8px 12px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
              }}
            >
              <div style={{ fontSize: "9px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                TOTAL SALES
              </div>
              <div style={{ fontSize: "15px", fontWeight: 800, color: "#ffffff", margin: "2px 0" }}>
                ₹24,75,300
              </div>
              <div style={{ fontSize: "10px", color: "#34d399", fontWeight: 600 }}>
                ↑ 12.5% vs last month
              </div>
            </div>

            {/* FLOATING STAT CARD 2: MIDDLE RIGHT (Low Stock Alert) */}
            <div
              style={{
                position: "absolute",
                top: "105px",
                right: "0px",
                backgroundColor: "rgba(15, 23, 42, 0.85)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "12px",
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
              }}
            >
              <div>
                <div style={{ fontSize: "9px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                  LOW STOCK ALERT
                </div>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "#ffffff" }}>
                  23 <span style={{ fontSize: "11px", fontWeight: 500, color: "#94a3b8" }}>Products</span>
                </div>
              </div>
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "6px",
                  backgroundColor: "rgba(239, 68, 68, 0.2)",
                  color: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AlertTriangle size={14} />
              </div>
            </div>

            {/* FLOATING STAT CARD 3: BOTTOM LEFT (Active Customers) */}
            <div
              style={{
                position: "absolute",
                bottom: "10px",
                left: "10px",
                backgroundColor: "rgba(15, 23, 42, 0.85)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "12px",
                padding: "8px 12px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
              }}
            >
              <div style={{ fontSize: "9px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                ACTIVE CUSTOMERS
              </div>
              <div className="flex items-center gap-sm">
                <span style={{ fontSize: "15px", fontWeight: 800, color: "#ffffff" }}>1,248</span>
                <Users size={14} style={{ color: "#60a5fa" }} />
              </div>
              <div style={{ fontSize: "10px", color: "#34d399", fontWeight: 600 }}>
                ↑ 8.7% vs last month
              </div>
            </div>

            {/* FLOATING STAT CARD 4: BOTTOM RIGHT (Pending Challans) */}
            <div
              style={{
                position: "absolute",
                bottom: "10px",
                right: "10px",
                backgroundColor: "rgba(15, 23, 42, 0.85)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "12px",
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
              }}
            >
              <div>
                <div style={{ fontSize: "9px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                  PENDING CHALLANS
                </div>
                <div style={{ fontSize: "14px", fontWeight: 800, color: "#ffffff" }}>
                  18
                </div>
                <div style={{ fontSize: "10px", color: "#fbbf24" }}>
                  Awaiting confirmation
                </div>
              </div>
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "6px",
                  backgroundColor: "rgba(245, 158, 11, 0.2)",
                  color: "#fbbf24",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FileText size={14} />
              </div>
            </div>
          </div>

          {/* Bottom Feature Icons Bar (4 Items) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "8px",
              paddingTop: "1rem",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              position: "relative",
              zIndex: 10,
            }}
          >
            <div className="flex items-center gap-xs" style={{ fontSize: "11px", color: "#cbd5e1" }}>
              <Shield size={14} style={{ color: "#60a5fa" }} />
              <span>Role Based Access</span>
            </div>

            <div className="flex items-center gap-xs" style={{ fontSize: "11px", color: "#cbd5e1" }}>
              <Activity size={14} style={{ color: "#34d399" }} />
              <span>Real-time Insights</span>
            </div>

            <div className="flex items-center gap-xs" style={{ fontSize: "11px", color: "#cbd5e1" }}>
              <Lock size={14} style={{ color: "#818cf8" }} />
              <span>Secure & Reliable</span>
            </div>

            <div className="flex items-center gap-xs" style={{ fontSize: "11px", color: "#cbd5e1" }}>
              <Zap size={14} style={{ color: "#fbbf24" }} />
              <span>Smart Automation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
