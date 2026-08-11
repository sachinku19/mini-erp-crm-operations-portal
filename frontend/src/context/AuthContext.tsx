import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";
import type { UserProfile } from "../services/authService";

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Base64URL decoder to extract user profile fields directly from the JWT payload.
 */
const parseJwt = (token: string): UserProfile | null => {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const decoded = JSON.parse(jsonPayload);
    
    // Check if token has expired
    if (decoded && decoded.exp) {
      const nowInSeconds = Math.floor(Date.now() / 1000);
      if (decoded.exp < nowInSeconds) {
        console.warn("JWT token has expired.");
        return null;
      }
    }

    // Validate required fields exist in token
    if (decoded && decoded.id && decoded.email && decoded.name && decoded.role) {
      return {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
      };
    }
    return null;
  } catch (error) {
    console.error("Failed to parse JWT payload:", error);
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Listen for unauthorized 401 events dispatched from API client
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  // Restore session from localStorage on startup with guaranteed completion
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("token");
      if (savedToken) {
        const decodedUser = parseJwt(savedToken);
        if (decodedUser) {
          setToken(savedToken);
          setUser(decodedUser);
        } else {
          // Clear corrupt or expired token
          localStorage.removeItem("token");
        }
      }
    } catch (err) {
      console.error("Session restoration error:", err);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      localStorage.setItem("token", data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (error) {
      logout();
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
