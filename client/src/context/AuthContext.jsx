import { createContext, useContext, useEffect, useState, useCallback } from "react";
import authService from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore session on mount
  useEffect(() => {
    const loadUser = async () => {
      const accessToken = localStorage.getItem("accessToken");
      const storedUser = localStorage.getItem("user");

      if (!accessToken) {
        setLoading(false);
        return;
      }

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem("user");
        }
      }

      try {
        const data = await authService.getProfile();
        setUser(data.data.user);
      } catch {
        // If profile fetch fails, try to refresh token
        try {
          await authService.refreshTokens();
          const data = await authService.getProfile();
          setUser(data.data.user);
        } catch {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = useCallback(async (credentials) => {
    setError(null);
    const data = await authService.login(credentials);
    setUser(data.data.user);
    return data;
  }, []);

  const register = useCallback(async (userData) => {
    setError(null);
    return await authService.register(userData);
  }, []);

  const googleLogin = useCallback(async (idToken) => {
    setError(null);
    const data = await authService.googleLogin(idToken);
    setUser(data.data.user);
    return data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const forgotPassword = useCallback(async (email) => {
    setError(null);
    return await authService.forgotPassword(email);
  }, []);

  const resetPassword = useCallback(async (token, password) => {
    setError(null);
    return await authService.resetPassword(token, password);
  }, []);

  const resendVerification = useCallback(async (email) => {
    setError(null);
    return await authService.resendVerification(email);
  }, []);

  const verifyEmail = useCallback(async (token) => {
    setError(null);
    return await authService.verifyEmail(token);
  }, []);

  const setAuthError = useCallback((err) => {
    setError(err);
  }, []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    googleLogin,
    logout,
    forgotPassword,
    resetPassword,
    resendVerification,
    verifyEmail,
    setError: setAuthError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};