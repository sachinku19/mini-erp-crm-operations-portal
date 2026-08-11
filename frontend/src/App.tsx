import { useState, useEffect } from "react";
import { API_URL } from "./constants";

interface HealthResponse {
  success: boolean;
  message: string;
  timestamp?: string;
}

interface DbCheckResponse {
  success: boolean;
  connected: boolean;
  message: string;
}

function App() {
  const [apiStatus, setApiStatus] = useState<"loading" | "connected" | "failed">("loading");
  const [apiData, setApiData] = useState<HealthResponse | null>(null);

  const [dbStatus, setDbStatus] = useState<"loading" | "connected" | "failed">("loading");
  const [dbData, setDbData] = useState<DbCheckResponse | null>(null);

  const [checking, setChecking] = useState<boolean>(false);

  const checkConnectivity = async () => {
    setChecking(true);
    setApiStatus("loading");
    setDbStatus("loading");

    try {
      // 1. Check Backend API Health
      const apiRes = await fetch(`${API_URL}/health`);
      if (apiRes.ok) {
        const data: HealthResponse = await apiRes.json();
        setApiStatus("connected");
        setApiData(data);
      } else {
        setApiStatus("failed");
        setApiData(null);
      }
    } catch (error) {
      console.error("API connectivity check failed:", error);
      setApiStatus("failed");
      setApiData(null);
    }

    try {
      // 2. Check Database Connectivity
      const dbRes = await fetch(`${API_URL}/db-check`);
      if (dbRes.ok) {
        const data: DbCheckResponse = await dbRes.json();
        if (data.connected) {
          setDbStatus("connected");
        } else {
          setDbStatus("failed");
        }
        setDbData(data);
      } else {
        setDbStatus("failed");
        setDbData(null);
      }
    } catch (error) {
      console.error("Database connectivity check failed:", error);
      setDbStatus("failed");
      setDbData(null);
    }

    setChecking(false);
  };

  useEffect(() => {
    checkConnectivity();
  }, []);

  return (
    <div className="app-container">
      {/* Google-style Enterprise Header */}
      <header className="header">
        <div className="brand">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Mini ERP + CRM Operations Portal</span>
        </div>
        <div>
          <button
            className="btn btn-outline"
            onClick={checkConnectivity}
            disabled={checking}
          >
            {checking ? "Verifying..." : "Refresh Status"}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="main-content">
        <div
          style={{
            marginBottom: "var(--spacing-xl)",
            borderBottom: "1px solid var(--color-border)",
            paddingBottom: "var(--spacing-md)",
          }}
        >
          <h1 style={{ fontWeight: 400, fontSize: "var(--font-size-xxl)" }}>
            System Foundation Dashboard
          </h1>
          <p style={{ color: "var(--color-text-secondary)", marginTop: "var(--spacing-xs)" }}>
            Infrastructure connectivity overview. Ready for application module injections.
          </p>
        </div>

        <div className="grid-cols-2">
          {/* Card 1: API Server Status */}
          <div className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--spacing-md)",
              }}
            >
              <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 500 }}>
                Backend API Server Status
              </h2>
              {apiStatus === "connected" && (
                <span className="badge badge-success">Connected</span>
              )}
              {apiStatus === "loading" && (
                <span className="badge badge-info">Checking...</span>
              )}
              {apiStatus === "failed" && (
                <span className="badge badge-danger">Offline</span>
              )}
            </div>

            <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>
              Communication with the Node.js + Express.js backend API server.
            </p>

            <div
              style={{
                marginTop: "var(--spacing-lg)",
                backgroundColor: "var(--color-border-light)",
                padding: "var(--spacing-md)",
                borderRadius: "var(--border-radius-sm)",
                fontFamily: "monospace",
                fontSize: "var(--font-size-sm)",
                border: "1px solid var(--color-border)",
                minHeight: "100px",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {apiStatus === "connected" && apiData ? (
                <div>
                  <div style={{ color: "var(--color-success)", fontWeight: "bold", marginBottom: "var(--spacing-xs)" }}>
                    ✓ API Healthy
                  </div>
                  <div>Endpoint: {API_URL}/health</div>
                  <div>Message: "{apiData.message}"</div>
                  <div>Timestamp: {apiData.timestamp}</div>
                </div>
              ) : apiStatus === "loading" ? (
                <div style={{ color: "var(--color-text-disabled)" }}>Pinging backend API server...</div>
              ) : (
                <div>
                  <div style={{ color: "var(--color-danger)", fontWeight: "bold", marginBottom: "var(--spacing-xs)" }}>
                    ✗ Connection Failed
                  </div>
                  <div>Unable to connect to: {API_URL}/health</div>
                  <div style={{ marginTop: "var(--spacing-sm)", color: "var(--color-text-secondary)" }}>
                    Verify backend server is started using 'npm run dev' inside 'backend/'.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Supabase Database Status */}
          <div className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--spacing-md)",
              }}
            >
              <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 500 }}>
                Supabase Database Status
              </h2>
              {dbStatus === "connected" && (
                <span className="badge badge-success">Available</span>
              )}
              {dbStatus === "loading" && (
                <span className="badge badge-info">Checking...</span>
              )}
              {dbStatus === "failed" && (
                <span className="badge badge-danger">Unavailable</span>
              )}
            </div>

            <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>
              PostgreSQL pool client connectivity from the backend to Supabase.
            </p>

            <div
              style={{
                marginTop: "var(--spacing-lg)",
                backgroundColor: "var(--color-border-light)",
                padding: "var(--spacing-md)",
                borderRadius: "var(--border-radius-sm)",
                fontFamily: "monospace",
                fontSize: "var(--font-size-sm)",
                border: "1px solid var(--color-border)",
                minHeight: "100px",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {dbStatus === "connected" && dbData ? (
                <div>
                  <div style={{ color: "var(--color-success)", fontWeight: "bold", marginBottom: "var(--spacing-xs)" }}>
                    ✓ Database Connection Active
                  </div>
                  <div>Status Code: 200 OK</div>
                  <div>Message: "{dbData.message}"</div>
                  <div>Connected: {String(dbData.connected)}</div>
                </div>
              ) : dbStatus === "loading" ? (
                <div style={{ color: "var(--color-text-disabled)" }}>Pinging backend database gateway...</div>
              ) : (
                <div>
                  <div style={{ color: "var(--color-danger)", fontWeight: "bold", marginBottom: "var(--spacing-xs)" }}>
                    ✗ Connection Unavailable
                  </div>
                  {dbData ? (
                    <div>Message: "{dbData.message}"</div>
                  ) : (
                    <div>No response from database bridge check endpoint.</div>
                  )}
                  <div style={{ marginTop: "var(--spacing-sm)", color: "var(--color-text-secondary)" }}>
                    Configure a valid DATABASE_URL environment variable in your backend .env file.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Development Overview Section */}
        <div className="card" style={{ marginTop: "var(--spacing-lg)" }}>
          <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 500, marginBottom: "var(--spacing-sm)" }}>
            Foundational Layout Checklist
          </h2>
          <ul
            style={{
              paddingLeft: "var(--spacing-lg)",
              color: "var(--color-text-secondary)",
              fontSize: "var(--font-size-sm)",
              display: "grid",
              gap: "var(--spacing-xs)",
            }}
          >
            <li>✓ Strict TypeScript configured (Vite + Node.js)</li>
            <li>✓ Centralized Error boundary registered on backend</li>
            <li>✓ Environment configurations validated dynamically</li>
            <li>✓ Official connection pool client setup utilizing pg</li>
            <li>✓ Modular enterprise layout with clean Google-style CSS Tokens</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default App;
