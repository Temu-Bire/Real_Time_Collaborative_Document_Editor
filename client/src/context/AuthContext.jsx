import { createContext, useContext, useEffect, useState, useCallback } from "react";
import authService from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await authService.getProfile();
        setUser(data.user);
      } catch {
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await authService.login(credentials);
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (userData) => {
    return await authService.register(userData);
  }, []);

  const googleLogin = useCallback(async (idToken) => {
    const data = await authService.googleLogin(idToken);
    setUser(data.user);
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
    return await authService.forgotPassword(email);
  }, []);

  const resetPassword = useCallback(async (token, password) => {
    return await authService.resetPassword(token, password);
  }, []);

  const resendVerification = useCallback(async (email) => {
    return await authService.resendVerification(email);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    googleLogin,
    logout,
    forgotPassword,
    resetPassword,
    resendVerification,
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